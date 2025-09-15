interface WebhookTweet {
  id: string
  username: string
  displayName: string
  text: string
  timestamp: number
  profileImage: string
  url?: string
  imageUrl?: string
  videoUrl?: string
  videoPoster?: string
  followerCount: string
  source: string
  embeds?: any[]
}

class WebhookService {
  private baseUrl: string
  private pollInterval: number = 200
  private isPolling: boolean = false
  private pollTimer?: NodeJS.Timeout
  private onNewTweet?: (tweet: WebhookTweet) => void
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || window.location.origin
  }

  setOnNewTweet(callback: (tweet: WebhookTweet) => void) {
    this.onNewTweet = callback
  }

  startPolling() {
    if (this.isPolling) return
    this.isPolling = true
    console.log('🚀 Starting webhook polling...')
    this.checkForNewTweets()
  }

  stopPolling() {
    this.isPolling = false
    if (this.pollTimer) {
      clearTimeout(this.pollTimer)
      this.pollTimer = undefined
    }
    console.log('⏹️ Stopped webhook polling')
  }

  private async checkForNewTweets() {
    if (!this.isPolling) return

    try {
      console.log('🔍 Checking for new tweets...')
      const response = await fetch(`${this.baseUrl}/api/latest-tweets`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Received data:', { tweetCount: data.tweets?.length || 0, totalCount: data.count })
        
        if (data.tweets && data.tweets.length > 0) {
          // Sort tweets by timestamp (newest first)
          const sortedTweets = data.tweets.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
          console.log('📊 Processing tweets in order:', sortedTweets.slice(0, 3).map((t: any) => ({
            id: t.id,
            username: t.username,
            timestamp: t.timestamp,
            text: t.text?.substring(0, 50) + '...'
          })))
          
          // Limit processing to prevent lag
          const tweetsToProcess = sortedTweets.slice(0, 50)
          
          tweetsToProcess.forEach((tweet: any) => {
            this.processTweet(tweet)
          })
        }
        
        this.reconnectAttempts = 0 // Reset on successful fetch
      } else {
        console.error('❌ Failed to fetch tweets:', response.status, response.statusText)
        this.handleReconnect()
      }
    } catch (error) {
      console.error('❌ Error fetching tweets:', error)
      this.handleReconnect()
    }

    // Schedule next poll
    if (this.isPolling) {
      this.pollTimer = setTimeout(() => this.checkForNewTweets(), this.pollInterval)
    }
  }

  private processTweet(tweetData: any) {
    try {
      console.log('🔍 Processing tweet:', tweetData.id, tweetData.username);
      
      // Extract images from embeds structure
      let imageUrl: string | undefined;
      let videoUrl: string | undefined;
      const processedEmbeds: any[] = [];
      
      if (tweetData.embeds && Array.isArray(tweetData.embeds)) {
        console.log('🔍 Found embeds array with', tweetData.embeds.length, 'items');
        
        tweetData.embeds.forEach((embed: any, index: number) => {
          if (embed.image && embed.image.url) {
            console.log(`✅ Found image in embed ${index}:`, embed.image.url);
            
            if (!imageUrl) {
              imageUrl = embed.image.url;
            }
            
            processedEmbeds.push({
              type: 'image',
              imageUrl: embed.image.url,
              title: embed.author?.name || 'Image',
              description: embed.description || ''
            });
          }
          
          if (embed.video && embed.video.url) {
            console.log(`✅ Found video in embed ${index}:`, embed.video.url);
            
            if (!videoUrl) {
              videoUrl = embed.video.url;
            }
            
            processedEmbeds.push({
              type: 'video',
              videoUrl: embed.video.url,
              title: embed.author?.name || 'Video',
              description: embed.description || ''
            });
          }
        });
      }
      
      // Clean the text content
      let cleanText = tweetData.content || tweetData.text || 'No content';
      
      // Handle markdown links like [text](url)
      const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
      const linkMatches = [...cleanText.matchAll(markdownLinkRegex)];
      
      if (linkMatches.length > 0) {
        // Extract the link text (first capture group)
        cleanText = linkMatches.map(match => match[1]).join(' ').trim();
      }
      
      // Clean up any remaining markdown or unwanted characters
      cleanText = cleanText
        .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove any remaining markdown links
        .replace(/\[Posted\]/g, '') // Remove [Posted] text
        .replace(/\[Quoted\]/g, '') // Remove [Quoted] text
        .replace(/\[Reposted\]/g, '') // Remove [Reposted] text
        .replace(/https?:\/\/[^\s]+/g, '') // Remove all URLs
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      const tweet: WebhookTweet = {
        id: tweetData.id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: tweetData.username || 'Unknown',
        displayName: tweetData.username || 'Unknown',
        text: cleanText,
        timestamp: Date.now(),
        profileImage: tweetData.avatar_url || 
                      tweetData.profileImage || 
                      tweetData.profile_image || 
                      tweetData.extension?.twitter_user_avatar ||
                      tweetData.author?.profileImage ||
                      tweetData.author?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(tweetData.username || 'Unknown')}&background=1f2937&color=fff`,
        url: tweetData.embeds?.[0]?.url || `https://twitter.com/${tweetData.username}/status/${tweetData.id}`,
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        videoPoster: undefined,
        followerCount: '1K',
        source: 'webhook',
        embeds: processedEmbeds.length > 0 ? processedEmbeds : undefined
      }
      
      console.log('✅ Sending tweet to UI:', {
        id: tweet.id,
        username: tweet.username,
        hasImage: !!tweet.imageUrl,
        hasVideo: !!tweet.videoUrl,
        imageUrl: tweet.imageUrl
      });

      this.onNewTweet?.(tweet)
      
    } catch (error) {
      console.error('Error processing tweet:', error)
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        if (this.isPolling) {
          this.checkForNewTweets()
        }
      }, delay)
    } else {
      console.error('❌ Max reconnection attempts reached. Stopping polling.')
      this.stopPolling()
    }
  }

  reconnect() {
    this.reconnectAttempts = 0
    this.startPolling()
  }
}

export default WebhookService
export type { WebhookTweet }