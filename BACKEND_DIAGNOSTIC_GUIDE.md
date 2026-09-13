# 🔧 Backend Diagnostic Guide

## Current Issue

Your validation shows:
- ✅ Live Mode: true (frontend detects backend)
- ❌ Every backend call fails with `✗ Backend call failed after XXXms: {}`
- ⚠️ Empty error object `{}` suggests backend is returning errors without proper error bodies

## What I've Fixed

I've improved the backend to:

1. **Check GEMINI_API_KEY on startup** - Backend will exit with clear error if key is missing
2. **Better error logging** - All errors now log to Railway logs with full details
3. **Diagnostic endpoint** - New `/api/diagnostic` endpoint to test Gemini connection
4. **Improved startup messages** - Clear indication of API key status

## What You Need to Do

### Step 1: Deploy the Updated Backend

```bash
# Download the updated workspace
# Upload to GitHub
# Railway will auto-deploy
```

### Step 2: Check Railway Logs

After deployment, go to Railway dashboard and check the logs. You should see:

```
============================================================
🚀 PERFORMANCE COACH BACKEND STARTING
============================================================
📡 Provider: Gemini
🤖 Model: gemini-2.5-flash
🔑 API Key: ✅ SET (39 chars)  ← OR ❌ NOT SET
🔒 Mode: LIVE AI (API key secured server-side)
🌐 Port: 3001
📁 Serving frontend from: /app/dist
🔍 Diagnostic endpoint: http://localhost:3001/api/diagnostic
============================================================
✅ Backend ready to accept requests
============================================================
✅ Gemini initialized successfully
```

**If you see `❌ NOT SET`:**
- Go to Railway → Your Service → Variables tab
- Add `GEMINI_API_KEY` with your Gemini API key
- Get key from: https://aistudio.google.com/apikey
- Railway will auto-restart

### Step 3: Test the Diagnostic Endpoint

Open this URL in your browser:
```
https://your-app-name.up.railway.app/api/diagnostic
```

**Expected response:**
```json
{
  "timestamp": "2026-01-XXT...",
  "environment": {
    "NODE_ENV": "production",
    "PORT": "3001",
    "GEMINI_API_KEY_set": true,
    "GEMINI_API_KEY_length": 39,
    "GEMINI_MODEL": "gemini-2.5-flash"
  },
  "gemini": {
    "initialized": true,
    "model": "gemini-2.5-flash"
  },
  "tests": {
    "geminiConnection": {
      "success": true,
      "response": "OK",
      "timestamp": "2026-01-XXT..."
    }
  }
}
```

**If `geminiConnection.success` is `false`:**
- Check the `error` field for details
- Common issues:
  - Invalid API key
  - API key expired
  - Quota exceeded
  - Network issues

### Step 4: Test the Health Endpoint

Open this URL:
```
https://your-app-name.up.railway.app/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "mode": "live",
  "apiKeySet": true,
  "timestamp": "2026-01-XXT..."
}
```

### Step 5: Run Validation Again

Once the diagnostic endpoint shows `geminiConnection.success: true`:

1. Open your app
2. Click "Validation" button
3. Click "Run Validation Suite"
4. Check the results

**Expected changes:**
- No more `✗ Backend call failed` errors
- Real Gemini responses (not mock)
- Different scores (not deterministic 0.00 variance)

## Common Issues & Solutions

### Issue 1: Backend Crashes on Startup

**Symptoms:**
- Railway logs show: `❌ CRITICAL ERROR: GEMINI_API_KEY environment variable is not set!`
- Backend exits immediately

**Solution:**
1. Go to Railway → Your Service → Variables
2. Add `GEMINI_API_KEY` = your-key-here
3. Railway will auto-restart

### Issue 2: Gemini Connection Fails

**Symptoms:**
- `/api/diagnostic` shows `geminiConnection.success: false`
- Error message mentions authentication or quota

**Solution:**
1. Verify API key is correct
2. Check if key has expired
3. Check Gemini API quota at https://aistudio.google.com/apikey
4. Try regenerating the API key

### Issue 3: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Backend logs show requests but frontend can't connect

**Solution:**
- Already fixed in the updated code (CORS allows all origins)
- If still failing, check Railway's network settings

### Issue 4: Backend Not Starting

**Symptoms:**
- Railway logs show no startup messages
- Service shows as "crashed" or "failed"

**Solution:**
1. Check Railway logs for error messages
2. Verify all dependencies are installed
3. Check if port 3001 is available
4. Try redeploying

## What to Report Back

After deploying and testing, tell me:

1. **Railway startup logs** - Do you see the startup messages?
2. **API Key status** - Does it show `✅ SET` or `❌ NOT SET`?
3. **Diagnostic endpoint** - What does `/api/diagnostic` return?
4. **Gemini connection test** - Is `geminiConnection.success` true or false?
5. **Validation results** - Do you still see `✗ Backend call failed` errors?

## If Everything Looks Good But Still Failing

If:
- ✅ Backend starts successfully
- ✅ API key is set
- ✅ Diagnostic endpoint shows success
- ❌ Validation still fails

Then the issue is likely:
- Frontend not calling the correct URL
- Network/proxy issues
- Request format issues

In that case, I'll need to improve the frontend error handling to show exactly what's failing.

## Quick Test Commands

Test from your browser:

```bash
# Health check
curl https://your-app.up.railway.app/api/health

# Diagnostic
curl https://your-app.up.railway.app/api/diagnostic

# Test chat endpoint
curl -X POST https://your-app.up.railway.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say OK"}]}'
```

## Next Steps

1. Deploy the updated backend
2. Check Railway logs
3. Test `/api/diagnostic`
4. Report back with the results
5. I'll help you fix whatever issue remains

---

**The backend improvements are ready. Deploy them and let me know what you see!**
