#!/usr/bin/env node

/**
 * Test script for DeckDev webhook endpoint
 * Usage: node test-webhook.js [webhook-url]
 */

import fetch from 'node-fetch';

const WEBHOOK_URL = process.argv[2] || 'http://localhost:3000/webhook';

// Test data examples
const testPayloads = [
  {
    id: 'test-001',
    type: 'tweet',
    data: {
      username: 'testuser',
      message: 'Hello from webhook test!',
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'test-002',
    type: 'notification',
    data: {
      title: 'New follower',
      user: 'john_doe',
      message: 'started following you'
    }
  },
  {
    id: 'test-003',
    type: 'payment',
    data: {
      amount: 100,
      currency: 'USD',
      from: 'user123',
      to: 'user456',
      description: 'Token purchase'
    }
  }
];

async function testWebhook(payload) {
  try {
    console.log(`\n🧪 Testing webhook with payload:`, JSON.stringify(payload, null, 2));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DeckDev-Webhook-Test/1.0'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', response.status);
      console.log('📄 Response:', JSON.stringify(responseData, null, 2));
    } else {
      console.log('❌ Error:', response.status);
      console.log('📄 Response:', JSON.stringify(responseData, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Network Error:', error.message);
  }
}

async function testHealthCheck() {
  try {
    console.log('\n🏥 Testing health check endpoint...');
    const healthUrl = WEBHOOK_URL.replace('/webhook', '/health');
    const response = await fetch(healthUrl);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Health check passed:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Health check failed:', response.status);
    }
  } catch (error) {
    console.error('💥 Health check error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 DeckDev Webhook Test Suite');
  console.log('📍 Webhook URL:', WEBHOOK_URL);
  
  // Test health check first
  await testHealthCheck();
  
  // Test each payload
  for (const payload of testPayloads) {
    await testWebhook(payload);
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✨ All tests completed!');
}

// Run the tests
runTests().catch(console.error);
