# Railway Deployment - Quick Setup Summary

**Date:** 2025-12-28  
**Status:** ✅ Ready to Deploy

---

## What Was Added

### 1. Configuration Files

- ✅ **`railway.json`** - Railway-specific build and deployment configuration
- ✅ **`nixpacks.toml`** - Alternative Nixpacks configuration for Railway
- ✅ **`RAILWAY_DEPLOYMENT_GUIDE.md`** - Comprehensive deployment guide

### 2. Dependencies

- ✅ **`serve@^14.2.1`** - Static file server for Railway (added to dependencies)

### 3. Package.json Scripts

```json
{
  "start": "serve -s dist -l 5173", // Local testing
  "start:railway": "serve -s dist -l $PORT", // Railway production
  "build:railway": "npm run build" // Railway build (same as build)
}
```

### 4. Vite Configuration

Updated `vite.config.ts` to support multiple deployment targets:

```typescript
base:
  process.env.VITE_BASE_PATH ||              // Manual override
  (process.env.RAILWAY_ENVIRONMENT           // Auto-detect Railway
    ? '/'                                    // Railway: root path
    : process.env.NODE_ENV === 'production'
      ? '/prompt-gen-web/'                   // GitHub Pages: subpath
      : '/'),                                // Local: root path
```

---

## Railway Configuration

### Build Command

```bash
npm ci && npm run build
```

### Start Command

```bash
npm run start:railway
```

### Environment Variables (Optional)

| Variable         | Value        | Purpose                                       |
| ---------------- | ------------ | --------------------------------------------- |
| `NODE_ENV`       | `production` | Enables production mode (auto-set by Railway) |
| `VITE_BASE_PATH` | `/`          | Override base path if needed (optional)       |

---

## OAuth Configuration

### Required Redirect URIs

The marketplace OAuth client needs these redirect URIs registered:

1. **Local Development:** `http://localhost:5173/oauth/callback`
2. **GitHub Pages:** `https://signatur3-git.github.io/prompt-gen-web/oauth/callback`
3. **Railway:** `https://your-app-name.up.railway.app/oauth/callback`

> **Action Required:** Add the Railway URL to the marketplace OAuth client after deployment.

---

## Deployment Steps

### Quick Start (Railway Dashboard)

1. **Sign in to [railway.app](https://railway.app)**

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `signatur3-git/prompt-gen-web`

3. **Railway Auto-Detects Configuration**
   - Railway will find `railway.json` and use it automatically
   - No manual configuration needed!

4. **Wait for Deployment**
   - First build takes ~2-3 minutes
   - Railway provides a URL like: `https://prompt-gen-web-production.up.railway.app`

5. **Update OAuth Configuration**
   - Copy your Railway URL
   - Add `https://your-railway-url.up.railway.app/oauth/callback` to marketplace OAuth client

6. **Test**
   - Visit your Railway URL
   - Click "Connect to Marketplace"
   - Complete OAuth flow

### Alternative: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# View logs
railway logs
```

---

## Testing Locally with Serve

Test the Railway serving behavior locally:

```bash
# Build the app
npm run build

# Serve it (simulates Railway)
npm run start

# Visit http://localhost:5173
```

---

## Differences: Railway vs GitHub Pages

| Aspect                    | GitHub Pages                             | Railway                   |
| ------------------------- | ---------------------------------------- | ------------------------- |
| **Base URL**              | `signatur3-git.github.io/prompt-gen-web` | `your-app.up.railway.app` |
| **Base Path**             | `/prompt-gen-web/`                       | `/` (root)                |
| **Deploy Trigger**        | Git tags (`v*`)                          | Any commit (configurable) |
| **Build Time**            | ~2-3 min (GitHub Actions)                | ~1-2 min (Railway)        |
| **Cost**                  | Free                                     | Free tier available       |
| **Environment Variables** | Build-time only                          | Build + runtime           |

---

## How the Base Path Logic Works

The updated `vite.config.ts` automatically detects the deployment target:

```typescript
// Priority order:
1. VITE_BASE_PATH env var (manual override)
2. RAILWAY_ENVIRONMENT detected → use '/'
3. NODE_ENV === 'production' → use '/prompt-gen-web/' (GitHub Pages)
4. Default → '/' (local development)
```

**Result:**

- ✅ Railway builds use `/` (root path)
- ✅ GitHub Pages builds use `/prompt-gen-web/` (subpath)
- ✅ Local development uses `/` (root path)
- ✅ No manual configuration needed!

---

## Troubleshooting

### Build Fails on Railway

**Check:**

- Railway logs for specific errors
- `package-lock.json` is committed
- Node version compatibility (Railway uses Node 20)

### App Shows 404 or Blank Page

**Fix:**

- Ensure `serve -s` is used (the `-s` flag is critical for SPA routing)
- Check Railway logs for startup errors
- Verify `dist/index.html` exists after build

### OAuth Doesn't Work

**Fix:**

- Add Railway URL to marketplace OAuth client redirect URIs
- Check `marketplace.config.ts` redirect URI logic
- Test callback URL manually: `https://your-railway-url/oauth/callback?code=test`

---

## Next Steps

1. ✅ All configuration files created
2. ✅ Dependencies installed (`serve`)
3. ✅ Scripts added to `package.json`
4. ✅ Vite config updated for multi-target deployment
5. ⏳ Deploy to Railway (follow steps above)
6. ⏳ Register Railway redirect URI in marketplace
7. ⏳ Test OAuth flow on Railway

---

## Summary

✅ **Railway deployment is ready!**

- Configuration files in place
- Dependencies installed
- Scripts configured
- Vite config handles base path automatically
- OAuth will work once redirect URI is registered

**No code changes needed** - just deploy to Railway and register the OAuth redirect URI! 🚀

---

## Files Modified/Created

- ✅ `railway.json` (created)
- ✅ `nixpacks.toml` (created)
- ✅ `RAILWAY_DEPLOYMENT_GUIDE.md` (created)
- ✅ `package.json` (updated: added `serve` dependency + scripts)
- ✅ `vite.config.ts` (updated: multi-target base path logic)

---

## Command Reference

```bash
# Local testing
npm run build        # Build the app
npm run start        # Serve locally (like Railway does)

# Railway deployment
railway login        # Login to Railway (CLI)
railway init         # Link to project
railway up           # Deploy
railway logs         # View logs

# GitHub Pages deployment (unchanged)
git tag v1.0.4-rc
git push origin v1.0.4-rc
```

---

**Ready to deploy? Follow the steps in `RAILWAY_DEPLOYMENT_GUIDE.md`!** 🎉
