import React from 'react'
import { motion } from 'framer-motion'
import { Wallet, QrCode } from 'lucide-react'

interface HeaderActionsProps {
  onWalletClick?: () => void
  onQrClick?: () => void
}

const HeaderActions: React.FC<HeaderActionsProps> = ({ onWalletClick, onQrClick }) => {
  return (
    <motion.div 
      className="flex items-center h-9 px-3 py-2 rounded-xl bg-transparent transition-all duration-200"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Wallet Icon */}
      <motion.button
        onClick={onWalletClick}
        className="p-1.5 text-white hover:text-[rgb(185,255,93)] transition-colors duration-200 focus:outline-none rounded-md"
        aria-label="Wallet"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Wallet className="w-4 h-4" />
      </motion.button>

      {/* Vertical Divider */}
      <motion.div 
        className="h-5 border-l border-gray-700 mx-3"
        whileHover={{ 
          borderColor: 'rgb(75 85 99)', // border-gray-600
          transition: { duration: 0.2 }
        }}
      />

      {/* QR Code Icon */}
      <motion.button
        onClick={onQrClick}
        className="p-1.5 text-white hover:text-[rgb(185,255,93)] transition-colors duration-200 focus:outline-none rounded-md"
        aria-label="Scan QR Code"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <QrCode className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )
}

export default HeaderActions
