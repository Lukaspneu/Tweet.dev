// Database utilities for PostgreSQL with wallet support
const { Pool } = require('pg');
const { dbConfig } = require('../config/database.js');

class DatabaseConnection {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.pool && this.isConnected) {
      return true;
    }

    if (!dbConfig.connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    try {
      // Create connection pool
      this.pool = new Pool({
        connectionString: dbConfig.connectionString,
        ssl: dbConfig.ssl,
        ...dbConfig.pool
      });

      // Test connection
      const client = await this.pool.connect();
      console.log('✅ Database connection successful');
      client.release();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async query(sql, params = []) {
    if (!this.pool) {
      await this.connect();
    }

    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error) {
      console.error('❌ Database query failed:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('✅ Database connection closed');
    }
  }
}

const db = new DatabaseConnection();

// Helper function to test database connection
async function testConnection() {
  try {
    await db.connect();
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

module.exports = { DatabaseConnection, db, testConnection };
