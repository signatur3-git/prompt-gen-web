# How to Get Marketplace Application Logs from Railway

## What We Found

Browser shows: `{"error":"Failed to download package"}`

This is a **generic error message**. The real error is in the marketplace server logs.

---

## Option 1: Railway Dashboard (EASIEST)

### Steps:

1. Go to **https://railway.app/dashboard**
2. Find and click your **marketplace** project
3. Click on the **marketplace service** (the backend, not the database)
4. Click **"Deployments"** in the left sidebar
5. Click on the **current deployment** (top of the list)
6. Click **"View Logs"** button
7. You'll see real-time application logs

### What to Look For:

Search or scroll to find logs around **2025-12-28 13:52:20** (when the error occurred)

Look for lines containing:

- `Error:`
- `failed`
- `download`
- `featured/base`
- `ENOENT` (file not found)
- `EACCES` (permission denied)

---

## Option 2: Railway CLI

### Install Railway CLI:

```bash
npm install -g @railway/cli
```

### Login:

```bash
railway login
```

### Navigate to Marketplace Project:

```bash
cd path/to/prompt-gen-marketplace
railway link  # Select your marketplace project
```

### Get Logs:

```bash
# Last 100 lines
railway logs --tail 100

# Real-time (watch for errors as they happen)
railway logs --follow

# Specific time window (around when error occurred)
railway logs --since "2025-12-28T13:50:00Z" --until "2025-12-28T13:55:00Z"

# Search for errors
railway logs | grep -i error
railway logs | grep -i "failed to download"
railway logs | grep -i "featured/base"
```

---

## Option 3: Railway API (Advanced)

If you have Railway API token:

```bash
curl "https://backboard.railway.app/graphql" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { logs(serviceId: \"...\") { timestamp, message } }"
  }'
```

---

## What Error Messages Look Like

### File Not Found (Most Likely):

```
Error: ENOENT: no such file or directory, open '/uploads/featured/base/1.0.0.yaml'
    at Object.openSync (fs.js:...)
    at Object.readFileSync (fs.js:...)
    at downloadPackage (/app/routes/packages.js:123:45)
```

### Database Error:

```
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete]
Error: relation "packages" does not exist
```

### Permission Error:

```
Error: EACCES: permission denied, open '/uploads/featured/base/1.0.0.yaml'
```

### Code Error:

```
TypeError: Cannot read property 'path' of undefined
    at downloadPackage (/app/routes/packages.js:...)
```

---

## Quick Test: Check Marketplace Service Status

### Railway Dashboard:

1. Go to your marketplace project
2. Look for **Status** indicator
3. Should be green "Active"
4. If red or yellow, service might be crashed

### Railway CLI:

```bash
railway status
```

### Check Health Endpoint:

```bash
curl https://prompt-gen-marketplace-production.up.railway.app/api/v1/health
```

Should return:

```json
{ "status": "ok" }
```

If it doesn't respond or returns error, marketplace is down.

---

## After You Get the Logs

### Copy and Share:

1. Find the error message around 13:52:20 UTC
2. Copy the **full error** including:
   - Error message
   - Stack trace
   - Any related log lines before/after
3. Share it here

### Example of What to Copy:

```
2025-12-28T13:52:20.123Z [ERROR] Failed to download package featured/base@1.0.0
2025-12-28T13:52:20.124Z [ERROR] Error: ENOENT: no such file or directory, open '/uploads/featured/base/1.0.0.yaml'
    at Object.openSync (node:fs:585:3)
    at Object.readFileSync (node:fs:453:35)
    at downloadPackage (/app/src/routes/packages.ts:145:23)
    at async /app/src/routes/packages.ts:89:12
```

---

## Troubleshooting Railway CLI

### CLI Not Installed:

```bash
npm install -g @railway/cli
# or
brew install railway  # macOS
```

### Not Logged In:

```bash
railway login
# Opens browser for authentication
```

### Can't Find Project:

```bash
railway link
# Lists all your projects, select marketplace
```

### Permission Denied:

- Make sure you're a member of the Railway project
- Check your Railway account has access

---

## Meanwhile: Check These Too

### Check if Package File Exists:

**Option A: Railway Shell (if enabled)**

```bash
railway shell
ls -la /uploads/featured/base/
exit
```

**Option B: Check Environment Variables**

```bash
railway variables
```

Look for:

- `UPLOADS_DIR` or `STORAGE_PATH` - where files are stored
- `DATABASE_URL` - database connection
- `NODE_ENV` - should be "production"

---

## Quick Diagnosis Table

| Error Log Says              | Cause             | Fix                         |
| --------------------------- | ----------------- | --------------------------- |
| `ENOENT: no such file`      | File missing      | Re-upload/republish package |
| `EACCES: permission denied` | Wrong permissions | Fix file/folder permissions |
| `ECONNREFUSED`              | DB not connected  | Check DATABASE_URL          |
| `relation does not exist`   | Missing DB table  | Run migrations              |
| `Cannot read property`      | Code bug          | Check recent deployments    |
| No logs at all              | Service crashed   | Check deployment status     |

---

## Priority Actions

1. **Get the application logs** (Railway Dashboard or CLI)
2. **Find the error** around 13:52:20 UTC
3. **Copy the full error message** and stack trace
4. **Share it** so we can diagnose and fix

The generic `"Failed to download package"` error is hiding the real cause. The application logs will reveal it!

---

**Created**: 2025 M12 28  
**Status**: Awaiting marketplace application logs  
**Next**: Check Railway Dashboard → Marketplace Service → View Logs
