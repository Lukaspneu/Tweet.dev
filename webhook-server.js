#!/usr/bin/env node

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './src/utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app with production optimizations
const app = express();
const PORT = process.env.PORT || 3000;

// Performance tracking
const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;

// Essential middleware only - no unnecessary overhead
app.use(express.json({ 
  limit: '10mb',  // Reasonable limit for webhook payloads
  strict: true    // Only parse JSON arrays and objects
}));

// CORS configuration for webhook accessibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Request logging middleware (minimal overhead)
app.use((req, res, next) => {
  requestCount++;
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - IP: ${req.ip || req.connection.remoteAddress}`);
  next();
});

// Production-ready webhook endpoint
app.post('/webhook', async (req, res) => {
  const webhookStartTime = Date.now();
  
  try {
    // Validate JSON payload
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) && req.body.length === 0) {
      errorCount++;
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload',
        message: 'Request body must contain a valid JSON object',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - webhookStartTime
      });
    }

    // Extract webhook data
    const webhookData = req.body;
    
    // Basic payload validation
    if (!webhookData.id && !webhookData.type && !webhookData.event) {
      console.warn('Webhook received with minimal data structure:', Object.keys(webhookData));
    }

    // Process webhook data (extensible structure)
    const processedData = {
      id: webhookData.id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: webhookData.type || webhookData.event || 'unknown',
      data: webhookData,
      metadata: {
        receivedAt: new Date().toISOString(),
        source: 'DeckDev Webhook Service',
        version: '1.0.0'
      }
    };

    // Log successful processing (structured logging)
    const processingTime = Date.now() - webhookStartTime;
    console.log(`✅ Webhook processed successfully:`, {
      id: processedData.id,
      type: processedData.type,
      processingTime: `${processingTime}ms`,
      payloadSize: JSON.stringify(webhookData).length
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: processedData,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    errorCount++;
    const processingTime = Date.now() - webhookStartTime;
    
    console.error('❌ Webhook processing error:', {
      error: error.message,
      stack: error.stack,
      processingTime: `${processingTime}ms`,
      payload: req.body ? Object.keys(req.body) : 'no payload'
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Webhook processing failed',
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    });
  }
});

// Enhanced health check with performance metrics
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    const uptime = process.uptime();
    
    const healthData = {
      status: 'healthy',
      service: 'DeckDev Webhook Service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        human: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`
      },
      performance: {
        totalRequests: requestCount,
        errorRate: requestCount > 0 ? ((errorCount / requestCount) * 100).toFixed(2) + '%' : '0%',
        averageResponseTime: requestCount > 0 ? (Date.now() - startTime) / requestCount : 0
      },
      database: {
        connected: dbStatus,
        url: process.env.DATABASE_URL ? 'configured' : 'not configured'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: PORT,
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(200).json({
      status: 'healthy',
      service: 'DeckDev Webhook Service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: 'Health check error: ' + error.message
    });
  }
});

// API status endpoint for monitoring
app.get('/api/status', (req, res) => {
  res.status(200).json({
    service: 'DeckDev Webhook API',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/webhook (POST)',
      health: '/health (GET)',
      status: '/api/status (GET)'
    }
  });
});

// Serve static files from the dist directory (for your React app)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing - return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 DeckDev Webhook Server Started');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API status: http://localhost:${PORT}/api/status`);
  console.log('✨ Server ready to receive webhooks!');
});

// Test database connection on startup (non-blocking)
testConnection().then(success => {
  if (success) {
    console.log('✅ Database connection established');
  } else {
    console.log('⚠️  Database connection failed - running without database');
  }
}).catch(error => {
  console.log('⚠️  Database connection test failed:', error.message);
});

export default app;
