# Quick Test Guide - OAuth Marketplace Integration

## 🚀 Start Testing in 4 Steps

### Step 1: Start the Marketplace Server

**Important:** The marketplace must be running locally on port 5174

```bash
# In the marketplace project directory
npm run dev
```

The marketplace will be available at: `http://localhost:5174`

### Step 2: Start the Web App Dev Server

```bash
# In the prompt-gen-web directory
npm run dev
```

The app will be available at: `http://localhost:5173`

### Step 3: Navigate to Marketplace

**Option A:** From Home Page

1. Open `http://localhost:5173`
2. Scroll down to "🏪 Community Marketplace" section
3. Click the purple "Open Marketplace" button

**Option B:** Direct Link

1. Navigate directly to `http://localhost:5173/marketplace`

### Step 4: Connect and Test

1. **Click "Connect to Marketplace"** button
   - You'll be redirected to the marketplace authorization page
   - URL will be: `http://localhost:5174/oauth/authorize?...` (local development)
   - Or: `https://prompt-gen-marketplace-production.up.railway.app/oauth/authorize?...` (production)

2. **Sign in to Marketplace** (if not already signed in)
   - The marketplace has its own login system
   - You'll need to authenticate there first

3. **Approve Authorization**
   - You'll see a consent screen
   - Click "Approve" to grant access

4. **Redirected Back to App**
   - You'll land on `/oauth/callback`
   - See "Completing authentication..." message
   - Then "Successfully Connected!" message
   - Auto-redirect to home page after 2 seconds

5. **Browse Packages**
   - Navigate back to `/marketplace`
   - You should now see the package browser
   - Try searching for packages
   - Click "Download" on any package to download its YAML file

6. **Test Disconnect**
   - Scroll down and click "Disconnect"
   - You'll be logged out
   - Can reconnect anytime

---

## 🔍 What to Test

### ✅ OAuth Flow

- [ ] Click "Connect to Marketplace" redirects correctly
- [ ] Marketplace authorization page loads
- [ ] After approval, redirects back to app
- [ ] Callback page shows success
- [ ] Token is stored (check localStorage in browser DevTools)
- [ ] Auto-redirect to home works

### ✅ Package Browsing

- [ ] Connected state shows package list
- [ ] Search functionality works
- [ ] Package cards display correctly
- [ ] Loading states appear during API calls

### ✅ Package Download

- [ ] Click download on a package
- [ ] Browser downloads YAML file
- [ ] File naming is correct: `{namespace}-{name}-{version}.yaml`
- [ ] File content is valid YAML

### ✅ Error Handling

- [ ] Deny authorization shows error
- [ ] Network errors are handled gracefully
- [ ] Expired tokens trigger re-authentication

### ✅ Persistence

- [ ] Close browser tab and reopen
- [ ] Still authenticated (token in localStorage)
- [ ] Works until token expires (1 hour)

### ✅ Logout

- [ ] Disconnect button works
- [ ] Token removed from localStorage
- [ ] Shows connection panel again

---

## 🐛 Debugging Tips

### Check Browser Console

Open DevTools (F12) and look for:

- `[OAuth] Starting auth flow:` - OAuth initiation
- `[OAuth] Exchanging authorization code for token...` - Token exchange
- `[OAuth] Successfully authenticated!` - Success
- `[Marketplace] Loaded X packages` - Package loading

### Check LocalStorage

In DevTools → Application → Local Storage:

- `marketplace_token` - Should contain JWT token
- `marketplace_token_expiry` - Timestamp when token expires

### Check SessionStorage (during OAuth flow)

In DevTools → Application → Session Storage:

- `oauth_verifier` - PKCE verifier (only during redirect)
- `oauth_state` - CSRF state (only during redirect)

These should be cleared after successful authentication.

### Common Issues

**Issue:** Redirect URI mismatch

- **Symptom:** Error on marketplace authorization page
- **Fix:** Ensure OAuth client has `http://localhost:5173/oauth/callback` registered

**Issue:** CORS error

- **Symptom:** Network errors when calling marketplace API
- **Fix:** Marketplace should have CORS configured for localhost

**Issue:** Token expired

- **Symptom:** API calls fail after 1 hour
- **Fix:** Disconnect and reconnect (future: auto refresh)

**Issue:** "Missing code or state" error

- **Symptom:** Error on OAuth callback page
- **Fix:** Don't manually navigate to `/oauth/callback` - only via OAuth flow

---

## 📝 Test Checklist

Copy this checklist and check off items as you test:

```
OAuth Flow:
[ ] Home page shows marketplace section
[ ] Marketplace page shows connection panel
[ ] Click connect redirects to marketplace
[ ] Marketplace authorization page loads
[ ] Can sign in to marketplace
[ ] Can approve authorization
[ ] Redirects back to app callback
[ ] Callback shows success message
[ ] Auto-redirects to home

Package Browsing:
[ ] Marketplace page shows packages
[ ] Package cards display correctly
[ ] Search bar works
[ ] Loading spinner shows during API calls
[ ] Empty state shows when no packages found

Package Download:
[ ] Click download triggers file download
[ ] File downloads successfully
[ ] Filename is correct
[ ] File contains valid YAML
[ ] Can import downloaded file in app

Session Management:
[ ] Token persists across page refreshes
[ ] Token persists after closing tab
[ ] Token expires after 1 hour
[ ] Disconnect clears token
[ ] Can reconnect after disconnect

Error Handling:
[ ] Denied authorization shows error
[ ] Error page has retry button
[ ] Error page has home button
[ ] Network errors show appropriate message
```

---

## 🎯 Expected Results

### Successful OAuth Flow

```
1. Click "Connect to Marketplace"
   → Browser redirects to marketplace

2. Approve on marketplace
   → Browser redirects to: http://localhost:5173/oauth/callback?code=...&state=...

3. Callback page processes
   → Shows: "Completing authentication..."
   → Console: "[OAuth] Successfully authenticated!"

4. Success screen
   → Shows: "Successfully Connected!" with checkmark
   → Auto-redirects after 2 seconds

5. Connected state
   → Marketplace page shows packages
   → Can search and download
```

### Package Download Flow

```
1. Click "Download" on package
   → Button shows "Downloading..."
   → Console: "[Marketplace] Downloading package: namespace/name@version"

2. Download completes
   → Browser downloads file
   → Filename: namespace-name-version.yaml
   → Console: "[Marketplace] Downloaded X bytes"

3. File ready
   → Can open in text editor
   → Contains valid YAML
   → Can import using app's import feature
```

---

## 🎉 Success Criteria

The implementation is successful if:

✅ User can connect to marketplace via OAuth  
✅ User can browse available packages  
✅ User can search for packages  
✅ User can download package YAML files  
✅ User can disconnect and reconnect  
✅ Token persists across sessions  
✅ All error cases are handled gracefully  
✅ UI is responsive and beautiful

---

**Happy Testing! 🚀**

If you encounter any issues, check the browser console for detailed logs.
All OAuth and marketplace operations are logged with `[OAuth]` and `[Marketplace]` prefixes.
