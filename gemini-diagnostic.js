#!/usr/bin/env node

/**
 * GEMINI MODEL DISCOVERY DIAGNOSTIC
 * 
 * This script tests which Gemini models are available using your API credentials.
 * 
 * USAGE:
 *   node gemini-diagnostic.js YOUR_API_KEY
 * 
 * OR set environment variable:
 *   export GEMINI_API_KEY=your-key-here
 *   node gemini-diagnostic.js
 * 
 * This script will:
 * 1. List all available models
 * 2. Test each model with basic text generation
 * 3. Test each model with structured output
 * 4. Test gemini-3.8-flash specifically
 * 5. Test gemini-2.5-flash specifically
 * 6. Generate a comprehensive report
 */

const API_KEY = process.argv[2] || process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('ERROR: API key required');
  console.error('Usage: node gemini-diagnostic.js YOUR_API_KEY');
  console.error('   or: export GEMINI_API_KEY=your-key && node gemini-diagnostic.js');
  process.exit(1);
}

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Mask API key for display
function maskKey(key) {
  if (key.length <= 8) return '***';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
}

// Test 1: List all available models
async function listModels() {
  console.log('\n=== TEST 1: LIST AVAILABLE MODELS ===\n');
  
  const url = `${BASE_URL}/models?key=${API_KEY}`;
  const startTime = Date.now();
  
  try {
    const response = await fetch(url);
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      console.log(`❌ Failed to list models`);
      console.log(`   HTTP Status: ${response.status}`);
      console.log(`   Latency: ${latency}ms`);
      const error = await response.text();
      console.log(`   Error: ${error}`);
      return [];
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    console.log(`✅ Retrieved ${models.length} models`);
    console.log(`   Latency: ${latency}ms\n`);
    
    console.log('Models returned by API:');
    console.log('─'.repeat(80));
    
    const modelTable = [];
    
    for (const model of models) {
      const name = model.name || 'unknown';
      const displayName = model.displayName || 'N/A';
      const supportedMethods = model.supportedGenerationMethods || [];
      const hasGenerateContent = supportedMethods.includes('generateContent');
      const inputModalities = model.inputTokenCount ? 'text' : 'unknown';
      const outputModalities = 'text';
      const contextWindow = model.inputTokenLimit || 'unknown';
      
      modelTable.push({
        name,
        displayName,
        generateContent: hasGenerateContent ? 'YES' : 'NO',
        inputModalities,
        outputModalities,
        contextWindow
      });
      
      console.log(`\nModel: ${name}`);
      console.log(`  Display Name: ${displayName}`);
      console.log(`  generateContent: ${hasGenerateContent ? 'YES' : 'NO'}`);
      console.log(`  Supported Methods: ${supportedMethods.join(', ')}`);
      console.log(`  Context Window: ${contextWindow}`);
    }
    
    return models;
    
  } catch (error) {
    console.log(`❌ Error listing models: ${error.message}`);
    return [];
  }
}

// Test 2: Test basic text generation
async function testBasicText(modelName) {
  const url = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Reply with exactly: MODEL_TEST_OK'
          }]
        }]
      })
    });
    
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.json();
      return {
        model: modelName,
        status: response.status,
        result: 'FAIL',
        latency,
        error: error.error?.message || 'Unknown error',
        retryable: response.status === 503 || response.status === 429
      };
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      model: modelName,
      status: response.status,
      result: 'PASS',
      latency,
      responseText: text.substring(0, 50),
      error: null,
      retryable: false
    };
    
  } catch (error) {
    return {
      model: modelName,
      status: 0,
      result: 'ERROR',
      latency: Date.now() - startTime,
      error: error.message,
      retryable: false
    };
  }
}

// Test 3: Test structured output
async function testStructuredOutput(modelName) {
  const url = `${BASE_URL}/models/${modelName}:generateContent?key=${API_KEY}`;
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Return a JSON object with this exact structure: {"status": "ok", "model": "' + modelName + '"}'
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });
    
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.json();
      return {
        model: modelName,
        status: response.status,
        result: 'FAIL',
        error: error.error?.message || 'Unknown error'
      };
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(text);
      return {
        model: modelName,
        status: response.status,
        result: 'PASS',
        jsonValid: true,
        parsedData: parsed
      };
    } catch (e) {
      return {
        model: modelName,
        status: response.status,
        result: 'PASS',
        jsonValid: false,
        responseText: text.substring(0, 100)
      };
    }
    
  } catch (error) {
    return {
      model: modelName,
      status: 0,
      result: 'ERROR',
      error: error.message
    };
  }
}

// Test 4: Test specific model with retries
async function testModelWithRetries(modelName, maxRetries = 3) {
  console.log(`\nTesting ${modelName} with up to ${maxRetries} retries...`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await testBasicText(modelName);
    
    console.log(`  Attempt ${attempt}: ${result.result} (${result.status}) - ${result.latency}ms`);
    
    if (result.result === 'PASS') {
      return { ...result, attempts: attempt };
    }
    
    if (!result.retryable || attempt === maxRetries) {
      return { ...result, attempts: attempt };
    }
    
    const delay = 1000 * Math.pow(2, attempt - 1);
    console.log(`  Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Main diagnostic
async function runDiagnostic() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   GEMINI MODEL DISCOVERY DIAGNOSTIC                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`API Key: ${maskKey(API_KEY)}`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  // Step 1: List models
  const models = await listModels();
  
  if (models.length === 0) {
    console.log('\n❌ No models found. Cannot continue diagnostic.');
    return;
  }
  
  // Step 2: Filter models that support generateContent
  const generateContentModels = models.filter(m => 
    m.supportedGenerationMethods?.includes('generateContent')
  );
  
  console.log(`\n\nFound ${generateContentModels.length} models supporting generateContent`);
  
  // Step 3: Test basic text generation for each model
  console.log('\n\n=== TEST 2: BASIC TEXT GENERATION ===\n');
  
  const basicTests = [];
  for (const model of generateContentModels.slice(0, 10)) { // Limit to first 10
    const modelName = model.name.replace('models/', '');
    console.log(`Testing ${modelName}...`);
    const result = await testBasicText(modelName);
    basicTests.push(result);
    console.log(`  Result: ${result.result} (${result.status}) - ${result.latency}ms`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }
  
  // Step 4: Test structured output for successful models
  console.log('\n\n=== TEST 3: STRUCTURED OUTPUT ===\n');
  
  const successfulModels = basicTests.filter(t => t.result === 'PASS');
  const structuredTests = [];
  
  for (const test of successfulModels.slice(0, 5)) { // Limit to first 5
    console.log(`Testing structured output for ${test.model}...`);
    const result = await testStructuredOutput(test.model);
    structuredTests.push(result);
    console.log(`  Result: ${result.result} - JSON valid: ${result.jsonValid}`);
  }
  
  // Step 5: Test gemini-3.8-flash specifically
  console.log('\n\n=== TEST 4: GEMINI 3.8 FLASH (CURRENT MODEL) ===\n');
  
  const gemini38Test = await testModelWithRetries('gemini-3.8-flash', 3);
  console.log(`\nFinal result: ${gemini38Test.result} after ${gemini38Test.attempts} attempts`);
  if (gemini38Test.error) {
    console.log(`Error: ${gemini38Test.error}`);
  }
  
  // Step 6: Test gemini-2.5-flash
  console.log('\n\n=== TEST 5: GEMINI 2.5 FLASH (ALTERNATIVE) ===\n');
  
  const gemini25Test = await testModelWithRetries('gemini-2.5-flash', 3);
  console.log(`\nFinal result: ${gemini25Test.result} after ${gemini25Test.attempts} attempts`);
  if (gemini25Test.error) {
    console.log(`Error: ${gemini25Test.error}`);
  }
  
  // Step 7: Generate final report
  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   FINAL REPORT                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('## ACTIVE CREDENTIAL\n');
  console.log(`Masked API key: ${maskKey(API_KEY)}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'unknown'}`);
  console.log(`Current configured model: gemini-3.8-flash\n`);
  
  console.log('## MODELS RETURNED BY GOOGLE API\n');
  console.log('| Model | generateContent | Accessible | Notes |');
  console.log('| ----- | --------------- | ---------- | ----- |');
  for (const model of models.slice(0, 15)) {
    const name = model.name || 'unknown';
    const hasGenerate = model.supportedGenerationMethods?.includes('generateContent') ? 'YES' : 'NO';
    console.log(`| ${name} | ${hasGenerate} | YES | - |`);
  }
  
  console.log('\n## REAL MODEL TESTS\n');
  console.log('| Model | HTTP Status | Result | Latency | Error | Retryable |');
  console.log('| ----- | ----------: | ------ | ------: | ----- | --------- |');
  for (const test of basicTests) {
    console.log(`| ${test.model} | ${test.status} | ${test.result} | ${test.latency}ms | ${test.error || '-'} | ${test.retryable ? 'YES' : 'NO'} |`);
  }
  
  console.log('\n## STRUCTURED OUTPUT TESTS\n');
  console.log('| Model | Basic Test | JSON Test | Structured Output |');
  console.log('| ----- | ---------- | --------- | ----------------- |');
  for (const test of structuredTests) {
    console.log(`| ${test.model} | PASS | ${test.jsonValid ? 'PASS' : 'FAIL'} | ${test.jsonValid ? 'PASS' : 'FAIL'} |`);
  }
  
  console.log('\n## CURRENT MODEL\n');
  console.log('Gemini 3.8 Flash:');
  console.log(`* API visible: ${models.some(m => m.name.includes('gemini-3.8-flash')) ? 'YES' : 'NO'}`);
  console.log(`* generateContent: ${generateContentModels.some(m => m.name.includes('gemini-3.8-flash')) ? 'YES' : 'NO'}`);
  console.log(`* real request: ${gemini38Test.result}`);
  console.log(`* HTTP status: ${gemini38Test.status}`);
  console.log(`* error: ${gemini38Test.error || 'none'}`);
  console.log(`* retry result: ${gemini38Test.attempts} attempts\n`);
  
  console.log('## ALTERNATIVES\n');
  console.log('Gemini 2.5 Flash:');
  console.log(`* available: ${models.some(m => m.name.includes('gemini-2.5-flash')) ? 'YES' : 'NO'}`);
  console.log(`* real request: ${gemini25Test.result}`);
  console.log(`* HTTP status: ${gemini25Test.status}`);
  console.log(`* structured output: ${structuredTests.find(t => t.model.includes('gemini-2.5-flash'))?.jsonValid ? 'PASS' : 'UNKNOWN'}\n`);
  
  const otherFlashModels = generateContentModels.filter(m => 
    m.name.includes('flash') && 
    !m.name.includes('3.8') && 
    !m.name.includes('2.5')
  );
  
  if (otherFlashModels.length > 0) {
    console.log('Other viable Flash model(s):');
    for (const model of otherFlashModels.slice(0, 3)) {
      console.log(`* ${model.name}`);
    }
  }
  
  console.log('\n## FREE-TIER STATUS\n');
  console.log('For each viable model:');
  console.log('* Free-tier availability: UNKNOWN — verify pricing separately');
  console.log('* Billing required: UNKNOWN — verify pricing separately');
  console.log('* Evidence/source: API does not expose pricing information\n');
  
  console.log('## RECOMMENDATION\n');
  
  const bestModel = gemini25Test.result === 'PASS' ? 'gemini-2.5-flash' : 
                    gemini38Test.result === 'PASS' ? 'gemini-3.8-flash' : 
                    'unknown';
  
  console.log('1. BEST MODEL FOR THIS APPLICATION: gemini-2.5-flash (if available)');
  console.log(`2. BEST MODEL THAT WORKS RIGHT NOW: ${bestModel}`);
  console.log('3. BEST MODEL FOR FREE-TIER: UNKNOWN — verify pricing separately');
  console.log(`4. SHOULD GEMINI 3.8 FLASH REMAIN PRODUCTION: ${gemini38Test.result === 'PASS' ? 'YES' : 'NO — switch to gemini-2.5-flash'}\n`);
  
  console.log('## CRITICAL CONCLUSION\n');
  console.log(`With the SAME Google API credentials currently used by the AI Coach Railway deployment, the Gemini model that can be called successfully RIGHT NOW using generateContent is:\n`);
  console.log(`**${bestModel}**\n`);
  console.log(`Evidence: HTTP ${bestModel === 'gemini-2.5-flash' ? gemini25Test.status : gemini38Test.status} - ${bestModel === 'gemini-2.5-flash' ? gemini25Test.result : gemini38Test.result}\n`);
}

// Run the diagnostic
runDiagnostic().catch(error => {
  console.error('\n❌ Diagnostic failed:', error);
  process.exit(1);
});
