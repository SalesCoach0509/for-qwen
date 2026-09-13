# AI Gateway Testing Guide

## Quick Start Testing

This guide helps you test the new AI Gateway architecture with different providers.

## Prerequisites

1. Backend dependencies installed: `cd backend && npm install`
3. At least one API key from a supported provider

## Test 1: Verify Backend Starts

```bash
cd backend
npm start
```

**Expected output:**
```
============================================================
🚀 PERFORMANCE COACH BACKEND STARTING
============================================================
✅ AI Gateway initialized successfully
   Provider: gemini
   Model: gemini-2.5-flash
   Capabilities: textGeneration, structuredOutput, conversation, ...
============================================================
```

---

## Test 3: Test Health Endpoint

```bash
curl http://localhost:3001/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "capabilities": [
    "textGeneration",
    "structuredOutput",
    "conversation",
    "streaming",
    "vision"
  ],
  "maxContext": 100000,
  "mode": "live",
  "apiKeySet": true,
  "timestamp": "2026-01-XXT..."
}
```

---

## Test 4: Test Chat Endpoint

```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say hello in JSON format"}
    ],
    "options": {
      "jsonMode": true
    }
  }'
```

**Expected response:**
```json
{
  "content": "{\"message\": \"Hello!\"}",
  "usage": {
    "promptTokens": 10,
    "completionTokens": 5,
    "totalTokens": 15
  }
}
```

---

## Test 5: Test with Different Providers

### Test 5a: Google Gemini

Update `.env`:
```bash
LLM_PROVIDER=gemini
LLM_API_KEY=your-gemini-key
LLM_MODEL=gemini-2.5-flash
```

Restart backend and test:
```bash
curl http://localhost:3001/api/health
```

### Test 5b: OpenAI

Update `.env`:
```bash
LLM_PROVIDER=openai
LLM_API_KEY=your-openai-key
LLM_MODEL=gpt-4o
```

Restart backend and test:
```bash
curl http://localhost:3001/api/health
```

### Test 5c: NVIDIA NIM (DeepSeek)

Update `.env`:
```bash
LLM_PROVIDER=nvidia-nim
LLM_API_KEY=your-nvidia-key
LLM_MODEL=deepseek-v4-pro
```

Restart backend and test:
```bash
curl http://localhost:3001/api/health
```

### Test 5d: NVIDIA NIM (Llama)

Update `.env`:
```bash
LLM_PROVIDER=nvidia-nim
LLM_API_KEY=your-nvidia-key
LLM_MODEL=meta/llama-3.1-405b-instruct
```

Restart backend and test:
```bash
curl http://localhost:3001/api/health
```

### Test 5e: Qwen

Update `.env`:
```bash
LLM_PROVIDER=qwen
LLM_API_KEY=your-qwen-key
LLM_MODEL=qwen-turbo
```

Restart backend and test:
```bash
curl http://localhost:3001/api/health
```

---

## Test 6: Test Capability Validation

### Test 6a: Request Unsupported Capability

Try to use a model that doesn't support vision:

Update `.env`:
```bash
LLM_PROVIDER=nvidia-nim
LLM_API_KEY=your-nvidia-key
LLM_MODEL=deepseek-v4-pro
```

The model doesn't support vision, so if you try to use vision capabilities, you should get an error.

### Test 6b: Verify Capability Error

The gateway should return:
```json
{
  "error": "MODEL_CAPABILITY_UNSUPPORTED",
  "message": "Model deepseek-v4-pro does not support required capabilities: vision",
  "missingCapabilities": ["vision"]
}
```

---

## Test 7: Test All Endpoints

### Test 7a: Preparation Brief

```bash
curl -X POST http://localhost:3001/api/ai/prepare \
  -H "Content-Type: application/json" \
  -d '{
    "interaction": {
      "name": "Test Meeting",
      "customer": "Test Corp",
      "role": "Sales Rep",
      "dateTime": "2026-01-XX",
      "objective": "Test objective",
      "agenda": "Test agenda",
      "notes": "Test notes"
    }
  }'
```

### Test 7b: Practice Evaluation

```bash
curl -X POST http://localhost:3001/api/ai/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "turns": [
      {"role": "ai", "content": "Your price is too high"},
      {"role": "user", "content": "I understand. Can you help me understand what specifically makes the price difficult to justify?"}
    ],
    "config": {
      "stakeholderRole": "CFO"
    }
  }'
```

### Test 7d: Roleplay Response

```bash
curl -X POST http://localhost:3001/api/ai/roleplay/respond \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "Hello, I am here to discuss our partnership",
    "config": {
      "stakeholderRole": "CFO",
      "personality": "Analytical and detail-oriented",
      "pressureLevel": "medium"
    },
    "conversationHistory": [],
    "sessionId": "test-session-123"
  }'
```

---

## Test 9: Run Validation Suite

```bash
npm run validate
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║   AI PERFORMANCE COACH - VALIDATION HARNESS            ║
╚═══════════════════════════════════════════════════════════╝

🔍 Checking backend availability...
✅ Backend available: gemini gemini-2.5-flash
✅ Live mode enabled

=== GATE 1: LLM VERIFICATION ===
Provider: gemini
Model: gemini-2.5-flash
Live Mode: true
...

=== GATE 2: PREPARATION QUALITY ===
...

=== GATE 3: OBJECTION HANDLING BENCHMARK ===
...

=== GATE 4: EVIDENCE TRACEABILITY ===
...

=== GATE 5: ADVERSARIAL TESTING ===
...

╔═══════════════════════════════════════════════════════════╗
║   VALIDATION SUMMARY                                    ║
╚═══════════════════════════════════════════════════════════╝

GATE 1 - LLM Verification: LIVE MODE
GATE 2 - Preparation Quality: X/10 PASSED
GATE 3 - Benchmark: X/10 PASSED
GATE 4 - Traceability: PASSED
GATE 5 - Adversarial: X/5 PASSED
```

---

## Test 10: Test Frontend Integration

1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
4. Open http://localhost:5173
5. **Verify:**
   - UI shows "AI: Gemini" (or your provider)
   - Can create interaction
5. **Generate brief**
   - Can view brief
7. **Start roleplay**
   - Can practice roleplay
   - Stakeholder responds appropriately
10. **Complete practice**
    - Can view results
12. **Check capability history**

---

## Test 11: Test Error Handling

### Test 11a: Missing API Key

Update `.env`:
```bash
LLM_PROVIDER=gemini
LLM_API_KEY=
LLM_MODEL=gemini-2.5-flash
```

Restart backend:
```bash
cd backend
npm start
```

**Expected output:**
```
❌ CRITICAL ERROR: LLM_API_KEY environment variable is not set!
```

Backend should exit with error.

### Test 11b: Invalid API Key

Update `.env`:
```bash
LLM_PROVIDER=gemini
LLM_API_KEY=invalid-key
LLM_MODEL=gemini-2.5-flash
```

Restart backend and try to chat:
```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

**Expected response:**
```json
{
  "error": "LIVE_AI_ERROR",
  "message": "Failed to generate response with Gemini",
  "details": "..."
}
```

---

## Test 12: Test Diagnostic Endpoint

```bash
curl http://localhost:3001/api/diagnostic
```

**Expected response:**
```json
{
  "timestamp": "2026-01-XXT...",
  "environment": {
    "NODE_ENV": "development",
    "PORT": "3001",
    "LLM_PROVIDER": "gemini",
    "LLM_MODEL": "gemini-2.5-flash",
    "LLM_API_KEY_set": true,
    "LLM_API_KEY_length": 39
  },
  "gateway": {
    "initialized": true,
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "capabilities": [...],
    "maxContext": 1000000
  },
  "tests": {
    "gatewayConnection": {
      "success": true,
      "response": "OK",
      "usage": {...},
      "timestamp": "2026-01-XXT..."
    }
  }
}
```

---

## Test 13: Test Model Switching

### Test 13a: Switch from Gemini to OpenAI

1. Update `.env`:
   ```bash
   LLM_PROVIDER=openai
   LLM_API_KEY=your-openai-key
   LLM_MODEL=gpt-4o
   ```

3. Restart backend
5. **Verify:**
   - Health endpoint shows OpenAI
   - Chat endpoint works with OpenAI
   - All endpoints work with OpenAI

### Test 13b: Switch from OpenAI to NVIDIA NIM

1. Update `.env`:
   ```bash
   LLM_PROVIDER=nvidia-nim
   LLM_API_KEY=your-nvidia-key
   LLM_MODEL=deepseek-v4-pro
   ```

3. Restart backend
5. **Verify:**
   - Health endpoint shows NVIDIA NIM
   - Chat endpoint works with NVIDIA NIM
   - All endpoints work with NVIDIA NIM

---

## Test 14: Test Capability Registry

### Test 14a: Verify Model in Registry

Check `backend/ai-gateway/model-capabilities.js`:

```javascript
export const MODEL_CAPABILITY_REGISTRY = {
  'gemini-2.5-flash': {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
      ModelCapabilities.VISION,
    ],
    maxContext: 1000000,
  },
  // ... other models
};
```

### Test 14b: Verify Capability Check

```javascript
import { checkModelCapabilities, ModelCapabilities } from './backend/ai-gateway/model-capabilities.js';

const result = checkModelCapabilities('gemini-2.5-flash', [
  ModelCapabilities.TEXT_GENERATION,
  ModelCapabilities.STRUCTURED_OUTPUT,
]);

console.log(result);
// {
//   supported: true,
//   modelInfo: {...}
// }
```

---

## Test 15: Test Provider Adapters

### Test 15a: Verify Adapter Creation

```javascript
import { createProviderAdapter } from './backend/ai-gateway/provider-adapters.js';

const adapter = createProviderAdapter({
  provider: 'gemini',
  apiKey: 'your-key',
  model: 'gemini-2.5-flash'
});

console.log(adapter.getName());
// 'gemini'

console.log(adapter.isConfigured());
// true
```

### Test 15b: Test Adapter Generation

```javascript
const result = await adapter.generate([
  { role: 'user', content: 'Say hello' }
], {
  temperature: 0.7,
  maxTokens: 100
});

console.log(result);
// {
//   content: 'Hello!',
//   usage: {...}
// }
```

---

## Troubleshooting

### Issue: Backend won't start

**Check:**
- Environment variables are set correctly
- API key is valid
- Model is in capability registry

### Issue: API calls fail

**Check:**
- API key is valid and not expired
- Model name is correct
- Base URL is correct (if using custom URL)
- Network connectivity

### Issue: Capability errors

**Check:**
- Model supports required capabilities
- Model is in capability registry
- Capability names are correct

### Issue: Validation suite fails

**Check:**
- Backend is running
- API key is valid
- Model supports required capabilities
- All endpoints are working

---

## Success Criteria

✅ Backend starts successfully
✅ Health endpoint returns correct provider/model info
✅ Chat endpoint works with configured provider
✅ All endpoints work (prepare, evaluate, analyze, roleplay)
✅ Validation suite passes
✅ Frontend integrates correctly
✅ Can switch between providers without code changes
✅ Capability validation works correctly
✅ Error handling works correctly
✅ Diagnostic endpoint provides useful information

---

## Next Steps

After testing:

1. ✅ Document any provider-specific quirks
2. ✅ Add any missing models to capability registry
3. ✅ Fix any bugs discovered during testing
4. ✅ Update documentation with test results
5. ✅ Prepare for production deployment

---

**Testing Date**: 2026-01-XX
**Status**: Ready for testing
**Next Action**: Run through all tests and document results
