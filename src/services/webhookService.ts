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

  private startPollingLoop() {
    // Poll for new tweets every 500ms for ultra-low latency
    const pollInterval = setInterval(async () => {
      try {
        await this.checkForNewTweets()
      } catch (error) {
        console.error('Polling error:', error)
        this.updateStatus('error')
        clearInterval(pollInterval)
        this.scheduleReconnect()
      }
    }, 500) // Ultra-fast polling for lowest latency
  }

  private async checkForNewTweets() {
    try {
      // Check webhook endpoint for new data
      const response = await fetch('https://deckdev-app.onrender.com/api/latest-tweets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.tweets && Array.isArray(data.tweets)) {
          data.tweets.forEach((tweet: any) => {
            this.processTweet(tweet)
          })
        }
      }
    } catch (error) {
      // Silent error - don't spam console for network issues
      if (this.status === 'connected') {
        console.warn('Polling error:', error)
      }
    }
  }

  private processTweet(tweetData: any) {
    try {
      // Transform webhook data to our tweet format
      const tweet: WebhookTweet = {
        id: tweetData.id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: tweetData.username || tweetData.author?.username || 'unknown',
        displayName: tweetData.displayName || tweetData.author?.displayName || tweetData.username || 'Unknown User',
        text: tweetData.text || tweetData.content || tweetData.message || 'No content',
        timestamp: tweetData.timestamp ? new Date(tweetData.timestamp).getTime() : Date.now(),
        profileImage: tweetData.profileImage || tweetData.author?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(tweetData.username || 'User')}&background=1f2937&color=fff`,
        url: tweetData.url || tweetData.tweetUrl || tweetData.link,
        imageUrl: tweetData.imageUrl || tweetData.media?.image || tweetData.attachments?.image,
        followerCount: tweetData.followerCount || tweetData.author?.followerCount || '1K',
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
}

export default WebhookService
