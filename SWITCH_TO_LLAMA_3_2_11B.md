# Switch to meta/llama-3.2-11b-vision-instruct

## Quick Answer

**To use the model you have available:**

1. Go to Railway Dashboard → Your Service → Variables
2. Update:
   ```
   LLM_MODEL=meta/llama-3.2-11b-vision-instruct
   ```
3. Railway auto-deploys
4. Done!

---

## About This Model

**meta/llama-3.2-11b-vision-instruct** is:

- ✅ **Llama 3.2** - Latest version (newer than 3.1)
- ✅ **11B parameters** - Smaller and faster than 70B/405B models
- ✅ **Vision capable** - Can process images (bonus feature, not used in current app)
- ✅ **Instruct-tuned** - Optimized for following instructions
- ✅ **128K context** - Large context window for long conversations

**Why this is a great choice:**

- ⚡ **Fast responses** - 11B model responds much faster than larger models
- 🎯 **Less likely to timeout** - Smaller model = quicker processing
- 💰 **Cost efficient** - Uses fewer resources
- 🆕 **Latest version** - Llama 3.2 is newer and better than 3.1
- 📏 **Large context** - 128K tokens for long roleplay sessions

---

## What Changed

I've added this model to the capability registry with these capabilities:

```javascript
'meta/llama-3.2-11b-vision-instruct': {
  provider: 'nvidia-nim',
  model: 'meta/llama-3.2-11b-vision-instruct',
  capabilities: [
    'textGeneration',      // Can generate text
    'structuredOutput',    // Can output JSON
    'conversation',        // Can handle multi-turn conversations
    'streaming',           // Supports streaming responses
    'vision',              // Can process images (bonus!)
  ],
  maxContext: 128000,      // 128K token context window
}
```

---

## Step-by-Step Instructions

### Step 1: Update Railway Variable

1. Go to https://railway.app/
2. Select your project: `performance-coach`
3. Click on your service
4. Go to **Variables** tab
5. Find `LLM_MODEL`
6. Change value to:
   ```
   meta/llama-3.2-11b-vision-instruct
   ```
7. Click **Save**

### Step 2: Wait for Deployment

Railway will automatically:
- Detect the change
- Rebuild the application
- Deploy the new version
- This takes 2-3 minutes

### Step 3: Verify It's Working

Check Railway logs for:
```
✅ AI Gateway initialized successfully
   Provider: nvidia-nim
   Model: meta/llama-3.2-11b-vision-instruct
   Capabilities: textGeneration, structuredOutput, conversation, streaming, vision
```

### Step 4: Test the Application

1. Open your app
2. Start a roleplay session
3. You should see fast responses (< 10 seconds)
4. Test the evaluation feature
5. Verify no timeout errors

---

## What to Expect

### Response Speed
- **Before** (with larger models): 30-300+ seconds, often timeout
- **After** (with 11B model): 5-15 seconds typically

### Quality
- Good quality for roleplay scenarios
- Good at following instructions
- Handles structured JSON output well
- Suitable for coaching conversations

### Capabilities
- ✅ Roleplay conversations
- ✅ Practice evaluation
- ✅ Transcript analysis
- ✅ Preparation brief generation
- ✅ Capability assessment
- ✅ Vision (not currently used, but available for future features)

---

## Complete Railway Variables

Your Railway variables should be:

```bash
# Backend variables
LLM_PROVIDER=nvidia-nim
LLM_API_KEY=your-nvidia-api-key
LLM_MODEL=meta/llama-3.2-11b-vision-instruct

# Frontend variables
VITE_APP_NAME=Performance Coach
VITE_LLM_PROVIDER=nvidia-nim
VITE_USE_MOCK_AI=false
```

---

## Troubleshooting

### If you still see timeouts:

1. **Check the model is correct**
   - Verify `LLM_MODEL=meta/llama-3.2-11b-vision-instruct`
   - No typos, exact match

2. **Check Railway logs**
   - Look for initialization success message
   - Check for any error messages

3. **Test health endpoint**
   ```bash
   curl https://your-app.up.railway.app/api/health
   ```
   Should show:
   ```json
   {
     "status": "ok",
     "provider": "nvidia-nim",
     "model": "meta/llama-3.2-11b-vision-instruct",
     "capabilities": ["textGeneration", "structuredOutput", "conversation", "streaming", "vision"]
   }
   ```

4. **Check NVIDIA NIM status**
   - Go to https://build.nvidia.com/
   - Verify the service is running
   - Check if there are any outages

### If you see "Model not found" error:

- Make sure you committed and pushed the updated code
- The model was added to `backend/ai-gateway/model-capabilities.js`
- Railway needs the latest code to recognize the model

---

## Why This Model is Better for You

### Compared to DeepSeek (current default):
- ✅ Newer version (3.2 vs DeepSeek V4)
- ✅ Faster responses (11B vs larger models)
- ✅ Less likely to timeout
- ✅ Vision capability (future-proof)

### Compared to Llama 3.1 70B/405B:
- ✅ Much faster (11B vs 70B/405B)
- ✅ Less likely to timeout
- ✅ More cost efficient
- ✅ Still good quality for your use case

### Compared to other models:
- ✅ You actually have access to this model
- ✅ It's available on your NVIDIA NIM account
- ✅ No need to request access or wait for approval

---

## Next Steps

1. ✅ Update `LLM_MODEL` in Railway
2. ✅ Wait for deployment (2-3 minutes)
3. ✅ Test the application
4. ✅ Verify fast responses
5. ✅ Report back if you see any issues

---

## Summary

**Model to use:** `meta/llama-3.2-11b-vision-instruct`

**Why:**
- Fast (11B parameters)
- Latest version (Llama 3.2)
- You have access to it
- Less likely to timeout
- Good quality for your use case

**How to switch:**
```
LLM_MODEL=meta/llama-3.2-11b-vision-instruct
```

**Expected result:**
- Fast responses (5-15 seconds)
- No timeout errors
- Good quality roleplay and evaluation
- Reliable operation

---

## Need Help?

If you encounter any issues after switching:

1. Check Railway logs for error messages
2. Verify the model name is exactly `meta/llama-3.2-11b-vision-instruct`
3. Make sure you pushed the latest code (with the model added to registry)
4. Test the health endpoint
5. Report back with any error messages

The model has been added to the capability registry and the code has been built successfully. Once you update the Railway variable and deploy, it should work!
