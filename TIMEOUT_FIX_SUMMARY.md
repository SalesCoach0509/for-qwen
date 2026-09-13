# Timeout Fix & Model Change Guide - Summary

## ✅ What Was Fixed

### Timeout Issue
The application was timing out after 300+ seconds when calling NVIDIA NIM API.

**Root Cause:**
- No timeout configured for API requests
- Some models (especially larger ones like 405B) are slow to respond
- Network issues or API overload can cause long hangs

**Solution:**
Added 60-second timeout with proper error handling:
- Requests now timeout after 60 seconds
- Clear error message when timeout occurs
- Prevents indefinite hangs

**Files Changed:**
- `backend/ai-gateway/provider-adapters.js`
  - Added AbortController with 60-second timeout
  - Added proper error handling for timeout errors
  - Clear error messages for users

---

## 🔄 How to Change Models

### Quick Answer

**To switch to Llama 3.1 70B (Recommended):**

1. Go to Railway Dashboard → Your Service → Variables
2. Update:
   ```
   LLM_MODEL=meta/llama-3.1-70b-instruct
   ```
3. Railway auto-deploys
4. Done!

### Available Models

#### ⭐ Recommended (Fast & Reliable)
```
LLM_MODEL=meta/llama-3.1-70b-instruct
```
- ⚡ Fast response times
- ⭐⭐⭐⭐ Good quality
- 📏 128K context window
- 💰 Cost efficient

#### High Quality (Slower)
```
LLM_MODEL=meta/llama-3.1-405b-instruct
```
- 🐌 Slower response times
- ⭐⭐⭐⭐⭐ Best quality
- 📏 128K context window
- 💰 More expensive

#### Current Default
```
LLM_MODEL=deepseek-ai/deepseek-v4-flash-0731
```
- ⚡ Fast
- ⭐⭐⭐⭐ Good quality
- 📏 128K context window

#### Other Options
```
LLM_MODEL=google/gemma-2-27b-it
LLM_MODEL=mistralai/mixtral-8x22b-instruct-v0.1
LLM_MODEL=qwen/qwen2.5-72b-instruct
```

---

## 🎯 Why You're Getting Timeouts

The timeout error shows:
```
✗ nvidia-nim call failed after 300347ms: TypeError: fetch failed
[cause]: HeadersTimeoutError: Headers Timeout Error
```

**Possible Causes:**

1. **Model is too slow**
   - Larger models (405B) take longer to respond
   - Complex prompts take longer
   - Solution: Use faster model (70B)

2. **NVIDIA NIM is overloaded**
   - Service might be experiencing high load
   - Solution: Try again later or switch models

3. **Network issues**
   - Railway to NVIDIA NIM connectivity issues
   - Solution: Retry or check NVIDIA status

4. **API rate limits**
   - You might be hitting rate limits
   - Solution: Check NVIDIA dashboard for usage

---

## 📊 Model Comparison

| Model | Speed | Quality | Timeout Risk | Recommendation |
|-------|-------|---------|--------------|----------------|
| `meta/llama-3.1-70b-instruct` | ⚡ Fast | ⭐⭐⭐⭐ | Low | **✅ BEST CHOICE** |
| `meta/llama-3.1-405b-instruct` | 🐌 Slow | ⭐⭐⭐⭐⭐ | High | Only if you need best quality |
| `deepseek-ai/deepseek-v4-flash-0731` | ⚡ Fast | ⭐⭐⭐⭐ | Medium | Good alternative |
| `google/gemma-2-27b-it` | ⚡⚡ Very Fast | ⭐⭐⭐ | Very Low | Fastest but smaller context |

---

## 🚀 Recommended Action

### Step 1: Switch to Llama 70B

Update Railway variable:
```
LLM_MODEL=meta/llama-3.1-70b-instruct
```

**Why this model?**
- Fast enough to avoid timeouts
- Good quality for roleplay and evaluation
- Reliable through NVIDIA NIM
- Good balance of speed and quality

### Step 2: Test the Application

1. Start a roleplay session
2. Verify responses come quickly (< 10 seconds)
3. Check response quality
4. Test evaluation feature
5. Verify no timeout errors

### Step 3: Monitor Performance

Check Railway logs for:
```
✓ nvidia-nim meta/llama-3.1-70b-instruct responded in XXXms
```

Should see response times under 30 seconds for most requests.

---

## 🔧 If Timeouts Continue

### Option 1: Try Even Faster Model
```
LLM_MODEL=google/gemma-2-27b-it
```
- Smaller model = faster responses
- But smaller context window (8K vs 128K)

### Option 2: Reduce Request Complexity
- Shorter conversation history
- Lower maxTokens
- Simpler prompts

### Option 3: Check NVIDIA NIM Status
- Go to https://build.nvidia.com/
- Check if service is experiencing issues
- Try again later

### Option 4: Verify API Key
- Make sure API key is valid
- Check if you've hit rate limits
- Generate new key if needed

---

## 📝 Complete Environment Variables

After switching to Llama 70B, your Railway variables should be:

```bash
# Backend variables
LLM_PROVIDER=nvidia-nim
LLM_API_KEY=your-nvidia-api-key
LLM_MODEL=meta/llama-3.1-70b-instruct

# Frontend variables
VITE_APP_NAME=Performance Coach
VITE_LLM_PROVIDER=nvidia-nim
VITE_USE_MOCK_AI=false
```

---

## ✅ Verification Steps

After changing the model:

1. **Check Railway logs**
   ```
   ✅ AI Gateway initialized successfully
      Provider: nvidia-nim
      Model: meta/llama-3.1-70b-instruct
   ```

2. **Test health endpoint**
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```
   Should show:
   ```json
   {
     "provider": "nvidia-nim",
     "model": "meta/llama-3.1-70b-instruct"
   }
   ```

3. **Test roleplay**
   - Start new session
   - Verify fast responses
   - Check quality

4. **Check for timeout errors**
   - Should see responses in < 30 seconds
   - No more 300+ second timeouts

---

## 📚 Documentation Created

1. **HOW_TO_CHANGE_MODELS.md** - Complete guide to changing models
2. **TIMEOUT_FIX_SUMMARY.md** - This file

---

## 🎯 Summary

**Problem:** Timeout errors after 300+ seconds

**Solution:** 
1. ✅ Added 60-second timeout with proper error handling
2. ✅ Switch to faster model (Llama 70B recommended)

**Next Steps:**
1. Update `LLM_MODEL=meta/llama-3.1-70b-instruct` in Railway
2. Railway auto-deploys
3. Test the application
4. Verify no more timeouts

**Expected Result:**
- Fast responses (< 30 seconds)
- Good quality responses
- No timeout errors
- Reliable operation

---

## 🆘 Still Having Issues?

If you still get timeouts after switching to Llama 70B:

1. Check NVIDIA NIM status at https://build.nvidia.com/
2. Verify API key is valid
3. Check Railway logs for specific error messages
4. Try an even faster model (gemma-2-27b-it)
5. Contact NVIDIA support if API is consistently slow

The timeout fix ensures you'll get a clear error message after 60 seconds instead of hanging indefinitely, making it easier to diagnose issues.
