import React, { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Trash2, Play, Pause, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import WebhookService, { WebhookTweet } from '../services/webhookService'

interface TwitterFeedProps {
  onLaunchModalOpen?: () => void
}

interface Tweet extends WebhookTweet {
  timestamp: number
}

const TwitterFeed: React.FC<TwitterFeedProps> = ({ onLaunchModalOpen }) => {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  // const [isAutoScrolling] = useState(true)
  // const [isPausedOnHover, setIsPausedOnHover] = useState(false)
  const [showHoverBox, setShowHoverBox] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [hoverPauseEnabled, setHoverPauseEnabled] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [webhookService, setWebhookService] = useState<WebhookService | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleDeployClick = () => {
    if (onLaunchModalOpen) {
      onLaunchModalOpen()
    }
  }

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

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const timeString = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    const timeAgo = formatTimeAgo(timestamp)
    return `${timeString} • ${timeAgo}`
  }

  const filteredTweets = tweets.filter(tweet => 
    tweet.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tweet.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Webhook service callbacks
  const handleNewTweet = useCallback((webhookTweet: WebhookTweet) => {
    const tweet: Tweet = {
      ...webhookTweet,
      timestamp: webhookTweet.timestamp ? new Date(webhookTweet.timestamp).getTime() : Date.now()
    }
    
    setTweets(prevTweets => {
      // Check if tweet already exists (prevent duplicates)
      const exists = prevTweets.some(t => t.id === tweet.id)
      if (exists) return prevTweets
      
      // Add new tweet at the beginning and keep only latest 100
      return [tweet, ...prevTweets.slice(0, 99)]
    })
  }, [])

  const handleError = useCallback((error: string) => {
    setErrorMessage(error)
    console.error('Webhook error:', error)
  }, [])

  const handleStatusChange = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    setConnectionStatus(status)
    if (status === 'connected') {
      setErrorMessage('')
    }
  }, [])

  // Initialize webhook service
  useEffect(() => {
    const service = new WebhookService({
      onNewTweet: handleNewTweet,
      onError: handleError,
      onStatusChange: handleStatusChange
    })
    
    setWebhookService(service)
    service.startPolling()

    return () => {
      // Cleanup will be handled by the service
    }
  }, [handleNewTweet, handleError, handleStatusChange])

  // Test function for simulating tweets
  const addTestTweet = () => {
    if (webhookService) {
      webhookService.simulateTweet()
    }
  }

  const clearTweets = () => {
    setTweets([])
  }

  // const handleTweetHover = () => {
  //   if (isAutoScrolling && hoverPauseEnabled) {
  //     setIsPausedOnHover(true)
  //   }
  // }

  // const handleTweetLeave = () => {
  //   setIsPausedOnHover(false)
  // }

  const handleFeedHover = () => {
    if (!hoverPauseEnabled) return
    
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setShowHoverBox(true)
  }

  const handleFeedLeave = () => {
    if (!hoverPauseEnabled) return
    
    const timeout = setTimeout(() => {
      setShowHoverBox(false)
    }, 100) // Small delay to prevent flickering
    setHoverTimeout(timeout)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

  return (
    <div 
      className={`w-full h-full rounded-xl border overflow-hidden flex flex-col relative transition-all duration-300 ${
        showHoverBox ? 'ring-2 ring-gray-500/30 ring-offset-2 ring-offset-transparent' : ''
      }`}
      style={{
        backgroundColor: 'rgb(30,30,30)', 
        borderColor: showHoverBox ? 'rgb(120,120,120)' : 'rgb(80,80,80)',
        boxShadow: showHoverBox ? '0 0 20px rgba(120, 120, 120, 0.1)' : 'none'
      }}
      onMouseEnter={handleFeedHover}
      onMouseLeave={handleFeedLeave}
    >
      {/* Header with search */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-3 border-b sticky top-0 z-20" style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}}>
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4" style={{color: 'rgb(192,192,192)', zIndex: 10}} />
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
        <div className="flex items-center gap-1">
          {connectionStatus === 'connected' && (
            <div title="Connected to webhook">
              <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
            </div>
          )}
          {connectionStatus === 'connecting' && (
            <div title="Connecting...">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 animate-spin" />
            </div>
          )}
          {connectionStatus === 'error' && (
            <div title="Connection error">
              <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
            </div>
          )}
          {connectionStatus === 'disconnected' && (
            <div title="Disconnected">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <button 
          onClick={addTestTweet}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity" 
          style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}} 
          title="Simulate Test Tweet"
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
        
        <button 
          onClick={() => setHoverPauseEnabled(!hoverPauseEnabled)}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity ${hoverPauseEnabled ? 'bg-green-600/20' : 'bg-gray-600/20'}`}
          title={hoverPauseEnabled ? "Disable Hover Pause" : "Enable Hover Pause"}
        >
          {hoverPauseEnabled ? (
            <Pause className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
          ) : (
            <Play className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Tweets Feed */}
      <div className="flex-1 overflow-y-auto tweet-feed-container">
        {filteredTweets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: 'rgb(40,40,40)'}}>
              {connectionStatus === 'connected' ? (
                <Wifi className="w-8 h-8 text-green-400" />
              ) : connectionStatus === 'connecting' ? (
                <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin" />
              ) : connectionStatus === 'error' ? (
                <WifiOff className="w-8 h-8 text-red-400" />
              ) : (
              <Search className="w-8 h-8" style={{color: 'rgb(185, 255, 93)'}} />
              )}
            </div>
            
            {connectionStatus === 'connected' ? (
              <>
                <h3 className="text-lg font-semibold text-white mb-2">Ready for Tweets</h3>
            <p className="text-sm mb-4" style={{color: 'rgb(192,192,192)'}}>
                  Webhook is connected and ready to receive tweets
            </p>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={addTestTweet}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  backgroundColor: 'rgb(185, 255, 93)',
                  color: 'rgb(0,0,0)'
                }}
              >
                    Test Tweet
                  </button>
                </div>
                <div className="mt-2 text-xs text-green-400">
                  ✅ Connected to webhook system
                </div>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <h3 className="text-lg font-semibold text-white mb-2">Connecting...</h3>
                <p className="text-sm mb-4" style={{color: 'rgb(192,192,192)'}}>
                  Establishing connection to webhook system
                </p>
                <div className="mt-2 text-xs text-yellow-400">
                  🔄 Connecting to webhook...
                </div>
              </>
            ) : connectionStatus === 'error' ? (
              <>
                <h3 className="text-lg font-semibold text-white mb-2">Connection Error</h3>
                <p className="text-sm mb-4" style={{color: 'rgb(192,192,192)'}}>
                  {errorMessage || 'Failed to connect to webhook system'}
                </p>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => webhookService?.reconnect()}
                    className="px-3 py-1 rounded text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: 'rgb(185, 255, 93)',
                      color: 'rgb(0,0,0)'
                    }}
                  >
                    Retry Connection
              </button>
            </div>
                <div className="mt-2 text-xs text-red-400">
                  ❌ Connection failed
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-white mb-2">Initializing...</h3>
                <p className="text-sm mb-4" style={{color: 'rgb(192,192,192)'}}>
                  Setting up webhook connection
                </p>
            <div className="mt-2 text-xs" style={{color: 'rgb(192,192,192)'}}>
                  🔧 Initializing webhook system
            </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {filteredTweets.map((tweet) => (
              <div 
                key={tweet.id} 
                className="w-full max-w-full mx-auto rounded-none overflow-hidden shadow-lg transition-all duration-200 border-b border-b-[5px] border-gray-700/50" 
                data-tweet-container="true"
              >
                <div className="relative flex flex-col w-full" style={{backgroundColor: 'rgb(30,30,30)'}}>
                  <div className="relative z-10">
                    <div className="border-b border-gray-700/50 flex items-center justify-between px-4 py-3">
                      <button className="flex items-center overflow-hidden cursor-pointer hover:bg-gray-600/30 transition-colors duration-200 flex-1 min-w-0 bg-transparent border-0 focus:outline-none text-left" type="button">
                        <img alt="." className="w-8 h-8 rounded-full object-cover border border-gray-700 flex-shrink-0 shadow-sm" loading="lazy" decoding="async" src={tweet.profileImage || 'https://pbs.twimg.com/profile_images/1922564280949317632/zbUSuaqn_normal.png'} />
                        <div className="flex flex-col ml-3 overflow-hidden min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-sm truncate text-white">{tweet.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="truncate">@{tweet.username}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-3 h-3" aria-hidden="true">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                              </svg>
                              <span>{tweet.followerCount || '1.2K'}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                      <button 
                        type="button" 
                        className="flex items-center justify-center px-4 py-2 hover:bg-gray-600/40 transition-colors duration-200 rounded-md font-medium"
                        style={{
                          backgroundColor: 'rgba(30, 30, 30, 0.8)',
                          borderColor: 'rgb(80, 80, 80)',
                          color: 'rgb(192, 192, 192)',
                          border: '1px solid'
                        }}
                        onClick={handleDeployClick}
                      >
                        <span className="text-sm">Deploy</span>
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="text-gray-100 text-sm leading-relaxed max-h-fit overflow-hidden">
                        <div className="text-left">
                          <span>{tweet.text}</span>
                        </div>
                      </div>
                      {tweet.imageUrl && (
                        <div className="px-0 pt-2">
                          <div className="rounded-lg border border-gray-700/50 shadow-sm flex items-center justify-center bg-gray-900/50 w-full">
                            <div className="relative group w-full h-full flex items-center justify-center">
                              <img alt="" className="object-contain max-w-full max-h-[250px] cursor-pointer transition-all duration-200" tabIndex={0} draggable={true} src={tweet.imageUrl} />
                              <button type="button" className="absolute top-2 right-2 bg-black/60 rounded-full p-1 transition-opacity duration-200 opacity-70" aria-label="Expand image">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize w-6 h-6 text-white drop-shadow p-1" aria-hidden="true">
                                  <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                                  <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                                  <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                                  <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                      </div>
                    )}
                    </div>
                    <div className="flex items-center border-t border-gray-700/50 h-10">
                      <button type="button" className="flex items-center justify-center h-full w-10 border-r border-gray-700/50 transition-colors duration-200 text-gray-500 hover:text-red-400 hover:bg-red-500/10" title={`Remove @${tweet.username} from feed`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-4 h-4" aria-hidden="true">
                          <path d="M18 6 6 18"></path>
                          <path d="m6 6 12 12"></path>
                        </svg>
                      </button>
                      <div className="flex-1 flex justify-between items-center px-4 h-full cursor-pointer hover:bg-gray-600/30 transition-colors duration-200 group">
                        <div className="flex items-center text-xs text-gray-400 group-hover:text-gray-200 transition-colors duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock w-3.5 h-3.5 mr-1.5 text-gray-500 group-hover:text-gray-300 transition-colors duration-200" aria-hidden="true">
                            <path d="M12 6v6l4 2"></path>
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                          <span>{formatTimestamp(tweet.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="button" className="text-xs flex items-center gap-1.5 text-gray-400 hover:text-gray-200" title="Translate to English">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-languages w-3.5 h-3.5" aria-hidden="true">
                              <path d="m5 8 6 6"></path>
                              <path d="m4 14 6-6 2-3"></path>
                              <path d="M2 5h12"></path>
                              <path d="M7 2h1"></path>
                              <path d="m22 22-5-10-5 10"></path>
                              <path d="M14 18h6"></path>
                            </svg>
                            <span>Translate</span>
                          </button>
                    {tweet.url && (
                            <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 group-hover:text-gray-200 text-xs flex items-center transition-colors duration-200">
                              <span className="mr-1.5">View</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link w-3.5 h-3.5" aria-hidden="true">
                                <path d="M15 3h6v6"></path>
                                <path d="M10 14 21 3"></path>
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              </svg>
                      </a>
                    )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
        )}
      </div>

      {/* Feed Paused Indicator */}
      {showHoverBox && hoverPauseEnabled && (
        <div className="absolute top-16 left-0 right-0 z-30 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <div 
            className="backdrop-blur-sm border rounded-md px-3 py-1.5 shadow-lg mx-4"
            style={{
              backgroundColor: 'rgba(30, 30, 30, 0.7)',
              borderColor: 'rgb(80, 80, 80)'
            }}
          >
            <div className="flex items-center justify-center gap-2 text-sm font-medium" style={{color: 'rgb(192, 192, 192)'}}>
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
              <span>Feed Paused</span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default TwitterFeed