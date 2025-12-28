# Troubleshooting: 204 No Content on Production

## Issue

On production, the marketplace packages list returns HTTP 204 (No Content), causing:

- Empty packages list
- Fallback to `namespace.name` notation (no `display_name`)
- No package data displayed

## Possible Causes

### 1. **Authentication Required (Most Likely)**

The marketplace API might require authentication for the packages list endpoint on production but not locally.

**Check:**

```javascript
// In browser console on production
console.log('Authenticated:', oauthService.isAuthenticated());
console.log('Has token:', !!localStorage.getItem('marketplace-token'));
```

**Solution:** Connect to marketplace before viewing packages

### 2. **Empty Database**

Production marketplace database might have no packages.

**Check:** Access marketplace admin or database directly

**Solution:** Publish packages to production marketplace

### 3. **API Endpoint Difference**

Production API might handle the endpoint differently than dev.

**Check console logs:**

```
[Marketplace] GET https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages?...
[Marketplace] Response status: 204 No Content
```

### 4. **CORS Issue**

Although 204 suggests request succeeded, CORS could cause empty response.

**Check:** Browser console for CORS errors

### 5. **API Version Mismatch**

Production marketplace might be running an older version without `display_name` support.

**Check:** Marketplace deployment version

## Enhanced Logging (Deployed)

The new build includes comprehensive logging to diagnose the issue:

### Request Logging

```
[Marketplace] Loading packages...
[Marketplace] Authenticated: true/false
[Marketplace] Token exists: true/false
[Marketplace] GET https://.../api/v1/packages?...
[Marketplace] Has auth token: true/false
```

### Response Logging

```
[Marketplace] Response status: 204 No Content
[Marketplace] Response content-type: null
[Marketplace] Received 204 No Content - returning empty result
[Marketplace] This might indicate: authentication required, no data, or API issue
```

### Result Logging

```
[Marketplace] Search result: { packages: [], total: 0 }
[Marketplace] Packages array: []
[Marketplace] Total count: 0
[Marketplace] Loaded 0 packages
[Marketplace] No packages returned - check if marketplace has data or if auth is required
```

## Diagnosis Steps

### Step 1: Check Console Logs

After deploying the new build, open production site and check console for:

1. **Authentication status**

   ```
   [Marketplace] Authenticated: false  ← If false, need to connect
   ```

2. **Response details**

   ```
   [Marketplace] Response status: 204 No Content
   [Marketplace] Response content-type: null
   ```

3. **Any warnings**
   ```
   [Marketplace] Received 204 No Content - returning empty result
   [Marketplace] This might indicate: authentication required, no data, or API issue
   ```

### Step 2: Test Authentication

1. Click "Connect to Marketplace" on production
2. Complete OAuth flow
3. Try viewing packages again
4. Check if you now get 200 response with data

### Step 3: Compare with Local

**Local (working):**

```
[Marketplace] Response status: 200 OK
[Marketplace] Response content-type: application/json
[Marketplace] Loaded 5 packages
```

**Production (not working):**

```
[Marketplace] Response status: 204 No Content
[Marketplace] Response content-type: null
[Marketplace] Loaded 0 packages
```

### Step 4: Test Marketplace API Directly

```bash
# Without auth
curl https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages

# With auth (get token from localStorage)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages
```

Check response:

- 200 with JSON: API works, might be CORS/fetch issue
- 204 No Content: API returns empty (no data or auth required)
- 401 Unauthorized: Auth required
- 500 Server Error: Backend issue

## Likely Scenarios

### Scenario A: Auth Required

**Symptoms:**

- 204 without auth
- 200 with data after connecting

**Solution:** Document that users must connect before viewing packages

### Scenario B: Empty Database

**Symptoms:**

- 204 even with auth
- Direct API call returns empty array or 204

**Solution:** Publish packages to production marketplace

### Scenario C: API Not Updated

**Symptoms:**

- Packages load but missing `display_name`
- Falls back to `namespace.name`

**Solution:** Deploy latest marketplace code with `display_name` support

### Scenario D: Environment Config

**Symptoms:**

- Works locally but not on Railway
- Logs show different behavior

**Solution:** Check Railway environment variables and marketplace config

## Quick Fixes

### For Users (If Auth Required)

Add note to marketplace page:

```vue
<div v-if="!isAuthenticated" class="auth-notice">
  ⚠️ Connect to marketplace to view available packages
</div>
```

### For Developers (If Empty Database)

Populate production marketplace:

```bash
# Connect to production marketplace
# Publish test packages
# Or seed from backup
```

### For API (If Missing display_name)

Ensure production marketplace has latest code:

```bash
cd prompt-gen-marketplace
git pull
railway up  # or your deployment method
```

## Monitoring

After deploying the enhanced logging build, monitor for:

1. **204 responses** - Check auth status when this occurs
2. **Empty packages arrays** - Verify marketplace has data
3. **Missing display_name** - Check if API includes field

## Expected Fix

Once the root cause is identified, the fix will be:

- **If auth required:** Update UI to show connect notice
- **If empty database:** Publish packages to production
- **If API outdated:** Deploy latest marketplace code
- **If config issue:** Update Railway environment variables

---

**Status:** Diagnostic logging deployed  
**Next:** Deploy to production and check console logs  
**Priority:** HIGH  
**Impact:** Production marketplace unusable
