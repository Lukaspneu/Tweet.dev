import React, { useState } from 'react'
import { Share2 } from 'lucide-react'
import SettingsButton from './SettingsButton'
import HeaderActions from './HeaderActions'
import QrCodeModal from './QrCodeModal'

interface NavbarProps {
  onSettingsClick: () => void
  onWalletClick: () => void
}

const Navbar: React.FC<NavbarProps> = ({ onSettingsClick, onWalletClick }) => {
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrModalOpenedManually, setQrModalOpenedManually] = useState(false)

  const handleWalletClick = () => {
    onWalletClick()
  }

  const handleQrClick = () => {
    setQrModalOpenedManually(true)
    setShowQrModal(true)
  }

  const handleQrClose = () => {
    setQrModalOpenedManually(false)
    setShowQrModal(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b h-12 flex items-center justify-between px-6" style={{ backgroundColor: 'rgb(30,30,30)', borderColor: 'rgb(80,80,80)' }}>
      {/* Left side */}
      <div className="flex items-center space-x-3">
        <img 
          src="/newha.png" 
          alt="Logo" 
          className="w-7 h-7 rounded purple-glow"
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
        <HeaderActions onWalletClick={handleWalletClick} onQrClick={handleQrClick} />
        <SettingsButton onClick={onSettingsClick} />
      </div>

      {/* QR Code Modal */}
      <QrCodeModal isOpen={showQrModal && qrModalOpenedManually} onClose={handleQrClose} />
    </nav>
  )
}

export default Navbar
