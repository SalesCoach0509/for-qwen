import fs from 'node:fs';
import { simulateStakeholder, validateRoleplayRequest } from './roleplay-contract.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeGatewayFromEnv, getAIGateway } from './ai-gateway/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contracts=JSON.parse(fs.readFileSync(new URL('../shared/operation-contracts.json',import.meta.url),'utf8'));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for now
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Initialize AI Gateway
let aiGateway;
let gatewayInitializationError = null;
try {
  aiGateway = initializeGatewayFromEnv();
  const info = aiGateway.getInfo();
  console.log('✅ AI Gateway initialized successfully');
  console.log(`   Provider: ${info.provider}`);
  console.log(`   Model: ${info.model}`);
  console.log(`   Capabilities: ${info.capabilities.join(', ')}`);
} catch (error) {
  gatewayInitializationError = 'Provider configuration is incomplete or invalid.';
  console.error('AI operation failed; see sanitized API status.');
  console.error('');
  console.error('Required environment variables:');
  console.error('  - LLM_PROVIDER (gemini, openai, nvidia-nim, qwen, deepseek)');
  console.error('  - LLM_API_KEY (your API key)');
  console.error('  - LLM_MODEL (model ID from capability registry)');
  console.error('');
  console.error('Example for Gemini:');
  console.error('  LLM_PROVIDER=gemini');
  console.error('  LLM_API_KEY=your-gemini-key');
  console.error('  LLM_MODEL=gemini-3.6-flash');
  console.error('');
  console.error('Example for NVIDIA NIM:');
  console.error('  LLM_PROVIDER=nvidia-nim');
  console.error('  LLM_API_KEY=your-nvidia-key');
  console.error('  LLM_MODEL=deepseek-v4-pro');
  aiGateway = getAIGateway();
}

// Health check
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check endpoint called');
  const gatewayInfo = aiGateway.getInfo();
  console.log('🔍 Gateway info:', gatewayInfo);
  res.json({ 
    release: 'performance-v1-consolidated-20261007',
    status: gatewayInfo.initialized ? 'ok' : 'degraded', 
    provider: gatewayInfo.provider,
    model: gatewayInfo.model,
    capabilities: gatewayInfo.capabilities,
    maxContext: gatewayInfo.maxContext,
    mode: 'live',
    apiKeySet: gatewayInfo.initialized,
    initializationError: gatewayInitializationError || undefined,
    timestamp: new Date().toISOString()
  });
});

// Track provider status globally
let lastProviderStatus = 'UNKNOWN';
let lastProviderCallStatus = null;
let lastProviderCallTimestamp = null;

const diagnosticTimeoutMs = Number.parseInt(process.env.LLM_DIAGNOSTIC_TIMEOUT_MS || '120000', 10);
const structuredRepairTimeoutMs = Number.parseInt(process.env.LLM_STRUCTURED_REPAIR_TIMEOUT_MS || '30000', 10);

function recordProviderSuccess() {
  lastProviderStatus = 'READY';
  lastProviderCallStatus = 'SUCCESS';
  lastProviderCallTimestamp = new Date().toISOString();
}

function recordProviderFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  lastProviderStatus = /\b(?:429|500|502|503|504)\b|timeout|temporarily.unavailable|high demand/i.test(message)
    ? 'TEMPORARILY_UNAVAILABLE'
    : 'ERROR';
  lastProviderCallStatus = lastProviderStatus === 'TEMPORARILY_UNAVAILABLE' ? 'UNAVAILABLE' : 'ERROR';
  lastProviderCallTimestamp = new Date().toISOString();
  return lastProviderStatus==='TEMPORARILY_UNAVAILABLE'?'Provider temporarily unavailable. Retry later.':'Provider request failed. Check server configuration.';
}

function withTimeout(operation, timeoutMs, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`${label} timed out after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([operation, timeout]).finally(() => clearTimeout(timeoutId));
}

// Live LLM test endpoint - tests actual provider connection
app.post('/api/diagnostic/llm-test', async (req, res) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();
  
  try {
    // Send a minimal test request through the gateway
    const testResult = await withTimeout(
      aiGateway.generate([{ role: 'user', content: 'Say "OK"' }], { maxTokens: 10, jsonMode: false }),
      diagnosticTimeoutMs,
      'LLM diagnostic'
    );
    
    const latency = Date.now() - startTime;
    
    recordProviderSuccess();
    res.json({
      success: true,
      provider: aiGateway.getInfo().provider,
      model: aiGateway.getInfo().model,
      requestId: requestId,
      latency: latency,
      structuredOutput: false,
      responsePreview: testResult.content?.substring(0, 50) || '',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = recordProviderFailure(error);
    res.status(error.name === 'TimeoutError' ? 504 : 503).json({
      success: false,
      provider: aiGateway.getInfo().provider,
      model: aiGateway.getInfo().model,
      requestId: requestId,
      latency: latency,
      structuredOutput: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/diagnostic', (req, res) => {
  const gatewayInfo = aiGateway.getInfo();
  
  // Determine provider status
  let providerStatus = 'NOT_CONFIGURED';
  if (gatewayInfo.initialized) {
    providerStatus = lastProviderStatus;
  }
  
  const diagnostic = {
    timestamp: new Date().toISOString(),
    // Top-level fields for frontend compatibility
    mode: 'live',
    provider: gatewayInfo.provider,
    model: gatewayInfo.model,
    backendStatus: 'connected',
    gatewayStatus: gatewayInfo.initialized ? 'ready' : 'error',
    providerStatus: providerStatus,
    capabilities: gatewayInfo.capabilities,
    maxContext: gatewayInfo.maxContext,
    lastCallStatus: lastProviderCallStatus,
    lastCallTimestamp: lastProviderCallTimestamp,
    // Nested structure for detailed diagnostics
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      LLM_PROVIDER: process.env.LLM_PROVIDER || 'gemini',
      LLM_MODEL: process.env.LLM_MODEL || process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      LLM_API_KEY_set: !!(process.env.LLM_API_KEY || process.env.GEMINI_API_KEY),
    },
    gateway: {
      initialized: gatewayInfo.initialized,
      provider: gatewayInfo.provider,
      model: gatewayInfo.model,
      capabilities: gatewayInfo.capabilities,
      maxContext: gatewayInfo.maxContext,
    },
    tests: {
      gatewayConnection: {
        success: lastProviderStatus === 'READY',
        checkedAt: lastProviderCallTimestamp,
        note: 'Use POST /api/diagnostic/llm-test for a live provider probe.'
      }
    }
  };

  res.json(diagnostic);
});

function parseJsonObject(text) {
  const normalized = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(normalized);
  } catch {
    // Some providers prepend a sentence before otherwise valid JSON. Extract the
    // first complete JSON object or array while respecting quoted strings.
    const start = normalized.search(/[\[{]/);
    if (start === -1) return null;

    const opening = normalized[start];
    const closing = opening === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < normalized.length; index += 1) {
      const character = normalized[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') inString = true;
      else if (character === opening) depth += 1;
      else if (character === closing) {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(normalized.slice(start, index + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

function hasRequiredStructuredFields(value, requiredFields) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && requiredFields.every(field => Object.prototype.hasOwnProperty.call(value, field));
}

async function ensureStructuredJson(messages, result, maxTokens, requiredFields) {
  const parsed = parseJsonObject(result.content);
  if (parsed !== null && hasRequiredStructuredFields(parsed, requiredFields)) {
    return { content: JSON.stringify(parsed), usage: result.usage };
  }

  // One explicit repair attempt handles providers that ignore JSON mode or add
  // prose. It remains a live model call—there is no mocked fallback.
  const repairResult = await withTimeout(aiGateway.generate([
    ...messages,
    { role: 'assistant', content: result.content },
    { role: 'user', content: `Your previous answer was invalid or incomplete. Return the complete corrected answer as JSON only, with no prose, markdown, or code fences. Required top-level fields: ${requiredFields.join(', ') || 'the requested schema'}.` },
  ], {
    temperature: 0,
    maxTokens,
    jsonMode: true,
  }), structuredRepairTimeoutMs, 'Structured-output repair');
  const repaired = parseJsonObject(repairResult.content);
  if (repaired === null || !hasRequiredStructuredFields(repaired, requiredFields)) {
    const error = new Error(`The LLM returned invalid or incomplete structured output after one repair attempt. Required fields: ${requiredFields.join(', ') || 'requested schema'}.`);
    error.name = 'InvalidStructuredOutputError';
    throw error;
  }
  return { content: JSON.stringify(repaired), usage: repairResult.usage };
}

// Generic chat endpoint for frontend proxy
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, options } = req.body;
    
    console.log('📥 Received chat request with', messages?.length || 0, 'messages');
    
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 80 || messages.some(m => !m || !['system','user','assistant'].includes(m.role) || typeof m.content !== 'string' || m.content.length > 300000) || (options && (typeof options !== 'object' || (options.maxTokens != null && (!Number.isInteger(options.maxTokens) || options.maxTokens < 1 || options.maxTokens > 12000))))) {
      console.error('❌ Invalid messages format');
      return res.status(400).json({ 
        error: 'LIVE_AI_ERROR',
        message: 'Invalid messages format',
        details: 'Messages must be an array'
      });
    }

    if (options?.temperature != null && (typeof options.temperature!=='number'||!Number.isFinite(options.temperature)||options.temperature<0||options.temperature>2)) return res.status(400).json({error:'INVALID_OPTIONS'});
    const contract=Object.prototype.hasOwnProperty.call(contracts,options?.operation)?contracts[options.operation]:null;
    if(!contract||options?.jsonMode!==true)return res.status(400).json({error:'INVALID_OPERATION',message:'A documented semantic operation and JSON mode are required.'});
    if(contract.input.length){let input;try{input=JSON.parse(messages[messages.length-1].content);}catch{return res.status(400).json({error:'INVALID_INPUT'});}
      if(!input||typeof input!=='object'||contract.input.some(k=>!(k in input)))return res.status(400).json({error:'INVALID_INPUT'});}
    console.log('Calling AI Gateway');
    const jsonMode = options?.jsonMode ?? false;
    const maxTokens = options?.maxTokens ?? (jsonMode ? 4096 : 2000);
    let result = await aiGateway.generate(messages, {
      temperature: options?.temperature ?? 0.7,
      maxTokens,
      jsonMode,
    });

    if (jsonMode) {
      result = await ensureStructuredJson(messages, result, maxTokens, Object.keys(contract.required));
      const parsed=JSON.parse(result.content);
      for(const [key,type] of Object.entries(contract.required)){
        const v=parsed[key];
        if(type==='array'?!Array.isArray(v):type==='object'?(!v||typeof v!=='object'||Array.isArray(v)):typeof v!==type){const e=new Error('Invalid operation schema');e.name='InvalidStructuredOutputError';throw e;}
      }
    }

    // Track successful provider call
    lastProviderStatus = 'READY';
    lastProviderCallStatus = 'SUCCESS';
    lastProviderCallTimestamp = new Date().toISOString();

    // Check for capability error
    if (result.error === 'MODEL_CAPABILITY_UNSUPPORTED') {
      return res.status(400).json({
        error: 'MODEL_CAPABILITY_UNSUPPORTED',
        message: result.message,
        missingCapabilities: result.missingCapabilities,
      });
    }
    
    console.log('✅ AI Gateway response received, length:', result.content.length);
    
    res.json({
      content: result.content,
      usage: result.usage,
    });
  } catch (error) {
    console.error('AI operation failed; see sanitized API status.');
    console.error('AI operation failed; see sanitized API status.');
    console.error('AI operation failed; see sanitized API status.');
    
    // Track provider failure
    const errorMessage = error.message || '';
    if (errorMessage.includes('503') || errorMessage.includes('TEMPORARILY_UNAVAILABLE')) {
      lastProviderStatus = 'TEMPORARILY_UNAVAILABLE';
      lastProviderCallStatus = '503';
    } else if (errorMessage.includes('429')) {
      lastProviderStatus = 'TEMPORARILY_UNAVAILABLE';
      lastProviderCallStatus = '429';
    } else {
      lastProviderStatus = 'ERROR';
      lastProviderCallStatus = 'ERROR';
    }
    lastProviderCallTimestamp = new Date().toISOString();
    
    // Ensure error is properly serialized
    const errorResponse = {
      error: 'LIVE_AI_ERROR',
      message: 'The live AI operation failed. Retry or check provider configuration.',
      details: 'No synthetic result was generated.',
      name: error.name || 'Error',
      stack: undefined
    };
    
    console.error('AI operation failed; see sanitized API status.');
    
    res.status(error.name === 'InvalidStructuredOutputError' ? 502 : 500).json(errorResponse);
  }
});

// Retired monolithic endpoints cannot bypass evidence-first operations.
for(const endpoint of ['prepare','evaluate','analyze'])app.post('/api/ai/'+endpoint,(req,res)=>res.status(410).json({error:'OPERATION_REPLACED',message:'Use the documented specialized chat operations.'}));

app.post('/api/ai/roleplay/respond', async (req,res) => {
  try { validateRoleplayRequest(req.body); } catch (error) { return res.status(400).json({error:'INVALID_REQUEST',message:error.message}); }
  try { const result=await simulateStakeholder(aiGateway,req.body); recordProviderSuccess(); res.json(result); }
  catch (error) { recordProviderFailure(error); res.status(503).json({error:'LIVE_AI_ERROR',message:'Practice could not be completed. No performance assessment was generated. Retry when the provider is available.'}); }
});

// Serve static files in production
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  console.log('🔍 Serving static files from:', distPath);
  app.use(express.static(distPath));
  
  app.use('/api', (req,res) => res.status(404).json({error:'NOT_FOUND',message:'Unknown API route'}));
  app.get('*', (req, res) => {
    if (path.extname(req.path) || req.path.startsWith('/assets/') || !req.accepts('html') || !/^\/(?:$|dashboard\/?$|create\/?$|validation\/?$|capabilities\/?$|performance(?:\/[^.]*)?$)/.test(req.path)) return res.status(404).send('Not found');
    console.log('🔍 Serving index.html for route:', req.path);
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('⚠️ Not in production mode, not serving static files');
}

app.use((error,req,res,next)=>{if(res.headersSent)return next(error);res.status(error.type==='entity.parse.failed'?400:error.type==='entity.too.large'?413:500).json({error:'REQUEST_FAILED',message:'The request could not be processed.'});});
app.listen(PORT, '0.0.0.0', () => {
  const info = aiGateway.getInfo();
  console.log('='.repeat(60));
  console.log('🚀 PERFORMANCE COACH BACKEND STARTING');
  console.log('='.repeat(60));
  console.log(`📡 Provider: ${info.provider}`);
  console.log(`🤖 Model: ${info.model}`);
  console.log(`🎯 Capabilities: ${(info.capabilities || []).join(', ') || 'unavailable'}`);
  console.log(`📏 Max Context: ${info.maxContext ? info.maxContext.toLocaleString() : 'unavailable'} tokens`);
  console.log(`🔑 Provider initialized: ${info.initialized ? 'YES' : 'NO'}`);
  console.log(`🔒 Mode: LIVE AI (API key secured server-side)`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log('='.repeat(60));
  console.log('✅ Backend ready to accept requests');
  console.log('='.repeat(60));
});
