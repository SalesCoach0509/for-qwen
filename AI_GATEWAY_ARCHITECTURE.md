# AI Gateway Architecture

## Overview

The AI Performance Coach now uses a **provider-agnostic AI Gateway** architecture that supports multiple LLM providers through a unified interface. This allows you to switch between different AI providers (Gemini, OpenAI, NVIDIA NIM, Qwen, DeepSeek) by simply changing environment variables—no code changes required.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  - Calls backend API endpoints                              │
│  - No direct LLM provider calls                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express.js)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AI Gateway Layer                         │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Model Capability Registry                     │  │  │
│  │  │  - Declares model capabilities                 │  │  │
│  │  │  - Validates capability requirements           │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Provider Adapters                             │  │  │
│  │  │  - GeminiAdapter                               │  │  │
│  │  │  - OpenAICompatibleAdapter                     │  │  │
│  │  │  - QwenAdapter                                 │  │  │
│  │  │  - DeepSeekAdapter                             │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Gateway Router                                │  │  │
│  │  │  - Validates model capabilities                │  │  │
│  │  │  - Routes to appropriate adapter               │  │  │
│  │  │  - Returns capability errors if needed         │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              LLM Providers (External APIs)                   │
│  - Google Gemini                                            │
│  - OpenAI                                                   │
│  - NVIDIA NIM (DeepSeek, Llama, Qwen, etc.)                │
│  - Alibaba Qwen                                             │
│  - DeepSeek                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

Configure the AI Gateway using these environment variables:

```bash
# LLM Provider: gemini, openai, nvidia-nim, qwen, deepseek
LLM_PROVIDER=gemini

# LLM API Key (from your provider)
LLM_API_KEY=your-api-key-here

# LLM Model (must be in capability registry)
LLM_MODEL=gemini-2.5-flash

# Optional: Custom base URL for OpenAI-compatible providers
# LLM_BASE_URL=https://integrate.api.nvidia.com/v1
```

### Provider Examples

#### Google Gemini

```bash
LLM_PROVIDER=gemini
LLM_API_KEY=your-gemini-api-key
LLM_MODEL=gemini-2.5-flash
```

Get your API key: https://aistudio.google.com/apikey

Available models:
- `gemini-2.5-flash` (recommended)
- `gemini-2.0-flash`

#### OpenAI

```bash
LLM_PROVIDER=openai
LLM_API_KEY=your-openai-api-key
LLM_MODEL=gpt-4o
```

Get your API key: https://platform.openai.com/api-keys

Available models:
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-oss-20b`
- `gpt-oss-120b`

#### NVIDIA NIM (Multiple Models)

NVIDIA NIM provides access to many models through an OpenAI-compatible API:

```bash
LLM_PROVIDER=nvidia-nim
LLM_API_KEY=your-nvidia-api-key
LLM_MODEL=deepseek-v4-pro
```

Get your API key: https://build.nvidia.com/

Available models:
- **DeepSeek**: `deepseek-v4-pro`, `deepseek-v4-flash`
- **Meta Llama**: `meta/llama-3.1-405b-instruct`, `meta/llama-3.1-70b-instruct`
- **Google Gemma**: `google/gemma-2-27b-it`
- **NVIDIA Nemotron**: `nvidia/nemotron-4-340b-instruct`
- **Mistral**: `mistralai/mixtral-8x22b-instruct-v0.1`
- **Qwen**: `qwen/qwen2.5-72b-instruct`
- **Moonshot Kimi**: `moonshotai/kimi-k2-instruct`
- **StepFun**: `stepfun/step-2-16k`

#### Alibaba Qwen (Direct)

```bash
LLM_PROVIDER=qwen
LLM_API_KEY=your-qwen-api-key
LLM_MODEL=qwen-turbo
```

Get your API key: https://dashscope.console.aliyun.com/

Available models:
- `qwen-turbo`
- `qwen-plus`

#### DeepSeek (Direct)

```bash
LLM_PROVIDER=deepseek
LLM_API_KEY=your-deepseek-api-key
LLM_MODEL=deepseek-chat
```

Get your API key: https://platform.deepseek.com/

Available models:
- `deepseek-chat`
- `deepseek-coder`

## Model Capability Registry

The system maintains a registry of model capabilities to ensure operations only use models that support required features.

### Capabilities

- `textGeneration` - Basic text generation
- `structuredOutput` - JSON/structured output
- `conversation` - Multi-turn conversation
- `toolCalling` - Function/tool calling
- `streaming` - Streaming responses
- `vision` - Image understanding
- `audio` - Audio processing
- `embeddings` - Text embeddings
- `translation` - Translation
- `codeGeneration` - Code generation
- `reasoning` - Advanced reasoning

### Capability Validation

Before executing an operation, the gateway validates that the selected model supports all required capabilities:

```javascript
// Example: Roleplay requires textGeneration, structuredOutput, conversation
const requiredCapabilities = [
  ModelCapabilities.TEXT_GENERATION,
  ModelCapabilities.STRUCTURED_OUTPUT,
  ModelCapabilities.CONVERSATION,
];

const check = checkModelCapabilities(modelId, requiredCapabilities);

if (!check.supported) {
  // Returns error: "Model X does not support required capabilities: ..."
  return { error: 'MODEL_CAPABILITY_UNSUPPORTED', ... };
}
```

### Adding New Models

To add a new model to the registry, edit `backend/ai-gateway/model-capabilities.js`:

```javascript
export const MODEL_CAPABILITY_REGISTRY = {
  // ... existing models
  
  'new-model-id': {
    provider: 'provider-name',
    model: 'new-model-id',
    capabilities: [
      ModelCapabilities.TEXT_GENERATION,
      ModelCapabilities.STRUCTURED_OUTPUT,
      ModelCapabilities.CONVERSATION,
      // ... other capabilities
    ],
    maxContext: 128000,
  },
};
```

## Provider Adapters

### OpenAI-Compatible Adapter

Most providers (OpenAI, NVIDIA NIM, DeepSeek) use OpenAI-compatible APIs. The `OpenAICompatibleAdapter` handles these:

```javascript
class OpenAICompatibleAdapter extends BaseProviderAdapter {
  async generate(messages, options) {
    // Converts to OpenAI format
    // Calls /chat/completions endpoint
    // Returns standardized response
  }
}
```

### Gemini Adapter

Google Gemini uses a different API format. The `GeminiAdapter` handles conversion:

```javascript
class GeminiAdapter extends BaseProviderAdapter {
  async generate(messages, options) {
    // Converts OpenAI format to Gemini format
    // Calls Gemini API
    // Returns standardized response
  }
}
```

### Qwen Adapter

Alibaba Qwen uses a custom API format. The `QwenAdapter` handles this:

```javascript
class QwenAdapter extends OpenAICompatibleAdapter {
  async generate(messages, options) {
    // Converts to Qwen format
    // Calls Qwen API
    // Returns standardized response
  }
}
```

## API Endpoints

All backend API endpoints now use the AI Gateway:

- `POST /api/ai/chat` - General chat completion
- `POST /api/ai/prepare` - Generate preparation brief
- `POST /api/ai/evaluate` - Evaluate practice session
- `POST /api/ai/analyze` - Analyze transcript
- `POST /api/ai/roleplay/respond` - Generate roleplay response
- `GET /api/health` - Health check (shows provider/model info)
- `GET /api/diagnostic` - Diagnostic information

### Response Format

All endpoints return standardized responses:

```json
{
  "content": "Generated text...",
  "usage": {
    "promptTokens": 100,
    "completionTokens": 200,
    "totalTokens": 300
  }
}
```

### Error Handling

If a model doesn't support required capabilities:

```json
{
  "error": "MODEL_CAPABILITY_UNSUPPORTED",
  "message": "Model X does not support required capabilities: vision, audio",
  "missingCapabilities": ["vision", "audio"]
}
```

## Switching Providers

To switch providers, simply update environment variables and restart:

```bash
# Switch from Gemini to NVIDIA NIM
LLM_PROVIDER=nvidia-nim
LLM_API_KEY=your-nvidia-key
LLM_MODEL=deepseek-v4-pro

# Restart backend
npm run dev
```

No code changes required!

## Validation Suite

The validation suite is provider-agnostic. It will work with any configured provider:

```bash
# Run validation with current provider
npm run validate
```

The validation suite tests:
- Gate 1: LLM Verification
- Gate 2: Preparation Quality
- Gate 3: Objection Handling Benchmark
- Gate 4: Evidence Traceability
- Gate 5: Adversarial Testing

## Monitoring

### Health Check

```bash
curl http://localhost:3001/api/health
```

Returns:
```json
{
  "status": "ok",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "capabilities": ["textGeneration", "structuredOutput", ...],
  "maxContext": 1000000,
  "mode": "live",
  "apiKeySet": true,
  "timestamp": "2026-01-XXT..."
}
```

### Diagnostic

```bash
curl http://localhost:3001/api/diagnostic
```

Returns detailed diagnostic information including:
- Environment variables
- Gateway configuration
- Connection test results

## Future Extensions

The AI Gateway architecture supports future extensions:

### Vision Gateway
For image understanding models:
```javascript
class VisionGateway {
  async analyzeImage(image, prompt) { ... }
}
```

### ASR Gateway
For speech-to-text models:
```javascript
class ASRGateway {
  async transcribe(audio) { ... }
}
```

### Embedding Gateway
For embedding models:
```javascript
class EmbeddingGateway {
  async embed(text) { ... }
}
```

### Translation Gateway
For translation models:
```javascript
class TranslationGateway {
  async translate(text, sourceLang, targetLang) { ... }
}
```

## Best Practices

1. **Start with Gemini**: Gemini 2.5 Flash offers the best balance of performance and cost
2. **Use NVIDIA NIM for variety**: Access many models through one API
3. **Check capabilities**: Ensure your model supports required features
4. **Monitor usage**: Track token usage and costs
5. **Test thoroughly**: Run validation suite after switching providers

## Troubleshooting

### "Model X not found in capability registry"

Add the model to `backend/ai-gateway/model-capabilities.js`

### "Model X does not support required capabilities"

Choose a different model that supports the required capabilities, or reduce the capability requirements.

### "Provider not properly configured"

Check your environment variables:
- `LLM_PROVIDER` is set correctly
- `LLM_API_KEY` is valid
- `LLM_MODEL` is in the capability registry

### "API error"

Check:
- API key is valid and not expired
- Model name is correct
- Base URL is correct (if using custom URL)
- Network connectivity

## Support

For issues or questions:
1. Check the diagnostic endpoint: `/api/diagnostic`
2. Review backend logs
3. Verify environment variables
4. Test with a different provider

## License

Same as the main project.
