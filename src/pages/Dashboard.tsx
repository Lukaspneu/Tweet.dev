import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import TwitterFeed from '../components/TwitterFeed'
import YourTokens from '../components/YourTokens'
import SettingsPanel from '../components/SettingsPanel'
import LaunchTokenModal from '../components/LaunchTokenModal'

const ANIMATION_VARIANTS = {
  leftBox: {
    hidden: { x: '-100vw', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 30,
        mass: 1,
        duration: 1.0,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  },
  rightBox: {
    hidden: { x: '100vw', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 30,
        mass: 1,
        duration: 1.0,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  }
}

const BACKGROUND_STYLE = {
  backgroundColor: 'rgb(22,22,22)',
  minHeight: '100vh',
  width: '100vw'
}

const BACKGROUND_GRADIENT = `
  radial-gradient(ellipse 1200px 800px at 20% 30%, rgba(185, 255, 93, 0.08) 0%, transparent 50%),
  radial-gradient(ellipse 1000px 600px at 80% 70%, rgba(185, 255, 93, 0.06) 0%, transparent 50%),
  radial-gradient(ellipse 800px 1000px at 50% 10%, rgba(185, 255, 93, 0.04) 0%, transparent 60%),
  linear-gradient(180deg, rgba(185, 255, 93, 0.02) 0%, transparent 30%, transparent 70%, rgba(185, 255, 93, 0.01) 100%)
`

const Dashboard: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('General')
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false)

  const handleSettingsClick = useCallback(() => setIsSettingsOpen(true), [])
  const handleSettingsClose = useCallback(() => setIsSettingsOpen(false), [])
  const handleWalletClick = useCallback(() => {
    setSelectedTab('Wallet Manager')
    setIsSettingsOpen(true)
  }, [])
  const handleLaunchModalOpen = useCallback(() => setIsLaunchModalOpen(true), [])
  const handleLaunchModalClose = useCallback(() => setIsLaunchModalOpen(false), [])

  return (
    <div className="h-screen overflow-hidden" style={BACKGROUND_STYLE}>
      {/* Background */}
      <div 
        className="fixed inset-0" 
        style={{
          background: BACKGROUND_GRADIENT,
          backgroundColor: 'rgb(22,22,22)'
        }}
      >
      </div>
      
      <Navbar onSettingsClick={handleSettingsClick} onWalletClick={handleWalletClick} />
      
      {/* Main Content */}
      <main className="relative flex-1 h-full overflow-hidden" style={{height: 'calc(100vh - 80px + 120px)', paddingTop: '60px', paddingBottom: '60px'}}>
        <div className="flex justify-center items-start w-full h-full px-3">
          <div className="flex gap-4 h-full w-full max-w-7xl">
            {/* Twitter Feed */}
            <motion.div 
              className="flex-1 min-w-0 h-full max-w-full"
              variants={ANIMATION_VARIANTS.leftBox}
              initial="hidden"
              animate="visible"
            >
              <TwitterFeed onLaunchModalOpen={handleLaunchModalOpen} />
            </motion.div>

            {/* Your Tokens */}
            <motion.div
              className="flex-shrink-0 hidden xl:block h-full"
              style={{ width: '350px' }}
              variants={ANIMATION_VARIANTS.rightBox}
              initial="hidden"
              animate="visible"
            >
              <YourTokens />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />

      {/* Launch Token Modal */}
      <LaunchTokenModal
        isOpen={isLaunchModalOpen}
        onClose={handleLaunchModalClose}
      />
    </div>
  )
}

export default Dashboard