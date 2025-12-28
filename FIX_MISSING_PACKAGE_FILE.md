# Fix: Missing Package File on Railway

## Problem Identified

```
Error: ENOENT: no such file or directory
Path: ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml
```

The package metadata exists in the database, but the YAML file is missing from storage.

---

## Solution 1: Create the Missing File (Quick Fix)

### Step 1: Connect to Railway

```bash
railway shell
```

### Step 2: Create Directory Structure

```bash
mkdir -p ./storage/packages/featured/base/1.0.0
```

### Step 3: Create a Basic Package File

**Option A: Minimal Valid Package**

```bash
cat > ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml << 'EOF'
id: featured/base
version: 1.0.0
metadata:
  name: Base Package
  description: Base package for the Random Prompt Generator
  authors:
    - Prompt Gen Team
  tags:
    - base
    - featured
    - example

namespaces: {}
datatypes: {}
separator_sets: {}
prompt_sections: {}
rules: {}
rulebooks: {}
EOF
```

**Option B: If You Have the Original Package**

```bash
# Copy from your local machine using Railway CLI
# Exit the shell first
exit

# Upload file from local machine
railway run -- bash -c "cat > ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml" < path/to/local/base-1.0.0.yaml
```

### Step 4: Verify File Was Created

```bash
railway shell

# Check file exists
ls -la ./storage/packages/featured/base/1.0.0/

# View contents
cat ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml

# Check file size (should be > 0)
ls -lh ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml

exit
```

### Step 5: Test Import

1. Go to web app on Railway
2. Navigate to marketplace
3. Select "featured/base" package
4. Click "Import to Library"
5. Should work now! ✅

---

## Solution 2: Use Railway Volumes (Permanent Fix)

Railway containers are **ephemeral** - files will be lost on redeploy. To persist storage:

### Add Railway Volume

1. Go to Railway Dashboard
2. Open marketplace project
3. Click marketplace service
4. Go to **"Settings"** tab
5. Scroll to **"Volumes"**
6. Click **"+ New Volume"**
7. Mount path: `/app/storage` (or wherever packages are stored)
8. Save

Now storage will persist across deployments!

---

## Solution 3: Republish All Packages

If many packages are missing files, republish them:

### Using Marketplace UI (if available)

1. Log in to marketplace
2. Go to "My Packages"
3. For each package, click "Edit" or "Republish"
4. Re-upload the YAML file

### Using API

```bash
# Get your OAuth token from browser
TOKEN="your-token-here"

# Publish package
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./packages/featured/base/base-1.0.0.yaml" \
  -F "namespace=featured" \
  -F "name=base" \
  https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages
```

---

## Solution 4: Check Storage Configuration

### Verify Environment Variables

```bash
railway variables
```

Look for:

- `STORAGE_PATH` - Should point to `/app/storage` or similar
- `UPLOADS_DIR` - Alternative storage path
- `PACKAGE_STORAGE_PATH` - Package-specific path

### Check Code Configuration

The marketplace code at `storage.service.js:74` is trying to read from:

```javascript
'./storage/packages/featured/base/1.0.0/base-1.0.0.yaml';
```

The `./` prefix means it's relative to the current working directory. Check:

```bash
railway shell

# Check current directory
pwd
# Should be /app or similar

# Check if storage exists
ls -la ./storage/
ls -la /app/storage/

exit
```

---

## Complete Fix Script

Save this as `fix-missing-package.sh`:

```bash
#!/bin/bash

# Fix missing featured/base package on Railway

echo "Connecting to Railway..."
railway shell << 'RAILWAY_COMMANDS'

echo "Creating directory structure..."
mkdir -p ./storage/packages/featured/base/1.0.0

echo "Creating minimal base package..."
cat > ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml << 'EOF'
id: featured/base
version: 1.0.0
metadata:
  name: Base Package
  description: Base package for the Random Prompt Generator
  authors:
    - Prompt Gen Team
  tags:
    - base
    - featured

namespaces: {}
datatypes: {}
separator_sets: {}
prompt_sections: {}
rules: {}
rulebooks: {}
EOF

echo "Verifying file..."
if [ -f ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml ]; then
    echo "✅ File created successfully!"
    ls -lh ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml
    echo ""
    echo "File contents:"
    cat ./storage/packages/featured/base/1.0.0/base-1.0.0.yaml
else
    echo "❌ Failed to create file"
fi

exit
RAILWAY_COMMANDS

echo "Done! Try importing the package now."
```

Run it:

```bash
chmod +x fix-missing-package.sh
./fix-missing-package.sh
```

---

## Testing After Fix

### 1. Test Download Endpoint Directly

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://prompt-gen-marketplace-production.up.railway.app/api/v1/packages/featured/base/1.0.0/download
```

Should return the YAML content (not an error).

### 2. Test Import in Web App

1. Go to Railway web app
2. Navigate to `/marketplace`
3. Select "featured/base" package
4. Click "Import to Library"
5. Should see: "Package imported successfully!"

### 3. Verify in Library

1. Go to `/library`
2. Click "Marketplace" tab
3. Should see "featured/base" package
4. Can generate prompts with it

---

## Prevention for Future

### 1. Use Railway Volumes

Mount `/app/storage` to a Railway volume for persistence.

### 2. Use Cloud Storage

Configure marketplace to use S3, GCS, or similar:

- More reliable
- Survives redeployments
- Better for production

### 3. Store YAML in Database

Alternative: Store package content in database as TEXT/BLOB:

- No file system needed
- Automatically backed up
- Easier to manage

### 4. Add Health Check

Add an endpoint to verify storage:

```javascript
app.get('/api/v1/health/storage', async (req, res) => {
  const missingFiles = [];
  const packages = await db.query('SELECT * FROM packages');

  for (const pkg of packages) {
    const filePath = `./storage/packages/${pkg.namespace}/${pkg.name}/${pkg.version}/${pkg.name}-${pkg.version}.yaml`;
    if (!fs.existsSync(filePath)) {
      missingFiles.push(filePath);
    }
  }

  res.json({
    status: missingFiles.length === 0 ? 'ok' : 'warning',
    missingFiles,
  });
});
```

---

## Summary

**Root Cause:** Package file missing from storage  
**Quick Fix:** Create the file manually using Railway shell  
**Permanent Fix:** Use Railway Volumes or cloud storage  
**Status:** Ready to fix - follow Solution 1 above

The package will work once the file exists at the correct path!

---

**Created:** 2025 M12 28  
**Status:** Solution identified  
**Next:** Run fix script or manually create file  
**Priority:** Medium (workaround available)
