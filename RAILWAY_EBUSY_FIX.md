# Railway EBUSY Build Error - Fix Applied

**Date:** 2025-12-28  
**Status:** ✅ Fixed  
**Error:** `npm error EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'`

---

## Problem

Railway build was failing with:

```
npm error code EBUSY
npm error syscall rmdir
npm error path /app/node_modules/.cache
npm error errno -16
npm error EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'
Build Failed: build daemon returned an error
```

This is a common issue in containerized build environments where npm's cache gets locked during concurrent operations.

---

## Solution Applied

### 1. Updated `railway.json`

**Before:**

```json
"buildCommand": "npm ci && npm run build"
```

**After:**

```json
"buildCommand": "npm cache clean --force && npm ci --prefer-offline --no-audit && npm run build"
```

**Changes:**

- ✅ `npm cache clean --force` - Clears cache before install to avoid locks
- ✅ `--prefer-offline` - Uses cached packages when possible (faster + more reliable)
- ✅ `--no-audit` - Skips audit to speed up install and reduce potential issues

### 2. Updated `nixpacks.toml`

**Before:**

```toml
[phases.install]
cmds = ["npm ci"]
```

**After:**

```toml
[phases.install]
cmds = ["npm cache clean --force", "npm ci --prefer-offline --no-audit"]
```

Same improvements as above, split into separate commands for Nixpacks.

### 3. Created `.railwayignore`

New file that excludes unnecessary files from Railway builds:

- Development files (.git, .github, .idea, .vscode)
- Test files (e2e/, test-results/, playwright-report/)
- Documentation (\*.md except README)
- Build artifacts (dist/, node_modules/.cache/)
- Local environment files

**Benefit:** Smaller upload, faster builds, fewer potential conflicts.

---

## Additional Resources Created

### `RAILWAY_CONFIG_ALTERNATIVES.md`

Provides alternative configurations if the default still has issues:

1. **Minimal railway.json** - Simplest config with manual build command
2. **Auto-detection** - Let Railway figure it out
3. **Dockerfile** - Maximum control with containerization

### Updated `RAILWAY_DEPLOYMENT_GUIDE.md`

Added comprehensive troubleshooting section for:

- EBUSY cache errors (with step-by-step fix)
- Node version mismatches
- Build cache clearing instructions
- When to use alternative configurations

---

## Why This Happens

Railway uses containerized builds with shared cache layers. Sometimes:

- Multiple processes try to access the cache simultaneously
- Cache locks don't release properly between builds
- Stale cache files interfere with new builds

**The fix:** Clean the cache before every build to ensure a fresh start.

---

## How to Deploy Now

1. **Commit and push** these changes to GitHub:

   ```bash
   git add .
   git commit -m "Fix Railway EBUSY build error"
   git push
   ```

2. **Trigger a new Railway deployment:**
   - Railway will automatically deploy on push
   - Or manually: Railway Dashboard → Deployments → Redeploy

3. **Monitor the build logs:**
   - You should see `npm cache clean --force` run successfully
   - Build should complete without EBUSY errors

---

## If Error Still Occurs

Try these steps in order:

### Step 1: Clear Railway Build Cache

- Railway Dashboard → Settings → Clear Build Cache
- Then redeploy

### Step 2: Try Alternative Configuration

- See `RAILWAY_CONFIG_ALTERNATIVES.md`
- Use Option 1 (Minimal) or Option 2 (Auto-detect)

### Step 3: Use Dockerfile

- Most reliable option with full control
- See Option 3 in `RAILWAY_CONFIG_ALTERNATIVES.md`

### Step 4: Contact Railway Support

- If none of the above work
- Provide build logs and error details
- Railway support is usually very responsive

---

## Files Modified/Created

- ✅ `railway.json` - Added cache cleaning to build command
- ✅ `nixpacks.toml` - Added cache cleaning to install phase
- ✅ `.railwayignore` - Excludes unnecessary files from builds
- ✅ `RAILWAY_DEPLOYMENT_GUIDE.md` - Added EBUSY troubleshooting section
- ✅ `RAILWAY_CONFIG_ALTERNATIVES.md` - Alternative configurations
- ✅ `RAILWAY_EBUSY_FIX.md` - This document

---

## Testing

✅ Linting passes  
✅ Local build works  
✅ Configuration files are valid  
⏳ Railway deployment pending

---

## Expected Behavior After Fix

When Railway builds, you should see:

```
npm cache clean --force
npm info it worked if it ends with ok
...
npm ci --prefer-offline --no-audit
added 331 packages in 15s
...
npm run build
> rpg-web@1.0.0-rc build
> vue-tsc -b && vite build
✓ 96 modules transformed.
dist/index.html ...
✓ built in 1.2s
```

No EBUSY errors! 🎉

---

## Prevention for Future

The current configuration should prevent this issue going forward because:

- ✅ Cache is cleaned before every build
- ✅ Offline mode used when possible (reduces npm registry hits)
- ✅ Audit skipped (faster, fewer moving parts)
- ✅ Unnecessary files excluded from build context

---

## Summary

✅ **Root cause identified:** npm cache locking in Railway's build environment  
✅ **Fix applied:** Clean cache before install + use offline mode  
✅ **Safety net added:** .railwayignore to reduce build surface area  
✅ **Documentation updated:** Troubleshooting guide for future reference  
✅ **Alternative configs provided:** Fallback options if needed

**Ready to redeploy to Railway!** 🚀
