import React, { useState, useCallback } from 'react'
import { Share2 } from 'lucide-react'
import SettingsButton from './SettingsButton'
import HeaderActions from './HeaderActions'
import QrCodeModal from './QrCodeModal'

interface NavbarProps {
  onSettingsClick: () => void
  onWalletClick: () => void
}

const NAVBAR_STYLE = {
  backgroundColor: 'rgb(30,30,30)',
  borderColor: 'rgb(80,80,80)'
}

const Navbar: React.FC<NavbarProps> = ({ onSettingsClick, onWalletClick }) => {
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrModalOpenedManually, setQrModalOpenedManually] = useState(false)

  const handleQrClick = useCallback(() => {
    setQrModalOpenedManually(true)
    setShowQrModal(true)
  }, [])

  const handleQrClose = useCallback(() => {
    setQrModalOpenedManually(false)
    setShowQrModal(false)
  }, [])

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 border-b h-12 flex items-center justify-between px-6" 
      style={NAVBAR_STYLE}
    >
      {/* Left side */}
      <div className="flex items-center space-x-3">
        <img 
          src="/logo1.png" 
          alt="Logo" 
          className="h-8 w-auto rounded purple-glow"
        />
        <div className="flex flex-col">
          <span className="text-white font-semibold text-base leading-none purple-glow-text">Extract.dev</span>
          <div className="flex items-center space-x-1 mt-0.5">
            <a 
              href="https://discord.gg/XqRwqyM9EE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white text-xs hover:text-gray-300 transition-colors cursor-pointer"
            >
              Discord
            </a>
            <Share2 className="w-2.5 h-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-3">
        <HeaderActions onWalletClick={onWalletClick} onQrClick={handleQrClick} />
        <SettingsButton onClick={onSettingsClick} />
      </div>

      {/* QR Code Modal */}
      <QrCodeModal isOpen={showQrModal && qrModalOpenedManually} onClose={handleQrClose} />
    </nav>
  )
}

export default Navbar
