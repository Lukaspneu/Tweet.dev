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
  embeds?: Array<{
    type: string
    url?: string
    imageUrl?: string
    videoUrl?: string
    thumbnailUrl?: string
    title?: string
    description?: string
  }>
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

  // Start polling for new tweets from webhook endpoint
  async startPolling() {
    if (this.isConnecting) return
    
    this.isConnecting = true
    this.updateStatus('connecting')

    try {
      // Initial connection test
      await this.testConnection()
      
      // Start polling for new tweets
      this.startPollingLoop()
      
      this.updateStatus('connected')
      this.reconnectAttempts = 0
      
    } catch (error) {
      console.error('Failed to start webhook polling:', error)
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

  private async checkForNewTweets() {
    try {
      console.log('🔍 Checking for new tweets...')
      // INSTANT real-time fetch - optimized for speed
      const response = await fetch('https://deckdev-app.onrender.com/api/latest-tweets', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store' // Disable all caching for instant updates
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 STEP 1: RAW API RESPONSE:', data);
        console.log('📊 Received data:', { tweetCount: data.tweets?.length || 0, totalCount: data.count })
        
        if (data.tweets && Array.isArray(data.tweets)) {
          // Sort tweets by timestamp (newest first) before processing
          const sortedTweets = data.tweets.sort((a: any, b: any) => {
            const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : a.receivedAt || 0
            const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : b.receivedAt || 0
            return timestampB - timestampA // Newest first
          })
          
          // Only process the latest 50 tweets to prevent lag
          const tweetsToProcess = sortedTweets.slice(0, 50)
          
          console.log('🔍 STEP 2: RAW TWEET DATA FROM API:');
          console.log('📊 Processing tweets in order:', tweetsToProcess.slice(0, 3).map((t: any) => ({
            id: t.id,
            timestamp: t.timestamp || t.receivedAt,
            username: t.username,
            hasEmbeds: !!t.embeds,
            embedsCount: t.embeds?.length || 0,
            rawTweet: t
          })))
          
          tweetsToProcess.forEach((tweet: any) => {
            console.log('🔍 STEP 3: PROCESSING INDIVIDUAL TWEET:', tweet);
            this.processTweet(tweet)
          })
        }
      } else {
        console.error('❌ Failed to fetch tweets:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Polling error:', error)
      if (this.status === 'connected') {
        this.updateStatus('error')
      }
    }
  }

  private startPollingLoop() {
    // ULTRA-FAST polling - 200ms for lowest latency possible
    const pollInterval = setInterval(async () => {
      try {
        await this.checkForNewTweets()
      } catch (error) {
        console.error('Polling error:', error)
        this.updateStatus('error')
        clearInterval(pollInterval)
        this.scheduleReconnect()
      }
    }, 200) // 200ms for ultra-low latency
  }


  private processTweet(tweetData: any) {
    try {
      // 🔍 STEP 4: PROCESSING INDIVIDUAL TWEET DATA
      console.log('='.repeat(80));
      console.log('🔍 STEP 4: RAW TWEET DATA BEING PROCESSED:');
      console.log('📦 Full webhook payload:', JSON.stringify(tweetData, null, 2));
      
      // EXTRACT MEDIA DIRECTLY FROM EMBEDS STRUCTURE
      let primaryImageUrl: string | undefined;
      let primaryVideoUrl: string | undefined;
      const processedEmbeds: any[] = [];
      
      console.log('🔍 EXTRACTING FROM EMBEDS STRUCTURE...');
      
      if (tweetData.embeds && Array.isArray(tweetData.embeds)) {
        console.log('🔍 Found embeds array with', tweetData.embeds.length, 'items');
        
        tweetData.embeds.forEach((embed: any, index: number) => {
          console.log(`🔍 Processing embed ${index}:`, embed);
          
          if (embed.image && embed.image.url) {
            console.log(`✅ Found image in embed ${index}:`, embed.image.url);
            
            if (!primaryImageUrl) {
              primaryImageUrl = embed.image.url;
              console.log('🎯 Set as primary image:', primaryImageUrl);
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
            
            if (!primaryVideoUrl) {
              primaryVideoUrl = embed.video.url;
              console.log('🎯 Set as primary video:', primaryVideoUrl);
            }
            
            processedEmbeds.push({
              type: 'video',
              videoUrl: embed.video.url,
              title: embed.author?.name || 'Video',
              description: embed.description || ''
            });
          }
        });
      } else {
        console.log('❌ No embeds found in tweetData');
      }
      
      console.log('🎯 Final primary image URL:', primaryImageUrl);
      console.log('🎯 Final primary video URL:', primaryVideoUrl);
      console.log('🎯 Final processed embeds:', processedEmbeds);
      

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
        
        // Use the media extracted from embeds structure
        imageUrl = primaryImageUrl;
        videoUrl = primaryVideoUrl;
        videoPoster = undefined; // Will be set from embeds if needed
        
        timestamp = tweetData.receivedAt || Date.now();
        
        console.log('🎯 Using media from embeds structure:', { imageUrl, videoUrl });

        // DEBUG: Log image extraction for PostInfo/FeedPost structure
        if (imageUrl) {
          console.log('🖼️ Image found in PostInfo/FeedPost:', imageUrl);
        } else {
          console.log('❌ No image found in PostInfo/FeedPost structure. Available fields:', Object.keys(tweetData), Object.keys(extension));
          console.log('📝 Raw text content:', rawText);
          
          // TEMPORARY TEST: Use a test image to verify display works
          if (rawText && rawText.toLowerCase().includes('image') || rawText.toLowerCase().includes('photo') || rawText.toLowerCase().includes('picture')) {
            imageUrl = 'https://pbs.twimg.com/media/G0vcsKaXQAASEXw?format=jpg&name=large';
            console.log('🧪 Using test image to verify display functionality');
          }
        }
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
        // ULTRA AGGRESSIVE IMAGE EXTRACTION - Check EVERYTHING!
        imageUrl = tweetData.imageUrl || 
                  tweetData.media?.image || 
                  tweetData.attachments?.image ||
                  tweetData.entities?.media?.[0]?.media_url_https ||
                  tweetData.entities?.media?.[0]?.media_url ||
                  tweetData.entities?.media?.[0]?.media_url_http ||
                  tweetData.media_url ||
                  tweetData.media_url_https ||
                  tweetData.media_url_http ||
                  tweetData.image ||
                  tweetData.photo ||
                  tweetData.picture ||
                  tweetData.thumbnail ||
                  tweetData.twitter_image ||
                  tweetData.tweet_image ||
                  tweetData.media_image ||
                  tweetData.image_url ||
                  tweetData.imageUrl ||
                  tweetData.imageURL ||
                  tweetData.ImageUrl ||
                  tweetData.IMAGE_URL ||
                  tweetData.media?.url ||
                  tweetData.media?.media_url ||
                  tweetData.media?.media_url_https ||
                  tweetData.media?.urls?.[0] ||
                  tweetData.attachments?.url ||
                  tweetData.attachments?.media_url ||
                  tweetData.attachments?.urls?.[0] ||
                  tweetData.entities?.urls?.[0]?.expanded_url ||
                  tweetData.entities?.urls?.[0]?.url ||
                  tweetData.extended_entities?.media?.[0]?.media_url_https ||
                  tweetData.extended_entities?.media?.[0]?.media_url ||
                  tweetData.quoted_status?.entities?.media?.[0]?.media_url_https ||
                  tweetData.retweeted_status?.entities?.media?.[0]?.media_url_https;
        
        // COMPREHENSIVE VIDEO EXTRACTION for legacy structure - Check ALL possible fields
        videoUrl = tweetData.videoUrl || 
                  tweetData.video || 
                  tweetData.media?.video || 
                  tweetData.attachments?.video ||
                  tweetData.entities?.media?.[0]?.video_info?.variants?.[0]?.url ||
                  tweetData.mp4 ||
                  tweetData.video_url ||
                  tweetData.twitter_video ||
                  tweetData.tweet_video ||
                  tweetData.media_video;
        
        // COMPREHENSIVE VIDEO POSTER EXTRACTION for legacy structure - Check ALL possible fields
        videoPoster = tweetData.videoPoster || 
                     tweetData.video_thumbnail || 
                     tweetData.media?.video_thumbnail ||
                     tweetData.entities?.media?.[0]?.media_url_https ||
                     tweetData.thumbnail ||
                     tweetData.poster ||
                     tweetData.video_poster ||
                     tweetData.media_thumbnail;
        timestamp = tweetData.timestamp ? new Date(tweetData.timestamp).getTime() : Date.now();
        
        console.log('🎯 Using media from embeds structure (legacy):', { imageUrl, videoUrl });

        // DEBUG: Log image extraction for legacy structure
        if (imageUrl) {
          console.log('🖼️ Image found in legacy structure:', imageUrl);
        } else {
          console.log('❌ No image found in legacy structure. Available fields:', Object.keys(tweetData));
          console.log('📝 Raw text content:', rawText);
          console.log('🔍 Field values:', {
            imageUrl: tweetData.imageUrl,
            videoUrl: tweetData.videoUrl,
            videoPoster: tweetData.videoPoster,
            media: tweetData.media,
            attachments: tweetData.attachments,
            entities: tweetData.entities
          });
          
          // TEMPORARY TEST: Use a test image to verify display works
          if (rawText && (rawText.toLowerCase().includes('image') || rawText.toLowerCase().includes('photo') || rawText.toLowerCase().includes('picture'))) {
            imageUrl = 'https://pbs.twimg.com/media/G0vcsKaXQAASEXw?format=jpg&name=large';
            console.log('🧪 Using test image to verify display functionality (legacy)');
          }
          
          // Deep search for any image URLs in the entire object
          const deepSearch = (obj: any, path = ''): void => {
            if (typeof obj === 'object' && obj !== null) {
              Object.keys(obj).forEach(key => {
                const value = obj[key];
                const currentPath = path ? `${path}.${key}` : key;
                
                if (typeof value === 'string' && (value.match(/https?:\/\/[^\s]*\.(jpg|jpeg|png|gif|webp)/i) || value.includes('pbs.twimg.com/media'))) {
                  console.log(`🖼️ Found image URL in ${currentPath}:`, value);
                  // If it's a Twitter media URL without format parameters, suggest the full URL
                  if (value.includes('pbs.twimg.com/media') && !value.includes('format=')) {
                    const baseUrl = value.split('?')[0];
                    console.log(`💡 Suggested full Twitter media URL: ${baseUrl}?format=jpg&name=large`);
                  }
                } else if (typeof value === 'object' && value !== null) {
                  deepSearch(value, currentPath);
                }
              });
            }
          };
          
          console.log('🔍 Deep searching for image URLs...');
          deepSearch(tweetData);
        }
      }
      
      // Transform webhook data to our tweet format
      // CREATE EMBEDS FROM FOUND MEDIA
      
      // Create embeds from found images
      const imageEmbeds = uniqueImageUrls.map(url => ({
        type: 'photo',
        imageUrl: url,
        title: 'Tweet Image',
        description: ''
      }));
      
      // Create embeds from found videos
      const videoEmbeds = uniqueVideoUrls.map(url => ({
        type: 'video',
        videoUrl: url,
        title: 'Tweet Video',
        description: ''
      }));
      
      const processedEmbeds = [...imageEmbeds, ...videoEmbeds];
      
      console.log('🎯 CREATED IMAGE EMBEDS:', imageEmbeds);
      console.log('🎯 CREATED VIDEO EMBEDS:', videoEmbeds);
      console.log('🎯 TOTAL PROCESSED EMBEDS:', processedEmbeds);

      // Primary media URLs already set above - use them
      
      console.log('🎯 SETTING PRIMARY MEDIA URLs:', {
        primaryImageUrl,
        primaryVideoUrl,
        foundImages: uniqueImageUrls.length,
        foundVideos: uniqueVideoUrls.length,
        uniqueImageUrls: uniqueImageUrls,
        uniqueVideoUrls: uniqueVideoUrls,
        originalImageUrl: imageUrl,
        originalVideoUrl: videoUrl
      });

      const tweet: WebhookTweet = {
        id: tweetData.id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: username,
        displayName: displayName,
        text: cleanText,
        timestamp: timestamp,
        profileImage: profileImage,
        url: tweetUrl,
        imageUrl: primaryImageUrl,
        videoUrl: primaryVideoUrl,
        videoPoster: videoPoster,
        followerCount: followerCount,
        source: 'webhook',
        embeds: processedEmbeds.length > 0 ? processedEmbeds : undefined
      }
      
      // CRITICAL: Double-check that imageUrl is set
      console.log('🔍 FINAL TWEET IMAGE CHECK:', {
        tweetImageUrl: tweet.imageUrl,
        primaryImageUrl: primaryImageUrl,
        isImageSet: !!tweet.imageUrl
      });

      // 🔍 STEP 5: FINAL TWEET OBJECT BEING SENT TO UI
      console.log('🔍 STEP 5: FINAL TWEET OBJECT:');
      console.log('📱 Final tweet data:', {
        id: tweet.id,
        username: tweet.username,
        text: tweet.text.substring(0, 50) + '...',
        embeds: tweet.embeds,
        embedsCount: tweet.embeds?.length || 0,
        imageUrl: tweet.imageUrl,
        hasImageUrl: !!tweet.imageUrl,
        videoUrl: tweet.videoUrl,
        hasVideoUrl: !!tweet.videoUrl
      });
      console.log('📱 Full tweet object:', tweet);
      
      // CRITICAL DEBUG: Check if imageUrl is actually set
      if (tweet.imageUrl) {
        console.log('✅ IMAGE URL IS SET IN TWEET:', tweet.imageUrl);
        console.log('🎯 IMAGE WILL BE DISPLAYED IN UI');
      } else {
        console.log('❌ NO IMAGE URL IN TWEET! Available fields:', Object.keys(tweet));
        console.log('❌ Tweet object:', JSON.stringify(tweet, null, 2));
        console.log('❌ Raw tweetData that was processed:', JSON.stringify(tweetData, null, 2));
        console.log('❌ uniqueImageUrls that were found:', uniqueImageUrls);
        console.log('❌ primaryImageUrl that was set:', primaryImageUrl);
      }

      // Validate required fields
      if (!tweet.id || !tweet.text) {
        console.warn('Invalid tweet data received:', tweetData)
        return
      }

      // 🔍 STEP 6: SENDING TO UI CALLBACK
      console.log('🔍 STEP 6: SENDING TO UI CALLBACK');
      console.log('📱 Sending tweet to UI:', tweet.id, tweet.username, tweet.text.substring(0, 50) + '...')
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
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.startPolling()
    }, delay)
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
    this.startPolling()
  }

  // Update tweet with image URL found via oEmbed
  private updateTweetWithImage(tweetId: string, imageUrl: string) {
    // This would need to be implemented to update the tweet in the UI
    // For now, just log it
    console.log(`🖼️ Would update tweet ${tweetId} with image: ${imageUrl}`);
  }
}

export default WebhookService
