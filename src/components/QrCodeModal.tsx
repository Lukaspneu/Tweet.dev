import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy } from 'lucide-react'
import { useWalletStore } from '../stores/walletStore'
import QRCode from 'qrcode'

interface QrCodeModalProps {
  isOpen: boolean
  onClose: () => void
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose }) => {
  const { wallets, activeWalletId, balances } = useWalletStore()
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  
  const activeWallet = wallets.find(w => w.id === activeWalletId)
  const balance = activeWallet ? balances.get(activeWallet.id) || 0 : 0

  // Generate QR code when wallet changes
  useEffect(() => {
    if (activeWallet) {
      QRCode.toDataURL(activeWallet.publicKey, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(setQrCodeDataUrl).catch(console.error)
    }
  }, [activeWallet])

  const handleCopyAddress = async () => {
    if (activeWallet) {
      try {
        await navigator.clipboard.writeText(activeWallet.publicKey)
        // You could add a toast notification here
      } catch (error) {
        console.error('Failed to copy address:', error)
      }
    }
  }

  if (!activeWallet) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {/* Blur Area - 200px down from QR code */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed z-[49]"
            style={{
              width: '2000px',
              height: '2000px',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, calc(-50% + 678px))'
            }}
          />
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ paddingTop: '478px' }}
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col w-[364px] min-h-[480px] border rounded shadow-lg qr-modal-bg qr-modal-border qr-modal-shadow"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex flex-row w-full h-[44px] pl-[16px] pr-[12px] justify-between items-center border-b border-gray-600">
                <span className="text-white text-[14px] leading-[20px] tracking-[-0.02em] font-medium">Deposit</span>
                <button 
                  onClick={onClose}
                  className="group flex flex-row p-[4px] w-[24px] h-[24px] justify-center items-center hover:bg-gray-600 rounded transition-colors duration-150 ease-in-out"
                >
                  <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 w-full p-[16px] pb-[20px] gap-[16px] min-h-[200px] mt-2">
                {/* Currency Info */}
                <div className="flex flex-row w-full gap-[8px]">
                  <div className="w-1/2">
                    <div className="group border border-gray-600 flex flex-row w-full h-[32px] gap-[8px] px-[12px] rounded justify-start items-center">
                      <img 
                        src="/solanalogo.png" 
                        alt="SOL" 
                        className="w-4 h-4"
                      />
                      <span className="text-white text-[12px] leading-[16px] font-normal flex-1 text-left">Solana</span>
                    </div>
                  </div>
                  <div className="flex-1 border border-gray-600 flex flex-row h-[32px] gap-[8px] px-[12px] rounded justify-start items-center">
                    <span className="text-gray-400 text-[12px] leading-[16px] font-normal flex-1">Balance:</span>
                    <span className="text-gray-300 text-[12px] leading-[16px] font-normal">{balance.toFixed(4)} SOL</span>
                  </div>
                </div>

                {/* Warning */}
                <span className="text-gray-400 text-[12px] leading-[16px] font-normal">
                  Only deposit SOL through the Solana network for this address.
                </span>

                {/* QR Code and Address */}
                <button 
                  onClick={handleCopyAddress}
                  className="relative border border-gray-600 flex flex-row w-full gap-[16px] p-[1px] pr-[16px] justify-start items-start rounded-[8px] hover:bg-gray-600 hover:border-gray-500 transition-all duration-[150ms] ease-in-out cursor-pointer mt-8 qr-modal-bg"
                >
                  <div className="relative min-w-[140px] min-h-[140px] rounded-[12px] p-[4px]" style={{ backgroundColor: 'rgb(22,22,22)' }}>
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code" 
                        className="w-full h-full rounded-[7px]"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-[7px] flex items-center justify-center">
                        <span className="text-gray-500 text-xs">Loading...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col w-full justify-start items-start gap-[4px] pt-[12px]">
                    <span className="text-gray-400 text-[12px] leading-[16px] font-normal">Deposit Address</span>
                    <div className="flex flex-row w-full justify-start items-start break-all">
                      <span className="text-gray-300 text-[12px] leading-[16px] font-normal break-all text-left w-full">
                        {activeWallet.publicKey}
                      </span>
                    </div>
                  </div>
                  <div className="group absolute bottom-[8px] right-[8px] w-[22px] h-[22px] flex flex-row justify-center items-center rounded">
                    <Copy className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

              </div>

              {/* Footer */}
              <div className="border-t border-gray-600 flex flex-row w-full h-[68px] justify-end items-center p-[16px] pb-[20px]">
                <button 
                  onClick={handleCopyAddress}
                  className="flex flex-row flex-1 h-[32px] px-[12px] gap-[8px] justify-center items-center rounded-full transition-all duration-[150ms] cursor-pointer border border-gray-600 qr-modal-bg"
                >
                  <span className="text-[14px] font-bold text-white">Copy Address</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default QrCodeModal
