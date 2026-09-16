/**
 * AI Gateway
 * 
 * Central gateway for all AI operations.
 * Routes requests to appropriate providers based on configuration.
 * Validates model capabilities before execution.
 */

import { createProviderAdapter } from './provider-adapters.js';
import { ModelCapabilities, getModelInfo } from './model-capabilities.js';

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
    const { provider, apiKey, model, baseUrl, capabilities, maxContext } = config;

    if (!provider || !apiKey || !model) {
      throw new Error('AI Gateway requires provider, apiKey, and model configuration');
    }

    this.provider = createProviderAdapter({
      provider,
      apiKey,
      model,
      baseUrl,
    });

    this.model = model;
    this.capabilities = capabilities;
    this.maxContext = maxContext;
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
      capabilities: this.capabilities || modelInfo?.capabilities || [],
      maxContext: this.maxContext || modelInfo?.maxContext || null,
    };
  }

  /**
   * Check if current model supports a capability
   */
  supportsCapability(capability) {
    if (!this.isInitialized()) {
      return false;
    }

    return (this.capabilities || getModelInfo(this.model)?.capabilities || []).includes(capability);
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
  const baseUrl = process.env.LLM_BASE_URL;
  const capabilities = (process.env.LLM_CAPABILITIES || [
    ModelCapabilities.TEXT_GENERATION,
    ModelCapabilities.CONVERSATION,
    ModelCapabilities.STRUCTURED_OUTPUT,
  ].join(','))
    .split(',')
    .map(capability => capability.trim())
    .filter(Boolean);
  const maxContext = Number.parseInt(process.env.LLM_MAX_CONTEXT || '', 10) || null;

  if (!apiKey) {
    throw new Error('LLM_API_KEY or GEMINI_API_KEY environment variable is required');
  }

  aiGateway.initialize({
    provider,
    apiKey,
    model,
    baseUrl,
    capabilities,
    maxContext,
  });

  return aiGateway;
}

/**
 * Get gateway instance
 */
export function getAIGateway() {
  return aiGateway;
}
