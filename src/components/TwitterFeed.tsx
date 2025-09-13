import React, { useState, useEffect } from 'react'
import { Search, RefreshCw, Trash2, Play, Pause } from 'lucide-react'

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
  const [isAutoScrolling] = useState(true)
  const [isPausedOnHover, setIsPausedOnHover] = useState(false)
  const [showHoverBox, setShowHoverBox] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [hoverPauseEnabled, setHoverPauseEnabled] = useState(true)

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
        text: '🚀 Just launched a new token! Check it out on DeckDev - the ultimate platform for token creation and management. #DeFi #Solana #TokenLaunch',
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
      },
      {
        username: 'El_Cooperante',
        displayName: 'El Cooperante',
        text: '#11Sep 📰| ⚽🇻🇪 Batista tras derrota ante Colombia: "Estábamos atrás de un sueño que no pudo ser"',
        profileImage: 'https://pbs.twimg.com/profile_images/1340660710720847874/mMOODVAK_normal.jpg',
        followerCount: '439.6K',
        url: 'https://elcooperante.com/es-un-momento-muy-duro-batista-pidio-disculpas-al-pueblo-venezolano-tras-derrota-de-la-vinotinto-ante-colombia/',
        imageUrl: 'https://pbs.twimg.com/card_img/1965729940898504704/Pv0WBH5W?format=jpg&name=600x600'
      },
      {
        username: 'HoloworldAI',
        displayName: 'Holoworld AI',
        text: '@pudgypenguins Give me the two',
        profileImage: 'https://pbs.twimg.com/profile_images/1654902057646825473/GKppeqtS_normal.png',
        followerCount: '209.8K',
        url: 'https://x.com/HoloworldAI/status/1966223063219056909',
        imageUrl: 'https://pbs.twimg.com/media/G0lqtz_WoAAEMOU.jpg'
      },
      {
        username: 'WashTimes',
        displayName: 'The Washington Times',
        text: 'Pope Leo\'s Augustinian order elects an American superior to lead during papacy of American pope @twthigherground',
        profileImage: 'https://pbs.twimg.com/profile_images/1755281859146080256/D-S95q4t_normal.png',
        followerCount: '471.7K',
        url: 'https://trib.al/2Jn43EF'
      },
      {
        username: 'NASA',
        displayName: 'NASA',
        text: '🚀 BREAKING: James Webb Space Telescope captures stunning new images of distant galaxies formed just 400 million years after the Big Bang! These observations are revolutionizing our understanding of the early universe. #JWSTScience #SpaceExploration',
        profileImage: 'https://pbs.twimg.com/profile_images/1321163587679784960/0ZxKlEKB_normal.jpg',
        followerCount: '56.8M',
        url: 'https://www.nasa.gov/news',
        imageUrl: 'https://pbs.twimg.com/media/GXample1.jpg'
      },
      {
        username: 'SpaceX',
        displayName: 'SpaceX',
        text: 'Successful launch of Falcon Heavy! All three boosters have landed safely. Next stop: Mars mission preparation continues. The future of space exploration is here! 🚀',
        profileImage: 'https://pbs.twimg.com/profile_images/1082744382585856001/rH_k3PtQ_normal.jpg',
        followerCount: '21.2M',
        url: 'https://spacex.com',
        imageUrl: 'https://pbs.twimg.com/media/GXample2.jpg'
      },
      {
        username: 'Apple',
        displayName: 'Apple',
        text: 'Introducing the new iPhone 15 Pro with titanium design and revolutionary camera system. Shot on iPhone has never looked better. Pre-orders start Friday! #iPhone15Pro',
        profileImage: 'https://pbs.twimg.com/profile_images/1283958620359516160/p7zz5dxZ_normal.jpg',
        followerCount: '8.9M',
        url: 'https://apple.com',
        imageUrl: 'https://pbs.twimg.com/media/GXample3.jpg'
      },
      {
        username: 'Microsoft',
        displayName: 'Microsoft',
        text: 'AI for everyone: Microsoft Copilot is now available across all our productivity apps. Transform how you work with intelligent assistance built right into Office 365. #MicrosoftCopilot #AI',
        profileImage: 'https://pbs.twimg.com/profile_images/1527729170741387264/9ZuLNZT6_normal.jpg',
        followerCount: '7.3M',
        url: 'https://microsoft.com'
      },
      {
        username: 'GoogleAI',
        displayName: 'Google AI',
        text: 'Breakthrough in quantum computing: Our new quantum processor achieved quantum supremacy in under 5 minutes for problems that would take classical computers millennia. The future is quantum! #QuantumComputing',
        profileImage: 'https://pbs.twimg.com/profile_images/1244313503858339840/y-3KNhGs_normal.png',
        followerCount: '2.1M',
        url: 'https://ai.google',
        imageUrl: 'https://pbs.twimg.com/media/GXample4.jpg'
      },
      {
        username: 'OpenAI',
        displayName: 'OpenAI',
        text: 'GPT-5 development update: We\'re making significant progress on reasoning capabilities and multimodal understanding. Safety remains our top priority as we advance toward AGI.',
        profileImage: 'https://pbs.twimg.com/profile_images/1634058036934500352/b4F1eVpJ_normal.jpg',
        followerCount: '4.7M',
        url: 'https://openai.com'
      },
      {
        username: 'NatGeo',
        displayName: 'National Geographic',
        text: '🐋 Incredible discovery: Scientists have documented the largest blue whale migration ever recorded, spanning over 12,000 miles across the Pacific Ocean. Climate change impacts on marine life continue to surprise researchers.',
        profileImage: 'https://pbs.twimg.com/profile_images/1264550654701088768/2S2rMxwX_normal.jpg',
        followerCount: '15.4M',
        url: 'https://nationalgeographic.com',
        imageUrl: 'https://pbs.twimg.com/media/GXample5.jpg'
      },
      {
        username: 'UN',
        displayName: 'United Nations',
        text: '🌍 Global climate summit reaches historic agreement: 195 countries commit to net-zero emissions by 2050. Together, we can build a sustainable future for all. #ClimateAction #UN2030',
        profileImage: 'https://pbs.twimg.com/profile_images/1184886655925022720/n5l8Mg5q_normal.jpg',
        followerCount: '4.2M',
        url: 'https://un.org'
      },
      {
        username: 'WHO',
        displayName: 'World Health Organization',
        text: '💉 Vaccine breakthrough: New universal flu vaccine shows 95% effectiveness against all known strains in Phase 3 trials. This could revolutionize seasonal flu prevention worldwide.',
        profileImage: 'https://pbs.twimg.com/profile_images/1280166317000617984/yjJaOXnR_normal.jpg',
        followerCount: '8.1M',
        url: 'https://who.int'
      },
      {
        username: 'verge',
        displayName: 'The Verge',
        text: 'Meta\'s new VR headset leaked: 8K per eye, brain-computer interface, and haptic gloves included. The metaverse just got a major upgrade. Full review coming soon! #MetaVR #VirtualReality',
        profileImage: 'https://pbs.twimg.com/profile_images/1644356935428268032/8sz7cSTQ_normal.jpg',
        followerCount: '2.8M',
        url: 'https://theverge.com',
        imageUrl: 'https://pbs.twimg.com/media/GXample6.jpg'
      },
      {
        username: 'Tesla',
        displayName: 'Tesla',
        text: '⚡ Cybertruck production ramping up! First deliveries begin next month. Full autonomy testing shows 99.9% safety improvement over human drivers. The future of transportation is electric! #Cybertruck',
        profileImage: 'https://pbs.twimg.com/profile_images/1337607516008501250/6Ggc4S5n_normal.png',
        followerCount: '19.3M',
        url: 'https://tesla.com',
        imageUrl: 'https://pbs.twimg.com/media/GXample7.jpg'
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

  const handleTweetHover = () => {
    if (isAutoScrolling && hoverPauseEnabled) {
      setIsPausedOnHover(true)
    }
  }

  const handleTweetLeave = () => {
    setIsPausedOnHover(false)
  }

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

  // Auto-scroll effect with pause on hover
  useEffect(() => {
    if (!isAutoScrolling || isPausedOnHover) return

    const interval = setInterval(() => {
      addTestTweet()
    }, Math.random() * 1500 + 800) // Random interval between 0.8-2.3 seconds for quicker updates

    return () => clearInterval(interval)
  }, [isAutoScrolling, isPausedOnHover])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

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
              <div 
                key={tweet.id} 
                className="w-full max-w-full mx-auto rounded-none overflow-hidden shadow-lg transition-all duration-200 border-b border-b-[5px] border-gray-700/50" 
                data-tweet-container="true"
                onMouseEnter={handleTweetHover}
                onMouseLeave={handleTweetLeave}
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