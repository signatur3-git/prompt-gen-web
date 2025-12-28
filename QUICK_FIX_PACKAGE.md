# Quick Fix: One Command to Create Missing Package

## The Problem

```
Error: ENOENT: no such file or directory
Path: ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml
```

## The Fix (One Command)

### Using Railway CLI:

```bash
railway run bash -c 'mkdir -p ./storage/packages/featured/base/1.0.0 && cat > ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml << '\''EOF'\''
id: featured/base
version: 1.0.0
metadata:
  name: Base Package
  description: Base package for the Random Prompt Generator
  authors:
    - Prompt Gen Team
namespaces: {}
datatypes: {}
separator_sets: {}
prompt_sections: {}
rules: {}
rulebooks: {}
EOF
' && echo "✅ Package file created! Try importing now."
```

**Or step by step:**

```bash
# 1. Create directory
railway run -- mkdir -p ./storage/packages/featured/base/1.0.0

# 2. Create file (copy this entire block)
railway run -- bash -c 'cat > ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml << '\''EOF'\''
id: featured/base
version: 1.0.0
metadata:
  name: Base Package
  description: Base package for the Random Prompt Generator
  authors:
    - Prompt Gen Team
namespaces: {}
datatypes: {}
separator_sets: {}
prompt_sections: {}
rules: {}
rulebooks: {}
EOF'

# 3. Verify
railway run -- ls -la ./storage/packages/featured/base/1.0.0/
railway run -- cat ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml
```

## After Running

1. Go to Railway web app: `/marketplace`
2. Select "featured/base" package
3. Click "Import to Library"
4. Should work! ✅

## If You Don't Have Railway CLI

### Option 1: Railway Dashboard Shell

1. Go to Railway Dashboard
2. Open marketplace service
3. Click "Settings" tab
4. Look for "Shell" or "Terminal" option (if available)
5. Run these commands:

```bash
mkdir -p ./storage/packages/featured/base/1.0.0

cat > ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml << 'EOF'
id: featured/base
version: 1.0.0
metadata:
  name: Base Package
  description: Base package for the Random Prompt Generator
  authors:
    - Prompt Gen Team
namespaces: {}
datatypes: {}
separator_sets: {}
prompt_sections: {}
rules: {}
rulebooks: {}
EOF

ls -la ./storage/packages/featured/base/1.0.0/
```

### Option 2: Ask Marketplace to Re-publish

If you have access to the marketplace codebase, trigger a package re-publish through the publish endpoint.

## Better Solution: Add Railway Volume

To prevent this from happening again (files lost on redeploy):

1. Railway Dashboard → Marketplace Service
2. Settings → Volumes
3. Add New Volume
4. Mount path: `/app/storage`
5. Save and redeploy

Files will now persist across deployments!

---

**Quick Summary:**

- **Problem:** Package file missing
- **Fix:** Create file using Railway CLI
- **Prevention:** Add Railway Volume for persistent storage
- **Time:** 2 minutes

Run the command above and try importing again!
