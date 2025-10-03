const { Pool } = require('pg');
const { dbConfig } = require('../config/database.js');
const fs = require('fs');
const path = require('path');

class WalletDatabaseService {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.privateKeysFile = path.join(__dirname, '../../private-keys-backup.txt');
  }

  async connect() {
    try {
      if (this.pool) {
        return true;
      }

      // Create connection pool
      this.pool = new Pool({
        connectionString: dbConfig.connectionString,
        ssl: dbConfig.ssl,
        ...dbConfig.pool
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('✅ Wallet database connected successfully');
      client.release();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('❌ Wallet database connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async createTables() {
    if (!this.pool) {
      await this.connect();
    }

    try {
      // Create wallets table
      const createWalletsTable = `
        CREATE TABLE IF NOT EXISTS wallets (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          public_key VARCHAR(255) NOT NULL UNIQUE,
          private_key TEXT NOT NULL,
          is_dev_wallet BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create wallet_transactions table for history
      const createTransactionsTable = `
        CREATE TABLE IF NOT EXISTS wallet_transactions (
          id SERIAL PRIMARY KEY,
          wallet_id VARCHAR(255) REFERENCES wallets(id) ON DELETE CASCADE,
          transaction_type VARCHAR(50) NOT NULL,
          amount DECIMAL(20, 9),
          destination_address VARCHAR(255),
          signature VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      await this.pool.query(createWalletsTable);
      await this.pool.query(createTransactionsTable);
      
      console.log('✅ Wallet database tables created successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to create wallet database tables:', error.message);
      throw error;
    }
  }

  async saveWallet(walletData) {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const { id, name, publicKey, privateKey, isDevWallet = false } = walletData;
      
      const query = `
        INSERT INTO wallets (id, name, public_key, private_key, is_dev_wallet, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          public_key = EXCLUDED.public_key,
          private_key = EXCLUDED.private_key,
          is_dev_wallet = EXCLUDED.is_dev_wallet,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await this.pool.query(query, [id, name, publicKey, privateKey, isDevWallet]);
      
      // Save private key to local backup file
      await this.appendPrivateKeyToFile(id, name, publicKey, privateKey, isDevWallet);
      
      console.log(`✅ Wallet saved to database: ${name}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to save wallet to database:', error.message);
      throw error;
    }
  }

  async appendPrivateKeyToFile(id, name, publicKey, privateKey, isDevWallet = false) {
    try {
      const timestamp = new Date().toISOString();
      const devBadge = isDevWallet ? ' [DEV WALLET]' : '';
      
      const keyEntry = `
# ============================================
# WALLET: ${name}${devBadge}
# ID: ${id}
# Created: ${timestamp}
# Public Key: ${publicKey}
# Private Key (Base58): ${privateKey}
# ============================================
`;

      // Append to the private keys backup file
      fs.appendFileSync(this.privateKeysFile, keyEntry);
      console.log(`🔐 Private key saved to local backup file: ${name}`);
    } catch (error) {
      console.error('❌ Failed to save private key to backup file:', error.message);
      // Don't throw error - this shouldn't break wallet creation
    }
  }

  async getWallet(id) {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const query = 'SELECT * FROM wallets WHERE id = $1';
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Failed to get wallet from database:', error.message);
      throw error;
    }
  }

  async getAllWallets() {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const query = 'SELECT * FROM wallets ORDER BY created_at ASC';
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get wallets from database:', error.message);
      throw error;
    }
  }

  async updateWallet(id, updates) {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const allowedFields = ['name', 'public_key', 'private_key', 'is_dev_wallet'];
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      const query = `
        UPDATE wallets 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      values.push(id);
      const result = await this.pool.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Failed to update wallet in database:', error.message);
      throw error;
    }
  }

  async deleteWallet(id) {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const query = 'DELETE FROM wallets WHERE id = $1 RETURNING *';
      const result = await this.pool.query(query, [id]);
      console.log(`✅ Wallet deleted from database: ${id}`);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Failed to delete wallet from database:', error.message);
      throw error;
    }
  }

  async saveTransaction(transactionData) {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const { walletId, transactionType, amount, destinationAddress, signature, status = 'pending' } = transactionData;
      
      const query = `
        INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, destination_address, signature, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const result = await this.pool.query(query, [walletId, transactionType, amount, destinationAddress, signature, status]);
      console.log(`✅ Transaction saved to database: ${transactionType}`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to save transaction to database:', error.message);
      throw error;
    }
  }

  async getWalletTransactions(walletId) {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const query = 'SELECT * FROM wallet_transactions WHERE wallet_id = $1 ORDER BY created_at DESC';
      const result = await this.pool.query(query, [walletId]);
      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get wallet transactions from database:', error.message);
      throw error;
    }
  }

  async backupWallets() {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const wallets = await this.getAllWallets();
      const backup = {
        timestamp: new Date().toISOString(),
        wallets: wallets.map(wallet => ({
          id: wallet.id,
          name: wallet.name,
          publicKey: wallet.public_key,
          privateKey: wallet.private_key,
          isDevWallet: wallet.is_dev_wallet,
          createdAt: wallet.created_at,
          updatedAt: wallet.updated_at
        }))
      };
      
      console.log(`✅ Wallet backup created: ${wallets.length} wallets backed up`);
      return backup;
    } catch (error) {
      console.error('❌ Failed to backup wallets:', error.message);
      throw error;
    }
  }

  async restoreWallets(backupData) {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const { wallets } = backupData;
      let restored = 0;

      for (const wallet of wallets) {
        try {
          await this.saveWallet({
            id: wallet.id,
            name: wallet.name,
            publicKey: wallet.publicKey,
            privateKey: wallet.privateKey,
            isDevWallet: wallet.isDevWallet
          });
          restored++;
        } catch (error) {
          console.warn(`⚠️ Failed to restore wallet ${wallet.name}:`, error.message);
        }
      }

      console.log(`✅ Wallet restore completed: ${restored}/${wallets.length} wallets restored`);
      return { restored, total: wallets.length };
    } catch (error) {
      console.error('❌ Failed to restore wallets:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('✅ Wallet database connection closed');
    }
  }
}

// Create singleton instance
const walletDbService = new WalletDatabaseService();

module.exports = { WalletDatabaseService, walletDbService };
