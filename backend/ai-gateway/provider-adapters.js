/**
 * Base Provider Adapter
 * 
 * Abstract base class for all AI provider adapters.
 * Each provider must implement these methods.
 */

function getRequestTimeoutMs() {
  const value = Number.parseInt(process.env.LLM_REQUEST_TIMEOUT_MS || '60000', 10);
  return Number.isFinite(value) && value > 0 ? value : 60000;
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

export class BaseProviderAdapter {
  constructor(config) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * Generate text completion
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - { content, usage }
   */
  async generate(messages, options = {}) {
    throw new Error('generate() must be implemented by provider adapter');
  }

  /**
   * Check if provider is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    throw new Error('isConfigured() must be implemented by provider adapter');
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return this.name;
  }
}

/**
 * OpenAI-Compatible Provider Adapter
 * 
 * Works with any OpenAI-compatible API including:
 * - OpenAI
 * - NVIDIA NIM
 * - Azure OpenAI
 * - Other OpenAI-compatible providers
 */
export class OpenAICompatibleAdapter extends BaseProviderAdapter {
  constructor(config) {
    super(config);
    this.name = config.name || 'openai-compatible';
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model;
  }

  isConfigured() {
    return !!this.apiKey && !!this.model;
  }

  async generate(messages, options = {}) {
    if (!this.isConfigured()) {
      throw new Error(`${this.name} provider not properly configured`);
    }

    const startTime = Date.now();
    const maxRetries = 3;
    const baseDelayMs = 1000;

    // Retry loop for transient errors
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const requestBody = {
          model: this.model,
          messages: messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
        };

        // Add JSON mode if requested
        if (options.jsonMode) {
          requestBody.response_format = { type: 'json_object' };
        }

        // Add streaming if requested
        if (options.stream) {
          requestBody.stream = true;
        }

        const controller = new AbortController();
        const requestTimeoutMs = getRequestTimeoutMs();
        const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
        let response;
        try {
          response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        const latency = Date.now() - startTime;

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = JSON.stringify(error);
          
          // Check if this is a transient error (503, 429)
          const isTransient = 
            response.status === 503 ||
            response.status === 429 ||
            errorMessage.includes('503') ||
            errorMessage.includes('429') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('TEMPORARILY_UNAVAILABLE');
          
          if (!isTransient || attempt === maxRetries) {
            throw new Error(`${this.name} API error (${latency}ms): ${errorMessage}`);
          }
          
          // Transient error - retry with exponential backoff
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          console.log(`⏳ ${this.name} transient error ${response.status} (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const data = await response.json();

        console.log(`✓ ${this.name} ${this.model} responded in ${latency}ms (attempt ${attempt})`);

        return {
          content: data.choices[0]?.message?.content || '',
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          } : undefined,
        };
      } catch (error) {
        const latency = Date.now() - startTime;
        
        if (error.name === 'AbortError') {
          const requestTimeoutMs = getRequestTimeoutMs();
          console.error(`✗ ${this.name} request timed out after ${requestTimeoutMs}ms`);
          const timeoutError = new Error(`${this.name} API request timed out after ${requestTimeoutMs}ms. The model may be overloaded or slow to respond.`);
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }
        
        // Check if this is a transient error
        const errorMessage = error.message || '';
        const isTransient = 
          errorMessage.includes('503') ||
          errorMessage.includes('429') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('TEMPORARILY_UNAVAILABLE');
        
        if (!isTransient || attempt === maxRetries) {
          console.error(`✗ ${this.name} call failed after ${latency}ms (attempt ${attempt}):`, error);
          throw error;
        }
        
        // Transient error - retry with exponential backoff
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`⏳ ${this.name} transient error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

/**
 * Google Gemini Provider Adapter
 */
export class GeminiAdapter extends BaseProviderAdapter {
  constructor(config) {
    super(config);
    this.name = 'gemini';
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-2.5-flash';
    this.genAI = null;
    this.modelInstance = null;
  }

  isConfigured() {
    return !!this.apiKey && !!this.model;
  }

  async initialize() {
    if (!this.genAI) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.modelInstance = this.genAI.getGenerativeModel({
        model: this.model,
      });
    }
  }

  async generate(messages, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Gemini provider not properly configured');
    }

    await this.initialize();

    const startTime = Date.now();
    const maxRetries = 3;
    const baseDelayMs = 1000;

    // Retry loop for transient errors
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Convert OpenAI-style messages to Gemini format
        const contents = messages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

        const generationConfig = {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2000,
        };

        if (options.jsonMode) {
          generationConfig.responseMimeType = 'application/json';
        }

        const requestTimeoutMs = getRequestTimeoutMs();
        const result = await withTimeout(
          this.modelInstance.generateContent({ contents, generationConfig }),
          requestTimeoutMs,
          `Gemini ${this.model} request`
        );

        const response = await withTimeout(result.response, requestTimeoutMs, `Gemini ${this.model} response`);
        const text = response.text();
        const latency = Date.now() - startTime;

        console.log(`✓ Gemini ${this.model} responded in ${latency}ms (attempt ${attempt})`);

        return {
          content: text,
          usage: response.usageMetadata ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          } : undefined,
        };
      } catch (error) {
        const latency = Date.now() - startTime;
        const errorMessage = error.message || 'Unknown error';
        
        // Check if this is a transient error (503, 429, timeout)
        const isTransient = 
          errorMessage.includes('503') ||
          errorMessage.includes('429') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('TEMPORARILY_UNAVAILABLE') ||
          errorMessage.includes('high demand');
        
        if (!isTransient || attempt === maxRetries) {
          // Not transient or max retries reached - throw error
          console.error(`✗ Gemini call failed after ${latency}ms (attempt ${attempt}):`, error);
          
          // Ensure error is properly serialized with all details
          const errorName = error.name || 'Error';
          const errorDetails = error.details || error.cause || {};
          
          console.error(`✗ Error name: ${errorName}`);
          console.error(`✗ Error message: ${errorMessage}`);
          console.error(`✗ Error details:`, errorDetails);
          
          // Create a new error with all details preserved
          const wrappedError = new Error(`${errorName}: ${errorMessage}`);
          wrappedError.details = errorDetails;
          wrappedError.originalError = error;
          
          throw wrappedError;
        }
        
        // Transient error - retry with exponential backoff
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`⏳ Gemini transient error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

/**
 * Qwen Provider Adapter (Alibaba Cloud)
 */
export class QwenAdapter extends OpenAICompatibleAdapter {
  constructor(config) {
    super({
      ...config,
      name: 'qwen',
      baseUrl: config.baseUrl || 'https://dashscope.aliyuncs.com/api/v1',
    });
  }

  async generate(messages, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Qwen provider not properly configured');
    }

    const startTime = Date.now();

    try {
      const requestBody = {
        model: this.model,
        input: {
          messages: messages,
        },
        parameters: {
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
          result_format: 'message',
        },
      };

      if (options.jsonMode) {
        requestBody.parameters.result_format = 'message';
      }

      const controller = new AbortController();
      const requestTimeoutMs = getRequestTimeoutMs();
      const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
      let response;
      try {
        response = await fetch(`${this.baseUrl}/services/aigc/text-generation/generation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Qwen API error (${latency}ms): ${JSON.stringify(error)}`);
      }

      const data = await response.json();

      console.log(`✓ Qwen ${this.model} responded in ${latency}ms`);

      return {
        content: data.output?.choices?.[0]?.message?.content || '',
        usage: data.usage ? {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      console.error(`✗ Qwen call failed after ${latency}ms:`, error);
      throw error;
    }
  }
}

/**
 * DeepSeek Provider Adapter
 */
export class DeepSeekAdapter extends OpenAICompatibleAdapter {
  constructor(config) {
    super({
      ...config,
      name: 'deepseek',
      baseUrl: config.baseUrl || 'https://api.deepseek.com/v1',
    });
  }
}

/**
 * Provider Factory
 * 
 * Creates the appropriate adapter based on provider configuration
 */
export function createProviderAdapter(config) {
  const { provider, apiKey, model, baseUrl } = config;

  switch (provider) {
    case 'gemini':
      return new GeminiAdapter({ apiKey, model });

    case 'openai':
      return new OpenAICompatibleAdapter({
        name: 'openai',
        apiKey,
        model,
        baseUrl: baseUrl || 'https://api.openai.com/v1',
      });

    case 'nvidia-nim':
      return new OpenAICompatibleAdapter({
        name: 'nvidia-nim',
        apiKey,
        model,
        baseUrl: baseUrl || 'https://integrate.api.nvidia.com/v1',
      });

    case 'qwen':
      return new QwenAdapter({ apiKey, model, baseUrl });

    case 'deepseek':
      return new DeepSeekAdapter({ apiKey, model, baseUrl });

    default:
      // Assume OpenAI-compatible for unknown providers
      return new OpenAICompatibleAdapter({
        name: provider,
        apiKey,
        model,
        baseUrl: baseUrl || 'https://api.openai.com/v1',
      });
  }
}
