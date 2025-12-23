# OAuth Authorization Endpoint Fix

## 🔧 Issue Fixed

**Problem:** Clicking "Connect to Marketplace" returned JSON error: `{"error":"Missing authorization header"}`

**Root Cause:** The authorization endpoint was using the API path `/api/v1/oauth/authorize` which requires authentication. However, the OAuth authorization page should be a **frontend web page** that users can access without being authenticated yet.

**Solution:** Changed authorization endpoint from `/api/v1/oauth/authorize` to `/oauth/authorize`

---

## 📝 Changes Made

### File: `src/config/marketplace.config.ts`

**Before:**

```typescript
authorizationEndpoint: `${MARKETPLACE_BASE_URL}/api/v1/oauth/authorize`;
```

**After:**

```typescript
authorizationEndpoint: `${MARKETPLACE_BASE_URL}/oauth/authorize`;
```

---

## 🔍 Why This Fix Works

### OAuth Authorization Flow Requirements

1. **Authorization Page = Web UI (HTML)**
   - Users must be able to see a page to log in
   - Users must be able to see consent screen
   - Should NOT require authentication header (they're not authenticated yet!)

2. **Token Endpoint = API (JSON)**
   - This endpoint exchanges code for token
   - This is a backend API endpoint: `/api/v1/oauth/token` ✅

3. **Other OAuth Endpoints = API (JSON)**
   - Token revocation: `/api/v1/oauth/revoke` ✅
   - Token listing: `/api/v1/oauth/tokens` ✅

### Typical OAuth URL Structure

```
Frontend Routes (HTML pages):
- /oauth/authorize          ← User visits this page
- /oauth/login              ← Login page (if needed)
- /oauth/consent            ← Consent screen

API Routes (JSON endpoints):
- /api/v1/oauth/token       ← Exchange code for token
- /api/v1/oauth/revoke      ← Revoke token
- /api/v1/oauth/tokens      ← List tokens
```

---

## ✅ Expected Behavior Now

### When You Click "Connect to Marketplace"

1. **Browser redirects to:** `http://localhost:5174/oauth/authorize?client_id=...&redirect_uri=...&...`

2. **Marketplace shows:**
   - **If not logged in:** Login page
   - **If logged in:** Consent/authorization page

3. **User actions:**
   - Log in (if needed)
   - Click "Approve" or "Deny"

4. **Marketplace redirects back:** `http://localhost:5173/oauth/callback?code=...&state=...`

5. **Web app exchanges code for token** via `/api/v1/oauth/token` endpoint

6. **Success!** User can browse packages

---

## 🧪 How to Test

1. **Ensure marketplace is running:**

   ```bash
   # In marketplace project
   npm run dev
   # Should be on http://localhost:5174
   ```

2. **Ensure web app is running:**

   ```bash
   # In prompt-gen-web project
   npm run dev
   # Should be on http://localhost:5173
   ```

3. **Test the flow:**
   - Open `http://localhost:5173`
   - Navigate to Marketplace
   - Click "Connect to Marketplace"
   - **You should see:** Marketplace login/authorization page (HTML)
   - **NOT see:** JSON error

4. **Check browser console:**
   ```
   [OAuth] Starting auth flow: {
     authUrl: "http://localhost:5174/oauth/authorize?...",
     ...
   }
   ```

---

## 🔄 If This Doesn't Work

If you still get an error, it could mean:

### Option 1: Marketplace OAuth Not Implemented

The marketplace might not have the OAuth authorization UI page yet. Check if:

- `/oauth/authorize` route exists in marketplace
- Marketplace has a frontend OAuth flow implemented

### Option 2: Different Path

The marketplace might use a different path. Try checking:

- `/auth/authorize`
- `/authorize`
- `/login` (then redirects to OAuth)

### Option 3: Marketplace Needs to Be Started Differently

The marketplace might need:

- Environment variables set
- Database migrations run
- OAuth client seeded

### How to Debug

1. **Test marketplace authorization endpoint directly:**

   ```
   Open in browser: http://localhost:5174/oauth/authorize?client_id=prompt-gen-web&redirect_uri=http://localhost:5173/oauth/callback&response_type=code&state=test
   ```

   **Expected:** HTML page (login or authorization screen)
   **If you get:** JSON error → OAuth UI not implemented
   **If you get:** 404 → Wrong path

2. **Check marketplace logs:**
   - Look for OAuth route registration
   - Check if authorization endpoint is defined
   - See what requests are being made

3. **Check marketplace README:**
   - Verify OAuth setup instructions
   - Check if there are prerequisites
   - See if OAuth needs to be explicitly enabled

---

## 📚 Documentation Updated

Updated the following files to reflect this change:

- `src/config/marketplace.config.ts` - Changed authorization endpoint
- `src/views/MarketplaceView.vue` - Better error handling and logging
- `src/services/oauth.service.ts` - Enhanced console logging

---

## 🎯 Summary

**Changed:** Authorization endpoint from API path to frontend path  
**Reason:** OAuth authorization must be a web page (HTML), not an API endpoint (JSON)  
**Status:** Ready to test with marketplace running on localhost:5174

---

**Try connecting again and check what happens!** 🚀

If you still see an error, please share:

1. What URL the browser tries to go to (check address bar)
2. What error message appears
3. What's in the browser console (F12 → Console tab)
4. Whether the marketplace is running and accessible at http://localhost:5174
