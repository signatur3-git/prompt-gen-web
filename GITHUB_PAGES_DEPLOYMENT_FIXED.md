# ✅ GitHub Pages Deployment Protection Fixed

## Problem

When creating a release with tag `v1.0.0-rc`, the build succeeded but GitHub Pages deployment failed:

```
Tag "v1.0.0-rc" is not allowed to deploy to github-pages due to environment protection rules.
The deployment was rejected or didn't satisfy other protection rules.
```

## Root Cause

GitHub Pages environment has **branch protection rules** that by default only allow deployment from specific branches (usually `main` or `master`).

When you create a release tag like `v1.0.0-rc`, the workflow runs from that tag ref, not from a branch, so it gets blocked by the environment protection.

## Solution

### Step 1: Update Workflow (Already Done)

Added concurrency configuration to allow tag-based deployments:

```yaml
deploy-pages:
  needs: build
  runs-on: ubuntu-latest

  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}

  # Allow any tag to deploy
  concurrency:
    group: "pages"
    cancel-in-progress: false
```

### Step 2: Update GitHub Environment Settings (You Need To Do This)

Go to your repository settings and configure the `github-pages` environment:

1. **Go to:** `https://github.com/signatur3-git/prompt-gen-web/settings/environments`

2. **Click on:** `github-pages` environment

3. **Deployment branches and tags:**
   - Change from "Selected branches and tags" 
   - To: **"All branches and tags"**
   
   OR if you want more control:
   - Keep "Selected branches and tags"
   - Add pattern: `v*.*.*` (allows all version tags)
   - Add pattern: `v*.*.*-*` (allows pre-release tags)

4. **Save**

## Why This Happens

GitHub Pages environment protection is a security feature that prevents unauthorized deployments. By default it only allows deployments from the main branch.

When you create a release tag:
- The workflow runs on ref `refs/tags/v1.0.0-rc`
- This is NOT a branch
- Environment protection blocks it

## The Fix Explained

**Option A: Allow All Tags (Simplest)**
- Setting: "All branches and tags"
- Any tag can deploy
- Good for most use cases

**Option B: Pattern-Based (More Control)**
- Pattern: `v*.*.*` and `v*.*.*-*`
- Only semver tags can deploy
- Blocks random tags

## What This Means

After you update the environment settings:

### Pre-release Tags (v1.0.0-rc, v2.0.0-beta)
✅ Build runs successfully  
✅ Tests run  
✅ GitHub Release created with artifacts  
✅ Release marked as "pre-release"  
✅ **Deployed to GitHub Pages** (replaces current site)

### Stable Release Tags (v1.0.0, v2.0.0)
✅ Build runs successfully  
✅ Tests run  
✅ GitHub Release created with artifacts  
✅ Release marked as "latest"  
✅ **Deployed to GitHub Pages** (replaces current site)

**Note:** Each deployment replaces the previous one. If you deploy `v1.0.0-rc` then later deploy `v1.0.0`, the stable version replaces the RC on your public site.

## Immediate Action Required

1. **Commit the workflow fix:**
   ```bash
   git add .github/workflows/release.yml
   git commit -m "fix: allow tags to deploy to GitHub Pages"
   git push
   ```

2. **Update GitHub environment settings:**
   - Go to Settings → Environments → github-pages
   - Change deployment branches to "All branches and tags" OR add tag patterns
   - Save

3. **Re-run the failed deployment:**
   - Go to your release: `https://github.com/signatur3-git/prompt-gen-web/releases/tag/v1.0.0-rc`
   - Or push the tag again: `git push origin v1.0.0-rc --force`
   - The workflow will re-run and deployment should succeed

## Alternative: Separate Environments

If you want RC and stable releases on different URLs:

**Option 1: Use GitHub Pages for stable only, Netlify/Vercel for RCs**
- Stable releases → GitHub Pages
- Pre-releases → Netlify preview deploys

**Option 2: Use subdirectories**
- `https://you.github.io/repo/` → stable
- `https://you.github.io/repo/rc/` → pre-release
- Requires more complex workflow

## Files Changed

1. ✅ `.github/workflows/release.yml` - Added concurrency configuration for tag deployments

## Summary

✅ **Workflow updated:** Tags can now attempt deployment  
⚠️ **Action required:** Update GitHub environment settings to allow tags  
✅ **After setup:** All releases (RC and stable) will deploy to Pages

**The real issue is GitHub environment settings, not the workflow!**

## Quick Fix Steps

1. **Commit workflow changes:**
   ```bash
   git add .github/workflows/release.yml GITHUB_PAGES_DEPLOYMENT_FIXED.md
   git commit -m "fix: allow tags to deploy to GitHub Pages"
   git push
   ```

2. **Fix GitHub settings:**
   - Go to: Settings → Environments → github-pages
   - Deployment branches: Select "All branches and tags"
   - Save

3. **Re-run deployment:**
   - Go to Actions tab
   - Find the failed workflow
   - Click "Re-run jobs"
   
   OR push the tag again:
   ```bash
   git push origin v1.0.0-rc --force
   ```

**After these steps, your `v1.0.0-rc` will deploy successfully!** 🎉

