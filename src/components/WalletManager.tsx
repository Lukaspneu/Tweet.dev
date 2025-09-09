import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Upload, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Wallet as WalletIcon,
  MoreHorizontal,
  RefreshCw,
  Wallet,
  Download,
  Crown,
  X
} from 'lucide-react'
import { useWalletStore } from '../stores/walletStore'
import { WalletUtils } from '../utils/walletUtils'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

const WalletManager: React.FC = () => {
  const {
    wallets,
    activeWalletId,
    balances,
    createWallet,
    importWallet,
    deleteWallet,
    setActiveWallet,
    copyPrivateKeyToClipboard,
    exportPrivateKey,
    fetchAllBalances,
  } = useWalletStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null)
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false)
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [newWalletName, setNewWalletName] = useState('')
  const [privateKeyInput, setPrivateKeyInput] = useState('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDropdown, setShowDropdown] = useState<string | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown) {
        const target = event.target as Element
        // Check if click is outside the dropdown and button
        if (!target.closest('.wallet-dropdown-container')) {
          setShowDropdown(null)
        }
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Fetch balances when wallets change
  useEffect(() => {
    if (wallets.length > 0) {
      fetchAllBalances()
    }
  }, [wallets, fetchAllBalances])

  const handleCreateWallet = () => {
    if (wallets.length >= 5) {
      setError('Maximum of 5 wallets allowed')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const walletName = WalletUtils.generateWalletName()
      createWallet(walletName)
      
      setSuccess('Wallet generated successfully!')
      
    } catch (error) {
      setError('Failed to create wallet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportWallet = () => {
    if (wallets.length >= 5) {
      setError('Maximum of 5 wallets allowed')
      return
    }

    if (!privateKeyInput.trim()) {
      setError('Please enter a private key')
      return
    }

    if (!WalletUtils.validatePrivateKey(privateKeyInput.trim())) {
      setError('Invalid private key format. Please check and try again.')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const walletName = WalletUtils.generateWalletName()
      importWallet(walletName, privateKeyInput.trim())
      
      setSuccess('Wallet generated successfully!')
      setPrivateKeyInput('')
      setShowImportModal(false)
      
    } catch (error) {
      setError('Failed to import wallet. Please check your private key and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWallet = (walletId: string) => {
    deleteWallet(walletId)
    setSuccess('Wallet deleted successfully')
  }

  const handleCopyPrivateKey = async (walletId: string) => {
    try {
      const success = await copyPrivateKeyToClipboard(walletId)
      if (success) {
        setSuccess('Private key copied to clipboard!')
        setTimeout(() => setSuccess(''), 3000) // Clear success message after 3 seconds
      } else {
        setError('Failed to copy private key. Please try again.')
      }
    } catch (error) {
      setError('Failed to copy private key. Please try again.')
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount) {
      setError('Please fill in all fields')
      return
    }

    if (!selectedWalletId) {
      setError('No wallet selected')
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Get the wallet and its private key
      const wallet = wallets.find(w => w.id === selectedWalletId)
      if (!wallet) {
        throw new Error('Wallet not found')
      }

      const privateKey = exportPrivateKey(selectedWalletId)
      if (!privateKey) {
        throw new Error('Private key not available. Please try again.')
      }

      // Create connection and keypair
      const connection = new Connection('https://solana-mainnet.rpc.extrnode.com/a2988063-b48c-45cd-9ca8-3ce429f65e0f', 'confirmed')
      const secretKey = bs58.decode(privateKey)
      const keypair = Keypair.fromSecretKey(secretKey)

      // Validate recipient address
      let recipientPublicKey
      try {
        recipientPublicKey = new PublicKey(withdrawAddress)
      } catch (error) {
        throw new Error('Invalid recipient address')
      }

      // Check balance
      const balance = await connection.getBalance(keypair.publicKey)
      const solBalance = balance / LAMPORTS_PER_SOL
      
      if (amount > solBalance) {
        throw new Error(`Insufficient balance. Available: ${solBalance.toFixed(4)} SOL`)
      }

      // Create transaction
      const transaction = new Transaction()
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL)

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: recipientPublicKey,
          lamports: lamports,
        })
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = keypair.publicKey

      // Sign and send transaction
      transaction.sign(keypair)
      const signature = await connection.sendRawTransaction(transaction.serialize())

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')

      setSuccess(`Successfully withdrew ${amount} SOL to ${withdrawAddress}`)
      setShowWithdrawModal(false)
      setWithdrawAddress('')
      setWithdrawAmount('')
      
      // Refresh balances
      fetchAllBalances()
      
      setTimeout(() => setSuccess(''), 5000)
    } catch (error) {
      console.error('Withdrawal error:', error)
      setError(error instanceof Error ? error.message : 'Failed to withdraw SOL. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDelete = () => {
    if (walletToDelete) {
      handleDeleteWallet(walletToDelete)
      setShowDeleteModal(false)
      setWalletToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setWalletToDelete(null)
  }

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setSuccess('Address copied to clipboard!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Failed to copy address:', error)
      setError('Failed to copy address')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleDropdownAction = (action: string, walletId: string) => {
    setShowDropdown(null)
    switch (action) {
      case 'makeDev':
        setActiveWallet(walletId)
        setSuccess('Wallet set as Dev')
        setTimeout(() => setSuccess(''), 3000)
        break
      case 'withdraw':
        setSelectedWalletId(walletId)
        setShowWithdrawModal(true)
        break
      case 'exportKey':
        handleCopyPrivateKey(walletId)
        break
      case 'delete':
        setWalletToDelete(walletId)
        setShowDeleteModal(true)
        break
    }
  }

  const selectedWallet = wallets.find(w => w.id === selectedWalletId)
  const selectedPrivateKey = selectedWalletId ? exportPrivateKey(selectedWalletId) : null

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Wallet Manager</h3>
          <p className="text-gray-400 text-sm">Create, import, and manage your Solana wallets</p>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={handleCreateWallet}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: 'rgba(185, 255, 93, 0.1)',
              border: '1px solid rgba(185, 255, 93, 0.3)',
              color: 'rgb(185, 255, 93)'
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(185, 255, 93, 0.15)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span>{isLoading ? 'Creating...' : 'Create Wallet'}</span>
          </motion.button>
          <motion.button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(80, 80, 80, 0.3)',
              color: 'rgb(192, 192, 192)'
            }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(80, 80, 80, 0.2)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </motion.button>
          <motion.button 
            onClick={() => fetchAllBalances()}
            className="p-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(80, 80, 80, 0.3)',
              color: 'rgb(192, 192, 192)'
            }}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(80, 80, 80, 0.2)' }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              color: 'rgb(248, 113, 113)'
            }}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              color: 'rgb(74, 222, 128)'
            }}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallets Grid */}
      {wallets.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8 rounded-xl" style={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(80, 80, 80, 0.3)'
          }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
              backgroundColor: 'rgba(185, 255, 93, 0.1)',
              border: '1px solid rgba(185, 255, 93, 0.3)'
            }}>
              <WalletIcon className="w-8 h-8" style={{ color: 'rgb(185, 255, 93)' }} />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">No Wallets Yet</h4>
            <p className="text-gray-400 text-sm mb-6 max-w-sm">Create your first Solana wallet or import an existing one to start managing your tokens</p>
            <div className="flex justify-center space-x-3">
              <motion.button
                onClick={handleCreateWallet}
                disabled={isLoading}
                className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(185, 255, 93, 0.1)',
                  border: '1px solid rgba(185, 255, 93, 0.3)',
                  color: 'rgb(185, 255, 93)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Creating...' : 'Create Wallet'}
              </motion.button>
              <motion.button
                onClick={() => setShowImportModal(true)}
                className="px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(80, 80, 80, 0.3)',
                  color: 'rgb(192, 192, 192)'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Import Wallet
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          {/* Compact Wallet Cards */}
          <div className="space-y-3 p-4 pt-8 pb-8">
            {wallets.map((wallet) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-4 transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(80, 80, 80, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}
                whileHover={{
                  borderColor: 'rgba(185, 255, 93, 0.3)',
                  boxShadow: '0 4px 16px rgba(185, 255, 93, 0.1)'
                }}
              >
                <div className="flex items-center justify-between">
                  {/* Left Side - Wallet Info */}
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Wallet Icon */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
                      backgroundColor: 'rgba(185, 255, 93, 0.1)',
                      border: '1px solid rgba(185, 255, 93, 0.3)'
                    }}>
                      <WalletIcon className="w-5 h-5" style={{ color: 'rgb(185, 255, 93)' }} />
                    </div>
                    
                    {/* Wallet Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        {wallet.id === activeWalletId && (
                          <div className="flex items-center space-x-1 px-3 py-1 rounded text-sm font-medium" style={{
                            backgroundColor: 'rgba(185, 255, 93, 0.1)',
                            border: '1px solid rgba(185, 255, 93, 0.3)',
                            color: 'rgb(185, 255, 93)'
                          }}>
                            <Crown className="w-4 h-4" />
                            <span>Dev Wallet</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-gray-400">Balance: </span>
                          <span className="text-white font-semibold">
                            {balances.get(wallet.id)?.toFixed(4) || '0.0000'} SOL
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyAddress(wallet.publicKey)}
                          className="text-gray-400 hover:text-white transition-colors truncate max-w-40"
                          title="Click to copy full address"
                        >
                          {WalletUtils.formatPublicKey(wallet.publicKey)}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Actions */}
                  <div className="flex items-center space-x-3">
                    <motion.button
                      onClick={() => handleDropdownAction('withdraw', wallet.id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(80, 80, 80, 0.3)',
                        color: 'rgb(192, 192, 192)'
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        backgroundColor: 'rgba(80, 80, 80, 0.2)'
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Wallet className="w-3 h-3 inline mr-1" />
                      Withdraw
                    </motion.button>
                    <motion.button
                      onClick={() => handleDropdownAction('exportKey', wallet.id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(80, 80, 80, 0.3)',
                        color: 'rgb(192, 192, 192)'
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        backgroundColor: 'rgba(80, 80, 80, 0.2)'
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download className="w-3 h-3 inline mr-1" />
                      Export
                    </motion.button>
                    
                    {/* More Options */}
                    <div className="relative wallet-dropdown-container" style={{ zIndex: 999999 }}>
                      <motion.button
                        onClick={() => setShowDropdown(showDropdown === wallet.id ? null : wallet.id)}
                        className="p-2 rounded-lg transition-all duration-200"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(80, 80, 80, 0.3)',
                          color: 'rgb(192, 192, 192)'
                        }}
                        whileHover={{ 
                          scale: 1.05,
                          backgroundColor: 'rgba(80, 80, 80, 0.2)'
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </motion.button>

                      {/* Dropdown Menu - Always appears on top */}
                      <AnimatePresence>
                        {showDropdown === wallet.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 bottom-full mb-2 w-44 rounded-lg shadow-lg"
                            style={{
                              backgroundColor: 'rgb(32, 32, 32)',
                              border: '1px solid rgba(80, 80, 80, 0.3)',
                              backdropFilter: 'blur(10px)',
                              zIndex: 9999999
                            }}
                          >
                            <div className="py-2">
                              <button
                                onClick={() => handleDropdownAction('makeDev', wallet.id)}
                                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-3 transition-colors text-sm"
                              >
                                <Crown className="w-4 h-4" />
                                <span>Make Dev</span>
                              </button>
                              <button
                                onClick={() => handleDropdownAction('delete', wallet.id)}
                                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-900/20 flex items-center space-x-3 transition-colors text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Wallet</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Create Wallet Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-xl p-6 w-full max-w-md"
              style={{
                backgroundColor: 'rgb(32, 32, 32)',
                border: '1px solid rgba(80, 80, 80, 0.3)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Create New Wallet</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(80, 80, 80, 0.3)',
                    border: '1px solid rgba(80, 80, 80, 0.5)',
                    color: 'rgb(192, 192, 192)'
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet Name
                  </label>
                  <input
                    type="text"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    placeholder={WalletUtils.generateWalletName()}
                    className="w-full px-3 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(80, 80, 80, 0.3)',
                    }}
                  />
                </div>
                
                <div className="p-4 rounded-lg" style={{
                  backgroundColor: 'rgba(185, 255, 93, 0.05)',
                  border: '1px solid rgba(185, 255, 93, 0.2)'
                }}>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-4 h-4 mt-0.5" style={{ color: 'rgb(185, 255, 93)' }} />
                    <div className="text-gray-300 text-xs">
                      <p className="font-medium mb-1" style={{ color: 'rgb(185, 255, 93)' }}>Security Notice:</p>
                      <p>Your private key is never stored on our servers. It's only temporarily held in your browser's memory for security.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <motion.button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(80, 80, 80, 0.3)',
                    color: 'rgb(192, 192, 192)'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleCreateWallet}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(185, 255, 93, 0.1)',
                    border: '1px solid rgba(185, 255, 93, 0.3)',
                    color: 'rgb(185, 255, 93)'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? 'Creating...' : 'Create Wallet'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Wallet Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-xl p-6 w-full max-w-md"
              style={{
                backgroundColor: 'rgb(32, 32, 32)',
                border: '1px solid rgba(80, 80, 80, 0.3)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Import Wallet</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(80, 80, 80, 0.3)',
                    border: '1px solid rgba(80, 80, 80, 0.5)',
                    color: 'rgb(192, 192, 192)'
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-gray-300 text-sm mb-4">Enter your private key to import an existing wallet.</p>
              
              <div className="mb-6">
                <div className="relative">
                  <input
                    type={showPrivateKey ? 'text' : 'password'}
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    placeholder="Enter private key"
                    className="w-full px-3 py-2 pr-12 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(80, 80, 80, 0.3)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-all duration-200"
                    style={{ color: 'rgb(192, 192, 192)' }}
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <motion.button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(80, 80, 80, 0.3)',
                    color: 'rgb(192, 192, 192)'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleImportWallet}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(185, 255, 93, 0.1)',
                    border: '1px solid rgba(185, 255, 93, 0.3)',
                    color: 'rgb(185, 255, 93)'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? 'Importing...' : 'Import'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-lg p-6 w-full max-w-md border border-gray-800"
              style={{ backgroundColor: 'rgb(32, 32, 32)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Withdraw SOL</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm text-gray-300 mb-2">Withdrawal Address</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Withdrawal address (Solana pubkey)"
                  className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 text-sm mb-4"
                />
                
                <label className="block text-sm text-gray-300 mb-2">Amount (SOL)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0000"
                  className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 text-sm"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 text-white disabled:text-gray-400 rounded-md transition-colors text-sm font-medium"
                >
                  {isLoading ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && walletToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelDelete}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-lg p-6 w-full max-w-md border border-gray-800"
              style={{ backgroundColor: 'rgb(32, 32, 32)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Delete Wallet</h3>
                <button
                  onClick={handleCancelDelete}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-white text-sm mb-3">Are you sure you want to delete the following wallet?</p>
                <div className="flex items-center justify-between border border-gray-600 rounded-lg p-3">
                  <button
                    onClick={() => {
                      const wallet = wallets.find(w => w.id === walletToDelete)
                      if (wallet) {
                        handleCopyAddress(wallet.publicKey)
                      }
                    }}
                    className="clickable-address text-white font-mono text-sm hover:text-gray-300 cursor-pointer text-left"
                    title="Click to copy full address"
                  >
                    {WalletUtils.formatPublicKey(wallets.find(w => w.id === walletToDelete)?.publicKey || '')}
                  </button>
                  <button
                    onClick={() => {
                      const wallet = wallets.find(w => w.id === walletToDelete)
                      if (wallet) {
                        handleCopyAddress(wallet.publicKey)
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-2 text-white rounded-md transition-all duration-200 text-sm font-medium hover:scale-105"
                  style={{ backgroundColor: 'rgb(64,64,64)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 text-white rounded-md transition-all duration-200 text-sm font-medium hover:scale-105"
                  style={{ backgroundColor: 'rgb(192,192,192)' }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Private Key Export Modal */}
      <AnimatePresence>
        {showPrivateKeyModal && selectedWallet && selectedPrivateKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrivateKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-lg p-6 w-full max-w-lg border border-gray-800"
              style={{ backgroundColor: 'rgb(32, 32, 32)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Export Private Key</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Wallet: {selectedWallet.name}
                  </label>
                  <div className="relative">
                    <input
                      type={showPrivateKey ? 'text' : 'password'}
                      value={selectedPrivateKey}
                      readOnly
                      className="w-full px-3 py-2 pr-16 bg-gray-800 border border-gray-700 rounded-md text-white font-mono text-xs"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPrivateKey(selectedWallet.id)}
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-800/20 border border-gray-600/50 rounded-md">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-gray-300 text-xs">
                      <p className="font-medium mb-1">CRITICAL SECURITY WARNING:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Never share this private key with anyone</li>
                        <li>Anyone with this key can control your wallet</li>
                        <li>Store it securely offline</li>
                        <li>Consider using a hardware wallet for large amounts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPrivateKeyModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => handleCopyPrivateKey(selectedWallet.id)}
                  className="flex-1 px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-md transition-colors text-sm font-medium"
                >
                  Copy to Clipboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WalletManager