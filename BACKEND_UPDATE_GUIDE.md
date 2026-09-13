# Backend Code Update Guide - Gemini 3.8 Flash Support

## 📋 Overview

Your backend code needs to be updated to support the new Gemini models (3.8 Flash and 3.7 Flash) since Gemini 2.5 Flash is no longer available.

## 🔧 File to Update

**File:** `backend/ai-gateway/model-capabilities.js`

## 📝 Changes Required

### Step 1: Find the Gemini Models Section

Locate this section in your `model-capabilities.js` file:

```javascript
// Google Gemini models
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
'gemini-2.0-flash': {
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  capabilities: [
    ModelCapabilities.TEXT_GENERATION,
    ModelCapabilities.STRUCTURED_OUTPUT,
    ModelCapabilities.CONVERSATION,
    ModelCapabilities.STREAMING,
    ModelCapabilities.VISION,
  ],
  maxContext: 1000000,
},
```

### Step 2: Replace with New Models

Replace the above section with:

```javascript
// Google Gemini models (Updated for 2025)
'gemini-3.8-flash': {
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  capabilities: [
    ModelCapabilities.TEXT_GENERATION,
    ModelCapabilities.STRUCTURED_OUTPUT,
    ModelCapabilities.CONVERSATION,
    ModelCapabilities.STREAMING,
    ModelCapabilities.VISION,
  ],
  maxContext: 1000000,
},
'gemini-3.7-flash': {
  provider: 'gemini',
  model: 'gemini-3.7-flash',
  capabilities: [
    ModelCapabilities.TEXT_GENERATION,
    ModelCapabilities.STRUCTURED_OUTPUT,
    ModelCapabilities.CONVERSATION,
    ModelCapabilities.STREAMING,
    ModelCapabilities.VISION,
  ],
  maxContext: 1000000,
},
```

### Step 3: Update Error Messages (Optional but Recommended)

Find this section in `backend/server.js`:

```javascript
console.error('Example for Gemini:');
console.error('  LLM_PROVIDER=gemini');
console.error('  LLM_API_KEY=your-gemini-key');
console.error('  LLM_MODEL=gemini-2.5-flash');
```

Replace with:

```javascript
console.error('Example for Gemini:');
console.error('  LLM_PROVIDER=gemini');
console.error('  LLM_API_KEY=your-gemini-key');
console.error('  LLM_MODEL=gemini-3.8-flash');
```

## 🚀 Deployment Steps

### 1. Make the Changes

Edit `backend/ai-gateway/model-capabilities.js` in your GitHub repository.

### 2. Commit and Push

```bash
git add backend/ai-gateway/model-capabilities.js
git commit -m "Update Gemini models to 3.8 Flash and 3.7 Flash"
git push
```

### 3. Update Railway Variables

In Railway Dashboard → Variables:

```bash
LLM_PROVIDER=gemini
LLM_API_KEY=your-gemini-api-key
LLM_MODEL=gemini-3.8-flash
```

### 4. Wait for Deployment

Railway will automatically redeploy (2-3 minutes).

### 5. Verify

Check Railway logs for:

```
✅ AI Gateway initialized successfully
   Provider: gemini
   Model: gemini-3.8-flash
   Capabilities: textGeneration, structuredOutput, conversation, streaming, vision
```

## 📊 Complete Updated File

Here's the complete updated `backend/ai-gateway/model-capabilities.js` file for reference:

```javascript
/**
 * Model Capability Registry
 * 
 * Defines what capabilities each model supports.
 * Prevents silent degradation when a model doesn't support required features.
 */

export const ModelCapabilities = {
  // Text generation capabilities
  TEXT_GENERATION: 'textGeneration',
  STRUCTURED_OUTPUT: 'structuredOutput',
  CONVERSATION: 'conversation',
  TOOL_CALLING: 'toolCalling',
  STREAMING: 'streaming',
  
  // Multimodal capabilities
  VISION: 'vision',
  AUDIO: 'audio',
  EMBEDDINGS: 'embeddings',
  
  // Specialized capabilities
  TRANSLATION: 'translation',
  CODE_GENERATION: 'codeGeneration',
  REASONING: 'reasoning',
};

/**
 * Model capability declarations
 * Each provider/model combination declares what it supports
 */
export const MODEL_CAPABILITY_REGISTRY = {
  // Google Gemini models (Updated for 2025)
  'gemini-3.8-flash': {
    provider: 'gemini',
    model: 'gemini-3.8-flash',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
      ModelCapabilities.VISION,
    ],
    maxContext: 1000000,
  },
  'gemini-3.7-flash': {
    provider: 'gemini',
    model: 'gemini-3.7-flash',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
      ModelCapabilities.VISION,
    ],
    maxContext: 1000000,
  },
  
  // OpenAI models
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.TOOL_CALLING,
      ModelCapabilities.STREAMING,
      ModelCapabilities.VISION,
    ],
    maxContext: 128000,
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.TOOL_CALLING,
      ModelCapabilities.STREAMING,
      ModelCapabilities.VISION,
    ],
    maxContext: 128000,
  },
  
  // NVIDIA NIM models (OpenAI-compatible)
  'deepseek-v4-pro': {
    provider: 'nvidia-nim',
    model: 'deepseek-v4-pro',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
      ModelCapabilities.REASONING,
    ],
    maxContext: 128000,
  },
  'deepseek-v4-flash': {
    provider: 'nvidia-nim',
    model: 'deepseek-v4-flash',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
      ModelCapabilities.REASONING,
    ],
    maxContext: 128000,
  },
  'meta/llama-3.1-405b-instruct': {
    provider: 'nvidia-nim',
    model: 'meta/llama-3.1-405b-instruct',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 128000,
  },
  'meta/llama-3.1-70b-instruct': {
    provider: 'nvidia-nim',
    model: 'meta/llama-3.1-70b-instruct',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 128000,
  },
  'meta/llama-3.2-11b-vision-instruct': {
    provider: 'nvidia-nim',
    model: 'meta/llama-3.2-11b-vision-instruct',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
      ModelCapabilities.VISION,
    ],
    maxContext: 128000,
  },
  'google/gemma-2-27b-it': {
    provider: 'nvidia-nim',
    model: 'google/gemma-2-27b-it',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 8192,
  },
  'nvidia/nemotron-4-340b-instruct': {
    provider: 'nvidia-nim',
    model: 'nvidia/nemotron-4-340b-instruct',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 8192,
  },
  'mistralai/mixtral-8x22b-instruct-v0.1': {
    provider: 'nvidia-nim',
    model: 'mistralai/mixtral-8x22b-instruct-v0.1',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 65536,
  },
  'qwen/qwen2.5-72b-instruct': {
    provider: 'nvidia-nim',
    model: 'qwen/qwen2.5-72b-instruct',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 32768,
  },
  'moonshotai/kimi-k2-instruct': {
    provider: 'nvidia-nim',
    model: 'moonshotai/kimi-k2-instruct',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 128000,
  },
  'stepfun/step-2-16k': {
    provider: 'nvidia-nim',
    model: 'stepfun/step-2-16k',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 16000,
  },
  
  // Qwen models (direct)
  'qwen-turbo': {
    provider: 'qwen',
    model: 'qwen-turbo',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 8000,
  },
  'qwen-plus': {
    provider: 'qwen',
    model: 'qwen-plus',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 32000,
  },
  
  // DeepSeek models (direct)
  'deepseek-chat': {
    provider: 'deepseek',
    model: 'deepseek-chat',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 64000,
  },
  'deepseek-coder': {
    provider: 'deepseek',
    model: 'deepseek-coder',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
      ModelCapabilities.CODE_GENERATION,
    ],
    maxContext: 64000,
  },
};

/**
 * Check if a model supports required capabilities
 */
export function checkModelCapabilities(modelId, requiredCapabilities) {
  const modelInfo = MODEL_CAPABILITY_REGISTRY[modelId];
  
  if (!modelInfo) {
    return {
      supported: false,
      error: `Model ${modelId} not found in capability registry`,
    };
  }
  
  const missingCapabilities = requiredCapabilities.filter(
    cap => !modelInfo.capabilities.includes(cap)
  );
  
  if (missingCapabilities.length > 0) {
    return {
      supported: false,
      error: `Model ${modelId} does not support required capabilities: ${missingCapabilities.join(', ')}`,
      missingCapabilities,
    };
  }
  
  return {
    supported: true,
    modelInfo,
  };
}

/**
 * Get model info by ID
 */
export function getModelInfo(modelId) {
  return MODEL_CAPABILITY_REGISTRY[modelId] || null;
}

/**
 * List all models for a provider
 */
export function listModelsByProvider(provider) {
  return Object.entries(MODEL_CAPABILITY_REGISTRY)
    .filter(([_, info]) => info.provider === provider)
    .map(([id, info]) => ({ id, ...info }));
}

/**
 * List all models that support a specific capability
 */
export function listModelsByCapability(capability) {
  return Object.entries(MODEL_CAPABILITY_REGISTRY)
    .filter(([_, info]) => info.capabilities.includes(capability))
    .map(([id, info]) => ({ id, ...info }));
}
```

## ✅ Verification

After deployment, test with:

```bash
curl https://your-app.uprailway.app/api/health
```

Expected response:

```json
{
  "status": "ok",
  "provider": "gemini",
  "model": "gemini-3.8-flash",
  "capabilities": ["textGeneration", "structuredOutput", "conversation", "streaming", "vision"],
  "mode": "live",
  "apiKeySet": true
}
```

## 🎯 Summary

1. Update `backend/ai-gateway/model-capabilities.js` with new Gemini models
2. Commit and push to GitHub
3. Update Railway variable `LLM_MODEL=gemini-3.8-flash`
4. Wait for auto-deployment
5. Verify with health endpoint

That's it! Your app will now use Gemini 3.8 Flash.
