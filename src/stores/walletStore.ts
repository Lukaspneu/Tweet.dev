import { create } from 'zustand'
import { PublicKey, Connection } from '@solana/web3.js'
import { WalletUtils } from '../utils/walletUtils'

export interface AutoSenderConfig {
  id: string
  sourceWalletId: string
  destinationWalletId: string
  isActive: boolean
  lastChecked: number
  lastTransfer: number
  totalTransferred: number
  transferCount: number
  reserveAmount: number // Amount to keep in source wallet (in SOL)
}

export interface Wallet {
  id: string
  name: string
  publicKey: string
  // Private key is NEVER stored in the store for security
  // It's only temporarily held in memory during operations
}

interface WalletState {
  wallets: Wallet[]
  activeWalletId: string | null
  connection: Connection
  isConnected: boolean
  
  // Balance cache
  balances: Map<string, number>
  
  // Auto-sender functionality
  autoSenderConfigs: AutoSenderConfig[]
  autoSenderInterval: NodeJS.Timeout | null
  
  // Actions
  createWallet: (name: string) => { wallet: Wallet; privateKey: string }
  importWallet: (name: string, privateKey: string) => Wallet
  deleteWallet: (id: string) => void
  setActiveWallet: (id: string) => void
  getWalletPrivateKey: (id: string) => string | null
  exportPrivateKey: (id: string) => string | null
  copyPrivateKeyToClipboard: (id: string) => Promise<boolean>
  fetchBalance: (walletId: string) => Promise<number>
  fetchAllBalances: () => Promise<void>
  
  // Auto-sender actions
  createAutoSender: (sourceWalletId: string, destinationWalletId: string, reserveAmount: number) => AutoSenderConfig
  updateAutoSender: (id: string, updates: Partial<AutoSenderConfig>) => void
  deleteAutoSender: (id: string) => void
  toggleAutoSender: (id: string) => void
  startAutoSenderMonitoring: () => void
  stopAutoSenderMonitoring: () => void
  executeAutoTransfer: (config: AutoSenderConfig) => Promise<void>
  
  // Temporary private key storage (in memory only)
  tempPrivateKeys: Map<string, string>
}

const generateWalletId = (): string => 
  `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

const generateAutoSenderId = (): string => 
  `autoSender_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

const SOLANA_RPC_URL = 'https://solana-mainnet.rpc.extrnode.com/a2988063-b48c-45cd-9ca8-3ce429f65e0f'

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  activeWalletId: null,
  connection: new Connection(SOLANA_RPC_URL, 'confirmed'),
  isConnected: false,
  balances: new Map(),
  tempPrivateKeys: new Map(),
  
  // Auto-sender state
  autoSenderConfigs: [],
  autoSenderInterval: null,

  createWallet: (name: string) => {
    try {
      // Generate new keypair using utility function
      const { privateKey, publicKey } = WalletUtils.generateKeypair()
      
      const wallet: Wallet = {
        id: generateWalletId(),
        name,
        publicKey,
      }
      
      // Store wallet (without private key)
      set((state) => ({
        wallets: [...state.wallets, wallet],
        activeWalletId: state.wallets.length === 0 ? wallet.id : state.activeWalletId,
        isConnected: state.wallets.length === 0 ? true : state.isConnected,
      }))
      
      // Temporarily store private key in memory
      get().tempPrivateKeys.set(wallet.id, privateKey)
      
      return { wallet, privateKey }
    } catch (error) {
      console.error('Error creating wallet:', error)
      throw new Error('Failed to create wallet')
    }
  },

  importWallet: (name: string, privateKey: string) => {
    try {
      // Import wallet using utility function
      const { publicKey } = WalletUtils.importFromPrivateKey(privateKey)
      
      const wallet: Wallet = {
        id: generateWalletId(),
        name,
        publicKey,
      }
      
      // Store wallet (without private key)
      set((state) => ({
        wallets: [...state.wallets, wallet],
        activeWalletId: state.wallets.length === 0 ? wallet.id : state.activeWalletId,
        isConnected: state.wallets.length === 0 ? true : state.isConnected,
      }))
      
      // Temporarily store private key in memory
      get().tempPrivateKeys.set(wallet.id, privateKey)
      
      return wallet
    } catch (error) {
      console.error('Error importing wallet:', error)
      throw new Error('Invalid private key format')
    }
  },

  deleteWallet: (id: string) => {
    set((state) => ({
      wallets: state.wallets.filter((wallet) => wallet.id !== id),
      activeWalletId: state.activeWalletId === id ? null : state.activeWalletId,
      isConnected: state.activeWalletId === id ? false : state.isConnected,
    }))
    
    // Remove from temporary storage
    get().tempPrivateKeys.delete(id)
  },

  setActiveWallet: (id: string) => {
    set({ activeWalletId: id, isConnected: true })
  },

  getWalletPrivateKey: (id: string) => {
    return get().tempPrivateKeys.get(id) || null
  },

  exportPrivateKey: (id: string) => {
    return get().tempPrivateKeys.get(id) || null
  },

  copyPrivateKeyToClipboard: async (id: string) => {
    try {
      const privateKey = get().tempPrivateKeys.get(id)
      if (!privateKey) {
        throw new Error('Private key not found')
      }
      
      await navigator.clipboard.writeText(privateKey)
      return true
    } catch (error) {
      console.error('Error copying private key:', error)
      return false
    }
  },

  fetchBalance: async (walletId: string) => {
    try {
      const wallet = get().wallets.find(w => w.id === walletId)
      if (!wallet) {
        throw new Error('Wallet not found')
      }

      const publicKey = new PublicKey(wallet.publicKey)
      const balance = await get().connection.getBalance(publicKey)
      const solBalance = balance / 1e9 // Convert lamports to SOL

      // Update balance in cache
      set((state) => {
        const newBalances = new Map(state.balances)
        newBalances.set(walletId, solBalance)
        return { balances: newBalances }
      })

      return solBalance
    } catch (error) {
      console.error('Error fetching balance:', error)
      return 0
    }
  },

  fetchAllBalances: async () => {
    const { wallets, connection } = get()
    const balancePromises = wallets.map(async (wallet) => {
      try {
        const publicKey = new PublicKey(wallet.publicKey)
        const balance = await connection.getBalance(publicKey)
        return { walletId: wallet.id, balance: balance / 1e9 }
      } catch (error) {
        console.error(`Error fetching balance for wallet ${wallet.id}:`, error)
        return { walletId: wallet.id, balance: 0 }
      }
    })

    const balances = await Promise.all(balancePromises)
    
    set((state) => {
      const newBalances = new Map(state.balances)
      balances.forEach(({ walletId, balance }) => {
        newBalances.set(walletId, balance)
      })
      return { balances: newBalances }
    })
  },

  // Auto-sender methods
  createAutoSender: (sourceWalletId: string, destinationWalletId: string, reserveAmount: number = 5) => {
    const config: AutoSenderConfig = {
      id: generateAutoSenderId(),
      sourceWalletId,
      destinationWalletId,
      isActive: true,
      lastChecked: Date.now(),
      lastTransfer: 0,
      totalTransferred: 0,
      transferCount: 0,
      reserveAmount
    }

    set((state) => ({
      autoSenderConfigs: [...state.autoSenderConfigs, config]
    }))

    return config
  },

  updateAutoSender: (id: string, updates: Partial<AutoSenderConfig>) => {
    set((state) => ({
      autoSenderConfigs: state.autoSenderConfigs.map(config =>
        config.id === id ? { ...config, ...updates } : config
      )
    }))
  },

  deleteAutoSender: (id: string) => {
    set((state) => ({
      autoSenderConfigs: state.autoSenderConfigs.filter(config => config.id !== id)
    }))
  },

  toggleAutoSender: (id: string) => {
    set((state) => ({
      autoSenderConfigs: state.autoSenderConfigs.map(config =>
        config.id === id ? { ...config, isActive: !config.isActive } : config
      )
    }))
  },

  startAutoSenderMonitoring: () => {
    const { autoSenderInterval, autoSenderConfigs } = get()
    
    // Clear existing interval if any
    if (autoSenderInterval) {
      clearInterval(autoSenderInterval)
    }

    // Start new monitoring interval (check every 0.5 seconds for ULTRA FAST transfers)
    const interval = setInterval(async () => {
      const { autoSenderConfigs, executeAutoTransfer } = get()
      
      for (const config of autoSenderConfigs) {
        if (config.isActive) {
          try {
            await executeAutoTransfer(config)
          } catch (error) {
            console.error(`Auto-sender error for config ${config.id}:`, error)
          }
        }
      }
    }, 500) // 0.5 seconds - ULTRA FAST!

    set({ autoSenderInterval: interval })
  },

  stopAutoSenderMonitoring: () => {
    const { autoSenderInterval } = get()
    if (autoSenderInterval) {
      clearInterval(autoSenderInterval)
      set({ autoSenderInterval: null })
    }
  },

  executeAutoTransfer: async (config: AutoSenderConfig) => {
    const { wallets, tempPrivateKeys, connection, fetchAllBalances } = get()
    
    // Find source and destination wallets
    const sourceWallet = wallets.find(w => w.id === config.sourceWalletId)
    const destinationWallet = wallets.find(w => w.id === config.destinationWalletId)
    
    if (!sourceWallet || !destinationWallet) {
      throw new Error('Source or destination wallet not found')
    }

    // Get private key for source wallet
    const privateKey = tempPrivateKeys.get(config.sourceWalletId)
    if (!privateKey) {
      throw new Error('Private key not available for source wallet')
    }

    // Check current balance
    const sourcePublicKey = new PublicKey(sourceWallet.publicKey)
    const balance = await connection.getBalance(sourcePublicKey)
    const solBalance = balance / 1e9

    // Convert SOL balance to USD (approximate rate: 1 SOL = $195 USD)
    // Note: In a real application, you'd want to fetch live SOL price
    const solToUsdRate = 195 // $195 per SOL
    const balanceUsd = solBalance * solToUsdRate

    // Only proceed if balance is above $15 USD
    if (balanceUsd <= 15) {
      return
    }

    // Calculate transfer amount (balance minus reserve amount)
    const transferAmount = Math.max(0, solBalance - config.reserveAmount)
    
    // Only transfer if there's enough to transfer (more than reserve + transaction fee)
    if (transferAmount < 0.001) { // Minimum 0.001 SOL to cover transaction fees
      return
    }

    // Execute the transfer
    try {
      const { Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } = await import('@solana/web3.js')
      const bs58 = await import('bs58')

      const secretKey = bs58.default.decode(privateKey)
      const keypair = Keypair.fromSecretKey(secretKey)
      const destinationPublicKey = new PublicKey(destinationWallet.publicKey)

      // Create transaction
      const transaction = new Transaction()
      const lamports = Math.floor(transferAmount * LAMPORTS_PER_SOL)

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: destinationPublicKey,
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

      // Update config stats
      get().updateAutoSender(config.id, {
        lastTransfer: Date.now(),
        lastChecked: Date.now(),
        totalTransferred: config.totalTransferred + transferAmount,
        transferCount: config.transferCount + 1
      })

      // Refresh balances
      await fetchAllBalances()

      console.log(`Auto-transfer successful: ${transferAmount} SOL from ${sourceWallet.name} to ${destinationWallet.name}`)
    } catch (error) {
      console.error('Auto-transfer failed:', error)
      // Update last checked time even on failure
      get().updateAutoSender(config.id, {
        lastChecked: Date.now()
      })
      throw error
    }
  },
}))

// Security utility to clear temporary private keys
export const clearTempPrivateKeys = () => {
  const store = useWalletStore.getState()
  store.tempPrivateKeys.clear()
}

// Auto-clear private keys after 5 minutes of inactivity
let privateKeyTimeout: NodeJS.Timeout | null = null

export const resetPrivateKeyTimeout = () => {
  if (privateKeyTimeout) {
    clearTimeout(privateKeyTimeout)
  }
  
  privateKeyTimeout = setTimeout(() => {
    clearTempPrivateKeys()
    console.log('Temporary private keys cleared for security')
  }, 5 * 60 * 1000) // 5 minutes
}
