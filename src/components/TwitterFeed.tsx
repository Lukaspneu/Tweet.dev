import React, { useState, useEffect, useRef } from 'react'
import { Search, RefreshCw, Trash2 } from 'lucide-react'

interface TwitterFeedProps {
  onLaunchModalOpen?: () => void
}

interface Tweet {
  id: string
  username: string
  displayName: string
  text: string
  timestamp: number
  profileImage?: string
  url?: string
  imageUrl?: string
  followerCount?: string
}

const TwitterFeed: React.FC<TwitterFeedProps> = ({ onLaunchModalOpen }) => {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAutoScrolling, setIsAutoScrolling] = useState(true)

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

  const filteredTweets = tweets.filter(tweet => 
    tweet.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tweet.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addTestTweet = () => {
    const tweetTemplates = [
      {
        username: 'seven100x',
        displayName: 'Seven100x',
        text: '🚀 Just launched a new token! Check it out on Extract.dev - the ultimate platform for token creation and management. #DeFi #Solana #TokenLaunch',
        profileImage: 'https://avatars.githubusercontent.com/u/1?v=4',
        followerCount: '12.3K',
        url: 'https://twitter.com/seven100x'
      },
      {
        username: 'boblatta',
        displayName: 'Rep. Bob Latta',
        text: 'Today marks 24 years since the September 11th terrorist attacks that changed our nation forever. On that morning, 2,977 innocent lives were taken, and countless families were left with heartbreak, and every American reeled in communal pain. We remember the bravery of the first responders who ran toward dangers when others were fleeing, and the courage of Americans who died as heroes aboard Flight 93. Their sacrifice and selflessness will never be forgotten.',
        profileImage: 'https://pbs.twimg.com/profile_images/1649394978660012032/XkrfP4fL_normal.jpg',
        followerCount: '39.6K',
        imageUrl: 'https://pbs.twimg.com/media/G0kK-AKXoAAo2Zj.jpg',
        url: 'https://x.com/boblatta/status/1966114865417740735'
      },
      {
        username: 'DailyMail',
        displayName: 'Daily Mail',
        text: 'Alice Evans admits she\'s living through some \'dark times\' since her brother\'s \'unexpected death\' last month as she discusses hearing \'brutal news\' for the first time',
        profileImage: 'https://pbs.twimg.com/profile_images/1922564280949317632/zbUSuaqn_normal.png',
        followerCount: '2.9M',
        url: 'https://trib.al/rPE1mnu'
      },
      {
        username: 'elonmusk',
        displayName: 'Elon Musk',
        text: 'The future of AI is here. Neuralink is making incredible progress with brain-computer interfaces. This will revolutionize how we interact with technology.',
        profileImage: 'https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_normal.jpg',
        followerCount: '180.2M',
        url: 'https://twitter.com/elonmusk'
      },
      {
        username: 'VitalikButerin',
        displayName: 'Vitalik Buterin',
        text: 'Ethereum 2.0 is bringing unprecedented scalability and efficiency to blockchain technology. The merge was just the beginning of what\'s possible.',
        profileImage: 'https://pbs.twimg.com/profile_images/977496875887558661/L86xyLF4_normal.jpg',
        followerCount: '5.1M',
        url: 'https://twitter.com/VitalikButerin'
      },
      {
        username: 'solana',
        displayName: 'Solana',
        text: 'Building the future of web3. Solana\'s high-performance blockchain is enabling the next generation of decentralized applications. Join the revolution!',
        profileImage: 'https://pbs.twimg.com/profile_images/1299400345144049665/sPxnVXa7_normal.jpg',
        followerCount: '1.8M',
        url: 'https://twitter.com/solana'
      },
      {
        username: 'CNN',
        displayName: 'CNN',
        text: 'Breaking: Major developments in the ongoing investigation. Authorities are working around the clock to gather more information.',
        profileImage: 'https://pbs.twimg.com/profile_images/1278253934565117952/7Kj6Zb5m_normal.jpg',
        followerCount: '61.2M',
        url: 'https://twitter.com/CNN'
      },
      {
        username: 'BBCBreaking',
        displayName: 'BBC Breaking News',
        text: 'Latest updates from around the world. Stay informed with the most recent developments.',
        profileImage: 'https://pbs.twimg.com/profile_images/1278253934565117952/7Kj6Zb5m_normal.jpg',
        followerCount: '15.7M',
        url: 'https://twitter.com/BBCBreaking'
      },
      {
        username: 'Reuters',
        displayName: 'Reuters',
        text: 'Global news and analysis. Trusted by millions worldwide for accurate and timely reporting.',
        profileImage: 'https://pbs.twimg.com/profile_images/1278253934565117952/7Kj6Zb5m_normal.jpg',
        followerCount: '8.9M',
        url: 'https://twitter.com/Reuters'
      },
      {
        username: 'WSJ',
        displayName: 'Wall Street Journal',
        text: 'Financial markets update: Stocks showing mixed signals as investors weigh economic indicators.',
        profileImage: 'https://pbs.twimg.com/profile_images/1278253934565117952/7Kj6Zb5m_normal.jpg',
        followerCount: '12.4M',
        url: 'https://twitter.com/WSJ'
      },
      {
        username: 'TechCrunch',
        displayName: 'TechCrunch',
        text: 'Startup funding round announced: $50M Series B for innovative AI company. Read more about the breakthrough technology.',
        profileImage: 'https://pbs.twimg.com/profile_images/1278253934565117952/7Kj6Zb5m_normal.jpg',
        followerCount: '3.2M',
        url: 'https://twitter.com/TechCrunch'
      }
    ]

    const randomTemplate = tweetTemplates[Math.floor(Math.random() * tweetTemplates.length)]
    const testTweet: Tweet = {
      id: `test-${Date.now()}`,
      ...randomTemplate,
      timestamp: Date.now()
    }
    setTweets(prevTweets => [testTweet, ...prevTweets.slice(0, 49)])
  }

  const clearTweets = () => {
    setTweets([])
  }

  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoScrolling) return

    const interval = setInterval(() => {
      addTestTweet()
    }, Math.random() * 1500 + 800) // Random interval between 0.8-2.3 seconds for quicker updates

    return () => clearInterval(interval)
  }, [isAutoScrolling])

  // Add initial tweets
  useEffect(() => {
    const initialTweets = [
      {
        id: 'initial-1',
        username: 'boblatta',
        displayName: 'Rep. Bob Latta',
        text: 'Today marks 24 years since the September 11th terrorist attacks that changed our nation forever. On that morning, 2,977 innocent lives were taken, and countless families were left with heartbreak, and every American reeled in communal pain. We remember the bravery of the first responders who ran toward dangers when others were fleeing, and the courage of Americans who died as heroes aboard Flight 93. Their sacrifice and selflessness will never be forgotten.',
        profileImage: 'https://pbs.twimg.com/profile_images/1649394978660012032/XkrfP4fL_normal.jpg',
        followerCount: '39.6K',
        imageUrl: 'https://pbs.twimg.com/media/G0kK-AKXoAAo2Zj.jpg',
        url: 'https://x.com/boblatta/status/1966114865417740735',
        timestamp: Date.now() - 30000
      },
      {
        id: 'initial-2',
        username: 'DailyMail',
        displayName: 'Daily Mail',
        text: 'Alice Evans admits she\'s living through some \'dark times\' since her brother\'s \'unexpected death\' last month as she discusses hearing \'brutal news\' for the first time',
        profileImage: 'https://pbs.twimg.com/profile_images/1922564280949317632/zbUSuaqn_normal.png',
        followerCount: '2.9M',
        url: 'https://trib.al/rPE1mnu',
        timestamp: Date.now() - 60000
      },
      {
        id: 'initial-3',
        username: 'elonmusk',
        displayName: 'Elon Musk',
        text: 'The future of AI is here. Neuralink is making incredible progress with brain-computer interfaces. This will revolutionize how we interact with technology.',
        profileImage: 'https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_normal.jpg',
        followerCount: '180.2M',
        url: 'https://twitter.com/elonmusk',
        timestamp: Date.now() - 90000
      },
      {
        id: 'initial-4',
        username: 'CNN',
        displayName: 'CNN',
        text: 'Breaking: Major developments in the ongoing investigation. Authorities are working around the clock to gather more information.',
        profileImage: 'https://pbs.twimg.com/profile_images/1278253934565117952/7Kj6Zb5m_normal.jpg',
        followerCount: '61.2M',
        url: 'https://twitter.com/CNN',
        timestamp: Date.now() - 120000
      },
      {
        id: 'initial-5',
        username: 'solana',
        displayName: 'Solana',
        text: 'Building the future of web3. Solana\'s high-performance blockchain is enabling the next generation of decentralized applications. Join the revolution!',
        profileImage: 'https://pbs.twimg.com/profile_images/1299400345144049665/sPxnVXa7_normal.jpg',
        followerCount: '1.8M',
        url: 'https://twitter.com/solana',
        timestamp: Date.now() - 150000
      }
    ]
    setTweets(initialTweets)
  }, [])

  return (
    <div className="w-full h-full rounded-xl border overflow-hidden flex flex-col" style={{backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)'}}>
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
        
        {/* Action Buttons */}
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
        
        <button 
          onClick={() => setIsAutoScrolling(!isAutoScrolling)}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity ${isAutoScrolling ? 'bg-green-600/20' : 'bg-gray-600/20'}`}
          title={isAutoScrolling ? "Stop Auto Feed" : "Start Auto Feed"}
        >
          <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${isAutoScrolling ? 'bg-green-400' : 'bg-gray-400'}`} />
        </button>
      </div>

      {/* Tweets Feed */}
      <div className="flex-1 overflow-y-auto tweet-feed-container">
        {filteredTweets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: 'rgb(40,40,40)'}}>
              <Search className="w-8 h-8" style={{color: 'rgb(185, 255, 93)'}} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Tweets Yet</h3>
            <p className="text-sm mb-4" style={{color: 'rgb(192,192,192)'}}>
              Add some test tweets to see them here
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
                Add Test Tweet
              </button>
            </div>
            <div className="mt-2 text-xs" style={{color: 'rgb(192,192,192)'}}>
              Ready for Twitter integration
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredTweets.map((tweet) => (
              <div key={tweet.id} className="w-full max-w-full mx-auto rounded-none overflow-hidden shadow-lg transition-all duration-200 border-b border-b-[5px] border-gray-700/50">
                <div className="relative flex flex-col w-full" style={{backgroundColor: 'rgb(30,30,30)'}}>
                  <div className="relative z-10">
                    <div className="border-b border-gray-700/50 flex">
                      <button className="flex items-center overflow-hidden cursor-pointer hover:bg-gray-600/30 transition-colors duration-200 flex-1 min-w-0 bg-transparent border-0 focus:outline-none text-left px-4 py-3" type="button">
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
                      <button type="button" className="flex items-center justify-center gap-2 px-4 py-2 hover:bg-gray-600/30 transition-colors duration-200 min-w-0 flex-shrink-0 border-l border-gray-700/50" style={{flexBasis: '33.333%'}} onClick={handleDeployClick}>
                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layers w-4 h-4" aria-hidden="true">
                            <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"></path>
                            <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"></path>
                            <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"></path>
                          </svg>
                          <span className="text-sm">Deploy</span>
                        </div>
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="text-gray-100 text-sm leading-relaxed max-h-fit overflow-hidden">
                        <div className="text-left">
                          <span>{tweet.text}</span>
                          {tweet.url && (
                            <a href={tweet.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
                              {tweet.url}
                            </a>
                          )}
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
                          <span>{new Date(tweet.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          <span className="mx-2 text-gray-600 group-hover:text-gray-400 transition-colors duration-200">•</span>
                          <span>{formatTimeAgo(tweet.timestamp)}</span>
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

    </div>
  )
}

export default TwitterFeed