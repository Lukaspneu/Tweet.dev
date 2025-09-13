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

// Performance tracking for Render optimization
const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;
let lastHealthCheck = Date.now();

// Tweet storage for real-time display
let latestTweets = [];
const maxTweets = 100; // Keep last 100 tweets

// Essential middleware only - optimized for speed
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));

// CORS configuration for universal access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-API-Key');
  res.header('Access-Control-Max-Age', '86400');
  res.header('X-Powered-By', 'DeckDev-Webhook/1.0');
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Minimal request logging (production optimized)
app.use((req, res, next) => {
  requestCount++;
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip || req.connection.remoteAddress}`);
  next();
});

// PRODUCTION WEBHOOK ENDPOINT - Optimized for Render 24/7
app.post('/webhook', async (req, res) => {
  const webhookStartTime = Date.now();
  
  try {
    // Ultra-fast JSON validation
    if (!req.body || typeof req.body !== 'object' || (Array.isArray(req.body) && req.body.length === 0)) {
      errorCount++;
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON payload',
        message: 'Request body must contain a valid JSON object',
        timestamp: new Date().toISOString(),
        processingTime: `${Date.now() - webhookStartTime}ms`
      });
    }

    const webhookData = req.body;
    
    // Generate unique ID if not provided
    const webhookId = webhookData.id || `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Process webhook data with minimal overhead
    const processedData = {
      id: webhookId,
      type: webhookData.type || webhookData.event || 'webhook',
      data: webhookData,
      metadata: {
        receivedAt: new Date().toISOString(),
        source: 'DeckDev Production Webhook',
        version: '2.0.0',
        server: 'render-production'
      }
    };

    // Store tweet for real-time display (if it's a tweet or FeedPost)
    if (webhookData.tweet_id || webhookData.feed_id || webhookData.tweet_content || webhookData.type === 'tweet' || webhookData.event === 'new_tweet' || webhookData.text || webhookData.content || webhookData.data?.text || webhookData.extension?.tweet_id || webhookData.extension?.tweet_content) {
      
      // Handle PostInfo/FeedPost structure
      let tweetData;
      
      if (webhookData.tweet_id || webhookData.feed_id || webhookData.extension?.tweet_id) {
        // New PostInfo/FeedPost structure (including extension field)
        const extension = webhookData.extension || {};
        const tweetId = webhookData.tweet_id || extension.tweet_id;
        const username = webhookData.twitter_user_handle || extension.twitter_user_handle || 'unknown';
        const displayName = username; // Use handle as display name if no separate display name
        const profileImage = webhookData.twitter_user_avatar || extension.twitter_user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1f2937&color=fff`;
        let content = webhookData.tweet_content || extension.tweet_content || 'No content';
        const published = webhookData.published || extension.published || new Date().toISOString();
        const received = webhookData.received || extension.received || new Date().toISOString();
        
        // Clean the content - remove "Posted", "Quoted" and URLs
        content = content
          .replace(/^(Posted|Quoted|Reposted)\s*/i, '') // Remove Posted/Quoted/Reposted prefixes
          .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
          .replace(/\s+/g, ' ') // Clean up extra spaces
          .trim();
        
        // If content is empty after cleaning, use a default message
        if (!content || content === '') {
          content = 'Tweet content';
        }
        
        // Create tweet URL from tweet_id
        const tweetUrl = `https://twitter.com/${username}/status/${tweetId}`;
        
        tweetData = {
          id: `tweet_${tweetId}`,
          username: username,
          displayName: displayName,
          text: content,
          timestamp: published,
          profileImage: profileImage,
          url: tweetUrl,
          followerCount: '1K', // Default since not in PostInfo structure
          source: 'webhook',
          receivedAt: new Date(received).getTime(),
          tweetId: tweetId,
          userId: webhookData.twitter_user_id,
          feedId: webhookData.feed_id,
          linkedTo: webhookData.linked_to
        };
      } else {
        // Legacy structure - extract tweet data with better parsing
        let rawText = webhookData.text || webhookData.content || webhookData.message || webhookData.data?.text || 'No content';
        
        // Clean markdown links and extract clean text
        let cleanText = rawText;
        let extractedUrl = null;
        
        // Handle markdown links like [text](url)
        const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
        const linkMatches = [...rawText.matchAll(markdownLinkRegex)];
        
        if (linkMatches.length > 0) {
          // Extract the link text (first capture group)
          cleanText = linkMatches.map(match => match[1]).join(' ').trim();
          // Extract the URL (second capture group) - use the first one found
          extractedUrl = linkMatches[0][2];
        }
        
        // Clean up any remaining markdown or unwanted characters
        cleanText = cleanText
          .replace(/\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove any remaining markdown links
          .replace(/\[Posted\]/g, '') // Remove [Posted] text
          .replace(/\[↧\]/g, '') // Remove [↧] symbols
          .replace(/^(Posted|Quoted|Reposted)\s*/i, '') // Remove Posted/Quoted/Reposted prefixes
          .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
          .replace(/\s+/g, ' ') // Clean up extra spaces
          .trim();
        
        const author = webhookData.author || webhookData.data?.author || {};
        const username = webhookData.username || author.username || webhookData.data?.username || webhookData.twitter_user_handle || 'unknown';
        const displayName = webhookData.displayName || author.displayName || webhookData.data?.displayName || username || 'Unknown User';
        const profileImage = webhookData.profileImage || author.profileImage || webhookData.data?.profileImage || webhookData.twitter_user_avatar || 
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1f2937&color=fff`;
        const followerCount = webhookData.followerCount || author.followerCount || webhookData.data?.followerCount || '1K';
        const tweetUrl = extractedUrl || webhookData.url || webhookData.tweetUrl || webhookData.link || webhookData.data?.url;
        const imageUrl = webhookData.imageUrl || webhookData.media?.image || webhookData.attachments?.image || webhookData.data?.imageUrl;
        
        tweetData = {
          id: webhookId,
          username: username,
          displayName: displayName,
          text: cleanText,
          timestamp: new Date().toISOString(),
          profileImage: profileImage,
          url: tweetUrl,
          imageUrl: imageUrl,
          followerCount: followerCount,
          source: 'webhook',
          receivedAt: Date.now()
        };
      }

      // Add to latest tweets (prepend for newest first)
      latestTweets.unshift(tweetData);
      
      // Keep only the latest tweets
      if (latestTweets.length > maxTweets) {
        latestTweets = latestTweets.slice(0, maxTweets);
      }

      console.log(`📱 New tweet stored: ${tweetData.username} - ${tweetData.text.substring(0, 50)}...`);
    }

    // Log successful processing (minimal for performance)
    const processingTime = Date.now() - webhookStartTime;
    if (processingTime > 10) {
      console.log(`⚠️  Slow webhook processing: ${processingTime}ms for ${webhookId}`);
    }

    // Return optimized success response
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: processedData,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      server: 'render-production'
    });

  } catch (error) {
    errorCount++;
    const processingTime = Date.now() - webhookStartTime;
    
    console.error('❌ Webhook error:', {
      error: error.message,
      processingTime: `${processingTime}ms`,
      payload: req.body ? Object.keys(req.body) : 'no payload'
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Webhook processing failed',
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      server: 'render-production'
    });
  }
});

// RENDER-OPTIMIZED HEALTH CHECK
app.get('/health', async (req, res) => {
  try {
    lastHealthCheck = Date.now();
    const dbStatus = await testConnection();
    const uptime = process.uptime();
    
    // Calculate performance metrics
    const avgResponseTime = requestCount > 0 ? (Date.now() - startTime) / requestCount : 0;
    const errorRate = requestCount > 0 ? ((errorCount / requestCount) * 100).toFixed(2) : '0.00';
    
    const healthData = {
      status: 'healthy',
      service: 'DeckDev Production Webhook',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        human: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
        started: new Date(startTime).toISOString()
      },
      performance: {
        totalRequests: requestCount,
        errorRate: `${errorRate}%`,
        averageResponseTime: Math.round(avgResponseTime),
        lastHealthCheck: new Date(lastHealthCheck).toISOString()
      },
      database: {
        connected: dbStatus,
        url: process.env.DATABASE_URL ? 'configured' : 'not configured'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'production',
        port: PORT,
        nodeVersion: process.version,
        platform: process.platform,
        render: true,
        alwaysOn: true
      },
      server: {
        type: 'render-production',
        region: 'oregon',
        plan: 'starter'
      }
    };

    res.status(200).json(healthData);
  } catch (error) {
    res.status(200).json({
      status: 'healthy',
      service: 'DeckDev Production Webhook',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      error: 'Health check error: ' + error.message,
      server: 'render-production'
    });
  }
});

// LATEST TWEETS ENDPOINT - For real-time tweet display
app.get('/api/latest-tweets', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      tweets: latestTweets,
      count: latestTweets.length,
      timestamp: new Date().toISOString(),
      server: 'render-production'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tweets',
      timestamp: new Date().toISOString()
    });
  }
});

// API STATUS ENDPOINT
app.get('/api/status', (req, res) => {
  res.status(200).json({
    service: 'DeckDev Production Webhook API',
    status: 'operational',
    timestamp: new Date().toISOString(),
    server: 'render-production',
    endpoints: {
      webhook: '/webhook (POST) - Main webhook endpoint',
      health: '/health (GET) - Health check with metrics',
      status: '/api/status (GET) - API status',
      latestTweets: '/api/latest-tweets (GET) - Latest tweets for display',
      root: '/ (GET) - React app'
    },
    features: [
      'Ultra-fast webhook processing',
      '24/7 always-on hosting',
      'CORS-enabled for universal access',
      'Production-ready error handling',
      'Performance monitoring',
      'Real-time tweet storage',
      'Custom domain compatible'
    ],
    stats: {
      totalTweets: latestTweets.length,
      lastTweetReceived: latestTweets.length > 0 ? latestTweets[0].receivedAt : null
    }
  });
});

// KEEP-ALIVE ENDPOINT for Render
app.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    server: 'render-production'
  });
});

// Serve static files from the dist directory (React app)
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing - return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// GRACEFUL SHUTDOWN for Render
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// START SERVER - Optimized for Render
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 DeckDev Production Webhook Server Started');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📡 Webhook: https://deckdev-app.onrender.com/webhook`);
  console.log(`❤️  Health: https://deckdev-app.onrender.com/health`);
  console.log(`📊 Status: https://deckdev-app.onrender.com/api/status`);
  console.log(`🏓 Ping: https://deckdev-app.onrender.com/ping`);
  console.log('✨ Server ready for 24/7 production webhooks!');
  console.log('🔥 Optimized for Render always-on performance!');
});

// Test database connection (non-blocking)
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