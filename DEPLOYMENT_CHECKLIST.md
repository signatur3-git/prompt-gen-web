# GitHub Pages Deployment Checklist

## 📋 Pre-Deployment Checklist

Before deploying to GitHub Pages, verify these items:

### ✅ OAuth Configuration

- [x] OAuth client ID: `prompt-gen-web` (already registered)
- [x] Redirect URI for production: `https://signatur3-git.github.io/prompt-gen-web/oauth/callback`
- [x] Dynamic redirect URI handling in `marketplace.config.ts`
- [x] Base path configured in `vite.config.ts`: `/prompt-gen-web/`
- [x] **Environment-aware marketplace URL:**
  - Development: `http://localhost:5174` (local marketplace)
  - Production: `https://prompt-gen-marketplace-production.up.railway.app`

### ✅ Code Quality

- [x] TypeScript compilation passes: `npm run type-check`
- [x] Build succeeds: `npm run build`
- [ ] All tests pass: `npm run test:run`
- [ ] E2E tests pass (optional): `npm run test:e2e`

### ✅ Security

- [x] No secrets or API keys in code
- [x] PKCE implementation correct
- [x] CSRF protection with state parameter
- [x] HTTPS-only OAuth flow (enforced by marketplace)

---

## 🚀 Deployment Steps

### 1. Build the Application

```bash
npm run build
```

This creates the `dist/` directory with optimized production files.

### 2. Test Build Locally

```bash
npm run preview
```

Visit `http://localhost:4173` and test:

- [ ] App loads correctly
- [ ] Routing works (all pages accessible)
- [ ] Home page marketplace section visible
- [ ] Can navigate to `/marketplace`

### 3. Deploy to GitHub Pages

**Option A: Using GitHub Actions** (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Option B: Manual Deployment**

```bash
# Build
npm run build

# Deploy (using gh-pages package)
npm install -D gh-pages
npx gh-pages -d dist
```

### 4. Configure GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Set **Source** to:
   - **GitHub Actions** (if using Option A)
   - **gh-pages branch** (if using Option B)
3. Save

### 5. Wait for Deployment

- GitHub Actions: Check **Actions** tab for deployment status
- Manual: Wait ~1-2 minutes for GitHub to publish

---

## 🧪 Post-Deployment Testing

Once deployed, test at: `https://signatur3-git.github.io/prompt-gen-web/`

### Critical Tests

#### 1. Basic Functionality

- [ ] Home page loads
- [ ] Editor page loads
- [ ] Preview page loads
- [ ] Marketplace page loads
- [ ] All styles render correctly
- [ ] No console errors

#### 2. OAuth Flow (Most Important!)

- [ ] Navigate to `/marketplace`
- [ ] Click "Connect to Marketplace"
- [ ] Redirects to marketplace authorization page
- [ ] URL contains correct redirect_uri:
  ```
  https://signatur3-git.github.io/prompt-gen-web/oauth/callback
  ```
- [ ] After approval, redirects back correctly
- [ ] Callback page processes successfully
- [ ] Token stored in localStorage
- [ ] Can browse packages

#### 3. Package Operations

- [ ] Search packages works
- [ ] Package list displays
- [ ] Download package works
- [ ] Downloaded file is valid YAML

#### 4. Session Persistence

- [ ] Refresh page → still authenticated
- [ ] Close tab and reopen → still authenticated
- [ ] Token expires after 1 hour
- [ ] Disconnect works

---

## 🐛 Troubleshooting

### Issue: 404 on Page Refresh

**Symptom:** Refreshing `/marketplace` gives 404

**Cause:** GitHub Pages doesn't support client-side routing by default

**Fix:** Add a `404.html` that redirects to index.html:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting...</title>
    <script>
      // Redirect to index.html with the path as hash
      sessionStorage.redirect = location.href;
      location.replace(location.origin + location.pathname.split('/').slice(0, -1).join('/') + '/');
    </script>
  </head>
  <body></body>
</html>
```

Then in `index.html`, add:

```html
<script>
  // Restore the path from sessionStorage
  (function () {
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect !== location.href) {
      history.replaceState(null, null, redirect);
    }
  })();
</script>
```

**Better Fix:** Vue Router already uses history mode. Ensure `base` in `vite.config.ts` matches repo name.

### Issue: OAuth Redirect URI Mismatch

**Symptom:** Error on marketplace authorization page: "redirect_uri doesn't match"

**Check:**

1. Marketplace OAuth client registration includes:
   ```
   https://signatur3-git.github.io/prompt-gen-web/oauth/callback
   ```
2. Config in `marketplace.config.ts` generates correct URI
3. Browser console shows correct redirect_uri in OAuth URL

**Fix:** Verify the OAuth client in marketplace database has correct redirect URI.

### Issue: CORS Errors

**Symptom:** API calls to marketplace fail with CORS errors

**Fix:** Marketplace must allow origin: `https://signatur3-git.github.io`

Contact marketplace admin to verify CORS configuration.

### Issue: Assets Not Loading

**Symptom:** CSS/JS files return 404

**Check:** Ensure `base` in `vite.config.ts` is correct:

```typescript
base: process.env.NODE_ENV === 'production' ? '/prompt-gen-web/' : '/';
```

### Issue: OAuth Callback Not Working

**Symptoms:**

- "Missing code or state" error
- Blank callback page
- Redirect loop

**Debug Steps:**

1. Check browser console for errors
2. Check Network tab for API calls
3. Verify sessionStorage has `oauth_verifier` and `oauth_state` during redirect
4. Check localStorage for token after success
5. Verify marketplace is returning code and state parameters

---

## 📊 Deployment Verification Checklist

After deployment, verify these items:

```
Infrastructure:
[ ] GitHub Pages site is live
[ ] HTTPS is enabled
[ ] Custom domain configured (if applicable)
[ ] DNS propagated (if using custom domain)

Application:
[ ] Home page loads
[ ] All routes accessible
[ ] Assets load (CSS, JS, images)
[ ] No 404 errors
[ ] No console errors

OAuth Integration:
[ ] Marketplace link works
[ ] OAuth redirect correct
[ ] Can complete OAuth flow
[ ] Token persists
[ ] API calls work

Functionality:
[ ] Package browsing works
[ ] Package search works
[ ] Package download works
[ ] Disconnect works
[ ] Error handling works

Performance:
[ ] Page load time < 3 seconds
[ ] OAuth flow completes < 5 seconds
[ ] API calls complete quickly
[ ] No memory leaks

SEO (Optional):
[ ] Title and meta tags correct
[ ] OpenGraph tags (if desired)
[ ] Favicon displays
```

---

## 🔄 Update Workflow

When updating the marketplace integration:

1. **Make changes locally**

   ```bash
   npm run dev
   # Test thoroughly
   ```

2. **Run validation**

   ```bash
   npm run type-check
   npm run lint
   npm run test:run
   ```

3. **Build and preview**

   ```bash
   npm run build
   npm run preview
   # Test at http://localhost:4173
   ```

4. **Commit and push**

   ```bash
   git add .
   git commit -m "Update marketplace integration"
   git push
   ```

5. **GitHub Actions deploys automatically**
   - Or manually deploy with `npx gh-pages -d dist`

6. **Verify on production**
   - Test all critical paths
   - Check browser console for errors

---

## 📝 Monitoring

### Things to Monitor

1. **OAuth Success Rate**
   - Track failed authentications
   - Monitor error messages

2. **API Performance**
   - Package search latency
   - Download success rate

3. **User Issues**
   - Console errors
   - Failed API calls
   - Token expiration problems

### Debug in Production

Users can enable verbose logging:

1. Open browser DevTools
2. Watch Console tab
3. Look for `[OAuth]` and `[Marketplace]` logs

---

## 🎉 Success!

Once all checks pass, the OAuth marketplace integration is live on GitHub Pages! 🚀

Users can now:

- ✅ Connect to the marketplace
- ✅ Browse community packages
- ✅ Download packages
- ✅ Import packages into their editor

---

## 📞 Support

If issues persist:

1. **Check marketplace status:** Is the marketplace server up?
   - URL: `https://prompt-gen-marketplace-production.up.railway.app/health`

2. **Verify OAuth client:** Is the redirect URI registered?
   - Check marketplace database
   - Confirm client ID matches

3. **Test locally first:** Does it work on `localhost:5173`?
   - If yes, likely deployment config issue
   - If no, code issue

4. **Browser compatibility:** Test in multiple browsers
   - Chrome, Firefox, Safari, Edge
   - Check for browser-specific issues

---

**Ready to deploy? Let's go! 🚀**
