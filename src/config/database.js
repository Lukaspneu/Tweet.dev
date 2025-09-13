// Database configuration for Render PostgreSQL
export const dbConfig = {
  // Render will provide DATABASE_URL environment variable
  connectionString: process.env.DATABASE_URL,
  
  // Alternative individual config (if needed)
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'deckdev',
  username: process.env.DB_USER || 'deckdev_user',
  password: process.env.DB_PASSWORD,
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Connection pool settings
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};

export default dbConfig;
