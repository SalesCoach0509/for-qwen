# CRITICAL: Add Backend Files to Your GitHub Repository

## 🚨 The Problem

Your GitHub repository currently only has frontend files. The backend infrastructure is missing, which is why Railway is failing with "Model gemini-3.8-flash not found in capability registry".

## ✅ The Solution

You need to add the complete backend structure to your GitHub repository. I've created all the necessary files in this workspace.

## 📁 Files to Add to GitHub

### Backend Directory Structure

```
backend/
├── package.json
├── server.js
└── ai-gateway/
    ├── index.js
    ├── gateway.js
    ├── provider-adapters.js
    └── model-capabilities.js
```

### What Each File Does

1. **backend/package.json** - Backend dependencies (Express, CORS, Google Generative AI)
2. **backend/server.js** - Main Express server with API endpoints
3. **backend/ai-gateway/index.js** - Gateway module exports
4. **backend/ai-gateway/gateway.js** - AI Gateway class that manages providers
5. **backend/ai-gateway/provider-adapters.js** - Provider adapters (Gemini, OpenAI, NVIDIA NIM, etc.)
6. **backend/ai-gateway/model-capabilities.js** - Model registry with Gemini 3.8 Flash support

## 🚀 Step-by-Step Instructions

### Step 1: Download the Backend Files

Since the backend files are in this workspace, you need to download them. You can:

**Option A: Copy-paste each file**
1. Open each file in this workspace
2. Copy the content
3. Create the file in your GitHub repository

**Option B: Download the entire workspace**
1. Download all files from this workspace
2. Upload the backend/ directory to your GitHub repository

### Step 2: Add Files to GitHub Repository

1. Go to your GitHub repository
2. Click "Add file" → "Create new file"
3. Create the directory structure:
   - Create `backend/` directory
   - Create `backend/ai-gateway/` directory
4. Add each file:
   - `backend/package.json`
   - `backend/server.js`
   - `backend/ai-gateway/index.js`
   - `backend/ai-gateway/gateway.js`
   - `backend/ai-gateway/provider-adapters.js`
   - `backend/ai-gateway/model-capabilities.js`

### Step 3: Commit and Push

```bash
git add backend/
git commit -m "Add backend infrastructure with Gemini 3.8 Flash support"
git push
```

### Step 4: Update Railway Configuration

Make sure your Railway project is configured to:
1. Use the Dockerfile (which copies the backend directory)
2. Set environment variables:
   ```
   LLM_PROVIDER=gemini
   LLM_API_KEY=your-gemini-api-key
   LLM_MODEL=gemini-3.8-flash
   ```

### Step 5: Wait for Railway to Redeploy

Railway will automatically:
1. Detect the new backend files
2. Build the Docker image
3. Install backend dependencies
4. Start the backend server
5. Initialize the AI Gateway with Gemini 3.8 Flash

## ✅ Verification

After deployment, check Railway logs for:

```
✅ AI Gateway initialized successfully
   Provider: gemini
   Model: gemini-3.8-flash
   Capabilities: textGeneration, structuredOutput, conversation, streaming, vision
```

Then test the health endpoint:

```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:

```json
{
  "status": "ok",
  "provider": "gemini",
  "model": "gemini-3.8-flash",
  "capabilities": ["textGeneration", "structuredOutput", "conversation", "streaming", "vision"],
  "mode": "live",
  "apiKeySet": true
}
```

## 🎯 Key Features of the Backend

### 1. Model Registry
- Supports Gemini 3.8 Flash and 3.7 Flash
- Supports multiple NVIDIA NIM models (Llama, DeepSeek, etc.)
- Supports OpenAI, Qwen, and DeepSeek direct APIs

### 2. Provider Abstraction
- Switch providers via environment variables
- No code changes needed to switch models
- Automatic capability validation

### 3. Timeout Protection
- 60-second timeout for API requests
- Clear error messages when timeout occurs
- Prevents indefinite hangs

### 4. Response Cleaning
- Removes prompt leakage from AI responses
- Ensures only user-visible content is displayed
- Protects against internal instruction exposure

### 5. Error Handling
- Comprehensive error messages
- Graceful degradation
- Clear troubleshooting guidance

## 📋 Railway Environment Variables

Your Railway variables should be:

```bash
# Backend variables
LLM_PROVIDER=gemini
LLM_API_KEY=your-gemini-api-key
LLM_MODEL=gemini-3.8-flash

# Frontend variables
VITE_APP_NAME=Performance Coach
VITE_LLM_PROVIDER=gemini
VITE_USE_MOCK_AI=false
```

## 🔧 Troubleshooting

### If you still see "Model not found" error:

1. **Verify files were added** - Check that all 6 backend files exist in your GitHub repo
2. **Check Railway logs** - Look for initialization messages
3. **Verify environment variables** - Make sure LLM_MODEL=gemini-3.8-flash
4. **Check Dockerfile** - Ensure it copies the backend directory

### If backend doesn't start:

1. **Check package.json** - Verify all dependencies are listed
2. **Check Railway build logs** - Look for npm install errors
3. **Verify Node.js version** - Backend requires Node.js 18+

## 📞 Quick Reference

**Files to add:**
- backend/package.json
- backend/server.js
- backend/ai-gateway/index.js
- backend/ai-gateway/gateway.js
- backend/ai-gateway/provider-adapters.js
- backend/ai-gateway/model-capabilities.js

**Railway variables:**
- LLM_PROVIDER=gemini
- LLM_API_KEY=your-key
- LLM_MODEL=gemini-3.8-flash

**Expected result:**
- Backend starts successfully
- AI Gateway initializes with Gemini 3.8 Flash
- API endpoints work correctly
- No more "Model not found" errors

## 🎉 Summary

The backend infrastructure is now complete and ready to add to your GitHub repository. Once you add these files and push to GitHub, Railway will automatically redeploy with full Gemini 3.8 Flash support.

**Next steps:**
1. Add the 6 backend files to your GitHub repository
2. Commit and push
3. Wait for Railway to redeploy
4. Verify the health endpoint works
5. Test the application

That's it! Your app will now work with Gemini 3.8 Flash.
