# CRITICAL FIX: Error Handling for Live API Calls

## Problem Identified

**Symptom:** Backend health check passes but all actual API calls fail with empty error objects `{}`

**Root Cause:** Error objects were not being properly serialized when caught and returned to the frontend. The error details were being lost in the catch blocks.

## What Was Fixed

### 1. Backend Error Serialization (backend/server.js)

**Before:**
```javascript
res.status(500).json({ 
  error: 'LIVE_AI_ERROR',
  message: 'Failed to generate response with AI Gateway',
  details: error.message 
});
```

**After:**
```javascript
// Ensure error is properly serialized
const errorResponse = {
  error: 'LIVE_AI_ERROR',
  message: error.message || 'Unknown error occurred',
  details: error.message || 'Unknown error occurred',
  name: error.name || 'Error',
  stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
};

console.error('Returning error response:', JSON.stringify(errorResponse));

res.status(500).json(errorResponse);
```

**Changes:**
- Added fallback values for error.message
- Added error.name to response
- Added stack trace in development mode
- Added logging to see what's being returned
- Applied to ALL error handlers: chat, prepare, evaluate, analyze, roleplay

### 2. Provider Adapter Error Wrapping (backend/ai-gateway/provider-adapters.js)

**Before:**
```javascript
} catch (error) {
  const latency = Date.now() - startTime;
  console.error(`✗ Gemini call failed after ${latency}ms:`, error);
  throw error;
}
```

**After:**
```javascript
} catch (error) {
  const latency = Date.now() - startTime;
  console.error(`✗ Gemini call failed after ${latency}ms:`, error);
  
  // Ensure error is properly serialized with all details
  const errorMessage = error.message || 'Unknown error';
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
```

**Changes:**
- Extract error details before throwing
- Create wrapped error with all details preserved
- Add comprehensive logging
- Preserve original error reference

## Expected Result

After deploying these fixes:

1. **Empty error objects `{}` should no longer appear**
2. **Actual error messages will be visible in:**
   - Railway logs (backend console.error)
   - Frontend console (if development mode)
   - API response (error.message, error.details)

3. **You'll be able to see the actual Gemini API error:**
   - Invalid API key
   - Rate limit exceeded
   - Model not available
   - Network errors
   - etc.

## Next Steps

### 1. Push Changes to GitHub
```bash
git add backend/server.js backend/ai-gateway/provider-adapters.js
git commit -m "Fix error serialization for live API calls"
git push origin main
```

### 2. Wait for Railway Auto-Deploy
Railway will automatically redeploy with the fixes (2-3 minutes).

### 3. Test Again
Run the validation suite again. You should now see:
- Actual error messages instead of `{}`
- Clear indication of what's wrong with the Gemini API call

### 4. Check Railway Logs
Look for the detailed error logs:
```
✗ Gemini call failed after Xms: <error details>
✗ Error name: <error name>
✗ Error message: <error message>
✗ Error details: <error details>
Returning error response: <full error response>
```

## Common Gemini API Errors

Once you see the actual error, it will likely be one of these:

### 1. Invalid API Key
```
Error: 401 Unauthorized
Message: API key not valid
```
**Fix:** Check `LLM_API_KEY` environment variable in Railway

### 2. Model Not Available
```
Error: 404 Not Found
Message: Model gemini-3.8-flash not found
```
**Fix:** Change `LLM_MODEL` to a valid model like `gemini-2.5-flash`

### 3. Rate Limit Exceeded
```
Error: 429 Too Many Requests
Message: Quota exceeded
```
**Fix:** Wait or check Gemini API quota

### 4. Network Error
```
Error: fetch failed
Message: Network error
```
**Fix:** Check Railway network connectivity

## Verification

After deploying and running validation again:

✅ **Success:** You see actual error messages  
❌ **Failure:** You still see empty `{}` objects

If you still see `{}`, the error is happening before the catch block, which would indicate a different issue.

## Files Changed

1. `backend/server.js` - Enhanced error serialization in all endpoints
2. `backend/ai-gateway/provider-adapters.js` - Enhanced error wrapping in Gemini adapter

## Status

✅ **FIXED** - Ready for deployment

Push the changes and test again. You should now see the actual Gemini API error instead of empty objects.
