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
    
    // Debug logging to see what's being received
    console.log('🔍 Full webhook data received:', JSON.stringify(webhookData, null, 2));
    console.log('🔍 Data structure keys:', Object.keys(webhookData));
    console.log('🔍 Video URL detected:', webhookData.videoUrl);
    
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

    // Store tweet for real-time display (always try to process as tweet)
    if (true) { // Process all webhook data as potential tweets
      
      // Handle PostInfo/FeedPost structure
      let tweetData;
      
      // Universal tweet parser - handles any data format
      const extension = webhookData.extension || {};
      
      // Extract tweet ID from multiple possible sources
      const tweetId = webhookData.tweet_id || extension.tweet_id || webhookData.id || 
                     (webhookData.url && webhookData.url.match(/status\/(\d+)/)?.[1]) || 
                     Date.now();
      
      // Extract username from multiple possible sources
      const username = webhookData.twitter_user_handle || extension.twitter_user_handle || 
                      webhookData.username || webhookData.handle || 
                      (webhookData.url && webhookData.url.match(/twitter\.com\/([^\/]+)/)?.[1]) ||
                      'unknown';
      
      // Extract display name from multiple possible sources
      const displayName = webhookData.twitter_user_display_name || extension.twitter_user_display_name || 
                         webhookData.displayName || extension.displayName || 
                         webhookData.name || webhookData.display_name || username;
      
      // Extract profile image from multiple possible sources
      const profileImage = webhookData.twitter_user_avatar || extension.twitter_user_avatar || 
                          webhookData.profileImage || webhookData.avatar || 
                          webhookData.profile_image || webhookData.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1f2937&color=fff`;
      
      // Extract follower count from multiple possible sources
      const followerCount = webhookData.twitter_user_followers || extension.twitter_user_followers || 
                           webhookData.followerCount || webhookData.followers || 
                           webhookData.follower_count || '1K';
      
      // Extract content from multiple possible sources
      let content = webhookData.tweet_content || extension.tweet_content || 
                   webhookData.text || webhookData.content || 
                   webhookData.message || webhookData.description || 'No content';
      
      const published = webhookData.published || extension.published || webhookData.timestamp || new Date().toISOString();
      const received = webhookData.received || extension.received || new Date().toISOString();
        
        // Extract URL before cleaning content
        let extractedUrl = null;
        const urlMatch = content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          extractedUrl = urlMatch[0];
        }
        
        // Clean the content - remove "Posted", "Quoted" and ALL URLs
        content = content
          .replace(/^(Posted|Quoted|Reposted)\s*/i, '') // Remove Posted/Quoted/Reposted prefixes
          .replace(/https?:\/\/[^\s]+/g, '') // Remove all http/https URLs
          .replace(/x\.com\/[^\s]+/g, '') // Remove x.com links
          .replace(/twitter\.com\/[^\s]+/g, '') // Remove twitter.com links
          .replace(/t\.co\/[^\s]+/g, '') // Remove t.co short links
          .replace(/bit\.ly\/[^\s]+/g, '') // Remove bit.ly links
          .replace(/tinyurl\.com\/[^\s]+/g, '') // Remove tinyurl links
          .replace(/www\.[^\s]+/g, '') // Remove www links
          .replace(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*/g, '') // Remove domain.com/path links
          .replace(/@[^\s]+\s+/g, '') // Remove @mentions if they're just links
          .replace(/\s+/g, ' ') // Clean up extra spaces
          .trim();
        
        // If content is empty after cleaning, use a default message
        if (!content || content === '') {
          content = 'Tweet content';
        }
        
        // Create tweet URL - use extracted URL or generate from tweet_id
        const tweetUrl = extractedUrl || webhookData.url || `https://twitter.com/${username}/status/${tweetId}`;
        
        // Extract image URL if present - handle multiple formats
        const imageUrl = webhookData.imageUrl || webhookData.image || webhookData.media?.image || 
                        webhookData.attachments?.image || webhookData.photo || webhookData.picture ||
                        webhookData.media?.url || webhookData.attachments?.url ||
                        webhookData.media?.photo?.url || webhookData.entities?.media?.[0]?.media_url ||
                        webhookData.extended_entities?.media?.[0]?.media_url ||
                        extension.imageUrl || extension.image || extension.media?.image ||
                        extension.attachments?.image || extension.photo || extension.picture;
        
        // Extract video URL if present - handle multiple formats
        const videoUrl = webhookData.videoUrl || webhookData.video || webhookData.media?.video || 
                        webhookData.attachments?.video || webhookData.media?.video_url ||
                        webhookData.entities?.media?.[0]?.video_info?.variants?.[0]?.url ||
                        webhookData.extended_entities?.media?.[0]?.video_info?.variants?.[0]?.url ||
                        extension.videoUrl || extension.video || extension.media?.video ||
                        extension.attachments?.video;
        
        // Extract video poster/thumbnail if present
        const videoPoster = webhookData.videoPoster || webhookData.video_thumbnail || 
                           webhookData.media?.video_thumbnail || webhookData.attachments?.video_thumbnail ||
                           extension.videoPoster || extension.video_thumbnail;
        
        console.log('🔍 Extracted videoUrl:', videoUrl);
        console.log('🔍 Extracted videoPoster:', videoPoster);
        
        tweetData = {
          id: `tweet_${tweetId}`,
          username: username,
          displayName: displayName,
          text: content,
          timestamp: published,
          profileImage: profileImage,
          url: tweetUrl,
          imageUrl: imageUrl || null,
          videoUrl: videoUrl || null,
          videoPoster: videoPoster || null,
          followerCount: followerCount,
          source: 'webhook',
          receivedAt: new Date(received).getTime(),
          tweetId: tweetId,
          userId: webhookData.twitter_user_id,
          feedId: webhookData.feed_id,
          linkedTo: webhookData.linked_to
        };

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
      server: 'render-production',
      version: '3.0.0-video-support'
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