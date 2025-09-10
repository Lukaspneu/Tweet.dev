import React, { useState, useEffect } from 'react'
import { Search, RefreshCw, Trash2, Wifi, WifiOff } from 'lucide-react'

interface TwitterFeedProps {
  onLaunchModalOpen?: () => void
}

interface Tweet {
  id: string
  username: string
  text: string
  timestamp: number
  profileImage?: string
  url?: string
  author?: {
    id: string
    username: string
    name: string
    profilePicture?: string
    isVerified?: boolean
    isBlueVerified?: boolean
    followers?: number
    following?: number
  }
  metrics?: {
    retweet_count: number
    like_count: number
    reply_count: number
    quote_count: number
    view_count: number
    bookmark_count: number
  }
  source?: string
  lang?: string
  isReply?: boolean
  conversationId?: string
}

const TwitterFeed: React.FC<TwitterFeedProps> = ({ onLaunchModalOpen }) => {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)

  const handleDeployClick = () => {
    if (onLaunchModalOpen) {
      onLaunchModalOpen()
    }
  }

  // Fetch tweets from webhook endpoint
  const fetchWebhookTweets = async () => {
    try {
      console.log('🔄 Fetching tweets from webhook...')
      
      const response = await fetch('/api/tweets')
      const data = await response.json()
      
      if (data.success && data.tweets) {
        // Convert webhook tweets to our format
        const convertedTweets: Tweet[] = data.tweets.map((tweet: any) => ({
          id: tweet.id,
          username: tweet.author?.username || 'seven100x',
          text: tweet.text,
          timestamp: new Date(tweet.createdAt).getTime(),
          profileImage: tweet.author?.profilePicture || `https://avatars.githubusercontent.com/u/1?v=4`,
          url: tweet.url,
          author: tweet.author,
          metrics: tweet.metrics,
          source: tweet.source,
          lang: tweet.lang,
          isReply: tweet.isReply,
          conversationId: tweet.conversationId
        }))
        
        setTweets(convertedTweets)
        setIsConnected(true)
        setLastFetchTime(new Date())
        
        console.log(`📊 Fetched ${convertedTweets.length} tweets from webhook`)
      } else {
        console.log('📭 No tweets available from webhook')
        setIsConnected(false)
      }
    } catch (error) {
      console.error('❌ Error fetching webhook tweets:', error)
      setIsConnected(false)
    }
  }

  // Poll for new tweets every 5 seconds
  useEffect(() => {
    // Initial fetch
    fetchWebhookTweets()
    
    // Set up polling
    const interval = setInterval(fetchWebhookTweets, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const filteredTweets = tweets.filter(tweet => 
    tweet.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tweet.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addTestTweet = () => {
    const testTweet: Tweet = {
      id: `test-${Date.now()}`,
      username: 'seven100x',
      text: `🚀 Just launched a new token! Check it out on Extract.dev - the ultimate platform for token creation and management. #DeFi #Solana #TokenLaunch`,
      timestamp: Date.now(),
      profileImage: 'https://avatars.githubusercontent.com/u/1?v=4',
      url: `https://twitter.com/seven100x`
    }
    setTweets(prevTweets => [testTweet, ...prevTweets.slice(0, 49)])
  }

  const clearTweets = () => {
    setTweets([])
  }

  return (
    <div className="w-full h-full rounded-xl border overflow-hidden flex flex-col" style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}}>
      {/* Header with search */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-3 border-b sticky top-0 z-20" style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}}>
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4" style={{color: 'rgb(192,192,192)'}} />
            <input 
              type="text"
              placeholder="Search tweets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400"
              style={{backgroundColor: 'rgb(20,20,20)', borderColor: 'rgb(80,80,80)', color: 'rgb(192,192,192)'}}
            />
          </div>
        </div>
        
        {/* Webhook Status */}
        <div className="flex items-center gap-1 text-xs" style={{color: isConnected ? 'rgb(185, 255, 93)' : 'rgb(255, 100, 100)'}}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'Webhook Active' : 'Webhook Offline'}
        </div>
        
        {/* Action Buttons */}
        <button 
          onClick={fetchWebhookTweets}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" 
          style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}} 
          title="Refresh Webhook"
        >
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" style={{color: 'rgb(192,192,192)'}} />
        </button>
        
        <button 
          onClick={addTestTweet}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" 
          style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}} 
          title="Add Test Tweet"
        >
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" style={{color: 'rgb(192,192,192)'}} />
        </button>
        
        <button 
          onClick={clearTweets}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" 
          style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}} 
          title="Clear All Tweets"
        >
          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" style={{color: 'rgb(192,192,192)'}} />
        </button>
      </div>

      {/* Tweets Feed */}
      <div className="flex-1 overflow-y-auto">
        {filteredTweets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: 'rgb(40,40,40)'}}>
              {isConnected ? <Wifi className="w-8 h-8" style={{color: 'rgb(185, 255, 93)'}} /> : <WifiOff className="w-8 h-8" style={{color: 'rgb(255, 100, 100)'}} />}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isConnected ? 'Webhook Connected' : 'Waiting for Webhook'}
            </h3>
            <p className="text-sm mb-4" style={{color: 'rgb(192,192,192)'}}>
              {isConnected ? 'Monitoring @seven100x via webhook' : 'Setting up webhook connection...'}
            </p>
            
            {lastFetchTime && (
              <div className="mb-4 p-3 rounded-lg text-xs" style={{backgroundColor: 'rgb(40,40,40)', color: 'rgb(192,192,192)', border: '1px solid rgb(80,80,80)'}}>
                Last fetch: {lastFetchTime.toLocaleTimeString()}
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <button 
                onClick={fetchWebhookTweets}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'rgb(185, 255, 93)',
                  color: 'rgb(0,0,0)'
                }}
              >
                Refresh Webhook
              </button>
              
              <button 
                onClick={addTestTweet}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'rgb(30,30,30)',
                  color: 'rgb(192,192,192)',
                  border: '1px solid rgb(80,80,80)'
                }}
              >
                Add Test Tweet
              </button>
            </div>
            
            <div className="mt-2 text-xs" style={{color: 'rgb(192,192,192)'}}>
              {isConnected ? 'Webhook polling every 5s • Rule: 0cdc452da1fd4da8b213ca5482809673' : 'TwitterAPI.io webhook integration'}
            </div>
          </div>
        ) : (
          <div className="p-2 sm:p-4 space-y-3">
            {filteredTweets.map((tweet) => (
              <div key={tweet.id} className="p-3 sm:p-4 rounded-lg border hover:opacity-90 transition-opacity" style={{backgroundColor: 'rgb(25,25,25)', borderColor: 'rgb(60,60,60)'}}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0" style={{backgroundColor: 'rgb(40,40,40)'}}>
                    {tweet.profileImage ? (
                      <img src={tweet.profileImage} alt={tweet.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">
                        {tweet.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">
                        {tweet.author?.name || tweet.username}
                      </span>
                      <span className="text-xs" style={{color: 'rgb(192,192,192)'}}>
                        @{tweet.username}
                      </span>
                      
                      {/* Verification Badges */}
                      {tweet.author?.isVerified && (
                        <span className="text-blue-400 text-xs">✓</span>
                      )}
                      {tweet.author?.isBlueVerified && (
                        <span className="text-blue-400 text-xs">✓</span>
                      )}
                      
                      <span className="text-xs" style={{color: 'rgb(192,192,192)'}}>
                        {formatTimeAgo(tweet.timestamp)}
                      </span>
                    </div>
                    
                    {/* Source Information */}
                    {tweet.source && (
                      <div className="text-xs mb-2" style={{color: 'rgb(120,120,120)'}}>
                        via {tweet.source}
                      </div>
                    )}

                    <p className="text-sm text-white leading-relaxed mb-2">
                      {tweet.text}
                    </p>
                    
                    {/* Tweet Metrics */}
                    {tweet.metrics && (tweet.metrics.like_count > 0 || tweet.metrics.retweet_count > 0 || tweet.metrics.reply_count > 0) && (
                      <div className="flex items-center gap-4 mb-2 text-xs" style={{color: 'rgb(120,120,120)'}}>
                        {tweet.metrics.like_count > 0 && (
                          <span>❤️ {tweet.metrics.like_count}</span>
                        )}
                        {tweet.metrics.retweet_count > 0 && (
                          <span>🔄 {tweet.metrics.retweet_count}</span>
                        )}
                        {tweet.metrics.reply_count > 0 && (
                          <span>💬 {tweet.metrics.reply_count}</span>
                        )}
                        {tweet.metrics.quote_count > 0 && (
                          <span>💭 {tweet.metrics.quote_count}</span>
                        )}
                        {tweet.metrics.view_count > 0 && (
                          <span>👁️ {tweet.metrics.view_count}</span>
                        )}
                      </div>
                    )}
                    
                    {tweet.url && (
                      <a 
                        href={tweet.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs hover:underline" 
                        style={{color: 'rgb(185, 255, 93)'}}
                      >
                        View on Twitter →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
        )}
      </div>

      {/* Deploy Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleDeployClick}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          Deploy Token
        </button>
      </div>
    </div>
  )
}

export default TwitterFeed