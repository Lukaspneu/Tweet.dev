#!/usr/bin/env node

import fetch from 'node-fetch';

// Production webhook testing for Render deployment
const PRODUCTION_URL = 'https://deckdev-app.onrender.com';
const WEBHOOK_URL = `${PRODUCTION_URL}/webhook`;
const HEALTH_URL = `${PRODUCTION_URL}/health`;
const STATUS_URL = `${PRODUCTION_URL}/api/status`;
const PING_URL = `${PRODUCTION_URL}/ping`;

// Performance tracking
let totalTests = 0;
let passedTests = 0;
let totalResponseTime = 0;

// Test payloads optimized for production
const productionTests = [
  {
    name: 'Basic Production Webhook',
    payload: {
      id: 'prod_001',
      type: 'user_signup',
      data: {
        userId: '12345',
        email: 'user@example.com',
        timestamp: new Date().toISOString()
      }
    }
  },
  {
    name: 'Payment Processing Webhook',
    payload: {
      id: 'pay_002',
      type: 'payment_completed',
      event: 'payment_success',
      data: {
        transactionId: 'txn_abc123',
        amount: 99.99,
        currency: 'USD',
        customer: {
          id: 'cust_456',
          email: 'customer@example.com'
        },
        metadata: {
          source: 'stripe',
          timestamp: new Date().toISOString()
        }
      }
    }
  },
  {
    name: 'High-Volume Data Webhook',
    payload: {
      id: 'bulk_003',
      type: 'bulk_import',
      data: {
        records: Array.from({ length: 100 }, (_, i) => ({
          id: `record_${i}`,
          value: Math.random() * 1000,
          timestamp: new Date().toISOString()
        })),
        totalRecords: 100
      }
    }
  },
  {
    name: 'Minimal Webhook',
    payload: {
      message: 'Hello production webhook!',
      timestamp: Date.now()
    }
  }
];

// Test functions with performance tracking
async function testWebhook(payload, name) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📤 Payload size: ${JSON.stringify(payload).length} bytes`);
    
    const startTime = Date.now();
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DeckDev-Production-Tester/2.0',
        'X-API-Key': 'test-key-123'
      },
      body: JSON.stringify(payload)
    });
    
    const responseTime = Date.now() - startTime;
    const responseData = await response.json();
    
    totalTests++;
    totalResponseTime += responseTime;
    
    console.log(`📥 Response (${response.status}):`, JSON.stringify(responseData, null, 2));
    console.log(`⏱️  Response time: ${responseTime}ms`);
    
    if (response.ok && responseData.success) {
      console.log('✅ Test passed');
      passedTests++;
      return { success: true, responseTime, status: response.status };
    } else {
      console.log('❌ Test failed');
      return { success: false, responseTime, status: response.status, error: responseData };
    }
    
  } catch (error) {
    console.log(`❌ Test error: ${error.message}`);
    totalTests++;
    return { success: false, error: error.message };
  }
}

async function testInvalidPayload() {
  try {
    console.log('\n🧪 Testing: Invalid JSON payload');
    
    const startTime = Date.now();
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid json payload'
    });
    
    const responseTime = Date.now() - startTime;
    const responseData = await response.json();
    
    totalTests++;
    totalResponseTime += responseTime;
    
    console.log(`📥 Response (${response.status}):`, JSON.stringify(responseData, null, 2));
    console.log(`⏱️  Response time: ${responseTime}ms`);
    
    if (response.status === 400) {
      console.log('✅ Invalid payload test passed');
      passedTests++;
      return true;
    } else {
      console.log('❌ Invalid payload test failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Invalid payload test error: ${error.message}`);
    totalTests++;
    return false;
  }
}

async function testHealthEndpoint() {
  try {
    console.log('\n🧪 Testing: Health endpoint');
    
    const startTime = Date.now();
    const response = await fetch(HEALTH_URL);
    const responseTime = Date.now() - startTime;
    const responseData = await response.json();
    
    totalTests++;
    totalResponseTime += responseTime;
    
    console.log(`📥 Health Response (${response.status}):`, JSON.stringify(responseData, null, 2));
    console.log(`⏱️  Response time: ${responseTime}ms`);
    
    if (response.ok && responseData.status === 'healthy') {
      console.log('✅ Health check passed');
      passedTests++;
      return true;
    } else {
      console.log('❌ Health check failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
    totalTests++;
    return false;
  }
}

async function testStatusEndpoint() {
  try {
    console.log('\n🧪 Testing: API Status endpoint');
    
    const startTime = Date.now();
    const response = await fetch(STATUS_URL);
    const responseTime = Date.now() - startTime;
    const responseData = await response.json();
    
    totalTests++;
    totalResponseTime += responseTime;
    
    console.log(`📥 Status Response (${response.status}):`, JSON.stringify(responseData, null, 2));
    console.log(`⏱️  Response time: ${responseTime}ms`);
    
    if (response.ok && responseData.status === 'operational') {
      console.log('✅ Status check passed');
      passedTests++;
      return true;
    } else {
      console.log('❌ Status check failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Status check error: ${error.message}`);
    totalTests++;
    return false;
  }
}

async function testPingEndpoint() {
  try {
    console.log('\n🧪 Testing: Ping endpoint');
    
    const startTime = Date.now();
    const response = await fetch(PING_URL);
    const responseTime = Date.now() - startTime;
    const responseData = await response.json();
    
    totalTests++;
    totalResponseTime += responseTime;
    
    console.log(`📥 Ping Response (${response.status}):`, JSON.stringify(responseData, null, 2));
    console.log(`⏱️  Response time: ${responseTime}ms`);
    
    if (response.ok && responseData.status === 'alive') {
      console.log('✅ Ping check passed');
      passedTests++;
      return true;
    } else {
      console.log('❌ Ping check failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Ping check error: ${error.message}`);
    totalTests++;
    return false;
  }
}

async function performanceTest() {
  console.log('\n🏃‍♂️ Running performance test (10 concurrent requests)...');
  
  const promises = [];
  const testPayload = {
    id: 'perf_test',
    type: 'performance_test',
    data: { test: 'concurrent_load' }
  };
  
  const startTime = Date.now();
  
  for (let i = 0; i < 10; i++) {
    promises.push(
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testPayload, id: `perf_${i}` })
      })
    );
  }
  
  try {
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    const successful = responses.filter(r => r.ok).length;
    const averageTime = totalTime / 10;
    
    console.log(`📊 Performance Results:`);
    console.log(`   Total time: ${totalTime}ms`);
    console.log(`   Average time per request: ${averageTime.toFixed(2)}ms`);
    console.log(`   Successful requests: ${successful}/10`);
    console.log(`   Requests per second: ${(10000 / totalTime).toFixed(2)}`);
    
    if (successful >= 9 && averageTime < 1000) {
      console.log('✅ Performance test passed');
      return true;
    } else {
      console.log('❌ Performance test failed');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Performance test error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runProductionTests() {
  console.log('🚀 Starting Production Webhook Tests');
  console.log(`🎯 Target: ${PRODUCTION_URL}`);
  console.log(`📡 Webhook: ${WEBHOOK_URL}`);
  console.log(`❤️  Health: ${HEALTH_URL}`);
  console.log(`📊 Status: ${STATUS_URL}`);
  console.log(`🏓 Ping: ${PING_URL}`);
  
  const results = [];
  
  // Test all webhook payloads
  for (const test of productionTests) {
    const result = await testWebhook(test.payload, test.name);
    results.push({ name: test.name, ...result });
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Test error handling
  const invalidResult = await testInvalidPayload();
  results.push({ name: 'Invalid payload', success: invalidResult });
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Test all endpoints
  const healthResult = await testHealthEndpoint();
  results.push({ name: 'Health check', success: healthResult });
  
  const statusResult = await testStatusEndpoint();
  results.push({ name: 'Status check', success: statusResult });
  
  const pingResult = await testPingEndpoint();
  results.push({ name: 'Ping check', success: pingResult });
  
  // Performance test
  const perfResult = await performanceTest();
  results.push({ name: 'Performance test', success: perfResult });
  
  // Summary
  console.log('\n📊 Production Test Summary:');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  const avgResponseTime = totalTests > 0 ? (totalResponseTime / totalTests).toFixed(2) : 0;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
    console.log(`${status} ${result.name}${time}`);
  });
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
  console.log(`⏱️  Average response time: ${avgResponseTime}ms`);
  console.log(`📊 Total requests tested: ${totalTests}`);
  
  if (passed === total) {
    console.log('🎉 All production tests passed! Your webhook is ready for 24/7 production use.');
    console.log('🔥 Render deployment is optimized and performing perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Please check the webhook implementation.');
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionTests().catch(console.error);
}

export { runProductionTests, testWebhook, testHealthEndpoint, performanceTest };
