/**
 * AI Gateway
 * 
 * Central gateway for all AI operations.
 * Routes requests to appropriate providers based on configuration.
 * Validates model capabilities before execution.
 */

import { createProviderAdapter } from './provider-adapters.js';
import { checkModelCapabilities, ModelCapabilities, getModelInfo } from './model-capabilities.js';

class AIGateway {
  constructor() {
    this.provider = null;
    this.model = null;
    this.initialized = false;
  }

  /**
   * Initialize the gateway with provider configuration
   */
  initialize(config) {
    const { provider, apiKey, model } = config;

    if (!provider || !apiKey || !model) {
      throw new Error('AI Gateway requires provider, apiKey, and model configuration');
    }

    // Check model capabilities
    const capabilityCheck = checkModelCapabilities(model, [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.CONVERSATION,
    ]);

    if (!capabilityCheck.supported) {
      throw new Error(capabilityCheck.error);
    }

    this.provider = createProviderAdapter({
      provider,
      apiKey,
      model,
    });

    this.model = model;
    this.initialized = true;

    console.log(`✅ AI Gateway initialized with ${provider}/${model}`);
  }

  /**
   * Check if gateway is initialized
   */
  isInitialized() {
    return this.initialized && this.provider && this.provider.isConfigured();
  }

  /**
   * Generate text with capability validation
   */
  async generate(messages, options = {}) {
    if (!this.isInitialized()) {
      throw new Error('AI Gateway not initialized. Call initialize() first.');
    }

    // Validate required capabilities
    const requiredCapabilities = [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.CONVERSATION,
    ];

    if (options.jsonMode) {
      requiredCapabilities.push(ModelCapabilities.STRUCTURED_OUTPUT);
    }

    if (options.stream) {
      requiredCapabilities.push(ModelCapabilities.STREAMING);
    }

    const capabilityCheck = checkModelCapabilities(this.model, requiredCapabilities);

    if (!capabilityCheck.supported) {
      return {
        error: 'MODEL_CAPABILITY_UNSUPPORTED',
        message: capabilityCheck.error,
        missingCapabilities: capabilityCheck.missingCapabilities,
      };
    }

    // Execute generation
    return await this.provider.generate(messages, options);
  }

  /**
   * Get current provider and model info
   */
  getInfo() {
    if (!this.isInitialized()) {
      return { initialized: false };
    }

    const modelInfo = getModelInfo(this.model);

    return {
      initialized: true,
      provider: this.provider.getName(),
      model: this.model,
      capabilities: modelInfo?.capabilities || [],
      maxContext: modelInfo?.maxContext || 0,
    };
  }

  /**
   * Check if current model supports a capability
   */
  supportsCapability(capability) {
    if (!this.isInitialized()) {
      return false;
    }

    const check = checkModelCapabilities(this.model, [capability]);
    return check.supported;
  }
}

// Singleton instance
export const aiGateway = new AIGateway();

/**
 * Initialize gateway from environment variables
 */
export function initializeGatewayFromEnv() {
  const provider = process.env.LLM_PROVIDER || 'gemini';
  const apiKey = process.env.LLM_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.LLM_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('LLM_API_KEY or GEMINI_API_KEY environment variable is required');
  }

  aiGateway.initialize({
    provider,
    apiKey,
    model,
  });

  return aiGateway;
}

/**
 * Get gateway instance
 */
export function getAIGateway() {
  return aiGateway;
}
