import { Keypair, PublicKey } from '@solana/web3.js'
import bs58 from 'bs58'

export interface WalletInfo {
  publicKey: string
  balance: number
  isImported: boolean
}

export class WalletUtils {
  static generateKeypair(): { keypair: Keypair; privateKey: string; publicKey: string } {
    const keypair = Keypair.generate()
    const privateKey = bs58.encode(keypair.secretKey)
    const publicKey = keypair.publicKey.toString()
    
    return { keypair, privateKey, publicKey }
  }

  static importFromPrivateKey(privateKey: string): { keypair: Keypair; publicKey: string } {
    try {
      const secretKey = bs58.decode(privateKey)
      const keypair = Keypair.fromSecretKey(secretKey)
      const publicKey = keypair.publicKey.toString()
      
      return { keypair, publicKey }
    } catch (error) {
      throw new Error('Invalid private key format. Please ensure it\'s a valid base58 encoded key.')
    }
  }

  static validatePrivateKey(privateKey: string): boolean {
    try {
      const secretKey = bs58.decode(privateKey)
      return secretKey.length === 64 // Solana private keys are 64 bytes
    } catch {
      return false
    }
  }

  static formatPublicKey(publicKey: string): string {
    if (publicKey.length <= 8) return publicKey
    return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
  }

  static async getBalance(publicKey: string, connection: any): Promise<number> {
    try {
      const pubKey = new PublicKey(publicKey)
      const balance = await connection.getBalance(pubKey)
      return balance / 1e9 // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching balance:', error)
      return 0
    }
  }

  static generateWalletName(): string {
    const adjectives = ['Swift', 'Bright', 'Golden', 'Silver', 'Crystal', 'Diamond', 'Royal', 'Noble']
    const nouns = ['Phoenix', 'Dragon', 'Eagle', 'Wolf', 'Tiger', 'Lion', 'Falcon', 'Panther']
    
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(Math.random() * 999) + 1
    
    return `${adj} ${noun} ${num}`
  }
}

export const SECURITY_WARNINGS = {
  PRIVATE_KEY_EXPORT: '⚠️ SECURITY WARNING: Never share your private key with anyone. Anyone with access to your private key can control your wallet and steal your funds.',
  PRIVATE_KEY_STORAGE: '🔒 Your private key is never stored on our servers. It\'s only temporarily held in your browser\'s memory for security.',
  BACKUP_RECOMMENDATION: '💾 Always backup your private key in a secure location. If you lose it, you\'ll lose access to your wallet forever.',
  PHISHING_WARNING: '🚨 Never enter your private key on suspicious websites. Always verify you\'re on the official site.',
}
