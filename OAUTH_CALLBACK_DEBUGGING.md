# OAuth Callback Debugging Guide

**Date:** 2025-12-23  
**Issue:** OAuth callback URL not working on GitHub Pages  
**URL:** `https://signatur3-git.github.io/prompt-gen-web/oauth/callback?code=...&state=...`

---

## 🔍 Problem Analysis

When the marketplace redirects back to the OAuth callback URL with query parameters:

```
https://signatur3-git.github.io/prompt-gen-web/oauth/callback?code=SY5BzbPZmpKOjDTlSKz-pawozC6_MOSytzxJvvYNXh0&state=R8375g7mu2OXe6kycznV2w
```

The app should:

1. Load the callback page
2. Extract `code` and `state` from URL
3. Exchange code for access token
4. Store token and redirect to home

---

## 🐛 Possible Issues

### Issue 1: 404.html Query Parameter Encoding

**Problem:** The 404.html script encodes `&` as `~and~` in query parameters.

**What happens:**

```
Original: /oauth/callback?code=ABC&state=XYZ
404.html encodes to: /?/oauth/callback&code=ABC~and~state=XYZ
index.html decodes to: /oauth/callback?code=ABC&state=XYZ
```

**This should work**, but let's verify the encoding/decoding logic.

### Issue 2: Vue Router Base Path

**Problem:** With base path `/prompt-gen-web/`, the routing might not match correctly.

**Check:** Vue Router config in `src/router/index.ts`:

```typescript
history: createWebHistory(import.meta.env.BASE_URL);
```

`BASE_URL` should be `/prompt-gen-web/` in production.

### Issue 3: Redirect Script Timing

**Problem:** The index.html redirect script runs before Vue mounts, which is correct, but might have issues with the path reconstruction.

**Check:** The script in index.html:

```javascript
if (l.search[1] === '/') {
  var decoded = l.search
    .slice(1)
    .split('&')
    .map(function (s) {
      return s.replace(/~and~/g, '&');
    })
    .join('?');
  window.history.replaceState(null, null, l.pathname.slice(0, -1) + decoded + l.hash);
}
```

**Potential issue:** `l.pathname.slice(0, -1)` might remove too much or too little.

### Issue 4: sessionStorage Not Preserved

**Problem:** The PKCE verifier is stored in sessionStorage during redirect, but might not survive the 404 → index.html redirect.

**Check:** When 404.html redirects, does sessionStorage persist?

- ✅ Should persist (same domain)
- ❌ Might not if there's a full page reload

---

## 🧪 Debug Steps Added

I've added detailed console logging to help diagnose the issue:

### In `OAuthCallback.vue`:

```javascript
console.log('[OAuthCallback] Current URL:', window.location.href);
console.log('[OAuthCallback] Search params:', window.location.search);
console.log('[OAuthCallback] Hash:', window.location.hash);
console.log('[OAuthCallback] Pathname:', window.location.pathname);
```

### In `oauth.service.ts`:

```javascript
console.log('[OAuth] URL:', window.location.href);
console.log('[OAuth] Search:', window.location.search);
console.log('[OAuth] Hash:', window.location.hash);
console.log('[OAuth] URL params:', Object.fromEntries(urlParams.entries()));
console.log('[OAuth] Hash params:', Object.fromEntries(hashParams.entries()));
console.log('[OAuth] Extracted:', { code, state, error });
```

---

## 📊 What to Check After Deployment

Once GitHub Pages redeploys with the debug logging (2-5 minutes):

### 1. Try the OAuth Flow Again

1. Go to: `https://signatur3-git.github.io/prompt-gen-web/marketplace`
2. Click "Connect to Marketplace"
3. Complete authentication on marketplace
4. Watch what happens on callback

### 2. Open Browser DevTools

**Before clicking "Connect":**

- Open DevTools (F12)
- Go to Console tab
- Keep it open during the entire flow

### 3. Check Console Logs

Look for these log messages:

**Expected logs:**

```
[OAuth] Starting auth flow: { authUrl: "...", ... }
[OAuthCallback] Processing OAuth callback...
[OAuthCallback] Current URL: https://...oauth/callback?code=...&state=...
[OAuthCallback] Search params: ?code=...&state=...
[OAuth] handleCallback started
[OAuth] URL: https://...oauth/callback?code=...&state=...
[OAuth] URL params: { code: "...", state: "..." }
[OAuth] Extracted: { code: "...", state: "..." }
[OAuth] Successfully authenticated!
```

**If you see:**

```
[OAuth] Missing code or state in callback
```

Then the query parameters aren't being preserved properly.

### 4. Check sessionStorage

In Console tab, run:

```javascript
sessionStorage.getItem('oauth_verifier');
sessionStorage.getItem('oauth_state');
```

**Expected:**

- `oauth_verifier` should exist (long random string)
- `oauth_state` should match the `state` in URL

**If missing:** sessionStorage was cleared during redirect

### 5. Manually Test the Redirect Logic

In Console, run:

```javascript
// Test 404.html encoding
var l = window.location;
var pathSegmentsToKeep = 1;
var encoded =
  l.protocol +
  '//' +
  l.hostname +
  l.pathname
    .split('/')
    .slice(0, 1 + pathSegmentsToKeep)
    .join('/') +
  '/?/' +
  l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
  (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
  l.hash;
console.log('404 would redirect to:', encoded);
```

---

## 🔧 Potential Fixes

Based on what we find, here are possible solutions:

### Fix 1: Use Hash Fragment Instead of Query String

If query parameters are being lost, we can use hash fragments instead:

**Change marketplace redirect URI to:**

```
https://signatur3-git.github.io/prompt-gen-web/oauth/callback#code=...&state=...
```

Hash fragments are never sent to the server, so 404.html won't see them, but JavaScript can access them.

### Fix 2: Use GitHub Pages' Root Domain

If the subpath is causing issues, we could:

- Use a custom domain (if available)
- Or deploy to root of GitHub Pages (rename repo to `signatur3-git.github.io`)

### Fix 3: Modify 404.html Logic

Update 404.html to better handle query parameters:

```javascript
// Special handling for OAuth callback
if (l.pathname.includes('/oauth/callback')) {
  // Don't encode query params, just pass them through
  l.replace(
    l.protocol +
      '//' +
      l.hostname +
      l.pathname
        .split('/')
        .slice(0, 1 + pathSegmentsToKeep)
        .join('/') +
      '/?/oauth/callback' +
      l.search +
      l.hash
  );
  return;
}
```

### Fix 4: Store State in Different Location

Instead of sessionStorage, store PKCE verifier in:

- localStorage (survives redirects better)
- Or encode it in the state parameter itself

---

## 🎯 Next Steps

1. **Wait for GitHub Pages to deploy** (2-5 minutes)
2. **Try OAuth flow with DevTools open**
3. **Check console logs** to see what's happening
4. **Share the logs** so we can diagnose the exact issue
5. **Apply the appropriate fix** based on what we find

---

## 📝 Known Working URL Pattern

Your callback URL:

```
https://signatur3-git.github.io/prompt-gen-web/oauth/callback?code=SY5BzbPZmpKOjDTlSKz-pawozC6_MOSytzxJvvYNXh0&state=R8375g7mu2OXe6kycznV2w
```

**Should transform to:**

```
Step 1 (404.html): https://signatur3-git.github.io/prompt-gen-web/?/oauth/callback&code=SY5BzbPZmpKOjDTlSKz-pawozC6_MOSytzxJvvYNXh0~and~state=R8375g7mu2OXe6kycznV2w

Step 2 (index.html): https://signatur3-git.github.io/prompt-gen-web/oauth/callback?code=SY5BzbPZmpKOjDTlSKz-pawozC6_MOSytzxJvvYNXh0&state=R8375g7mu2OXe6kycznV2w

Step 3 (Vue Router): /oauth/callback route matches, OAuthCallback component loads

Step 4 (OAuth Service): Extract code & state, exchange for token
```

---

## 🔍 Debug Checklist

After trying the flow with debug logging enabled:

- [ ] Console shows `[OAuthCallback] Processing OAuth callback...`
- [ ] Console shows current URL with code and state parameters
- [ ] Console shows `[OAuth] handleCallback started`
- [ ] Console shows extracted code and state
- [ ] sessionStorage has `oauth_verifier` and `oauth_state`
- [ ] State parameter matches sessionStorage state
- [ ] Token exchange request is made
- [ ] Token is stored in localStorage
- [ ] Redirect to home page happens

**If any checkbox fails, that's where the problem is!**

---

## 💡 Immediate Workaround

If the callback continues to fail, here's a temporary workaround:

**Manual OAuth Test:**

1. Start OAuth flow to get sessionStorage populated
2. Before clicking authorize, open DevTools Console
3. Run: `localStorage.setItem('debug_oauth', 'true')`
4. Complete authorization
5. If callback fails, manually run in Console:

```javascript
// Get code and state from URL
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const state = params.get('state');
const verifier = sessionStorage.getItem('oauth_verifier');

// Manual token exchange
fetch('https://prompt-gen-marketplace-production.up.railway.app/api/v1/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: 'https://signatur3-git.github.io/prompt-gen-web/oauth/callback',
    client_id: 'prompt-gen-web',
    code_verifier: verifier,
  }),
})
  .then(r => r.json())
  .then(data => {
    localStorage.setItem('marketplace_token', data.access_token);
    console.log('Token stored!');
    window.location.href = '/prompt-gen-web/marketplace';
  });
```

This bypasses the callback handling and directly stores the token.

---

**Status:** Debug logging deployed, awaiting test results  
**Next:** Check console logs to diagnose the exact issue  
**Expected Resolution:** Once we see the logs, we can apply the right fix
