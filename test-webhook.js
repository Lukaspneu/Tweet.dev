#!/usr/bin/env node

import fetch from 'node-fetch';

// Webhook testing script
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';

// Test payloads
const testPayloads = [
  {
    name: 'Basic webhook',
    payload: {
      id: 'test_001',
      type: 'user_signup',
      data: {
        userId: '12345',
        email: 'test@example.com',
        timestamp: new Date().toISOString()
      }
    }
  },
  {
    name: 'Payment webhook',
    payload: {
      id: 'pay_002',
      type: 'payment_completed',
      event: 'payment_success',
      data: {
        transactionId: 'txn_abc123',
        amount: 29.99,
        currency: 'USD',
        customer: {
          id: 'cust_456',
          email: 'customer@example.com'
        }
      }
    }
  },
  {
    name: 'Minimal webhook',
    payload: {
      message: 'Hello webhook!',
      timestamp: Date.now()
    }
  }
];

// Test functions
async function testWebhook(payload, name) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    
    const startTime = Date.now();
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Webhook-Tester/1.0'
      },
      body: JSON.stringify(payload)
    });
    
    const responseTime = Date.now() - startTime;
    const responseData = await response.json();
    
    console.log(`📥 Response (${response.status}):`, JSON.stringify(responseData, null, 2));
    console.log(`⏱️  Response time: ${responseTime}ms`);
    
    if (response.ok) {
      console.log('✅ Test passed');
    } else {
      console.log('❌ Test failed');
    }
    
    return { success: response.ok, responseTime, status: response.status };
    
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testInvalidPayload() {
  try {
    console.log('\n🧪 Testing: Invalid JSON payload');
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid json'
    });
    
    const responseData = await response.json();
    console.log(`📥 Response (${response.status}):`, JSON.stringify(responseData, null, 2));
    
    if (response.status === 400) {
      console.log('✅ Invalid payload test passed');
      return true;
    } else {
      console.log('❌ Invalid payload test failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Invalid payload test error: ${error.message}`);
    return false;
  }
}

async function testHealthEndpoint() {
  try {
    console.log('\n🧪 Testing: Health endpoint');
    
    const response = await fetch(WEBHOOK_URL.replace('/webhook', '/health'));
    const responseData = await response.json();
    
    console.log(`📥 Health Response (${response.status}):`, JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Health check passed');
      return true;
    } else {
      console.log('❌ Health check failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Webhook Tests');
  console.log(`🎯 Target URL: ${WEBHOOK_URL}`);
  
  const results = [];
  
  // Test valid payloads
  for (const test of testPayloads) {
    const result = await testWebhook(test.payload, test.name);
    results.push({ name: test.name, ...result });
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test invalid payload
  const invalidResult = await testInvalidPayload();
  results.push({ name: 'Invalid payload', success: invalidResult });
  
  // Test health endpoint
  const healthResult = await testHealthEndpoint();
  results.push({ name: 'Health check', success: healthResult });
  
  // Summary
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    console.log(`${status} ${result.name}${time}`);
  });
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your webhook is ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Please check the webhook implementation.');
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testWebhook, testInvalidPayload, testHealthEndpoint };