import React, { useState, useEffect, useRef } from 'react'
import { Search, Wifi, WifiOff, RefreshCw, Trash2 } from 'lucide-react'

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
}

const TwitterFeed: React.FC<TwitterFeedProps> = ({ onLaunchModalOpen }) => {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  const API_KEY = 'new1_67400f93f49a4ab0a677947a92d8ed77'
  const USERNAME = 'seven100x'

  const handleDeployClick = () => {
    if (onLaunchModalOpen) {
      onLaunchModalOpen()
    }
  }

  // Add user to TwitterAPI.io monitoring
  const addUserToMonitor = async () => {
    try {
      console.log(`📡 Adding @${USERNAME} to TwitterAPI.io monitoring...`)
      
      const response = await fetch('https://api.twitterapi.io/oapi/x_user_stream/add_user_to_monitor_tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          x_user_name: USERNAME
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ User added to monitoring:', data)
      
      if (data.status === 'success') {
        setIsMonitoring(true)
        setConnectionError(null)
        return true
      } else {
        throw new Error(data.msg || 'Failed to add user to monitoring')
      }

    } catch (error) {
      console.error('❌ Error adding user to monitoring:', error)
      setConnectionError(error instanceof Error ? error.message : 'Failed to add user to monitoring')
      setIsMonitoring(false)
      return false
    }
  }

  // Connect to WebSocket stream (placeholder - need actual WebSocket URL from TwitterAPI.io)
  const connectToStream = () => {
    try {
      console.log('🔌 Connecting to TwitterAPI.io WebSocket stream...')
      
      // Note: This is a placeholder URL - TwitterAPI.io should provide the actual WebSocket endpoint
      // You'll need to check their documentation for the real WebSocket URL
      const wsUrl = 'wss://api.twitterapi.io/stream' // This needs to be the actual WebSocket URL
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ Connected to TwitterAPI.io WebSocket stream!')
        setIsConnected(true)
        setConnectionError(null)
      }

      ws.onclose = (event) => {
        console.log('❌ TwitterAPI.io WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        
        if (event.code === 1006) {
          setConnectionError('Connection lost unexpectedly')
        } else if (event.code === 1011) {
          setConnectionError('Server error')
        } else if (event.code === 1000) {
          setConnectionError('Connection closed normally')
        } else {
          setConnectionError(`Connection closed (code: ${event.code})`)
        }
        
        // Attempt to reconnect after 3 seconds
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log('🔄 Attempting to reconnect to TwitterAPI.io...')
            connectToStream()
          }, 3000)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ TwitterAPI.io WebSocket error:', error)
        setConnectionError('WebSocket connection failed')
        setIsConnected(false)
      }

      ws.onmessage = (event) => {
        console.log('📨 Received tweet from TwitterAPI.io:', event.data)
        
        try {
          const data = JSON.parse(event.data)
          
          // Process the tweet data based on TwitterAPI.io format
          if (data.tweet || data.text) {
            const tweetData = data.tweet || data
            
            const newTweet: Tweet = {
              id: tweetData.id || `twitterapi-${Date.now()}-${Math.random()}`,
              username: tweetData.username || tweetData.user?.username || USERNAME,
              text: tweetData.text || tweetData.content || tweetData.message || '',
              timestamp: tweetData.created_at || tweetData.timestamp || Date.now(),
              profileImage: tweetData.user?.profile_image_url || tweetData.profile_image_url,
              url: tweetData.url || `https://twitter.com/${USERNAME}/status/${tweetData.id}`
            }

            console.log('🎯 Processed TwitterAPI.io tweet:', newTweet)
            setTweets(prevTweets => [newTweet, ...prevTweets.slice(0, 49)]) // Keep last 50 tweets
          }
          
        } catch (error) {
          console.error('Error parsing TwitterAPI.io message:', error)
          console.log('Raw message data:', event.data)
        }
      }

    } catch (error) {
      console.error('❌ Error connecting to TwitterAPI.io WebSocket:', error)
      setConnectionError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // Initialize monitoring
  useEffect(() => {
    const initializeMonitoring = async () => {
      console.log(`Initializing TwitterAPI.io monitoring for @${USERNAME}...`)
      
      // Step 1: Add user to monitoring
      const added = await addUserToMonitor()
      
      if (added) {
        // Step 2: Connect to WebSocket stream
        connectToStream()
      }
    }

    initializeMonitoring()

    // Cleanup function
    return () => {
      console.log('Disconnecting TwitterAPI.io monitoring...')
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
      }
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
      id: `twitterapi-test-${Date.now()}`,
      username: USERNAME,
      text: `This is a test tweet from @${USERNAME} via TwitterAPI.io! 🚀`,
      timestamp: Date.now(),
      profileImage: 'https://pbs.twimg.com/profile_images/default_profile_normal.png',
      url: `https://twitter.com/${USERNAME}`
    }
    setTweets(prevTweets => [testTweet, ...prevTweets.slice(0, 49)])
  }

  const reconnect = async () => {
    console.log('🔄 Manual reconnect to TwitterAPI.io...')
    setConnectionError(null)
    
    if (wsRef.current) {
      wsRef.current.close()
    }
    
    // Re-add user to monitoring and reconnect
    const added = await addUserToMonitor()
    if (added) {
      connectToStream()
    }
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
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4" style={{color: 'rgb(192,192,192)'}} />
            </span>
            <input 
              className="w-full h-9 pl-10 pr-4 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none transition-colors" 
              style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)', color: 'rgb(192,192,192)'}}
              placeholder="Search Feed" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'Live' : 'Offline'}
          </div>
          
          {/* Debug Buttons */}
          <button 
            onClick={addTestTweet}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" 
            style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}} 
            title="Add Test Tweet"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" style={{color: 'rgb(192,192,192)'}} />
          </button>
          
          <button 
            onClick={reconnect}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" 
            style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}} 
            title="Reconnect"
          >
            <Wifi className="w-3 h-3 sm:w-4 sm:h-4" style={{color: 'rgb(192,192,192)'}} />
          </button>
          
          <button 
            onClick={clearTweets}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" 
            style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}} 
            title="Clear Tweets"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" style={{color: 'rgb(192,192,192)'}} />
          </button>
        </div>
      </div>

      {/* Connection Error */}
      {connectionError && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-red-400 text-sm">Connection Error: {connectionError}</p>
        </div>
      )}

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto" style={{backgroundColor: 'rgba(30,30,30,0.85)'}}>
        {filteredTweets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{
              backgroundColor: 'rgba(185, 255, 93, 0.1)',
              border: '1px solid rgba(185, 255, 93, 0.3)'
            }}>
              <Wifi className="w-8 h-8" style={{color: 'rgb(185, 255, 93)'}} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Waiting for @seven100x Tweets</h3>
            <p className="text-sm mb-4" style={{color: 'rgb(192,192,192)'}}>
              {isMonitoring ? 'Monitoring @seven100x via TwitterAPI.io...' : 'Setting up TwitterAPI.io monitoring...'}
            </p>
            <p className="text-xs" style={{color: 'rgb(192,192,192)'}}>
              Total tweets: {tweets.length}
            </p>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={addTestTweet}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'rgba(185, 255, 93, 0.1)',
                  border: '1px solid rgba(185, 255, 93, 0.3)',
                  color: 'rgb(185, 255, 93)'
                }}
              >
                Add Test Tweet
              </button>
              <button 
                onClick={reconnect}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'rgba(185, 255, 93, 0.1)',
                  border: '1px solid rgba(185, 255, 93, 0.3)',
                  color: 'rgb(185, 255, 93)'
                }}
              >
                Reconnect
              </button>
            </div>
            <div className="mt-2 text-xs" style={{color: 'rgb(192,192,192)'}}>
              Real-time WebSocket streaming via TwitterAPI.io
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredTweets.map((tweet) => (
              <div key={tweet.id} className="border-b" style={{borderColor: 'rgba(80,80,80,0.3)'}}>
                <div className="flex items-start gap-3 p-4 hover:bg-zinc-900/30 transition-colors duration-200">
                  {/* Profile Image */}
                  <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                    {tweet.profileImage ? (
                      <img 
                        src={tweet.profileImage} 
                        alt={tweet.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center"><span class="text-white font-bold text-sm">' + tweet.username.charAt(0).toUpperCase() + '</span></div>'
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{tweet.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tweet Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-white truncate">{tweet.username}</span>
                      <span className="text-xs" style={{color: 'rgb(192,192,192)'}}>@{tweet.username}</span>
                      <span className="text-xs" style={{color: 'rgb(192,192,192)'}}>•</span>
                      <span className="text-xs" style={{color: 'rgb(192,192,192)'}}>{formatTimeAgo(tweet.timestamp)}</span>
                    </div>
                    
                    <div className="text-sm leading-relaxed mb-2" style={{color: 'rgb(192,192,192)'}}>
                      {tweet.text}
                    </div>
                    
                    {/* Tweet Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-xs hover:text-blue-400 transition-colors" style={{color: 'rgb(192,192,192)'}}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>Reply</span>
                        </button>
                        
                        <button 
                          onClick={handleDeployClick}
                          className="flex items-center gap-1 text-xs hover:text-green-400 transition-colors" 
                          style={{color: 'rgb(192,192,192)'}}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
                          </svg>
                          <span>Deploy</span>
                        </button>
                      </div>
                      
                      {tweet.url && (
                        <a 
                          href={tweet.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 hover:text-blue-400 transition-colors"
                          style={{color: 'rgb(192,192,192)'}}
                        >
                          <span>View</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TwitterFeed
