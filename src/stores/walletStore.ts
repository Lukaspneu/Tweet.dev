import { create } from 'zustand'
import { PublicKey, Connection } from '@solana/web3.js'
import { WalletUtils } from '../utils/walletUtils'

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
  createWallet: (name: string) => { wallet: Wallet; privateKey: string }
  importWallet: (name: string, privateKey: string) => Wallet
  deleteWallet: (id: string) => void
  setActiveWallet: (id: string) => void
  getWalletPrivateKey: (id: string) => string | null
  exportPrivateKey: (id: string) => string | null
  copyPrivateKeyToClipboard: (id: string) => Promise<boolean>
  fetchBalance: (walletId: string) => Promise<number>
  fetchAllBalances: () => Promise<void>
  
  // Temporary private key storage (in memory only)
  tempPrivateKeys: Map<string, string>
}

// RPC endpoint - using mainnet Solana RPC with API key
const SOLANA_RPC_URL = 'https://solana-mainnet.rpc.extrnode.com/a2988063-b48c-45cd-9ca8-3ce429f65e0f'

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  activeWalletId: null,
  connection: new Connection(SOLANA_RPC_URL, 'confirmed'),
  isConnected: false,
  balances: new Map(),
  tempPrivateKeys: new Map(),

  createWallet: (name: string) => {
    try {
      // Generate new keypair using utility function
      const { privateKey, publicKey } = WalletUtils.generateKeypair()
      
      const wallet: Wallet = {
        id: `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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
        id: `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
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
