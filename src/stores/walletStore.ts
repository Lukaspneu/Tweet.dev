import { create } from 'zustand'
import { PublicKey, Connection } from '@solana/web3.js'
import { WalletUtils } from '../utils/walletUtils'
// @ts-ignore - JavaScript module without type declarations
const { walletDbService } = require('../services/walletDatabaseService.js')


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
  
  
  // Actions
  createWallet: (name: string) => Promise<{ wallet: Wallet; privateKey: string }>
  importWallet: (name: string, privateKey: string) => Promise<Wallet>
  deleteWallet: (id: string) => Promise<void>
  setActiveWallet: (id: string) => void
  getWalletPrivateKey: (id: string) => string | null
  exportPrivateKey: (id: string) => string | null
  copyPrivateKeyToClipboard: (id: string) => Promise<boolean>
  fetchBalance: (walletId: string) => Promise<number>
  fetchAllBalances: () => Promise<void>
  loadWalletsFromDatabase: () => Promise<void>
  saveWalletToDatabase: (wallet: Wallet, privateKey: string) => Promise<void>
  
  
  // Temporary private key storage (in memory only)
  tempPrivateKeys: Map<string, string>
}

const generateWalletId = (): string => 
  `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`


const SOLANA_RPC_URL = 'https://solana-mainnet.rpc.extrnode.com/a2988063-b48c-45cd-9ca8-3ce429f65e0f'

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  activeWalletId: null,
  connection: new Connection(SOLANA_RPC_URL, 'confirmed'),
  isConnected: false,
  balances: new Map(),
  tempPrivateKeys: new Map(),
  

  createWallet: async (name: string) => {
    try {
      // Generate new keypair using utility function
      const { privateKey, publicKey } = WalletUtils.generateKeypair()
      
      const wallet: Wallet = {
        id: generateWalletId(),
        name,
        publicKey,
      }
      
      // Save to database first
      await get().saveWalletToDatabase(wallet, privateKey)
      
      // Store wallet (without private key)
      set((state) => ({
        wallets: [...state.wallets, wallet],
        activeWalletId: state.wallets.length === 0 ? wallet.id : state.activeWalletId,
        isConnected: state.wallets.length === 0 ? true : state.isConnected,
      }))
      
      // Temporarily store private key in memory
      get().tempPrivateKeys.set(wallet.id, privateKey)
      
      console.log(`✅ Wallet created and saved to database: ${name}`)
      return { wallet, privateKey }
    } catch (error) {
      console.error('Error creating wallet:', error)
      throw new Error('Failed to create wallet')
    }
  },

  importWallet: async (name: string, privateKey: string) => {
    try {
      // Import wallet using utility function
      const { publicKey } = WalletUtils.importFromPrivateKey(privateKey)
      
      const wallet: Wallet = {
        id: generateWalletId(),
        name,
        publicKey,
      }
      
      // Save to database first
      await get().saveWalletToDatabase(wallet, privateKey)
      
      // Store wallet (without private key)
      set((state) => ({
        wallets: [...state.wallets, wallet],
        activeWalletId: state.wallets.length === 0 ? wallet.id : state.activeWalletId,
        isConnected: state.wallets.length === 0 ? true : state.isConnected,
      }))
      
      // Temporarily store private key in memory
      get().tempPrivateKeys.set(wallet.id, privateKey)
      
      console.log(`✅ Wallet imported and saved to database: ${name}`)
      return wallet
    } catch (error) {
      console.error('Error importing wallet:', error)
      throw new Error('Invalid private key format')
    }
  },

  deleteWallet: async (id: string) => {
    try {
      // Delete from database first
      await walletDbService.deleteWallet(id)
      
      set((state) => ({
        wallets: state.wallets.filter((wallet) => wallet.id !== id),
        activeWalletId: state.activeWalletId === id ? null : state.activeWalletId,
        isConnected: state.activeWalletId === id ? false : state.isConnected,
      }))
      
      // Remove from temporary storage
      get().tempPrivateKeys.delete(id)
      
      console.log(`✅ Wallet deleted from database: ${id}`)
    } catch (error) {
      console.error('Error deleting wallet:', error)
      throw new Error('Failed to delete wallet')
    }
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

  loadWalletsFromDatabase: async () => {
    try {
      // Initialize database connection and create tables
      await walletDbService.connect()
      await walletDbService.createTables()
      
      // Load all wallets from database
      const dbWallets = await walletDbService.getAllWallets()
      
      // Convert database format to store format
      const wallets = dbWallets.map((dbWallet: any) => ({
        id: dbWallet.id,
        name: dbWallet.name,
        publicKey: dbWallet.public_key
      }))
      
      // Update store with loaded wallets
      set(() => ({
        wallets,
        activeWalletId: wallets.length > 0 ? wallets[0].id : null,
        isConnected: wallets.length > 0
      }))
      
      console.log(`✅ Loaded ${wallets.length} wallets from database`)
    } catch (error) {
      console.error('Error loading wallets from database:', error)
      // Don't throw error to prevent app crash - just log and continue with empty wallets
    }
  },

  saveWalletToDatabase: async (wallet: Wallet, privateKey: string) => {
    try {
      await walletDbService.saveWallet({
        id: wallet.id,
        name: wallet.name,
        publicKey: wallet.publicKey,
        privateKey: privateKey,
        isDevWallet: false
      })
    } catch (error) {
      console.error('Error saving wallet to database:', error)
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
