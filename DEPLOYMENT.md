# AI Performance Coach — Deployment Guide

## Overview

This is a complete deployment package for the AI Performance Coach MVP. The application consists of:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js server
- **AI Provider**: Google Gemini 2.5 Flash
- **Deployment**: Docker container on Railway

The backend serves both the API and the built frontend as a single unit.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway Container                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Express Server (port 3001)                                 │
│  ├── /api/*              → AI endpoints (Gemini)           │
│  ├── /api/health         → Health check                    │
│  └── /*                  → Static frontend (dist/)         │
│                                                              │
│  Environment Variables:                                     │
│  ├── GEMINI_API_KEY (required, secret)                     │
│  ├── GEMINI_MODEL (optional, default: gemini-2.5-flash)   │
│  ├── PORT (optional, default: 3001)                        │
│  └── NODE_ENV (optional, default: production)              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Pre-Deployment Checklist

Before deploying, verify:

- [ ] All audit fixes applied (see audit report)
- [ ] `backend/server.js` binds to `0.0.0.0`
- [ ] `Dockerfile` uses explicit `COPY backend/server.js`
- [ ] `railway.json` has no conflicting `startCommand`
- [ ] `Procfile` uses `node backend/server.js`
- [ ] `.gitignore` excludes `.env` files
- [ ] `.dockerignore` excludes `node_modules` and `.env` files
- [ ] No API keys committed to repository

---

## Deployment Steps

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Final deployment package with audit fixes"
git push origin main
```

### Step 2: Deploy to Railway

1. Go to [Railway](https://railway.app)
2. Create a new project from your GitHub repository
3. Railway will automatically detect the `Dockerfile`
4. Add the required environment variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
5. Deploy

### Step 3: Verify Deployment

After deployment completes:

1. **Check health endpoint**:
   ```
   GET https://your-app.up.railway.app/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "provider": "gemini",
     "model": "gemini-2.5-flash",
     "mode": "live"
   }
   ```

2. **Open the application**:
   ```
   https://your-app.up.railway.app
   ```
   You should see the login screen.

3. **Verify Live Mode**:
   - Look at the top-right corner of the dashboard
   - Should show: **"AI: Gemini (gemini-2.5-flash)"**
   - NOT "Demo Mode"

4. **Test the full flow**:
   - Login (click "Try Demo")
   - Create an interaction
   - Generate a brief
   - Practice roleplay
   - Upload transcript
   - View analysis

5. **Run validation suite**:
   - Click "Validation" button in header
   - Click "Run Validation Suite"
   - All gates should pass with live Gemini

---

## Environment Variables

### Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `GEMINI_API_KEY` | Google Gemini API authentication | `AIzaSy...` |

### Optional

| Variable | Purpose | Default |
|----------|---------|---------|
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.5-flash` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `production` |

**Security Note**: `GEMINI_API_KEY` is server-side only. It is never exposed to the browser or committed to git.

---

## Build Process

### Docker Build Stages

1. **Frontend Build Stage**
   - Base: `node:20-alpine`
   - Installs dependencies: `npm ci`
   - Builds React app: `npm run build`
   - Output: `dist/` directory

2. **Production Stage**
   - Base: `node:20-alpine`
   - Installs backend dependencies: `npm install --only=production`
   - Copies backend source: `backend/server.js`
   - Copies frontend build: `dist/`
   - Exposes port: `3001`
   - Starts server: `node backend/server.js`

### Build Time

- First build: ~3-5 minutes
- Subsequent builds: ~1-2 minutes (with layer caching)

---

## API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and configuration.

### AI Operations

All AI operations go through the backend proxy:

```
POST /api/ai/chat
POST /api/ai/prepare
POST /api/ai/evaluate
POST /api/ai/analyze
POST /api/ai/roleplay
```

The frontend never calls Gemini directly. All requests are proxied through the backend, which holds the API key.

---

## Troubleshooting

### Build Fails

**Issue**: `npm ci` fails
**Solution**: Ensure `package-lock.json` exists. If missing, run `npm install` locally and commit the lockfile.

**Issue**: Frontend build fails
**Solution**: Check TypeScript errors. Run `npm run typecheck` locally to identify issues.

### Runtime Errors

**Issue**: "Demo Mode" shows instead of "AI: Gemini"
**Solution**: Verify `GEMINI_API_KEY` is set in Railway environment variables.

**Issue**: Backend fails to start
**Solution**: Check Railway logs. Common causes:
- Missing `GEMINI_API_KEY`
- Invalid Gemini API key
- Port already in use

**Issue**: Frontend not loading
**Solution**: Verify `dist/` directory exists in the container. Check Dockerfile COPY commands.

### API Errors

**Issue**: 500 errors from `/api/*` endpoints
**Solution**: Check Railway logs for Gemini API errors. Common causes:
- Rate limiting
- Invalid API key
- Network issues

**Issue**: CORS errors
**Solution**: Backend uses `cors()` middleware with default settings (allows all origins). For production, restrict origins in `backend/server.js`.

---

## Security

### API Key Protection

- ✅ `GEMINI_API_KEY` is stored in Railway environment variables
- ✅ Never exposed to browser (no `VITE_` prefix)
- ✅ Never committed to git (in `.gitignore`)
- ✅ Never logged (error messages don't include key)
- ✅ Encrypted at rest by Railway

### Repository Security

- ✅ `.gitignore` excludes `.env` files
- ✅ `.dockerignore` excludes `.env` files
- ✅ No hardcoded secrets in code
- ✅ Private GitHub repository recommended

### Network Security

- ✅ HTTPS enabled by Railway
- ✅ CORS configured (default: allow all, restrict in production)
- ✅ Rate limiting (Gemini API limits apply)

---

## Monitoring

### Railway Dashboard

- **Logs**: View real-time application logs
- **Metrics**: CPU, memory, network usage
- **Deployments**: Deployment history and rollback

### Application Logs

The backend logs:
- Server startup (port, model, mode)
- API requests (endpoint, latency)
- Errors (with stack traces)

### Health Checks

Railway can be configured to poll `/api/health` for health checks.

---

## Cost Estimates

### Railway

- **Hobby Plan**: $5/month (includes $5 credit)
- **Pro Plan**: $20/month (includes $20 credit)
- **Usage**: ~$5-15/month for moderate usage

### Google Gemini API

- **Free Tier**: 60 requests/minute, 1,500 requests/day
- **Paid**: Pay-as-you-go after free tier
- **Estimated Cost**: $0-10/month for moderate usage

### Total Estimated Cost

- **Low usage**: $5-10/month
- **Moderate usage**: $10-25/month
- **High usage**: $25-50/month

---

## Scaling

### Vertical Scaling

Railway allows you to increase CPU and memory:
- **Current**: 1 vCPU, 2GB RAM (default)
- **Recommended**: 2 vCPU, 4GB RAM for production

### Horizontal Scaling

The application is stateless (uses localStorage for persistence). You can scale horizontally by:
1. Increasing replica count in `railway.json`
2. Adding a load balancer (Railway provides this automatically)

**Note**: Current MVP uses localStorage for persistence. For multi-replica deployments, you'll need a shared database (PostgreSQL, Redis, etc.).

---

## Maintenance

### Updates

To update the application:
1. Make changes locally
2. Test locally
3. Commit and push to GitHub
4. Railway automatically deploys

### Rollbacks

Railway keeps deployment history. To rollback:
1. Go to Railway dashboard
2. Select previous deployment
3. Click "Rollback"

### Backups

- **Code**: Backed up in GitHub
- **Data**: localStorage is client-side (no server backups needed for MVP)
- **Environment Variables**: Backed up in Railway

---

## Known Limitations (MVP)

1. **Persistence**: Uses localStorage (client-side only)
   - Data is per-browser, not shared across users
   - No server-side database yet

2. **Authentication**: No user authentication
   - Anyone with the URL can access the app
   - No user isolation

3. **Multi-tenancy**: Single-tenant deployment
   - All users share the same Gemini API key
   - No organization isolation

4. **Rate Limiting**: Subject to Gemini API limits
   - 60 requests/minute
   - 1,500 requests/day (free tier)

These limitations are acceptable for MVP validation. Future iterations should add:
- PostgreSQL database
- User authentication (JWT/SSO)
- Multi-tenancy support
- Rate limiting middleware

---

## Support

### Documentation

- **README.md**: Project overview
- **ARCHITECTURE.md**: System architecture
- **docs/ADVERSARIAL_TESTS.md**: Test cases
- **docs/FINAL_SPRINT_REPORT.md**: Sprint summary

### Issues

For deployment issues:
1. Check Railway logs
2. Verify environment variables
3. Review this deployment guide
4. Check audit report for known issues

### Contact

For product questions or feature requests, refer to the product documentation.

---

## Deployment Verification Checklist

After deployment, verify:

- [ ] Health endpoint returns 200 OK
- [ ] Frontend loads without errors
- [ ] "AI: Gemini" badge shows (not "Demo Mode")
- [ ] Can create interaction
- [ ] Can generate brief
- [ ] Can practice roleplay
- [ ] Can upload transcript
- [ ] Can view analysis
- [ ] Validation suite passes
- [ ] No errors in Railway logs

---

## Final Notes

This deployment package has been audited and all critical issues have been fixed:

✅ Dockerfile COPY order corrected
✅ railway.json startCommand conflict resolved
✅ Procfile command aligned with Dockerfile
✅ Explicit host binding (0.0.0.0) added
✅ All audit fixes verified

The application is ready for production deployment on Railway.

---

**Last Updated**: 2026-01-XX
**Version**: MVP v0.1 (Final)
**Status**: ✅ Ready for Deployment
