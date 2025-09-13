// Real-time webhook service for receiving tweets
export interface WebhookTweet {
  id: string
  username: string
  displayName: string
  text: string
  timestamp: number
  profileImage?: string
  url?: string
  imageUrl?: string
  videoUrl?: string
  videoPoster?: string
  followerCount?: string
  source?: string
}

export interface WebhookServiceCallbacks {
  onNewTweet: (tweet: WebhookTweet) => void
  onError: (error: string) => void
  onStatusChange: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void
}

class WebhookService {
  private callbacks: WebhookServiceCallbacks
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private status: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected'

  constructor(callbacks: WebhookServiceCallbacks) {
    this.callbacks = callbacks
  }

  // Start INSTANT real-time SSE connection for tweets
  async connect() {
    if (this.isConnecting) return
    
    this.isConnecting = true
    this.updateStatus('connecting')

    try {
      // Initial connection test
      await this.testConnection()
      
      // Start INSTANT real-time SSE connection
      this.startSSEConnection()
      
      this.updateStatus('connected')
      this.reconnectAttempts = 0
      
    } catch (error) {
      console.error('Failed to start SSE connection:', error)
      this.updateStatus('error')
      this.callbacks.onError(`Connection failed: ${error}`)
      this.scheduleReconnect()
    } finally {
      this.isConnecting = false
    }
  }

  private async testConnection() {
    const response = await fetch('https://deckdev-app.onrender.com/health')
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`)
    }
  }

  private startSSEConnection() {
    // INSTANT real-time via Server-Sent Events - NO POLLING!
    const eventSource = new EventSource('https://deckdev-app.onrender.com/api/tweets-stream');
    
    eventSource.onopen = () => {
      console.log('🚀 SSE connection opened - INSTANT real-time updates!');
      this.updateStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'connected') {
          console.log('✅ SSE connected:', data.message);
        } else if (data.type === 'initial_tweets') {
          console.log(`📱 Loaded ${data.count} initial tweets`);
          if (data.tweets && Array.isArray(data.tweets)) {
            data.tweets.forEach((tweet: any) => {
              this.processTweet(tweet);
            });
          }
        } else if (data.type === 'new_tweet') {
          console.log('⚡ INSTANT new tweet received via SSE:', data.tweet.username);
          this.processTweet(data.tweet);
        }
      } catch (error) {
        console.error('SSE message parsing error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.updateStatus('error');
      eventSource.close();
      this.scheduleReconnect();
    };

    // Store event source for cleanup
    (this as any).eventSource = eventSource;
  }


  private processTweet(tweetData: any) {
    try {
      // Handle both PostInfo/FeedPost structure and legacy structure
      let username, displayName, profileImage, cleanText, tweetUrl, followerCount, imageUrl, videoUrl, videoPoster, timestamp;
      
      if (tweetData.tweet_id || tweetData.feed_id || tweetData.extension?.tweet_id) {
        // New PostInfo/FeedPost structure (including extension field)
        const extension = tweetData.extension || {};
        username = tweetData.username || extension.twitter_user_handle || 'unknown';
        displayName = tweetData.displayName || extension.twitter_user_display_name || username;
        profileImage = tweetData.profileImage || extension.twitter_user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1f2937&color=fff`;
        followerCount = tweetData.followerCount || extension.twitter_user_followers || '1K';
        let rawText = tweetData.text || extension.tweet_content || 'No content';
        
        // Clean the content - remove "Posted", "Quoted" and ALL URLs - ULTRA AGGRESSIVE
        cleanText = rawText
          .replace(/^(Posted|Quoted|Reposted)\s*/i, '') // Remove Posted/Quoted/Reposted prefixes
          .replace(/https?:\/\/[^\s]+/g, '') // Remove all http/https URLs
          .replace(/x\.com\/[^\s]+/g, '') // Remove x.com links
          .replace(/twitter\.com\/[^\s]+/g, '') // Remove twitter.com links
          .replace(/t\.co\/[^\s]+/g, '') // Remove t.co short links
          .replace(/bit\.ly\/[^\s]+/g, '') // Remove bit.ly links
          .replace(/tinyurl\.com\/[^\s]+/g, '') // Remove tinyurl links
          .replace(/www\.[^\s]+/g, '') // Remove www links
          .replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*/g, '') // Remove domain.com/path links
          .replace(/@[^\s]+\s+/g, '') // Remove @mentions if they're just links
          .replace(/\[([^\]]*)\]\(([^)]+)\)/g, '$1') // Remove markdown links but keep text
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
          .replace(/[^\w\s.,!?;:()-]/g, '') // Remove special characters except basic punctuation
          .replace(/\s+/g, ' ') // Clean up extra spaces
          .trim();
        
        // If content is empty after cleaning, use a default message
        if (!cleanText || cleanText === '') {
          cleanText = 'Tweet content';
        }
        
        tweetUrl = tweetData.url || `https://twitter.com/${username}/status/${tweetData.tweetId}`;
        followerCount = '1K'; // Default since not in PostInfo structure
        imageUrl = tweetData.imageUrl;
        videoUrl = tweetData.videoUrl;
        videoPoster = tweetData.videoPoster;
        timestamp = tweetData.receivedAt || Date.now();
      } else {
        // Legacy structure - extract tweet data with better parsing
        let rawText = tweetData.text || tweetData.content || tweetData.message || 'No content';
        
        // Clean markdown links and extract clean text
        cleanText = rawText;
        let extractedUrl = null;
        
        // Handle markdown links like [text](url)
        const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
        const linkMatches = [...rawText.matchAll(markdownLinkRegex)];
        
        if (linkMatches.length > 0) {
          // Extract the link text (first capture group)
          cleanText = linkMatches.map(match => match[1]).join(' ').trim();
          // Extract the URL (second capture group) - use the first one found
          extractedUrl = linkMatches[0][2];
        }
        
        // Clean up any remaining markdown or unwanted characters
        cleanText = cleanText
          .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove any remaining markdown links
          .replace(/\[Posted\]/g, '') // Remove [Posted] text
          .replace(/\[↧\]/g, '') // Remove [↧] symbols
          .replace(/^(Posted|Quoted|Reposted)\s*/i, '') // Remove Posted/Quoted/Reposted prefixes
          .replace(/https?:\/\/[^\s]+/g, '') // Remove all http/https URLs
          .replace(/x\.com\/[^\s]+/g, '') // Remove x.com links
          .replace(/twitter\.com\/[^\s]+/g, '') // Remove twitter.com links
          .replace(/t\.co\/[^\s]+/g, '') // Remove t.co short links
          .replace(/bit\.ly\/[^\s]+/g, '') // Remove bit.ly links
          .replace(/tinyurl\.com\/[^\s]+/g, '') // Remove tinyurl links
          .replace(/www\.[^\s]+/g, '') // Remove www links
          .replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*/g, '') // Remove domain.com/path links
          .replace(/@[^\s]+\s+/g, '') // Remove @mentions if they're just links
          .replace(/\s+/g, ' ') // Clean up extra spaces
          .trim();
        
        const author = tweetData.author || {};
        username = tweetData.username || author.username || tweetData.twitter_user_handle || 'unknown';
        displayName = tweetData.displayName || author.displayName || username || 'Unknown User';
        profileImage = tweetData.profileImage || author.profileImage || tweetData.twitter_user_avatar || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1f2937&color=fff`;
        followerCount = tweetData.followerCount || author.followerCount || '1K';
        tweetUrl = extractedUrl || tweetData.url || tweetData.tweetUrl || tweetData.link;
        imageUrl = tweetData.imageUrl || tweetData.media?.image || tweetData.attachments?.image;
        videoUrl = tweetData.videoUrl || tweetData.video || tweetData.media?.video || tweetData.attachments?.video;
        videoPoster = tweetData.videoPoster || tweetData.video_thumbnail || tweetData.media?.video_thumbnail;
        timestamp = tweetData.timestamp ? new Date(tweetData.timestamp).getTime() : Date.now();
      }
      
      // Transform webhook data to our tweet format
      const tweet: WebhookTweet = {
        id: tweetData.id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: username,
        displayName: displayName,
        text: cleanText,
        timestamp: timestamp,
        profileImage: profileImage,
        url: tweetUrl,
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        videoPoster: videoPoster,
        followerCount: followerCount,
        source: 'webhook'
      }

      // Validate required fields
      if (!tweet.id || !tweet.text) {
        console.warn('Invalid tweet data received:', tweetData)
        return
      }

      // Send to callback
      this.callbacks.onNewTweet(tweet)
      
    } catch (error) {
      console.error('Error processing tweet:', error)
      this.callbacks.onError(`Tweet processing error: ${error}`)
    }
  }

  private updateStatus(status: 'connecting' | 'connected' | 'disconnected' | 'error') {
    this.status = status
    this.callbacks.onStatusChange(status)
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.updateStatus('error')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff
    
    console.log(`Reconnecting SSE in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      if (this.status !== 'connected') {
        this.reconnect()
      }
    }, delay)
  }

  // Cleanup SSE connection
  public disconnect() {
    if ((this as any).eventSource) {
      (this as any).eventSource.close();
      (this as any).eventSource = null;
    }
    this.updateStatus('disconnected');
  }

  // Simulate receiving a tweet (for testing)
  simulateTweet() {
    const testTweet: WebhookTweet = {
      id: `test_${Date.now()}`,
      username: 'testuser',
      displayName: 'Test User',
      text: 'This is a test tweet from the webhook system! 🚀',
      timestamp: Date.now(),
      profileImage: 'https://ui-avatars.com/api/?name=Test&background=22c55e&color=fff',
      followerCount: '1.2K',
      source: 'test'
    }
    
    this.callbacks.onNewTweet(testTweet)
  }

  // Get current connection status
  getStatus() {
    return this.status
  }

  // Manual reconnect
  reconnect() {
    this.reconnectAttempts = 0
        this.connect()
  }
}

export default WebhookService
