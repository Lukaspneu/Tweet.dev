import React, { useState, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Wallet, Users } from 'lucide-react'
import WalletManager from './WalletManager'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedTab?: string
  onTabChange?: (tab: string) => void
  onRef?: (ref: { openWithTab: (tab: string) => void }) => void
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, selectedTab: propSelectedTab, onTabChange, onRef }) => {
  const [internalSelectedTab, setInternalSelectedTab] = useState('General')
  
  // Use prop selectedTab if provided, otherwise use internal state
  const selectedTab = propSelectedTab || internalSelectedTab
  const setSelectedTab = onTabChange || setInternalSelectedTab

  // Expose methods to parent
  useImperativeHandle(onRef, () => ({
    openWithTab: (tab: string) => {
      setSelectedTab(tab)
    }
  }))

  // Close modal on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const settingsItems = [
    { id: 'General', label: 'General', icon: User },
    { id: 'Wallet Manager', label: 'Wallet Manager', icon: Wallet },
    { id: 'Referrals', label: 'Referrals', icon: Users },
  ]

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'General':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">General Settings</h3>
              <p className="text-gray-400 text-sm mb-4">Configure your general application preferences.</p>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 rounded-lg border" style={{ borderColor: 'rgba(80, 80, 80, 0.3)', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium text-sm">Dark Mode</h4>
                    <p className="text-gray-400 text-xs">Always enabled</p>
                  </div>
                  <div className="w-10 h-5 rounded-full flex items-center justify-end pr-1" style={{ backgroundColor: 'rgba(185, 255, 93, 0.3)' }}>
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border" style={{ borderColor: 'rgba(80, 80, 80, 0.3)', backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium text-sm">Animations</h4>
                    <p className="text-gray-400 text-xs">Smooth transitions enabled</p>
                  </div>
                  <div className="w-10 h-5 rounded-full flex items-center justify-end pr-1" style={{ backgroundColor: 'rgba(185, 255, 93, 0.3)' }}>
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'Wallet Manager':
        return <WalletManager />

      case 'Referrals':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Referral Program</h3>
              <p className="text-gray-400 text-sm">Share your referral link and earn rewards</p>
            </div>

            {/* Referral Link Section */}
            <div className="rounded-xl p-4" style={{ 
              background: 'linear-gradient(135deg, rgba(185, 255, 93, 0.05) 0%, rgba(185, 255, 93, 0.02) 100%)',
              border: '1px solid rgba(185, 255, 93, 0.2)'
            }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(185, 255, 93, 0.2)' }}>
                  <svg className="w-3 h-3" style={{ color: 'rgb(185, 255, 93)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h4 className="font-medium text-white">Your Referral Link</h4>
              </div>
              <p className="text-xs text-gray-400 mb-4">Share your referral link and earn 5% of all fees paid by users you refer!</p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input 
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                      borderColor: 'rgba(80, 80, 80, 0.3)',
                      color: 'white',
                      focusRingColor: 'rgba(185, 255, 93, 0.3)'
                    }}
                    readOnly 
                    value="https://extract.dev/ref/your-code" 
                  />
                </div>
                <button className="px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1" style={{ 
                  backgroundColor: 'rgba(185, 255, 93, 0.1)',
                  border: '1px solid rgba(185, 255, 93, 0.3)',
                  color: 'rgb(185, 255, 93)'
                }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg p-3 flex flex-col" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', border: '1px solid rgba(80, 80, 80, 0.3)' }}>
                <div className="flex gap-1 mb-1">
                  <svg className="w-4 h-4" style={{ color: 'rgb(185, 255, 93)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <div className="text-xs text-gray-400">Tokens</div>
                </div>
                <div className="text-lg font-bold text-white">0</div>
              </div>
              
              <div className="rounded-lg p-3 flex flex-col" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', border: '1px solid rgba(80, 80, 80, 0.3)' }}>
                <div className="flex gap-1 mb-1">
                  <svg className="w-4 h-4" style={{ color: 'rgb(185, 255, 93)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <div className="text-xs text-gray-400">Total Earned</div>
                </div>
                <div className="text-lg font-bold text-white">0 SOL</div>
              </div>
              
              <div className="rounded-lg p-3 flex flex-col" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', border: '1px solid rgba(80, 80, 80, 0.3)' }}>
                <div className="flex gap-1 mb-1">
                  <svg className="w-4 h-4" style={{ color: 'rgb(185, 255, 93)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-gray-400">Claimed</div>
                </div>
                <div className="text-lg font-bold text-white">0 SOL</div>
              </div>
              
              <div className="rounded-lg p-3 flex flex-col" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', border: '1px solid rgba(80, 80, 80, 0.3)' }}>
                <div className="flex gap-1 mb-1">
                  <svg className="w-4 h-4" style={{ color: 'rgb(185, 255, 93)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-gray-400">Claimable</div>
                </div>
                <div className="text-lg font-bold text-white">0 SOL</div>
              </div>
            </div>

            {/* Referrals List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h4 className="font-medium text-white text-sm">Referrals</h4>
                  <span className="text-xs text-gray-500">(0)</span>
                </div>
                <button className="text-xs px-2 py-1 rounded-md transition-colors" style={{ 
                  backgroundColor: 'rgba(80, 80, 80, 0.2)',
                  color: 'rgb(192, 192, 192)'
                }}>
                  All
                  <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center p-8 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', border: '1px solid rgba(80, 80, 80, 0.3)' }}>
                  <div className="text-center">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm text-gray-400">No referrals yet</p>
                    <p className="text-xs text-gray-500 mt-1">Share your link to start earning rewards!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
          >
            {/* Settings Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl shadow-2xl overflow-hidden"
              style={{
                backgroundColor: 'rgb(32, 32, 32)',
                border: '1px solid rgba(80, 80, 80, 0.3)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                width: '1720px',
                maxWidth: '90vw',
                height: '800px',
                maxHeight: '90vh'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 z-10"
                style={{
                  background: 'rgba(80, 80, 80, 0.3)',
                  border: '1px solid rgba(80, 80, 80, 0.5)'
                }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(80, 80, 80, 0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 text-gray-300 hover:text-white transition-colors" />
              </motion.button>

              <div className="p-6 h-full flex flex-col">
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-white mb-1">Settings</h1>
                  <p className="text-gray-400 text-sm">Configure your application preferences</p>
                </div>

                {/* Section Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {settingsItems.map((item) => {
                    const Icon = item.icon
                    const isActive = selectedTab === item.id
                    
                    return (
                      <motion.div
                        key={item.id}
                        className={`settings-content border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                          isActive
                            ? 'border-gray-500 bg-gray-700'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTab(item.id)}
                      >
                        <div className="flex items-center justify-center h-full">
                          <h3 className="text-sm font-medium text-white text-center">{item.label}</h3>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">
                  <motion.div
                    key={selectedTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {renderTabContent()}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SettingsPanel