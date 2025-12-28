# Railway GitHub Workflow Conflict Resolution

**Date:** 2025-12-28  
**Issue:** Railway's auto-generated workflow may conflict with existing workflows  
**Workflow Name:** `zuccini-endurance` (Railway default)

---

## Understanding Railway's GitHub Integration

When you connect a GitHub repository to Railway, it can create a GitHub workflow file that:

- Triggers on push to specific branches
- Builds and deploys your app automatically
- May conflict with your existing CI/CD workflows

---

## Potential Conflicts

### Your Existing Workflows

1. **`ci.yml`** - Runs on push to `main` and `develop`
   - Builds the app
   - Runs tests
   - Creates artifacts

2. **`release.yml`** - Runs on version tags
   - Builds the app
   - Runs tests
   - Creates GitHub Release
   - Deploys to GitHub Pages

### Railway's Auto-Generated Workflow

Railway typically creates a workflow that:

- ✅ Triggers on the same branches (e.g., `main`)
- ✅ Runs a build
- ❌ May cause duplicate builds
- ❌ May consume GitHub Actions minutes unnecessarily
- ❌ May deploy before your tests pass

---

## How to Check for Railway's Workflow

### Option 1: Check GitHub Web Interface

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Look for a workflow named **`zuccini-endurance`** or similar
4. Check if there are duplicate builds running

### Option 2: Pull Latest from GitHub

Railway may have created the workflow directly on GitHub:

```bash
git fetch origin
git pull origin main
```

Then check:

```bash
ls .github/workflows/
# Look for files like: railway-deploy.yml, zuccini-endurance.yml, etc.
```

### Option 3: Check Railway Dashboard

1. Railway Dashboard → Your Project
2. Settings → Deployments
3. Look for "Deploy on push" or "GitHub integration" settings
4. Check which branches trigger deployments

---

## Recommended Solution: Disable Railway's GitHub Workflow

Since you already have comprehensive CI/CD with GitHub Actions, **disable Railway's auto-generated workflow** and let Railway deploy only when you want it to.

### Step 1: Remove Railway's Workflow (If It Exists)

```bash
# Check for Railway workflow
ls .github/workflows/

# If you find zuccini-endurance.yml or railway-*.yml, remove it:
git rm .github/workflows/zuccini-endurance.yml
git commit -m "Remove Railway auto-generated workflow"
git push
```

### Step 2: Configure Railway to Deploy Only on Manual Trigger

**In Railway Dashboard:**

1. Go to your project → **Settings**
2. Find **GitHub Integration** or **Deployments** section
3. Look for options like:
   - "Deploy on push" → **Disable**
   - "Auto-deploy" → **Disable**
   - "Watch for changes" → **Disable**

**This ensures:**

- ✅ Your GitHub Actions workflows run uninterrupted
- ✅ No duplicate builds
- ✅ You manually trigger Railway deployments when ready

### Step 3: Create Manual Deployment Workflow (Optional)

If you want to automate Railway deployment from GitHub Actions, create a new workflow:

**`.github/workflows/deploy-railway.yml`:**

```yaml
name: Deploy to Railway

on:
  workflow_dispatch: # Manual trigger only
  push:
    branches:
      - main
    paths-ignore:
      - '**.md'
      - '.github/**'
      - 'e2e/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm i -g @railway/cli

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up
```

**To set this up:**

1. Get Railway token: Railway Dashboard → Account → Tokens
2. Add to GitHub: Repository Settings → Secrets → Actions
3. Create secret named `RAILWAY_TOKEN` with your token value

---

## Alternative: Keep Both Workflows (With Adjustments)

If you want both to run, adjust triggers to avoid conflicts:

### Option A: Different Branches

**Your CI/CD:**

- Triggers on: `main`, `develop`

**Railway:**

- Triggers on: `railway-deploy` (new dedicated branch)

**Workflow:**

```bash
# When you want to deploy to Railway:
git checkout railway-deploy
git merge main
git push origin railway-deploy
```

### Option B: Path Filters

Add path filters to your existing workflows to avoid conflicts:

**Update `ci.yml`:**

```yaml
on:
  push:
    branches: [main, develop]
    paths-ignore:
      - '.railway/**'
```

**Railway workflow runs only when `.railway/` files change.**

### Option C: Manual Railway Deploys

Keep GitHub Actions for CI/CD, manually deploy to Railway:

```bash
# Via Railway CLI
railway up

# Or via Railway Dashboard
# → Deployments → Deploy latest commit
```

---

## Recommended Configuration

### For Maximum Control

```
GitHub Actions (ci.yml)
  ├─ Runs on: Every push to main/develop
  ├─ Purpose: Testing, validation
  └─ Result: Build artifacts

GitHub Actions (release.yml)
  ├─ Runs on: Version tags (v*.*.*)
  ├─ Purpose: Create releases
  └─ Result: GitHub Pages deployment

Railway
  ├─ Triggered: Manually only
  ├─ Purpose: Preview/staging deployments
  └─ Result: Railway app update
```

### How to Implement

1. **Disable Railway's auto-deploy:**
   - Railway Dashboard → Settings → Deployments
   - Turn off "Auto-deploy from GitHub"

2. **Deploy to Railway when ready:**

   ```bash
   # After your CI passes on GitHub
   railway up

   # Or use Railway Dashboard
   # → Deployments → Deploy → Select commit
   ```

3. **Keep separate deployment targets:**
   - **GitHub Pages:** Production (via release.yml on tags)
   - **Railway:** Staging/preview (manual deploys)

---

## Checking for Conflicts Right Now

Run this to see all GitHub workflow runs:

```bash
# Using GitHub CLI (if installed)
gh run list --limit 10

# Or check manually
# Go to: https://github.com/signatur3-git/prompt-gen-web/actions
```

Look for:

- ❌ Multiple builds for the same commit
- ❌ "zuccini-endurance" workflow runs
- ❌ Builds failing due to conflicts

---

## If Railway Workflow Is Causing Issues

### Immediate Fix

1. **Go to GitHub repository on web**
2. **Actions tab** → Find "zuccini-endurance" workflow
3. **Click the three dots** → "Disable workflow"
4. **Or delete the file:**
   ```bash
   git pull origin main
   git rm .github/workflows/zuccini-endurance.yml
   git commit -m "Disable Railway auto-deploy workflow"
   git push
   ```

### Configure Railway for Manual Deploy

Railway Dashboard:

- **Settings** → **Deployments**
- **Source:** GitHub repository (keep connected)
- **Auto-deploy:** Disabled
- **Deploy trigger:** Manual only

---

## Testing Your Setup

### 1. Verify GitHub Actions Work

```bash
# Push a change to main
git commit --allow-empty -m "Test CI workflow"
git push

# Check GitHub Actions tab
# Should see: ci.yml running
# Should NOT see: duplicate builds
```

### 2. Verify Railway Deploys Manually

```bash
# Trigger Railway deployment
railway up

# Or via dashboard
# Railway → Deployments → Deploy latest commit
```

### 3. Verify No Conflicts

```bash
# Check GitHub Actions
gh run list --limit 5

# Should see:
# ✅ CI workflow (your ci.yml)
# ✅ No duplicate builds
# ❌ No railway/zuccini workflows
```

---

## Summary & Recommendation

### The Issue

Railway's auto-generated GitHub workflow (`zuccini-endurance`) may:

- ❌ Run duplicate builds on every push
- ❌ Waste GitHub Actions minutes
- ❌ Deploy before tests pass
- ❌ Conflict with your existing CI/CD

### The Solution

**Disable Railway's auto-generated workflow:**

1. Remove `.github/workflows/zuccini-endurance.yml` (if it exists)
2. Disable auto-deploy in Railway Dashboard
3. Deploy to Railway manually when ready

**This gives you:**

- ✅ Clean CI/CD pipeline (via your existing workflows)
- ✅ No duplicate builds
- ✅ Full control over deployments
- ✅ GitHub Pages for production (tags)
- ✅ Railway for staging (manual)

---

## Quick Action Checklist

- [ ] Check GitHub Actions tab for "zuccini-endurance" workflow
- [ ] Pull latest from GitHub: `git pull origin main`
- [ ] Check for Railway workflow: `ls .github/workflows/`
- [ ] If found, delete it: `git rm .github/workflows/zuccini-endurance.yml`
- [ ] Disable auto-deploy in Railway Dashboard → Settings
- [ ] Test: Push to main, verify only your workflows run
- [ ] Deploy to Railway manually when ready: `railway up`

---

## Need More Info?

If you're unsure whether Railway created a workflow:

1. **Check GitHub Actions tab** - Look for unknown workflow runs
2. **Run:** `git pull && ls .github/workflows/`
3. **Check Railway Dashboard** - Settings → Deployments → Auto-deploy status

Let me know what you find and I can help resolve any conflicts! 🚀
