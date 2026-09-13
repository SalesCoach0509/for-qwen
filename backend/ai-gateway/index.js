/**
 * AI Gateway Module
 * 
 * Exports all gateway components for use in the application.
 */

export { aiGateway, initializeGatewayFromEnv, getAIGateway } from './gateway.js';
export { createProviderAdapter, BaseProviderAdapter, OpenAICompatibleAdapter, GeminiAdapter, QwenAdapter, DeepSeekAdapter } from './provider-adapters.js';
export { ModelCapabilities, MODEL_CAPABILITY_REGISTRY, checkModelCapabilities, getModelInfo, listModelsByProvider, listModelsByCapability } from './model-capabilities.js';
