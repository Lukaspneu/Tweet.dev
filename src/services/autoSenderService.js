const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } = require('@solana/web3.js')
const bs58 = require('bs58')

// Server-side Auto-Sender Service for 24/7 operation
class AutoSenderService {
  constructor() {
    this.autoSenderConfigs = []
    this.autoSenderInterval = null
    this.isRunning = false
    this.connection = new Connection('https://solana-mainnet.rpc.extrnode.com/a2988063-b48c-45cd-9ca8-3ce429f65e0f', 'processed')
    this.solToUsdRate = 195 // $195 per SOL
    this.minUsdThreshold = 15 // $15 USD minimum
    this.minTransferAmount = 0.0001 // Minimum 0.0001 SOL for transaction fees - ULTRA FAST!
  }

  // Add auto-sender configuration
  addAutoSender(config) {
    const autoSenderConfig = {
      id: `autoSender_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      sourcePrivateKey: config.sourcePrivateKey,
      sourcePublicKey: config.sourcePublicKey,
      destinationPublicKey: config.destinationPublicKey,
      isActive: true,
      lastChecked: Date.now(),
      lastTransfer: 0,
      totalTransferred: 0,
      transferCount: 0,
      reserveAmount: config.reserveAmount || 5, // Default 5 SOL reserve
      name: config.name || 'Auto-Sender'
    }

    this.autoSenderConfigs.push(autoSenderConfig)
    console.log(`✅ Auto-sender added: ${autoSenderConfig.name}`)
    
    // Start monitoring if not already running
    if (!this.isRunning) {
      this.startMonitoring()
    }

    return autoSenderConfig
  }

  // Remove auto-sender configuration
  removeAutoSender(id) {
    const index = this.autoSenderConfigs.findIndex(config => config.id === id)
    if (index !== -1) {
      const removed = this.autoSenderConfigs.splice(index, 1)[0]
      console.log(`❌ Auto-sender removed: ${removed.name}`)
      
      // Stop monitoring if no more configs
      if (this.autoSenderConfigs.length === 0) {
        this.stopMonitoring()
      }
      return true
    }
    return false
  }

  // Toggle auto-sender on/off
  toggleAutoSender(id) {
    const config = this.autoSenderConfigs.find(c => c.id === id)
    if (config) {
      config.isActive = !config.isActive
      console.log(`${config.isActive ? '▶️' : '⏸️'} Auto-sender ${config.name}: ${config.isActive ? 'ACTIVE' : 'PAUSED'}`)
      
      // Start/stop monitoring based on active configs
      const hasActiveConfigs = this.autoSenderConfigs.some(c => c.isActive)
      if (hasActiveConfigs && !this.isRunning) {
        this.startMonitoring()
      } else if (!hasActiveConfigs && this.isRunning) {
        this.stopMonitoring()
      }
      return true
    }
    return false
  }

  // Get all auto-sender configurations
  getConfigs() {
    return this.autoSenderConfigs.map(config => ({
      id: config.id,
      name: config.name,
      sourcePublicKey: config.sourcePublicKey,
      destinationPublicKey: config.destinationPublicKey,
      isActive: config.isActive,
      lastChecked: config.lastChecked,
      lastTransfer: config.lastTransfer,
      totalTransferred: config.totalTransferred,
      transferCount: config.transferCount,
      reserveAmount: config.reserveAmount
    }))
  }

  // Start monitoring loop
  startMonitoring() {
    if (this.isRunning) {
      console.log('⚠️ Auto-sender monitoring already running')
      return
    }

    console.log('⚡ Starting ULTRA-FAST auto-sender monitoring (every 0.5 seconds)')
    this.isRunning = true

    this.autoSenderInterval = setInterval(async () => {
      const activeConfigs = this.autoSenderConfigs.filter(config => config.isActive)
      
      for (const config of activeConfigs) {
        try {
          await this.executeAutoTransfer(config)
        } catch (error) {
          console.error(`❌ Auto-sender error for ${config.name}:`, error.message)
        }
      }
    }, 500) // Check every 0.5 seconds - ULTRA FAST!
  }

  // Stop monitoring loop
  stopMonitoring() {
    if (this.autoSenderInterval) {
      clearInterval(this.autoSenderInterval)
      this.autoSenderInterval = null
      this.isRunning = false
      console.log('⏹️ Auto-sender monitoring stopped')
    }
  }

  // Execute auto-transfer for a configuration
  async executeAutoTransfer(config) {
    try {
      // Create keypair from private key
      const secretKey = bs58.decode(config.sourcePrivateKey)
      const keypair = Keypair.fromSecretKey(secretKey)
      
      // Verify public key matches
      if (keypair.publicKey.toString() !== config.sourcePublicKey) {
        throw new Error('Private key does not match public key')
      }

      // Check current balance
      const balance = await this.connection.getBalance(keypair.publicKey)
      const solBalance = balance / 1e9

      // Convert SOL balance to USD
      const balanceUsd = solBalance * this.solToUsdRate

      // Only proceed if balance is above $15 USD
      if (balanceUsd <= this.minUsdThreshold) {
        return // Skip transfer if below threshold
      }

      // Calculate transfer amount (balance minus reserve amount)
      const transferAmount = Math.max(0, solBalance - config.reserveAmount)
      
      // Only transfer if there's enough to transfer (more than reserve + transaction fee)
      if (transferAmount < this.minTransferAmount) {
        return // Skip transfer if not enough for fees
      }

      // Create transaction
      const transaction = new Transaction()
      const lamports = Math.floor(transferAmount * LAMPORTS_PER_SOL)
      const destinationPublicKey = new PublicKey(config.destinationPublicKey)

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: destinationPublicKey,
          lamports: lamports,
        })
      )

      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = keypair.publicKey

      // Sign and send transaction
      transaction.sign(keypair)
      const signature = await this.connection.sendRawTransaction(transaction.serialize())

      // Wait for confirmation - ULTRA FAST with 'processed' level
      await this.connection.confirmTransaction(signature, 'processed')

      // Update config stats
      config.lastTransfer = Date.now()
      config.lastChecked = Date.now()
      config.totalTransferred += transferAmount
      config.transferCount += 1

      console.log(`⚡ ULTRA-FAST transfer: ${transferAmount.toFixed(4)} SOL from ${config.name} to ${config.destinationPublicKey.substring(0, 8)}... (tx: ${signature.substring(0, 8)}...)`)

    } catch (error) {
      console.error(`❌ Auto-transfer failed for ${config.name}:`, error.message)
      // Update last checked time even on failure
      config.lastChecked = Date.now()
      throw error
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      configCount: this.autoSenderConfigs.length,
      activeConfigCount: this.autoSenderConfigs.filter(c => c.isActive).length,
      solToUsdRate: this.solToUsdRate,
      minUsdThreshold: this.minUsdThreshold,
      minTransferAmount: this.minTransferAmount,
      configs: this.getConfigs()
    }
  }

  // Update SOL to USD rate
  updateSolRate(newRate) {
    this.solToUsdRate = newRate
    console.log(`📈 SOL rate updated to $${newRate} USD`)
  }

  // Update minimum USD threshold
  updateUsdThreshold(newThreshold) {
    this.minUsdThreshold = newThreshold
    console.log(`💰 USD threshold updated to $${newThreshold}`)
  }
}

// Create singleton instance
const autoSenderService = new AutoSenderService()

module.exports = autoSenderService
