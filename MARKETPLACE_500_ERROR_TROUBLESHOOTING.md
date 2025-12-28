# Marketplace 500 Error Troubleshooting Guide

## Issue

When importing packages from the marketplace on Railway (production), users encounter:

```
[Marketplace] Import failed: Error: Download failed: 500
```

This is a **500 Internal Server Error** from the marketplace server, indicating the server encountered an unexpected condition.

---

## Enhanced Error Handling (Deployed)

### What Was Added

1. **Detailed Console Logging**

   ```javascript
   console.log('[Marketplace] Importing package: namespace/name@version');
   console.log('[Marketplace] Marketplace URL: https://...');
   console.log('[Marketplace] Download URL: https://...');
   console.log('[Marketplace] Token present: true/false');
   console.error('[Marketplace] Error details:', { ... });
   ```

2. **Error Context in Alerts**
   - Now shows specific guidance based on error type (500, 404, network)
   - Provides actionable troubleshooting steps

3. **Response Body Parsing**
   - Attempts to read error details from server response
   - Logs full error context for debugging

---

## Diagnosing the 500 Error

### Step 1: Check Console Logs

After attempting import, check browser console for:

```
[Marketplace] Importing package: featured/base@1.0.0
[Marketplace] Marketplace URL: https://prompt-gen-marketplace-production.up.railway.app
[Marketplace] Download URL: https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages/featured/base/1.0.0/download
[Marketplace] Token present: true
[Marketplace] Download failed: {
  status: 500,
  statusText: "Internal Server Error",
  url: "...",
  errorDetails: "..." // Server's error message
}
```

### Step 2: Verify Marketplace Server Status

**Check if marketplace is running:**

```bash
curl https://prompt-gen-marketplace-production.up.railway.app/api/v1/health
```

Expected response:

```json
{
  "status": "ok"
}
```

If this fails, the marketplace server is down or unreachable.

### Step 3: Test Download Endpoint Directly

**Test the download endpoint:**

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages/featured/base/1.0.0/download
```

This will show:

- If package files exist on the server
- If there's a database/storage issue
- What the actual server error is

---

## Common Causes of 500 Errors

### 1. Missing Package Files

**Symptom:** Package exists in database but YAML file is missing

**Solution:**

- Re-publish the package
- Check marketplace server logs for file system errors
- Verify file storage configuration on Railway

### 2. Database Connection Issues

**Symptom:** Package metadata exists but can't be retrieved

**Solution:**

- Check Railway database status
- Verify DATABASE_URL environment variable
- Check marketplace server logs

### 3. Storage/File System Errors

**Symptom:** Server can't read package files

**Solution:**

- Check Railway volume/disk status
- Verify file permissions
- Check storage path configuration

### 4. Server Memory/Resource Limits

**Symptom:** Server crashes or times out under load

**Solution:**

- Check Railway resource usage
- Increase memory allocation if needed
- Check for memory leaks in marketplace server

### 5. Environment Configuration

**Symptom:** Missing environment variables or configuration

**Solution:**

- Verify all required environment variables are set on Railway
- Check marketplace configuration
- Review Railway deployment logs

---

## Marketplace Server Checklist

### Required Environment Variables

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
ALLOWED_ORIGINS=https://prompt-gen-web-production.up.railway.app
PORT=5174
NODE_ENV=production
```

### Required Files/Directories

```
/uploads/           # Package YAML files
/logs/              # Server logs
/tmp/               # Temporary files
```

### Required Database Tables

```sql
packages
package_versions
personas
oauth_clients
oauth_tokens
```

---

## Client-Side Error Handling

### What Users See Now

**500 Error:**

```
Failed to import package: Download failed: 500 Internal Server Error

The marketplace server encountered an error. This could be due to:
- Server maintenance or downtime
- Missing package files
- Database issues

Please try again later or contact support if the issue persists.
```

**404 Error:**

```
Failed to import package: Download failed: 404 Not Found

The package version could not be found on the marketplace server.
```

**Network Error:**

```
Failed to import package: Network error downloading package. Please check:
1. Internet connection
2. Marketplace server is running
3. CORS configuration
```

---

## Debugging Steps for Developers

### 1. Enable Detailed Logging

Already enabled in the new build. Check browser console after import attempt.

### 2. Check Network Tab

1. Open browser DevTools
2. Go to Network tab
3. Attempt import
4. Look for the download request
5. Check:
   - Request URL
   - Request headers (Authorization token)
   - Response status
   - Response body

### 3. Test Marketplace API Directly

**Health Check:**

```bash
curl https://prompt-gen-marketplace-production.up.railway.app/api/v1/health
```

**List Packages:**

```bash
curl https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages
```

**Download Package:**

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages/featured/base/1.0.0/download
```

### 4. Check Railway Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs
```

Look for:

- Incoming download requests
- Error messages
- Stack traces
- Database errors

### 5. Verify CORS Configuration

Marketplace server must allow:

```javascript
ALLOWED_ORIGINS=https://prompt-gen-web-production.up.railway.app,https://signatur3-git.github.io
```

Check for CORS errors in browser console.

---

## Temporary Workarounds

### Option 1: Use Download Instead of Import

1. Click "Download YAML" button
2. Save the YAML file locally
3. Go to Library > Imported tab
4. Click "Import Files"
5. Select the downloaded YAML file

### Option 2: Use Local Development

If marketplace is working locally but not on Railway:

1. Run marketplace locally: `npm run dev`
2. Run web app locally: `npm run dev`
3. Import packages locally
4. Packages are stored in browser localStorage
5. Will sync when you visit production site

---

## Fixes Implemented

### Build Version: Latest

**File: `src/services/marketplace-client.ts`**

- Enhanced error logging in `downloadPackage()`
- Parse and display server error messages
- Better network error handling

**File: `src/views/MarketplaceView.vue`**

- Detailed error context logging
- User-friendly error messages with troubleshooting steps
- Log package details, URLs, and token status

---

## Next Steps

### For Users

1. **Try again** - Server issues may be temporary
2. **Use Download workaround** - Download YAML then import from Library
3. **Report to support** - Include console error logs

### For Developers

1. **Check Railway logs** - See marketplace server errors
2. **Verify database** - Ensure package data exists
3. **Test endpoints** - Use curl to test API directly
4. **Check environment** - Verify all configs on Railway
5. **Review storage** - Ensure package files are accessible

---

## Related Files

- `src/services/marketplace-client.ts` - Enhanced error handling
- `src/views/MarketplaceView.vue` - Detailed error logging
- `src/config/marketplace.config.ts` - Production URL configuration

---

## Testing the Fix

### After Deployment

1. Navigate to `/marketplace` on Railway deployment
2. Select a package
3. Click "Import to Library"
4. If error occurs, check browser console
5. Look for detailed error logs

### Expected Console Output (Success)

```
[Marketplace] Importing package: featured/base@1.0.0
[Marketplace] Marketplace URL: https://prompt-gen-marketplace-production.up.railway.app
[Marketplace] Downloading package: featured/base@1.0.0
[Marketplace] Download URL: https://.../api/v1/packages/featured/base/1.0.0/download
[Marketplace] Token present: true
[Marketplace] Downloaded 12345 bytes
[Marketplace] Package imported successfully
```

### Expected Console Output (500 Error)

```
[Marketplace] Importing package: featured/base@1.0.0
[Marketplace] Marketplace URL: https://prompt-gen-marketplace-production.up.railway.app
[Marketplace] Downloading package: featured/base@1.0.0
[Marketplace] Download URL: https://.../api/v1/packages/featured/base/1.0.0/download
[Marketplace] Token present: true
[Marketplace] Download failed: {
  status: 500,
  statusText: "Internal Server Error",
  url: "...",
  errorDetails: "Actual server error message here"
}
[Marketplace] Import failed: Error: Download failed: 500 Internal Server Error - Actual server error message here
[Marketplace] Error details: {
  name: "Error",
  message: "Download failed: 500 Internal Server Error - ...",
  stack: "...",
  packageId: "featured/base",
  namespace: "featured",
  packageName: "base",
  version: "1.0.0"
}
```

---

## Resolution Status

✅ **Client-side error handling enhanced**

- Better logging
- More context in errors
- User-friendly messages

⏳ **Server-side investigation needed**

- Check Railway marketplace logs
- Verify package files exist
- Test API endpoints directly
- Check database connectivity

---

**Updated**: 2025 M12 28  
**Status**: Client improvements deployed, server investigation needed  
**Build**: ✅ Passing  
**Deployment**: Ready for Railway
