#!/usr/bin/env node

/**
 * DIAGNOSTIC SCRIPT - Test Backend Endpoints
 * 
 * This script tests the backend endpoints to identify why the validation
 * harness is failing with "Failed to get backend diagnostic: {}"
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   BACKEND ENDPOINT DIAGNOSTIC                             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`Testing backend at: ${BACKEND_URL}\n`);

// Test 1: /api/health
async function testHealth() {
  console.log('=== TEST 1: GET /api/health ===\n');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    const latency = Date.now() - startTime;
    
    console.log(`HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`Latency: ${latency}ms`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    const text = await response.text();
    console.log(`\nRaw Response:\n${text.substring(0, 500)}`);
    
    try {
      const json = JSON.parse(text);
      console.log(`\nParsed JSON:`);
      console.log(`  provider: ${json.provider}`);
      console.log(`  model: ${json.model}`);
      console.log(`  mode: ${json.mode}`);
      console.log(`  providerStatus: ${json.providerStatus}`);
      console.log(`  backendStatus: ${json.backendStatus}`);
      console.log(`  gatewayStatus: ${json.gatewayStatus}`);
      return { success: true, data: json };
    } catch (e) {
      console.log(`\n❌ JSON parsing failed: ${e.message}`);
      return { success: false, error: 'JSON parse error' };
    }
    
  } catch (error) {
    console.log(`\n❌ Request failed:`, error);
    console.log(`Error type: ${error.constructor.name}`);
    console.log(`Error message: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    return { success: false, error: error.message };
  }
}

// Test 2: /api/diagnostic
async function testDiagnostic() {
  console.log('\n\n=== TEST 2: GET /api/diagnostic ===\n');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/diagnostic`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    
    const latency = Date.now() - startTime;
    
    console.log(`HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`Latency: ${latency}ms`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    const text = await response.text();
    console.log(`\nRaw Response:\n${text.substring(0, 1000)}`);
    
    try {
      const json = JSON.parse(text);
      console.log(`\nParsed JSON:`);
      console.log(`  provider: ${json.provider}`);
      console.log(`  model: ${json.model}`);
      console.log(`  mode: ${json.mode}`);
      console.log(`  providerStatus: ${json.providerStatus}`);
      console.log(`  backendStatus: ${json.backendStatus}`);
      console.log(`  gatewayStatus: ${json.gatewayStatus}`);
      console.log(`  lastCallStatus: ${json.lastCallStatus}`);
      console.log(`  tests.gatewayConnection:`, json.tests?.gatewayConnection);
      return { success: true, data: json };
    } catch (e) {
      console.log(`\n❌ JSON parsing failed: ${e.message}`);
      console.log(`Error type: ${e.constructor.name}`);
      console.log(`Error stack: ${e.stack}`);
      return { success: false, error: 'JSON parse error' };
    }
    
  } catch (error) {
    console.log(`\n❌ Request failed:`, error);
    console.log(`Error type: ${error.constructor.name}`);
    console.log(`Error message: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    return { success: false, error: error.message };
  }
}

// Test 3: /api/ai/chat
async function testChat() {
  console.log('\n\n=== TEST 3: POST /api/ai/chat ===\n');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Reply with exactly: DIAGNOSTIC_TEST_OK' }
        ],
        options: {
          temperature: 0.7,
          maxTokens: 50,
          jsonMode: false
        }
      }),
      signal: AbortSignal.timeout(30000),
    });
    
    const latency = Date.now() - startTime;
    
    console.log(`HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`Latency: ${latency}ms`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    const text = await response.text();
    console.log(`\nRaw Response:\n${text.substring(0, 1000)}`);
    
    try {
      const json = JSON.parse(text);
      console.log(`\nParsed JSON:`);
      console.log(`  content: ${json.content?.substring(0, 100)}`);
      console.log(`  usage:`, json.usage);
      console.log(`  error:`, json.error);
      return { success: response.ok, data: json };
    } catch (e) {
      console.log(`\n❌ JSON parsing failed: ${e.message}`);
      return { success: false, error: 'JSON parse error' };
    }
    
  } catch (error) {
    console.log(`\n❌ Request failed:`, error);
    console.log(`Error type: ${error.constructor.name}`);
    console.log(`Error message: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    return { success: false, error: error.message };
  }
}

// Main diagnostic
async function runDiagnostic() {
  const healthResult = await testHealth();
  const diagnosticResult = await testDiagnostic();
  const chatResult = await testChat();
  
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   DIAGNOSTIC SUMMARY                                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('## /api/health');
  console.log(`Status: ${healthResult.success ? 'PASS' : 'FAIL'}`);
  if (healthResult.data) {
    console.log(`Provider: ${healthResult.data.provider}`);
    console.log(`Model: ${healthResult.data.model}`);
  }
  
  console.log('\n## /api/diagnostic');
  console.log(`Status: ${diagnosticResult.success ? 'PASS' : 'FAIL'}`);
  if (diagnosticResult.data) {
    console.log(`Provider: ${diagnosticResult.data.provider}`);
    console.log(`Model: ${diagnosticResult.data.model}`);
    console.log(`Provider Status: ${diagnosticResult.data.providerStatus}`);
  } else if (diagnosticResult.error) {
    console.log(`Error: ${diagnosticResult.error}`);
  }
  
  console.log('\n## /api/ai/chat');
  console.log(`Status: ${chatResult.success ? 'PASS' : 'FAIL'}`);
  if (chatResult.data) {
    console.log(`Content: ${chatResult.data.content?.substring(0, 50)}`);
    if (chatResult.data.error) {
      console.log(`Error: ${chatResult.data.error}`);
      console.log(`Details: ${chatResult.data.details}`);
    }
  } else if (chatResult.error) {
    console.log(`Error: ${chatResult.error}`);
  }
  
  console.log('\n## ROOT CAUSE ANALYSIS');
  
  if (healthResult.success && !diagnosticResult.success) {
    console.log('\n✅ Backend is reachable (/api/health works)');
    console.log('❌ /api/diagnostic endpoint is failing');
    console.log(`\nLikely cause: ${diagnosticResult.error}`);
  } else if (!healthResult.success) {
    console.log('\n❌ Backend is not reachable');
    console.log(`Error: ${healthResult.error}`);
  } else if (!chatResult.success) {
    console.log('\n✅ Backend is reachable');
    console.log('✅ /api/diagnostic works');
    console.log('❌ /api/ai/chat is failing');
    if (chatResult.data?.error) {
      console.log(`\nProvider error: ${chatResult.data.error}`);
      if (chatResult.data.error.includes('503')) {
        console.log('This is a GEMINI PROVIDER FAILURE (503 Service Unavailable)');
      }
    }
  } else {
    console.log('\n✅ All endpoints working');
  }
}

runDiagnostic().catch(error => {
  console.error('\n❌ Diagnostic failed:', error);
  process.exit(1);
});
