# Quick Action Plan: Marketplace 500 Error Investigation

## Status: Server-Side Issue on Railway

The 500 error is occurring on the **marketplace server** (not the web app). The web app is correctly configured and sending proper requests.

---

## Immediate Actions (Priority Order)

### 1. Check Railway Marketplace Logs (HIGHEST PRIORITY)

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to marketplace project
cd ../prompt-gen-marketplace  # or your marketplace directory

# Link to Railway project
railway link

# View real-time logs
railway logs --follow

# Or view recent logs
railway logs
```

**What to look for:**

- Error stack traces
- "File not found" errors
- Database connection errors
- Permission errors
- Any 500 error logs

### 2. Verify Marketplace Is Running

```bash
# Health check
curl https://prompt-gen-marketplace-production.up.railway.app/api/v1/health

# Should return: {"status":"ok"}
```

If this fails, marketplace is down.

### 3. Test Download Endpoint Directly

```bash
# Get an auth token first (from browser DevTools -> Application -> Local Storage)
TOKEN="your-oauth-token-here"

# Test download
curl -v -H "Authorization: Bearer $TOKEN" \
  https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages/featured/base/1.0.0/download
```

**Expected:** YAML content  
**If 500:** Server error details

### 4. Check Railway Dashboard

1. Go to https://railway.app
2. Open marketplace project
3. Check:
   - ✅ Deployment status (should be "Active")
   - ✅ Memory usage (not maxed out)
   - ✅ CPU usage (reasonable)
   - ✅ Recent deployments (any failures?)
   - ✅ Variables (all required env vars set)

### 5. Check Database Connection

If marketplace uses PostgreSQL:

```bash
# From Railway CLI
railway connect <database-service-name>

# Or use connection string
psql $DATABASE_URL

# Check if packages table exists
\dt

# Check if package exists
SELECT * FROM packages WHERE namespace='featured' AND name='base';

# Check package versions
SELECT * FROM package_versions WHERE package_id IN
  (SELECT id FROM packages WHERE namespace='featured' AND name='base');
```

---

## Common Causes & Quick Fixes

### Cause 1: Package Files Missing

**Symptom:** Package metadata in DB but YAML file doesn't exist

**Check:**

```bash
# SSH into Railway container (if possible)
railway shell

# Check if uploads directory exists
ls -la /uploads/
ls -la /uploads/featured/
```

**Fix:** Re-publish the package or restore files

### Cause 2: File Permissions

**Symptom:** Server can't read package files

**Check logs for:** "EACCES" or "Permission denied"

**Fix:** Ensure server has read permissions on storage directory

### Cause 3: Database Not Connected

**Symptom:** Can't query package data

**Check logs for:** "Connection refused" or "Connection timeout"

**Fix:**

- Verify DATABASE_URL is set in Railway
- Check database service is running
- Verify connection string is correct

### Cause 4: Missing Environment Variables

**Required variables:**

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
ALLOWED_ORIGINS=https://prompt-gen-web-production.up.railway.app,https://signatur3-git.github.io
PORT=5174
NODE_ENV=production
```

**Fix:** Set missing variables in Railway dashboard

### Cause 5: Server Code Error

**Symptom:** Download route is broken

**Check:** Recent marketplace code changes

**Fix:** Rollback to last working deployment

---

## Debugging Checklist

- [ ] Checked Railway logs for errors
- [ ] Verified marketplace health endpoint responds
- [ ] Tested download endpoint with curl
- [ ] Checked Railway deployment status
- [ ] Verified database connection
- [ ] Checked package exists in database
- [ ] Verified package files exist on disk
- [ ] Checked environment variables
- [ ] Reviewed recent code changes
- [ ] Checked CORS configuration

---

## Web App Status (Already Fixed)

✅ **Version handling** - Fixed (uses `latest_version || version`)  
✅ **Error logging** - Enhanced with detailed diagnostics  
✅ **User messaging** - Improved with specific guidance  
✅ **Error handling** - Parses server error responses

**The web app is working correctly.** The issue is on the marketplace server.

---

## Workaround for Users (Until Server Fixed)

### Option 1: Download Then Import

1. On marketplace, click "Download YAML" instead of "Import"
2. Save the YAML file
3. Go to Library > Imported tab
4. Click "Import Files"
5. Select the downloaded YAML

**Note:** If Download also fails with 500, the server is definitely the issue.

### Option 2: Create Manually

If the package is small, users can:

1. Copy package YAML from GitHub/documentation
2. Go to Library > Imported
3. Paste YAML and import

---

## Next Steps

### Immediate (Within 1 hour)

1. ✅ Check Railway logs
2. ✅ Verify marketplace is running
3. ✅ Test download endpoint
4. ✅ Identify root cause

### Short-term (Within 1 day)

1. Fix marketplace server issue
2. Deploy fix to Railway
3. Test import functionality
4. Notify users

### Long-term

1. Add server-side error logging/monitoring
2. Set up health checks/alerts
3. Implement retry logic
4. Add package file validation

---

## Contact Points

**Railway Support:** https://railway.app/help  
**Railway Status:** https://status.railway.app  
**Railway Docs:** https://docs.railway.app

---

## Testing After Fix

Once marketplace is fixed:

1. Navigate to Railway web app
2. Go to `/marketplace`
3. Select "featured/base" package
4. Click "Import to Library"
5. Should see: "Package imported successfully!"
6. Check Library > Marketplace tab
7. Package should appear

**Console should show:**

```
[Marketplace] Importing package: featured/base@1.0.0
[Marketplace] Downloaded XXXX bytes
[Marketplace] Package imported successfully
```

---

**Created**: 2025 M12 28  
**Priority**: HIGH  
**Blocking**: Yes (import feature unusable on production)  
**Owner**: Marketplace server team  
**Web App Status**: ✅ Fixed and ready
