# Quick Reference: Railway 500 Error

## 🚨 Issue

Import fails on Railway with: `Download failed: 500`

## ✅ What's Fixed (Web App)

- Enhanced error logging
- Better error messages
- Server error parsing
- User guidance

## ⏳ What Needs Investigation (Marketplace Server)

- Why server returns 500
- Check Railway logs
- Verify package files exist
- Test database connection

## 📋 Quick Diagnosis

### Check Console (F12)

```
[Marketplace] Download URL: https://...
[Marketplace] Token present: true
[Marketplace] Download failed: { status: 500, ... }
```

### Test Health

```bash
curl https://prompt-gen-marketplace-production.up.railway.app/api/v1/health
```

### Test Download

```bash
curl -H "Authorization: Bearer TOKEN" \
  https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages/featured/base/1.0.0/download
```

## 🔧 Workaround for Users

**Option 1:** Download YAML then import from Library

1. Click "Download YAML" (not Import)
2. Go to Library > Imported
3. Click "Import Files"
4. Select downloaded file

**Option 2:** Use local development

## 🗺️ Investigation Path

1. **Check Railway Logs**

   ```bash
   railway logs
   ```

2. **Common Causes:**
   - Missing package files
   - Database connection error
   - File permissions
   - Memory/resource limits
   - Missing environment variables

3. **Quick Fixes:**
   - Verify package files exist in `/uploads/`
   - Check DATABASE_URL is set
   - Ensure ALLOWED_ORIGINS includes web app URL
   - Restart marketplace service

## 📚 Documentation

- **Detailed Guide:** MARKETPLACE_500_ERROR_TROUBLESHOOTING.md
- **Action Plan:** MARKETPLACE_500_ACTION_PLAN.md
- **Full Summary:** MARKETPLACE_500_RESOLUTION_SUMMARY.md

## 🚀 Deployment

```bash
# Build is ready
npm run build

# Deploy to Railway (auto-deploys on push)
git add .
git commit -m "fix: enhance marketplace error handling"
git push
```

## ✅ Success Checklist

Web App:

- [x] Enhanced error handling
- [x] Detailed logging
- [x] User guidance
- [x] Build passing

Marketplace Server:

- [ ] Identify root cause
- [ ] Fix server issue
- [ ] Deploy fix
- [ ] Verify imports work

---

**Status:** Web app ready, server investigation needed  
**Updated:** 2025 M12 28
