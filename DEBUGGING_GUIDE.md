# DEBUGGING GUIDE - Demo Mode Issue

## Problem
The web app is showing "Demo Mode" instead of "AI: Gemini" and all features appear to be in demo phase.

## Root Cause Analysis

The issue is likely one of the following:

1. **Backend not running or not accessible**
2. **Backend not serving frontend in production mode**
3. **Frontend cannot reach backend health endpoint**
4. **NODE_ENV not set to 'production' on Railway**
5. **CORS or network issues**

## Debugging Steps

### Step 1: Check Railway Logs

After deploying, check the Railway logs for these messages:

```
🔍 NODE_ENV: production
🚀 PERFORMANCE COACH BACKEND STARTING
📡 Provider: gemini
🤖 Model: gemini-3.8-flash
🔑 API Key: ✅ SET
🌐 Port: 3001
🌍 NODE_ENV: production
✅ Backend ready to accept requests
🔍 Serving static files from: /app/dist
```

**If you see these messages:** Backend is running correctly  
**If you DON'T see these messages:** Backend is not starting or NODE_ENV is not set

### Step 2: Test Health Endpoint

Open this URL in your browser:
```
https://your-app.up.railway.app/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "provider": "gemini",
  "model": "gemini-3.8-flash",
  "capabilities": ["textGeneration", "structuredOutput", "conversation", "streaming", "vision"],
  "maxContext": 1000000,
  "mode": "live",
  "apiKeySet": true,
  "timestamp": "2026-01-13T..."
}
```

**If you get this response:** Backend is accessible  
**If you get an error:** Backend is not accessible or not running

### Step 3: Check Browser Console

Open your app in the browser and open the browser console (F12). Look for these messages:

```
🔍 BACKEND_URL: 
🔍 window.location.hostname: your-app.up.railway.app
🔍 LLMStatus: Checking backend health...
🔍 checkBackendHealth: Fetching /api/health
🔍 checkBackendHealth: Response status: 200
✅ checkBackendHealth: Success, provider: gemini model: gemini-3.8-flash
✅ LLMStatus: Backend is available, setting LIVE mode
```

**If you see these messages:** Frontend can reach backend  
**If you see errors:** Frontend cannot reach backend

### Step 4: Check Diagnostic Endpoint

Open this URL in your browser:
```
https://your-app.up.railway.app/api/diagnostic
```

**Expected response:**
```json
{
  "mode": "live",
  "provider": "gemini",
  "model": "gemini-3.8-flash",
  "backendStatus": "connected",
  "gatewayStatus": "ready",
  "providerStatus": "READY",
  "capabilities": [...],
  "maxContext": 1000000,
  "lastCallStatus": null,
  "lastCallTimestamp": null,
  "timestamp": "2026-01-13T..."
}
```

**If you get this response:** Everything is working  
**If you get an error:** Backend is not accessible

## Common Issues and Solutions

### Issue 1: Backend Not Starting

**Symptoms:**
- Railway logs show errors
- Health endpoint returns 503 or connection refused

**Solution:**
- Check Railway logs for error messages
- Verify `LLM_API_KEY` is set correctly
- Verify `LLM_PROVIDER=gemini` is set
- Verify `LLM_MODEL=gemini-3.8-flash` is set

### Issue 2: Backend Not Serving Frontend

**Symptoms:**
- Health endpoint works but app shows blank page or 404
- Railway logs don't show "Serving static files from"

**Solution:**
- Check if `NODE_ENV=production` is set in Railway
- If not set, add it to Railway environment variables
- Redeploy the application

### Issue 3: Frontend Cannot Reach Backend

**Symptoms:**
- Browser console shows fetch errors
- Health endpoint works but frontend shows "Demo Mode"

**Solution:**
- Check browser console for CORS errors
- Verify backend URL is correct (should be empty string in production)
- Check if backend is serving CORS headers correctly

### Issue 4: NODE_ENV Not Set

**Symptoms:**
- Railway logs show "Not in production mode, not serving static files"
- App shows blank page or 404

**Solution:**
- Add `NODE_ENV=production` to Railway environment variables
- Redeploy the application

### Issue 5: API Key Not Set

**Symptoms:**
- Railway logs show "❌ API Key: ❌ NOT SET"
- Health endpoint shows `apiKeySet: false`

**Solution:**
- Add `LLM_API_KEY=your-actual-gemini-api-key` to Railway environment variables
- Redeploy the application

## Quick Diagnostic Checklist

Run through this checklist to diagnose the issue:

- [ ] Railway logs show backend starting successfully
- [ ] Railway logs show "NODE_ENV: production"
- [ ] Railway logs show "✅ API Key: ✅ SET"
- [ ] Railway logs show "Serving static files from: /app/dist"
- [ ] `/api/health` endpoint returns valid JSON
- [ ] `/api/health` shows `provider: "gemini"`
- [ ] `/api/health` shows `apiKeySet: true`
- [ ] Browser console shows backend health check success
- [ ] Browser console shows no CORS errors
- [ ] `/api/diagnostic` endpoint returns valid JSON
- [ ] `/api/diagnostic` shows `providerStatus: "READY"`

## Environment Variables Checklist

Verify these environment variables are set in Railway:

```
LLM_PROVIDER=gemini
LLM_API_KEY=your-actual-gemini-api-key
LLM_MODEL=gemini-3.8-flash
NODE_ENV=production
PORT=3001
```

## Expected Behavior After Fix

### Railway Logs Should Show:
```
🔍 NODE_ENV: production
🚀 PERFORMANCE COACH BACKEND STARTING
📡 Provider: gemini
🤖 Model: gemini-3.8-flash
🔑 API Key: ✅ SET
🌐 Port: 3001
🌍 NODE_ENV: production
✅ Backend ready to accept requests
🔍 Serving static files from: /app/dist
```

### Health Endpoint Should Return:
```json
{
  "status": "ok",
  "provider": "gemini",
  "model": "gemini-3.8-flash",
  "mode": "live",
  "apiKeySet": true
}
```

### Browser Console Should Show:
```
🔍 BACKEND_URL: 
🔍 window.location.hostname: your-app.up.railway.app
🔍 LLMStatus: Checking backend health...
🔍 checkBackendHealth: Fetching /api/health
🔍 checkBackendHealth: Response status: 200
✅ checkBackendHealth: Success, provider: gemini model: gemini-3.8-flash
✅ LLMStatus: Backend is available, setting LIVE mode
```

### UI Should Show:
- Green badge: "AI: Gemini (gemini-3.8-flash)"
- NOT amber badge: "Demo Mode"

## Next Steps

1. **Deploy the updated code** (with debugging logs)
2. **Check Railway logs** for the debug messages
3. **Test the health endpoint** in browser
4. **Check browser console** for debug messages
5. **Report back** with what you see in the logs and console

Based on what you see, we can identify the exact issue and fix it.

---

## Quick Test Commands

### Test Health Endpoint:
```bash
curl https://your-app.up.railway.app/api/health
```

### Test Diagnostic Endpoint:
```bash
curl https://your-app.up.railway.app/api/diagnostic
```

### Test LLM Test Endpoint:
```bash
curl -X POST https://your-app.up.railway.app/api/diagnostic/llm-test
```

---

**Status:** Debugging logs added, ready for deployment and testing
