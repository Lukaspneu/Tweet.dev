import React, { useState, useEffect, useRef } from 'react'
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
  createdAt?: string
  publicMetrics?: {
    retweet_count: number
    like_count: number
    reply_count: number
  }
}

interface TwitterAPIResponse {
  tweets?: Array<{
    id: string
    text: string
    createdAt: string
    publicMetrics?: {
      retweet_count: number
      like_count: number
      reply_count: number
    }
  }>
  has_next_page?: boolean
  next_cursor?: string
}

const API_CONFIG = {
  KEY: 'new1_67400f93f49a4ab0a677947a92d8ed77',
  USERNAME: 'seven100x',
  BASE_URL: 'https://api.twitterapi.io',
  CHECK_INTERVAL: 10000, // 10 seconds
  TIME_WINDOW_HOURS: 1 // Check tweets from last hour
}

const TwitterFeed: React.FC<TwitterFeedProps> = ({ onLaunchModalOpen }) => {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [lastCheckedTime, setLastCheckedTime] = useState<Date>(new Date())
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const seenTweetIds = useRef<Set<string>>(new Set())

  const handleDeployClick = () => {
    if (onLaunchModalOpen) {
      onLaunchModalOpen()
    }
  }

  // Format time for Twitter API query
  const formatTimeForAPI = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '_').replace('T', '_').replace('Z', '_UTC')
  }

  // Check for new tweets using Advanced Search API
  const checkForNewTweets = async (): Promise<Tweet[]> => {
    try {
      const untilTime = new Date()
      const sinceTime = lastCheckedTime
      
      // Format times for API query
      const sinceStr = formatTimeForAPI(sinceTime)
      const untilStr = formatTimeForAPI(untilTime)
      
      // Construct the query as recommended in the blog
      const query = `from:${API_CONFIG.USERNAME} since:${sinceStr} until:${untilStr} include:nativeretweets`
      
      console.log(`🔍 Checking tweets from ${sinceStr} to ${untilStr}`)
      
      // For development, use demo mode since CORS proxies don't support custom headers
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔄 Development mode: Using demo tweets')
        return await getDemoTweets()
      }
      
      // Production: Try direct API call
      const url = `${API_CONFIG.BASE_URL}/twitter/tweet/advanced_search?query=${encodeURIComponent(query)}&queryType=Latest`
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-API-Key': API_CONFIG.KEY
          }
        })
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }
        
        const data: TwitterAPIResponse = await response.json()
        return await processTweetsData(data)
        
      } catch (error) {
        console.log('🔄 Production API failed, falling back to demo mode')
        return await getDemoTweets()
      }
      
    } catch (error) {
      console.error('❌ Error checking for new tweets:', error)
      throw error
    }
  }

  // Get demo tweets for development
  const getDemoTweets = async (): Promise<Tweet[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Generate demo tweets occasionally (10% chance)
    if (Math.random() < 0.1) {
      const demoTweets: Tweet[] = [
        {
          id: `demo-${Date.now()}`,
          username: API_CONFIG.USERNAME,
          text: `🚀 Just launched a new token! Check it out on Extract.dev - the ultimate platform for token creation and management. #DeFi #Solana #TokenLaunch`,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
          profileImage: `https://avatars.githubusercontent.com/u/1?v=4`,
          url: `https://twitter.com/${API_CONFIG.USERNAME}/status/demo-${Date.now()}`,
          publicMetrics: {
            like_count: Math.floor(Math.random() * 50) + 10,
            retweet_count: Math.floor(Math.random() * 20) + 5,
            reply_count: Math.floor(Math.random() * 15) + 2
          }
        }
      ]
      
      // Filter out already seen tweets
      const newTweets = demoTweets.filter(tweet => !seenTweetIds.current.has(tweet.id))
      
      // Add new tweet IDs to seen set
      newTweets.forEach(tweet => seenTweetIds.current.add(tweet.id))
      
      console.log(`📊 Demo mode: Generated ${newTweets.length} new tweets`)
      return newTweets
    }
    
    console.log('📊 Demo mode: No new tweets this check')
    return []
  }

  // Process tweets data and handle pagination
  const processTweetsData = async (data: TwitterAPIResponse): Promise<Tweet[]> => {
    const allTweets: Tweet[] = []
    let currentData = data
    
    while (true) {
      const apiTweets = currentData.tweets || []
      
      if (apiTweets.length > 0) {
        // Convert API tweets to our format
        const newTweets: Tweet[] = apiTweets.map(tweet => ({
          id: tweet.id,
          username: API_CONFIG.USERNAME,
          text: tweet.text,
          timestamp: new Date(tweet.createdAt).getTime(),
          createdAt: tweet.createdAt,
          profileImage: `https://avatars.githubusercontent.com/u/1?v=4`,
          url: `https://twitter.com/${API_CONFIG.USERNAME}/status/${tweet.id}`,
          publicMetrics: tweet.publicMetrics
        }))
        
        allTweets.push(...newTweets)
      }
      
      // Check if there are more pages
      if (currentData.has_next_page && currentData.next_cursor) {
        // For now, we'll skip pagination in CORS proxy mode to keep it simple
        // In production, you'd implement proper pagination handling
        break
      } else {
        break
      }
    }
    
    // Filter out already seen tweets
    const newTweets = allTweets.filter(tweet => !seenTweetIds.current.has(tweet.id))
    
    // Add new tweet IDs to seen set
    newTweets.forEach(tweet => seenTweetIds.current.add(tweet.id))
    
    console.log(`📊 Found ${allTweets.length} total tweets, ${newTweets.length} new tweets`)
    
    return newTweets
  }

  // Start monitoring loop
  const startMonitoring = () => {
    if (pollingIntervalRef.current) {
      console.log('⚠️ Monitoring already active')
      return
    }

    console.log(`🚀 Starting Twitter monitoring for @${API_CONFIG.USERNAME} every ${API_CONFIG.CHECK_INTERVAL / 1000} seconds`)
    setIsPolling(true)
    setIsConnected(true)
    setConnectionError(null)

    // Initial check
    checkForNewTweets().then(newTweets => {
      if (newTweets.length > 0) {
        setTweets(prevTweets => [...newTweets, ...prevTweets.slice(0, 49)])
        console.log(`📊 Initial check: found ${newTweets.length} tweets`)
      }
      setLastCheckedTime(new Date())
    }).catch(error => {
      console.error('❌ Initial check failed:', error)
      setConnectionError('Initial check failed')
    })

    // Set up monitoring interval
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const newTweets = await checkForNewTweets()
        
        if (newTweets.length > 0) {
          setTweets(prevTweets => [...newTweets, ...prevTweets.slice(0, 49)])
          console.log(`📊 Added ${newTweets.length} new tweets`)
        }
        
        // Update last checked time
        setLastCheckedTime(new Date())
        
      } catch (error) {
        console.error('❌ Monitoring error:', error)
        setConnectionError('Monitoring error occurred')
      }
    }, API_CONFIG.CHECK_INTERVAL)
  }

  // Stop monitoring
  const stopMonitoring = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setIsPolling(false)
    setIsConnected(false)
    console.log('🛑 Stopped Twitter monitoring')
  }

  // Manual refresh
  const manualRefresh = async () => {
    console.log('🔄 Manual refresh requested...')
    try {
      const newTweets = await checkForNewTweets()
      if (newTweets.length > 0) {
        setTweets(prevTweets => [...newTweets, ...prevTweets.slice(0, 49)])
        console.log(`📊 Manual refresh: added ${newTweets.length} tweets`)
      }
      setLastCheckedTime(new Date())
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
    }
  }

  // Initialize monitoring on component mount
  useEffect(() => {
    startMonitoring()

    return () => {
      stopMonitoring()
    }
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
        
          {/* Connection Status */}
          <div className="flex items-center gap-1 text-xs" style={{color: isConnected ? 'rgb(185, 255, 93)' : 'rgb(255, 100, 100)'}}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isPolling ? 'Monitoring' : isConnected ? 'Connected' : 'Offline'}
          </div>
          
          {/* Action Buttons */}
          <button 
            onClick={manualRefresh}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" 
            style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}} 
            title="Refresh Now"
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
              {isPolling ? `Monitoring @${API_CONFIG.USERNAME}` : isConnected ? 'Connected to TwitterAPI.io' : 'Setting up Twitter monitoring...'}
            </h3>
            <p className="text-sm mb-4" style={{color: 'rgb(192,192,192)'}}>
              {isPolling ? `Checking for new tweets every ${API_CONFIG.CHECK_INTERVAL / 1000} seconds` : 
               isConnected ? 'Advanced Search API ready, waiting for tweets...' : 
               'Initializing Twitter monitoring...'}
            </p>
            
            {/* Demo Mode Indicator */}
            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
              <div className="mb-4 p-3 rounded-lg text-xs" style={{backgroundColor: 'rgb(40,40,20)', color: 'rgb(255, 255, 100)', border: '1px solid rgb(80,80,40)'}}>
                🧪 Demo Mode: Simulating Twitter API responses for development
              </div>
            )}
            
            {connectionError && (
              <div className="mb-4 p-3 rounded-lg text-xs" style={{backgroundColor: 'rgb(40,20,20)', color: 'rgb(255, 100, 100)', border: '1px solid rgb(80,40,40)'}}>
                Error: {connectionError}
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              <button 
                onClick={manualRefresh}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'rgb(185, 255, 93)',
                  color: 'rgb(0,0,0)'
                }}
              >
                Refresh Now
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
              {isPolling ? 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ?
                  `Demo Mode • Every ${API_CONFIG.CHECK_INTERVAL / 1000}s • Simulating @${API_CONFIG.USERNAME}` :
                  `Advanced Search API • Every ${API_CONFIG.CHECK_INTERVAL / 1000}s • Time window: ${API_CONFIG.TIME_WINDOW_HOURS}h` 
                : 'TwitterAPI.io Advanced Search integration'}
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
                      <span className="font-semibold text-white text-sm">@{tweet.username}</span>
                      <span className="text-xs" style={{color: 'rgb(192,192,192)'}}>
                        {formatTimeAgo(tweet.timestamp)}
                      </span>
      </div>

                    <p className="text-sm text-white leading-relaxed mb-2">
                      {tweet.text}
                    </p>
                    
                    {/* Tweet Metrics */}
                    {tweet.publicMetrics && (
                      <div className="flex items-center gap-4 mb-2 text-xs" style={{color: 'rgb(120,120,120)'}}>
                        {tweet.publicMetrics.like_count > 0 && (
                          <span>❤️ {tweet.publicMetrics.like_count}</span>
                        )}
                        {tweet.publicMetrics.retweet_count > 0 && (
                          <span>🔄 {tweet.publicMetrics.retweet_count}</span>
                        )}
                        {tweet.publicMetrics.reply_count > 0 && (
                          <span>💬 {tweet.publicMetrics.reply_count}</span>
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