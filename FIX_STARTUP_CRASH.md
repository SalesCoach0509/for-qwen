# ✅ Fixed: Server Stuck on "Starting Container"

## 🐛 The Problem

Your Railway deployment was stuck on "Starting Container" and never completing startup. The app would never start.

## 🔍 Root Cause

The backend server was calling `process.exit(1)` when the `LLM_API_KEY` environment variable was missing or invalid. This caused the container to crash immediately on startup, and Railway would keep trying to restart it in an infinite loop, appearing "stuck".

**Old behavior (broken):**
```javascript
if (!apiKey) {
  throw new Error('LLM_API_KEY environment variable is required');
}
// ... later in catch block:
process.exit(1);  // ❌ This crashes the container
```

## ✅ The Fix

I've made the backend server **resilient** - it will now start successfully even if the API key is missing or invalid. The server will:

1. **Start successfully** regardless of API key status
2. **Log warnings** if the API key is missing
3. **Return 503 errors** for AI endpoints if gateway isn't initialized
4. **Show degraded status** in health check if gateway isn't initialized
5. **Continue running** so you can fix the configuration without the container crashing

**New behavior (fixed):**
```javascript
if (!apiKey) {
  console.warn('⚠️  WARNING: LLM_API_KEY environment variable is not set');
  console.warn('   AI features will not work until API key is configured');
  console.warn('   Server will start but AI endpoints will return errors');
} else {
  aiGateway.initialize({ provider, apiKey, model });
  gatewayInitialized = true;
}
// No process.exit(1) - server continues running
```

## 📋 Changes Made

### 1. Removed `process.exit(1)` on startup failure
- Server now continues running even if AI Gateway fails to initialize
- Logs warnings instead of crashing

### 2. Added `gatewayInitialized` flag
- Tracks whether the AI Gateway was successfully initialized
- Used to guard AI endpoints

### 3. Updated AI endpoints to check initialization
- `/api/ai/chat` - Returns 503 if gateway not initialized
- `/api/ai/roleplay/respond` - Returns 503 if gateway not initialized
- `/api/health` - Returns 503 with degraded status if gateway not initialized

### 4. Improved startup messages
- Shows clear status about whether AI Gateway is initialized
- Provides helpful guidance if API key is missing

## 🚀 What You Need to Do

### Step 1: Update backend/server.js
Copy the updated `backend/server.js` file to your GitHub repository.

### Step 2: Commit and Push
```bash
git add backend/server.js
git commit -m "Fix: Make server resilient to missing API key"
git push
```

### Step 3: Railway Auto-Deploys
Railway will automatically redeploy. The server will now start successfully.

### Step 4: Check Railway Logs
You should see one of these scenarios:

**If API key is set correctly:**
```
✅ AI Gateway initialized successfully
   Provider: gemini
   Model: gemini-3.8-flash
```

**If API key is missing:**
```
⚠️  WARNING: LLM_API_KEY environment variable is not set
   AI features will not work until API key is configured
   Server will start but AI endpoints will return errors
```

**If API key is invalid:**
```
❌ Failed to initialize AI Gateway: <error message>
   Server will continue but AI features will not work
```

### Step 5: Verify Server is Running
The server should now start successfully and you should see:
```
✅ Backend ready to accept requests
```

## 🎯 Expected Behavior

### Scenario 1: API Key is Set Correctly
- ✅ Server starts successfully
- ✅ AI Gateway initializes
- ✅ All endpoints work
- ✅ Health check returns `status: 'ok'`

### Scenario 2: API Key is Missing
- ✅ Server starts successfully
- ⚠️ AI Gateway not initialized
- ⚠️ AI endpoints return 503 errors
- ⚠️ Health check returns `status: 'degraded'`
- ✅ You can still access the frontend

### Scenario 3: API Key is Invalid
- ✅ Server starts successfully
- ❌ AI Gateway initialization fails
- ❌ AI endpoints return 503 errors
- ❌ Health check returns `status: 'degraded'`
- ✅ You can still access the frontend
- ✅ You can fix the API key without container crashing

## 🔧 How to Fix API Key Issues

If the server starts but AI features don't work:

1. **Check Railway Environment Variables**
   - Go to Railway Dashboard → Your Service → Variables
   - Verify `LLM_API_KEY` is set
   - Verify `LLM_PROVIDER` is set (e.g., `gemini`)
   - Verify `LLM_MODEL` is set (e.g., `gemini-3.8-flash`)

2. **Check Railway Logs**
   - Look for initialization messages
   - Check for specific error messages
   - The logs will tell you exactly what's wrong

3. **Update Variables and Redeploy**
   - Fix the environment variables
   - Railway will automatically redeploy
   - Check logs again to verify it worked

## 📊 Health Check Responses

### Healthy (API key set correctly):
```json
{
  "status": "ok",
  "provider": "gemini",
  "model": "gemini-3.8-flash",
  "capabilities": ["textGeneration", "structuredOutput", ...],
  "mode": "live",
  "apiKeySet": true,
  "timestamp": "2026-01-XXT..."
}
```

### Degraded (API key missing/invalid):
```json
{
  "status": "degraded",
  "message": "AI Gateway is not initialized. Please check LLM_API_KEY environment variable.",
  "apiKeySet": false,
  "timestamp": "2026-01-XXT..."
}
```

## 🎉 Summary

**Problem:** Server crashed on startup when API key was missing  
**Solution:** Made server resilient - starts even without API key  
**Result:** Server always starts, AI features gracefully degrade

The server will now always start successfully, even if the API key is missing or invalid. This prevents the "stuck on Starting Container" issue and allows you to fix configuration issues without the container crashing.

After deploying this fix, your Railway deployment should start successfully and you can then troubleshoot any API key issues separately.
