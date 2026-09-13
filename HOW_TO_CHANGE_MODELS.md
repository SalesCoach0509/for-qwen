# How to Change AI Models

## Quick Answer

To change the model, update **one environment variable** in Railway:

```
LLM_MODEL=meta/llama-3.1-70b-instruct
```

That's it! The system will automatically use the new model.

---

## Available Models

### NVIDIA NIM Models (Recommended)

These models are available through NVIDIA NIM and are pre-configured in the capability registry:

#### DeepSeek Models
- `deepseek-ai/deepseek-v4-flash-0731` (Current default)
- `deepseek-v4-pro`
- `deepseek-v4-flash`

#### Meta Llama Models
- `meta/llama-3.1-70b-instruct` ⭐ (Recommended - faster)
- `meta/llama-3.1-405b-instruct` (Larger, slower)

#### Other Models
- `google/gemma-2-27b-it`
- `nvidia/nemotron-4-340b-instruct`
- `mistralai/mixtral-8x22b-instruct-v0.1`
- `qwen/qwen2.5-72b-instruct`
- `moonshotai/kimi-k2-instruct`
- `stepfun/step-2-16k`

### Google Gemini Models

- `gemini-2.5-flash`
- `gemini-2.0-flash`

### OpenAI Models

- `gpt-4o`
- `gpt-4o-mini`

---

## Step-by-Step Instructions

### To Switch to Llama 3.1 70B

1. **Go to Railway Dashboard**
   - https://railway.app/
   - Select your project
   - Click on your service

2. **Go to Variables Tab**

3. **Update LLM_MODEL**
   ```
   LLM_MODEL=meta/llama-3.1-70b-instruct
   ```

4. **Railway will automatically redeploy**

5. **Verify in logs**
   ```
   ✅ AI Gateway initialized successfully
      Provider: nvidia-nim
      Model: meta/llama-3.1-70b-instruct
   ```

### To Switch to Llama 3.1 405B

```
LLM_MODEL=meta/llama-3.1-405b-instruct
```

### To Switch Back to DeepSeek

```
LLM_MODEL=deepseek-ai/deepseek-v4-flash-0731
```

---

## Complete Environment Variables

Your Railway variables should look like this:

```bash
# Provider (don't change this for NVIDIA models)
LLM_PROVIDER=nvidia-nim

# API Key (your NVIDIA NIM API key)
LLM_API_KEY=your-nvidia-api-key

# Model (change this to switch models)
LLM_MODEL=meta/llama-3.1-70b-instruct

# Frontend variables (keep these)
VITE_APP_NAME=Performance Coach
VITE_LLM_PROVIDER=nvidia-nim
VITE_USE_MOCK_AI=false
```

---

## Model Comparison

### Speed vs Quality

| Model | Speed | Quality | Context | Best For |
|-------|-------|---------|---------|----------|
| `meta/llama-3.1-70b-instruct` | ⚡ Fast | ⭐⭐⭐⭐ Good | 128K | **Recommended** - Good balance |
| `meta/llama-3.1-405b-instruct` | 🐌 Slow | ⭐⭐⭐⭐⭐ Excellent | 128K | Highest quality, but slow |
| `deepseek-ai/deepseek-v4-flash-0731` | ⚡ Fast | ⭐⭐⭐⭐ Good | 128K | Current default |
| `google/gemma-2-27b-it` | ⚡ Fast | ⭐⭐⭐ Decent | 8K | Fastest, but smaller context |
| `mistralai/mixtral-8x22b-instruct-v0.1` | ⚡ Fast | ⭐⭐⭐⭐ Good | 65K | Good alternative |

### Recommendation

**For best experience:** Use `meta/llama-3.1-70b-instruct`
- Fast response times
- Good quality
- Large context window (128K)
- Reliable through NVIDIA NIM

**If you want highest quality:** Use `meta/llama-3.1-405b-instruct`
- Best quality responses
- But much slower (may timeout)

---

## Troubleshooting

### Timeout Errors

If you see timeout errors like:
```
✗ nvidia-nim call failed after 300347ms: TypeError: fetch failed
```

**Solutions:**

1. **Try a faster model**
   - Switch from 405B to 70B
   - Switch from DeepSeek to Llama

2. **Check NVIDIA NIM status**
   - The service might be overloaded
   - Try again in a few minutes

3. **Check your API key**
   - Make sure it's valid
   - Check if you've hit rate limits

### Model Not Found Error

If you see:
```
❌ Failed to initialize AI Gateway: Model xxx not found in capability registry
```

**Solution:**
- The model name must match exactly what's in the registry
- Check the list of available models above
- Use the exact model ID (e.g., `meta/llama-3.1-70b-instruct`)

### API Key Invalid

If you see:
```
API key not valid. Please pass a valid API key.
```

**Solution:**
- Go to https://build.nvidia.com/
- Generate a new API key
- Update `LLM_API_KEY` in Railway

---

## Adding New Models

If you want to use a model that's not in the registry:

1. **Check if NVIDIA NIM supports it**
   - Go to https://build.nvidia.com/
   - Find the model
   - Note the exact model ID

2. **Add to capability registry**
   - Edit `backend/ai-gateway/model-capabilities.js`
   - Add the model with its capabilities
   - Example:
   ```javascript
   'new-model-id': {
     provider: 'nvidia-nim',
     model: 'new-model-id',
     capabilities: [
       ModelCapabilities.TEXT_GENERATION,
       ModelCapabilities.STRUCTURED_OUTPUT,
       ModelCapabilities.CONVERSATION,
       ModelCapabilities.STREAMING,
     ],
     maxContext: 128000,
   },
   ```

3. **Commit and push**
   ```bash
   git add backend/ai-gateway/model-capabilities.js
   git commit -m "Add new model to registry"
   git push
   ```

4. **Update Railway variable**
   ```
   LLM_MODEL=new-model-id
   ```

---

## Testing Different Models

After changing the model:

1. **Check health endpoint**
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```
   
   Should show:
   ```json
   {
     "status": "ok",
     "provider": "nvidia-nim",
     "model": "meta/llama-3.1-70b-instruct",
     "capabilities": [...]
   }
   ```

2. **Test roleplay**
   - Start a new roleplay session
   - Verify responses are coming from the new model
   - Check response quality and speed

3. **Test evaluation**
   - Complete a roleplay
   - Check if evaluation works
   - Verify scores are reasonable

---

## Performance Tips

### For Faster Responses
- Use 70B models instead of 405B
- Use Flash variants when available
- Reduce `maxTokens` in requests (currently 500 for roleplay)

### For Better Quality
- Use 405B models
- Increase temperature slightly (currently 0.8 for roleplay)
- Provide more context in prompts

### For Cost Efficiency
- Use smaller models (70B, 27B)
- Monitor API usage in NVIDIA dashboard
- Use mock mode for testing when possible

---

## Summary

**To change models:**
1. Update `LLM_MODEL` in Railway
2. Railway auto-deploys
3. Done!

**Recommended model:** `meta/llama-3.1-70b-instruct`
- Fast, reliable, good quality
- Less likely to timeout
- Good balance of speed and quality

**If you get timeouts:**
- Switch to a faster model
- Check NVIDIA NIM status
- Verify API key is valid
