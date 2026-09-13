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
  'gpt-oss-20b': {
    provider: 'openai',
    model: 'gpt-oss-20b',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
    ],
    maxContext: 128000,
  },
  'gpt-oss-120b': {
    provider: 'openai',
    model: 'gpt-oss-120b',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      ModelCapabilities.STREAMING,
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
  'deepseek-ai/deepseek-v4-flash-0731': {
    provider: 'nvidia-nim',
    model: 'deepseek-ai/deepseek-v4-flash-0731',
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
