import React, { useState, useEffect, useCallback } from 'react'
import { Search, Play, Pause } from 'lucide-react'
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
  const [displayLimit, setDisplayLimit] = useState(10) // Start with 10 tweets
  const [maxTweets] = useState(50) // Maximum tweets to prevent lag
  const [currentTime, setCurrentTime] = useState<number>(Date.now())

  // Continuous timer to update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleDeployClick = () => {
    if (onLaunchModalOpen) {
      onLaunchModalOpen()
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const diff = currentTime - timestamp
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

  const filteredTweets = tweets
    .filter(tweet => 
    tweet.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tweet.username.toLowerCase().includes(searchTerm.toLowerCase())
  )
    .sort((a, b) => b.timestamp - a.timestamp) // Sort by timestamp (newest first)
    .slice(0, displayLimit) // Limit display to prevent lag

  // Webhook service callbacks
  const handleNewTweet = useCallback((webhookTweet: WebhookTweet) => {
    // 🔍 STEP 7: UI RECEIVES TWEET FROM WEBHOOK SERVICE
    console.log('🔍 STEP 7: UI RECEIVED TWEET FROM WEBHOOK SERVICE');
    console.log('🎯 UI RECEIVED TWEET WITH EMBEDS:', {
      id: webhookTweet.id,
      username: webhookTweet.username,
      embeds: webhookTweet.embeds,
      embedsLength: webhookTweet.embeds?.length || 0,
      imageUrl: webhookTweet.imageUrl,
      hasImageUrl: !!webhookTweet.imageUrl,
      fullTweet: webhookTweet
    });
    
    // CRITICAL UI DEBUG: Check if image will be displayed
    if (webhookTweet.imageUrl) {
      console.log('✅ UI: IMAGE URL PRESENT - WILL DISPLAY:', webhookTweet.imageUrl);
    } else {
      console.log('❌ UI: NO IMAGE URL - WILL NOT DISPLAY IMAGE');
      console.log('❌ UI: Full webhookTweet object:', JSON.stringify(webhookTweet, null, 2));
    }
    
    const now = Date.now() // Get exact current time
    const tweet: Tweet = {
      ...webhookTweet,
      timestamp: now // Use exact current time so every new tweet starts at "0s ago"
    }
    
    setTweets(prevTweets => {
      // Check if tweet already exists (prevent duplicates)
      const exists = prevTweets.some(t => t.id === tweet.id)
      if (exists) {
        console.log('🔍 STEP 8: TWEET ALREADY EXISTS, SKIPPING');
        return prevTweets;
      }
      
      console.log('🔍 STEP 8: ADDING NEW TWEET TO STATE');
      console.log('🎯 TWEET BEING ADDED TO STATE:', {
        id: tweet.id,
        username: tweet.username,
        embeds: tweet.embeds,
        embedsCount: tweet.embeds?.length || 0,
        imageUrl: tweet.imageUrl,
        hasImageUrl: !!tweet.imageUrl
      });
      
      // Add new tweet and sort by timestamp (newest first)
      const newTweets = [tweet, ...prevTweets]
        .sort((a, b) => b.timestamp - a.timestamp) // Newest first
        .slice(0, maxTweets) // Keep only the latest maxTweets
      
      console.log('🔍 STEP 9: TWEETS STATE UPDATED, TOTAL TWEETS:', newTweets.length);
      return newTweets
    })
  }, [maxTweets])

  const handleError = useCallback((error: string) => {
    console.error('Webhook error:', error)
  }, [])

  const handleStatusChange = useCallback((status: 'connecting' | 'connected' | 'disconnected' | 'error') => {
    // Status change handling removed for simplicity
    console.log('Webhook status:', status)
  }, [])

  // Initialize webhook service
  useEffect(() => {
    const service = new WebhookService()
    service.setOnNewTweet(handleNewTweet)
    
    service.startPolling()

    return () => {
      // Cleanup will be handled by the service
    }
  }, [handleNewTweet, handleError, handleStatusChange])

  // Removed unused functions: addTestTweet and clearTweets

  const loadMoreTweets = () => {
    setDisplayLimit(prev => Math.min(prev + 20, maxTweets)) // Load 20 more, up to maxTweets
  }

  const resetDisplayLimit = () => {
    setDisplayLimit(10) // Reset to initial 10 tweets
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
        
        {/* Pause Button Only */}
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
            <h3 className="text-lg font-semibold text-white mb-2">Waiting for new tweets</h3>
            <p className="text-sm" style={{color: 'rgb(192,192,192)'}}>
              Tweets will appear here when they arrive
            </p>
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
                      {/* Video Media - Enhanced with raw payload support */}
                      {(() => {
                        // Check for videos in raw payload embeds
                        const rawVideos = tweet.rawPayload?.embeds?.filter((embed: any) => embed.video?.url).map((embed: any) => embed.video.url) || [];
                        const allVideos = [...(tweet.videoUrl ? [tweet.videoUrl] : []), ...rawVideos];
                        
                        return allVideos.map((videoUrl, index) => (
                          <div key={index} className="px-0 pt-2">
                            <div className="rounded-lg border border-gray-700/50 shadow-sm flex items-center justify-center bg-gray-900/50 w-full overflow-hidden">
                            <div className="relative group w-full h-full flex items-center justify-center">
                                <video 
                                  src={videoUrl} 
                                  poster={tweet.videoPoster || tweet.imageUrl}
                                  controls 
                                  preload="metadata" 
                                  className="object-contain max-w-full max-h-[400px] w-full rounded-lg"
                                  style={{ maxHeight: '400px' }}
                                >
                                  Your browser does not support the video tag.
                                </video>
                                <button type="button" className="absolute top-2 right-2 bg-black/60 rounded-full p-1 transition-opacity duration-200 opacity-70 hover:opacity-100" aria-label="Expand video">
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
                        ));
                      })()}
                      
                      {/* Image Media - Extract DIRECTLY from raw payload */}
                      {(() => {
                        console.log('🎯 EXTRACTING IMAGES FROM COMPLETELY RAW PAYLOAD:', tweet.id);
                        console.log('🎯 Raw payload keys:', Object.keys(tweet.rawPayload || {}));
                        
                        // Search the ENTIRE raw payload for ANY image URLs
                        const searchForImages = (obj: any, path = ''): string[] => {
                          const found: string[] = [];
                          if (typeof obj === 'string' && obj.includes('http') && obj.includes('pbs.twimg.com')) {
                            if (!obj.includes('profile') && !obj.includes('avatar') && obj.includes('media')) {
                              found.push(obj);
                              console.log(`🖼️ Found image URL at ${path}:`, obj);
                            }
                          }
                          if (typeof obj === 'object' && obj !== null) {
                            Object.keys(obj).forEach(key => {
                              found.push(...searchForImages(obj[key], path ? `${path}.${key}` : key));
                            });
                          }
                          return found;
                        };
                        
                        const foundImages = searchForImages(tweet.rawPayload);
                        console.log('🔍 ALL FOUND IMAGES:', foundImages);
                        
                        return foundImages.map((imageUrl, index) => (
                          <div key={index} className="px-0 pt-2">
                            <div className="rounded-lg border border-gray-700/50 shadow-sm bg-gray-900/50 w-full overflow-hidden">
                              <img 
                                alt="Tweet image (from raw payload)" 
                                className="w-full max-h-[400px] object-contain rounded-lg" 
                                src={imageUrl}
                                onError={(e) => {
                                  console.error('❌ Raw payload image failed to load:', imageUrl);
                                  const target = e.target as HTMLImageElement;
                                  target.style.border = '2px solid red';
                                  target.alt = 'Image failed to load';
                                }}
                                onLoad={() => {
                                  console.log('✅ Raw payload image loaded successfully:', imageUrl);
                                }}
                              />
                            </div>
                          </div>
                        ));
                      })()}

                      {/* FALLBACK: Display ANY image URLs found */}
                      {!tweet.imageUrl && !tweet.videoUrl && (
                        <div className="px-0 pt-2 space-y-2">
                          {(() => {
                            // Find any image URLs in the tweet data
                            const findImageUrls = (obj: any): string[] => {
                              if (typeof obj === 'string' && obj.includes('http') && 
                                  (obj.includes('pbs.twimg.com') || obj.includes('media') || obj.match(/\.(jpg|jpeg|png|gif|webp)/i))) {
                                if (!obj.includes('profile') && !obj.includes('avatar') && !obj.includes('banner')) {
                                  return [obj];
                                }
                              }
                              if (typeof obj === 'object' && obj !== null) {
                                const urls: string[] = [];
                                Object.keys(obj).forEach(key => {
                                  urls.push(...findImageUrls(obj[key]));
                                });
                                return urls;
                              }
                              return [];
                            };
                            
                            const imageUrls = findImageUrls(tweet);
                            console.log('🎯 FOUND IMAGE URLS IN TWEET:', imageUrls);
                            
                            return imageUrls.map((url, index) => (
                              <div key={index} className="rounded-lg border border-gray-700/50 shadow-sm bg-gray-900/50 w-full overflow-hidden">
                                <img 
                                  alt="Tweet image" 
                                  className="w-full max-h-[400px] object-contain rounded-lg" 
                                  src={url}
                                  onError={(e) => {
                                    console.error('❌ Fallback image failed to load:', url);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  onLoad={() => {
                                    console.log('✅ Fallback image loaded successfully:', url);
                                  }}
                                />
                              </div>
                            ));
                          })()}
                        </div>
                      )}

                      {/* Embeds Media */}
                      {tweet.embeds && tweet.embeds.length > 0 && (() => {
                        console.log('🎯 RENDERING EMBEDS:', tweet.embeds);
                        return (
                          <div className="px-0 pt-2 space-y-2">
                            {tweet.embeds.map((embed, index) => (
                            <div key={index} className="rounded-lg border border-gray-700/50 shadow-sm bg-gray-900/50 w-full overflow-hidden">
                              {embed.imageUrl && (
                                <img 
                                  alt={embed.title || "Embedded image"} 
                                  className="w-full max-h-[400px] object-contain rounded-lg" 
                                  src={embed.imageUrl}
                                  onError={(e) => {
                                    console.log('🖼️ Embed image failed to load:', embed.imageUrl);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                  onLoad={() => {
                                    console.log('🖼️ Embed image loaded successfully:', embed.imageUrl);
                                  }}
                                />
                              )}
                              {embed.videoUrl && !embed.imageUrl && (
                                <div className="relative group w-full h-full flex items-center justify-center">
                                  <video 
                                    src={embed.videoUrl} 
                                    poster={embed.thumbnailUrl}
                                    controls 
                                    preload="metadata" 
                                    className="object-contain max-w-full max-h-[400px] w-full rounded-lg"
                                    style={{ maxHeight: '400px' }}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}
                              {embed.title && (
                                <div className="p-3 bg-gray-800/50">
                                  <h4 className="text-sm font-semibold text-white mb-1">{embed.title}</h4>
                                  {embed.description && (
                                    <p className="text-xs text-gray-300">{embed.description}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        );
                      })()}
                      
                      {/* RAW PAYLOAD DISPLAY - Beautiful JSON viewer */}
                      {tweet.rawPayload && (
                        <div className="px-0 pt-4">
                          <div className="rounded-lg border border-gray-700/50 shadow-sm bg-gray-900/50 overflow-hidden">
                            <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
                              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                Raw Webhook Payload
                              </h4>
                            </div>
                            <div className="p-4">
                              <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                {JSON.stringify(tweet.rawPayload, null, 2)}
                              </pre>
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
            
            {/* Load More Button */}
            {tweets.length > displayLimit && (
              <div className="flex justify-center py-4">
                <button
                  onClick={loadMoreTweets}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgb(185, 255, 93)',
                    color: 'rgb(0,0,0)'
                  }}
                >
                  Load More ({Math.min(displayLimit + 20, maxTweets) - displayLimit} more)
                </button>
              </div>
            )}
            
            {/* Reset Button */}
            {displayLimit > 10 && (
              <div className="flex justify-center pb-4">
                <button
                  onClick={resetDisplayLimit}
                  className="px-3 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgb(80,80,80)',
                    color: 'rgb(192,192,192)'
                  }}
                >
                  Show Latest 10 Only
                </button>
              </div>
            )}
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