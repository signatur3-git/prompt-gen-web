# Railway Deployment Guide

**Date:** 2025-12-28  
**Status:** ✅ Ready for Railway Deployment

---

## Overview

This guide explains how to deploy the prompt-gen-web SPA to Railway alongside the existing GitHub Pages deployment. Railway offers:

- **Dynamic environment variables** for different environments
- **Custom build and start commands**
- **Automatic deployments** from GitHub
- **Built-in HTTPS** with custom domains
- **Faster build times** than GitHub Actions in some cases

---

## Railway vs GitHub Pages

| Feature                   | GitHub Pages       | Railway                                 |
| ------------------------- | ------------------ | --------------------------------------- |
| **Cost**                  | Free               | Free tier available, then pay-as-you-go |
| **Build Method**          | GitHub Actions     | Railway's build system                  |
| **Base Path**             | `/prompt-gen-web/` | `/` (root)                              |
| **Environment Variables** | Build-time only    | Build-time + runtime                    |
| **Custom Domain**         | Yes (free HTTPS)   | Yes (free HTTPS)                        |
| **Build Time**            | ~2-3 minutes       | ~1-2 minutes                            |
| **Deployment Trigger**    | Git tags           | Any branch/commit                       |

---

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Connected to Railway
3. **Marketplace OAuth Client**: Already registered with redirect URIs

---

## Railway Configuration

### Build and Start Commands

Railway needs to know how to build and serve the static SPA. Since this is a pure frontend app built with Vite, we need a simple HTTP server to serve the built files.

**Build Command:**

```bash
npm install && npm run build
```

**Start Command:**

```bash
npx serve -s dist -l $PORT
```

> **Note:** Railway automatically injects the `$PORT` environment variable. The `serve` package is a simple static file server that handles SPA routing correctly.

---

## Environment Variables for Railway

Set these in Railway's dashboard under **Variables**:

| Variable               | Value                                                      | Purpose                                   |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| `NODE_ENV`             | `production`                                               | Enables production optimizations          |
| `VITE_MARKETPLACE_URL` | `https://prompt-gen-marketplace-production.up.railway.app` | Points to marketplace (optional override) |

> **Important:** Railway uses `/` as the base path, not `/prompt-gen-web/`. The build will automatically detect this.

---

## Setup Instructions

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Go to [railway.app](https://railway.app)** and sign in

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `signatur3-git/prompt-gen-web`

3. **Configure Build Settings**
   - Root Directory: `/` (leave default)
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist -l $PORT`

4. **Set Environment Variables** (Optional)
   - Add `NODE_ENV=production` (usually set automatically)
   - Add `VITE_MARKETPLACE_URL` if you want to override

5. **Add Domain** (Optional)
   - Railway provides a free `.railway.app` domain
   - Or add your custom domain in Settings → Domains

6. **Deploy**
   - Railway will automatically build and deploy
   - Monitor logs in the deployment dashboard

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project (or create new one)
railway init

# Set environment variables
railway variables set NODE_ENV=production

# Deploy
railway up
```

---

## Configuration Files

### 1. `railway.json` (Railway Configuration)

This file is included in the repository and tells Railway how to deploy:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:railway",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

> **Note:** The build process is handled by `nixpacks.toml` to avoid duplicate build steps.

### 2. `nixpacks.toml` (Nixpacks Configuration)

Railway uses Nixpacks by default. This configuration is included in the repository:

```toml
[phases.setup]
nixPkgs = ["nodejs_22"]

[phases.install]
cmds = ["npm cache clean --force", "npm ci --prefer-offline --no-audit"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start:railway"
```

> **Note:** Node.js 22 is required because some dependencies (@oxc-project/runtime, @vitejs/plugin-vue, rolldown) require Node >=22.12.0 or ^20.19.0.

### 3. Update `vite.config.ts` for Railway

The current config already handles this! It uses `process.env.NODE_ENV` to determine the base path:

```typescript
base: process.env.NODE_ENV === 'production' ? '/prompt-gen-web/' : '/',
```

**For Railway deployment**, we need to distinguish between GitHub Pages and Railway:

```typescript
// Option 1: Use environment variable
base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/prompt-gen-web/' : '/'),

// Option 2: Detect Railway
base: process.env.RAILWAY_ENVIRONMENT ? '/' : (process.env.NODE_ENV === 'production' ? '/prompt-gen-web/' : '/'),
```

### 4. Update `package.json`

Add the `serve` package as a production dependency (Railway needs it):

```json
{
  "dependencies": {
    "js-yaml": "^4.1.1",
    "pinia": "^3.0.4",
    "vue": "^3.5.24",
    "vue-router": "^4.6.4",
    "serve": "^14.2.1"
  }
}
```

---

## Important: Ensure Railway Uses Dockerfile (Not Nixpacks)

If your Railway build logs show it using the `ghcr.io/railwayapp/nixpacks:...` image, Railway is still building with **Nixpacks**, even if this repo contains `railway.json`.

To force Docker builds:

1. Railway Dashboard → Project → **Settings**
2. **Build** / **Builder**:
   - Select **Dockerfile** (or "Use Dockerfile")
   - Ensure Dockerfile path is `./Dockerfile`
3. **Clear Build Cache** (important after switching builders)
4. Redeploy

This repo includes a `Dockerfile` that pins Node **20.19** and uses `npm ci --include=optional` for reliable installs.

---

## OAuth Configuration

### Redirect URI for Railway

You need to register a new OAuth redirect URI in the marketplace:

**Development:**

- `http://localhost:5173/oauth/callback`

**GitHub Pages:**

- `https://signatur3-git.github.io/prompt-gen-web/oauth/callback`

**Railway (example):**

- `https://prompt-gen-web-production.up.railway.app/oauth/callback`
- Or your custom domain: `https://yourdomain.com/oauth/callback`

### Update Marketplace OAuth Client

In the marketplace database or admin panel, update the `prompt-gen-web` client:

```sql
-- Add Railway redirect URI
INSERT INTO oauth_clients (client_id, redirect_uris, ...)
VALUES ('prompt-gen-web',
  '["http://localhost:5173/oauth/callback",
    "https://signatur3-git.github.io/prompt-gen-web/oauth/callback",
    "https://prompt-gen-web-production.up.railway.app/oauth/callback"]',
  ...);
```

---

## Deployment Workflow

### Automatic Deployments

Railway can deploy automatically on:

- **Every commit** to a specific branch (e.g., `main`)
- **Pull requests** (preview deployments)
- **Manual triggers**

### Deployment Triggers

Configure in Railway Dashboard → Settings → Deployments:

- **Production**: Deploy from `main` branch
- **Staging**: Deploy from `develop` branch
- **PR Previews**: Enable automatic PR deployments

---

## Build Scripts for Railway

Add these optional scripts to `package.json`:

```json
{
  "scripts": {
    "build:railway": "NODE_ENV=production npm run build",
    "start:railway": "serve -s dist -l $PORT",
    "deploy:railway": "railway up"
  }
}
```

---

## Testing Railway Deployment

### 1. Local Testing with `serve`

Simulate Railway's serving behavior:

```bash
# Build the app
npm run build

# Serve it like Railway does
npx serve -s dist -l 3000

# Visit http://localhost:3000
```

### 2. Preview Deployments

Railway provides unique URLs for each deployment:

- `https://prompt-gen-web-production-abc123.up.railway.app`

Test thoroughly before promoting to production!

### 3. Check Logs

Monitor Railway logs in real-time:

- Dashboard → Project → Deployments → View Logs
- Or via CLI: `railway logs`

---

## Troubleshooting

### Build Fails

**Issue:** `npm ci` fails or dependencies can't be installed

**Solution:**

- Check Node.js version (Railway uses Node 20 by default)
- Verify `package-lock.json` is committed
- Check build logs for specific errors

### App Doesn't Load

**Issue:** Railway serves the app but it shows 404 or blank page

**Solutions:**

- Verify `serve -s` is used (the `-s` flag enables SPA routing)
- Check base path in `vite.config.ts`
- Verify `dist/` directory contains `index.html`

### OAuth Fails

**Issue:** OAuth callback doesn't work on Railway

**Solutions:**

- Verify the Railway URL is registered in marketplace OAuth client
- Check `marketplace.config.ts` redirect URI logic
- Test callback URL manually: `https://your-railway-url.railway.app/oauth/callback?code=test&state=test`

### Environment Variables Not Working

**Issue:** `process.env.VITE_*` variables are undefined

**Solution:**

- Railway variables must be prefixed with `VITE_` to be exposed to the frontend
- Set them in Railway Dashboard → Variables
- Rebuild after adding/changing variables

### Build Fails with npm EBUSY Error

**Issue:**

```
npm error EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'
npm error errno -16
Build Failed: build daemon returned an error
```

**Cause:** Railway's build environment sometimes has cache locking issues with npm.

**Solution:**

The fix is already implemented in this repository:

- ✅ `railway.json` includes `npm cache clean --force` before install
- ✅ `nixpacks.toml` clears cache in the install phase
- ✅ `.railwayignore` excludes problematic cache directories

If you still encounter this error:

1. **Trigger a clean rebuild:**
   - Railway Dashboard → Deployments → Three dots menu → "Redeploy"

2. **Clear Railway's build cache:**
   - Settings → Clear Build Cache
   - Then deploy again

3. **Check build logs:**
   - Look for the cache clean command in the logs
   - Verify it runs before `npm ci`

4. **As a last resort, simplify the build command:**
   - In Railway Dashboard → Settings → Build Command
   - Try: `rm -rf node_modules/.cache && npm ci --prefer-offline && npm run build`

### Node Version Mismatch

**Issue:** Build fails with EBADENGINE warnings:

```
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: '@oxc-project/runtime@0.97.0',
npm warn EBADENGINE   required: { node: '^20.19.0 || >=22.12.0' },
npm warn EBADENGINE   current: { node: 'v20.18.1', npm: '10.8.2' }
npm warn EBADENGINE }
```

**Cause:** Some dependencies require Node.js 20.19.0 or higher, or Node.js 22.12.0 or higher.

**Solution:**

Railway is configured to use Node.js 22 in `nixpacks.toml`:

- ✅ `nixPkgs = ["nodejs_22"]` ensures Node 22 is used
- This satisfies the `>=22.12.0` requirement

If you still see Node version issues:

1. **Verify nixpacks.toml is committed** to your repository
2. **Check Railway build logs** to confirm Node 22 is being used
3. **Clear build cache** in Railway Dashboard → Settings
4. **Redeploy** to pick up the Node 22 configuration

For local development:

- Use Node 22 or Node 20.19.0+: `nvm use 22` or `nvm install 22`
- Or update to the latest Node 20.x: `nvm install 20 --latest-npm`

---

## Cost Estimates

### Railway Pricing (as of 2024)

- **Free Tier**: $5/month in credits (enough for small projects)
- **Pro Plan**: $20/month + usage
- **Static Site**: ~$0.01 - $1/month (very cheap since it's just serving files)

### GitHub Pages

- **Always Free** for public repositories
- **Unlimited bandwidth**

---

## Monitoring & Analytics

### Railway Metrics

Built-in monitoring:

- **Deployment history**
- **Build logs**
- **Runtime logs**
- **Uptime monitoring**

### External Analytics

You can add:

- **Google Analytics** or **Plausible** for traffic
- **Sentry** for error tracking
- **LogRocket** for session replay

---

## Comparison: When to Use Railway vs GitHub Pages

### Use GitHub Pages if:

- ✅ You want completely free hosting
- ✅ You're okay with `/prompt-gen-web/` base path
- ✅ You only need deployments on releases (tags)
- ✅ You don't need server-side logic

### Use Railway if:

- ✅ You want root path (`/`) instead of subpath
- ✅ You need environment-specific builds
- ✅ You want faster iteration (deploy on every commit)
- ✅ You might add backend APIs later
- ✅ You need staging environments

### Use Both if:

- ✅ GitHub Pages for stable releases
- ✅ Railway for development/staging
- ✅ Different URLs for different environments

---

## Multi-Environment Setup

### Recommended Structure

| Environment        | Platform     | URL                                      | Branch      | Purpose             |
| ------------------ | ------------ | ---------------------------------------- | ----------- | ------------------- |
| **Development**    | Local        | `localhost:5173`                         | -           | Local development   |
| **Staging**        | Railway      | `staging.yourdomain.com`                 | `develop`   | Pre-release testing |
| **Production**     | GitHub Pages | `signatur3-git.github.io/prompt-gen-web` | Tags (`v*`) | Stable releases     |
| **Production Alt** | Railway      | `yourdomain.com`                         | `main`      | Alternative prod    |

---

## Next Steps

1. **Create Railway account** and link GitHub repository
2. **Update `vite.config.ts`** to handle Railway base path
3. **Add `serve` to dependencies**
4. **Create `railway.json`** configuration file
5. **Register Railway redirect URI** in marketplace
6. **Deploy and test**
7. **Update documentation** with Railway URL

---

## Summary

✅ Railway is fully compatible with this SPA  
✅ Requires minimal configuration (`serve` package + Railway settings)  
✅ Can coexist with GitHub Pages deployment  
✅ Provides more flexibility for environments  
✅ Free tier available for testing

Railway deployment is a great complement to GitHub Pages! 🚀
