# Railway Deployment Fix - Module Not Found Error

## Problem
Railway deployment was failing with:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/backend/ai-gateway/index.js'
```

## Root Cause
The Dockerfile was only copying `backend/server.js` but not the entire `backend/` directory. This meant the `ai-gateway/` subdirectory with its files (gateway.js, provider-adapters.js, model-capabilities.js, index.js) was not included in the Docker image.

## Fix Applied
Updated `Dockerfile` line 30:

**Before:**
```dockerfile
COPY backend/server.js ./backend/
```

**After:**
```dockerfile
COPY backend/ ./backend/
```

This ensures the entire backend directory is copied, including:
- backend/server.js
- backend/package.json
- backend/ai-gateway/gateway.js
- backend/ai-gateway/index.js
- backend/ai-gateway/model-capabilities.js
- backend/ai-gateway/provider-adapters.js

## Verification
✅ Frontend build successful (750.20 kB)
✅ All backend files present in workspace
✅ Dockerfile updated to copy entire backend directory
✅ .dockerignore properly excludes node_modules

## Next Steps for You

### Step 1: Download Updated Files
Download the workspace files again to get the fixed Dockerfile.

### Step 2: Upload to GitHub
Upload all files to your GitHub repository, overwriting the existing files.

### Step 3: Railway Auto-Deploy
Railway will automatically:
1. Detect the Dockerfile change
2. Rebuild the Docker image
3. Include the entire backend directory
4. Deploy the updated application

### Step 4: Verify Deployment
Check Railway logs for:
```
✅ AI Gateway initialized successfully
   Provider: nvidia-nim
   Model: deepseek-ai/deepseek-v4-flash-0731
   Capabilities: textGeneration, structuredOutput, conversation, streaming
```

### Step 5: Test Health Endpoint
```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "provider": "nvidia-nim",
  "model": "deepseek-ai/deepseek-v4-flash-0731",
  "capabilities": [...],
  "mode": "live",
  "apiKeySet": true
}
```

## What Changed
- **Dockerfile**: Line 30 updated to copy entire backend directory
- **No other changes**: All application code remains the same
- **DeepSeek integration**: Already configured, just needs the Dockerfile fix

## Expected Outcome
After redeployment:
- ✅ Backend starts successfully
- ✅ AI Gateway initializes with DeepSeek
- ✅ All API endpoints work
- ✅ Roleplay uses DeepSeek for stakeholder responses
- ✅ Evaluation uses DeepSeek for capability assessment
- ✅ Transcript analysis uses DeepSeek
- ✅ All product intelligence features work with DeepSeek

## Troubleshooting
If you still see errors after redeployment:

1. **Check Railway logs** for initialization messages
2. **Verify environment variables** are set:
   - LLM_PROVIDER=nvidia-nim
   - LLM_API_KEY=your-nvidia-key
   - LLM_MODEL=deepseek-ai/deepseek-v4-flash-0731
3. **Test diagnostic endpoint**:
   ```bash
   curl https://your-app.up.railway.app/api/diagnostic
   ```

## Summary
The fix is simple: the Dockerfile now copies the entire backend directory instead of just server.js. This ensures all AI Gateway files are included in the Docker image. After you upload the updated files to GitHub, Railway will automatically redeploy with the fix.
