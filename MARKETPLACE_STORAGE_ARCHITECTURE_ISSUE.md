# CRITICAL: Marketplace Storage Architecture Issue

## 🚨 Problem Identified

**Current Architecture:** Marketplace stores package YAML files in the container filesystem (`./storage/packages/`)

**Why This is Wrong for Production:**

### 1. **Ephemeral Containers**

- Railway destroys and recreates containers on every deployment
- All files in `./storage/` are lost when container restarts
- Package files uploaded between deployments disappear

### 2. **No Persistence**

```
User uploads package → Stored in ./storage/ → Railway redeploys → Files gone ❌
```

### 3. **Scalability Issues**

- Can't horizontally scale (multiple instances can't share filesystem)
- Each instance would have different files
- Load balancing breaks functionality

### 4. **Not Production Ready**

- Development pattern being used in production
- Data loss on every deployment
- Unreliable for users

---

## 🏗️ Proper Architecture Solutions

### Option 1: Store YAML in Database (RECOMMENDED)

**Pros:**

- ✅ Survives deployments/restarts
- ✅ Backed up with database
- ✅ Easy to query and manage
- ✅ Works with multiple instances
- ✅ No additional services needed

**Cons:**

- ❌ Database gets larger (but YAML files are small)
- ❌ Slightly more complex queries

**Implementation:**

```sql
-- Add column to packages or package_versions table
ALTER TABLE package_versions
ADD COLUMN yaml_content TEXT;

-- Or create separate table
CREATE TABLE package_files (
  id SERIAL PRIMARY KEY,
  package_version_id INTEGER REFERENCES package_versions(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Code changes (marketplace repo):**

```typescript
// storage.service.ts
async retrievePackage(namespace: string, name: string, version: string): Promise<string> {
  // OLD: Read from filesystem
  // const content = fs.readFileSync(`./storage/packages/${namespace}/${name}/${version}/${name}-${version}.yaml`, 'utf8');

  // NEW: Read from database
  const result = await db.query(
    'SELECT yaml_content FROM package_versions WHERE package_id = (SELECT id FROM packages WHERE namespace = $1 AND name = $2) AND version = $3',
    [namespace, name, version]
  );

  if (!result.rows[0]) {
    throw new Error('Package not found');
  }

  return result.rows[0].yaml_content;
}

async storePackage(namespace: string, name: string, version: string, content: string): Promise<void> {
  // OLD: Write to filesystem
  // fs.writeFileSync(`./storage/packages/${namespace}/${name}/${version}/${name}-${version}.yaml`, content);

  // NEW: Write to database
  await db.query(
    'UPDATE package_versions SET yaml_content = $4 WHERE package_id = (SELECT id FROM packages WHERE namespace = $1 AND name = $2) AND version = $3',
    [namespace, name, version, content]
  );
}
```

---

### Option 2: Railway Volumes

**Pros:**

- ✅ Minimal code changes
- ✅ Fast file access
- ✅ Persists across deployments

**Cons:**

- ❌ Doesn't work with multiple instances (single volume)
- ❌ Not backed up automatically
- ❌ Railway-specific (vendor lock-in)
- ❌ Can't easily migrate to other platforms

**Implementation:**

1. Railway Dashboard → Marketplace Service
2. Settings → Volumes
3. Add New Volume
4. Mount path: `/app/storage`
5. Redeploy

**Not recommended for production** due to single-instance limitation.

---

### Option 3: Cloud Object Storage (S3, GCS, R2)

**Pros:**

- ✅ Highly scalable
- ✅ Works with multiple instances
- ✅ Automatic backups
- ✅ CDN integration possible
- ✅ Industry standard

**Cons:**

- ❌ Additional service/cost
- ❌ More complex setup
- ❌ Network latency for reads/writes

**Implementation:**

```typescript
// storage.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async retrievePackage(namespace: string, name: string, version: string): Promise<string> {
  const key = `packages/${namespace}/${name}/${version}/${name}-${version}.yaml`;

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });

  const response = await s3.send(command);
  return await response.Body.transformToString();
}

async storePackage(namespace: string, name: string, version: string, content: string): Promise<void> {
  const key = `packages/${namespace}/${name}/${version}/${name}-${version}.yaml`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: content,
    ContentType: 'text/yaml',
  });

  await s3.send(command);
}
```

**Alternatives:**

- **Cloudflare R2** - S3-compatible, free egress
- **Google Cloud Storage** - Similar to S3
- **Backblaze B2** - Cheaper alternative
- **DigitalOcean Spaces** - Simple S3-compatible

---

### Option 4: Hybrid Approach

**Database + CDN/Cache:**

1. Store YAML in database (source of truth)
2. Cache frequently accessed packages in Redis/memory
3. Optionally serve through CDN for performance

**Best of both worlds:**

- ✅ Reliable (database)
- ✅ Fast (cache/CDN)
- ✅ Scalable
- ✅ No external file storage needed

---

## 📊 Recommendation Matrix

| Solution             | Reliability | Scalability | Complexity | Cost       | Recommended       |
| -------------------- | ----------- | ----------- | ---------- | ---------- | ----------------- |
| **Database**         | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐  | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ | ✅ **YES**        |
| Railway Volume       | ⭐⭐⭐      | ⭐⭐        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⚠️ Quick fix only |
| Cloud Storage        | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐  | ⭐⭐       | ⭐⭐⭐     | ✅ For scale      |
| Filesystem (current) | ⭐          | ⭐          | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ **NO**         |

---

## 🎯 Recommended Solution: Database Storage

### Why Database is Best Here:

1. **Package YAML files are small** (usually < 100KB)
   - Won't bloat database significantly
   - Fast to query and retrieve

2. **Already have database infrastructure**
   - No new services needed
   - Already backing up database

3. **Consistent with metadata storage**
   - Package metadata already in DB
   - Keep everything together

4. **Simple to implement**
   - Add one column: `yaml_content TEXT`
   - Update two functions: store and retrieve
   - No external dependencies

5. **Production ready immediately**
   - Survives all deployments
   - Works with horizontal scaling
   - Reliable and backed up

---

## 🔧 Implementation Steps (Marketplace Repo)

### Step 1: Database Migration

```sql
-- Migration: Add yaml_content column
-- File: migrations/XXX_add_yaml_content.sql

BEGIN;

-- Add column to package_versions table
ALTER TABLE package_versions
ADD COLUMN yaml_content TEXT;

-- Optionally add index for faster queries
CREATE INDEX idx_package_versions_yaml_content
ON package_versions ((LENGTH(yaml_content)));

COMMIT;
```

### Step 2: Update Storage Service

```typescript
// File: src/services/storage.service.ts

export class StorageService {
  // Remove filesystem methods
  // Add database methods

  async storePackage(packageId: number, version: string, yamlContent: string): Promise<void> {
    await db.query(
      'UPDATE package_versions SET yaml_content = $1 WHERE package_id = $2 AND version = $3',
      [yamlContent, packageId, version]
    );
  }

  async retrievePackage(namespace: string, name: string, version: string): Promise<string> {
    const result = await db.query(
      `
      SELECT pv.yaml_content 
      FROM package_versions pv
      JOIN packages p ON p.id = pv.package_id
      WHERE p.namespace = $1 AND p.name = $2 AND pv.version = $3
    `,
      [namespace, name, version]
    );

    if (!result.rows[0] || !result.rows[0].yaml_content) {
      throw new Error('Package file not found');
    }

    return result.rows[0].yaml_content;
  }
}
```

### Step 3: Update Upload Handler

```typescript
// File: src/routes/package.routes.ts

router.post('/api/v1/packages', upload.single('file'), async (req, res) => {
  const yamlContent = req.file.buffer.toString('utf8');

  // Parse and validate YAML
  const packageData = parseYAML(yamlContent);

  // Store in database
  const pkg = await Package.create({
    namespace: packageData.namespace,
    name: packageData.name,
    // ... other fields
  });

  const version = await PackageVersion.create({
    package_id: pkg.id,
    version: packageData.version,
    yaml_content: yamlContent, // ← Store YAML here
    // ... other fields
  });

  res.json({ success: true, package: pkg });
});
```

### Step 4: Update Download Handler

```typescript
// File: src/routes/package.routes.ts

router.get('/api/v1/packages/:namespace/:name/:version/download', async (req, res) => {
  const { namespace, name, version } = req.params;

  try {
    const yamlContent = await storageService.retrievePackage(namespace, name, version);

    res.setHeader('Content-Type', 'text/yaml');
    res.setHeader('Content-Disposition', `attachment; filename="${name}-${version}.yaml"`);
    res.send(yamlContent);
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({ error: 'Package not found' });
  }
});
```

### Step 5: Data Migration (Existing Files)

If you have existing files in `./storage/`, migrate them:

```typescript
// One-time migration script
// File: scripts/migrate-files-to-db.ts

import * as fs from 'fs';
import * as path from 'path';
import { db } from '../src/db';

async function migrateFilesToDatabase() {
  const storageDir = './storage/packages';

  // Walk through all package files
  const packages = await db.query('SELECT * FROM packages');

  for (const pkg of packages.rows) {
    const versions = await db.query('SELECT * FROM package_versions WHERE package_id = $1', [
      pkg.id,
    ]);

    for (const ver of versions.rows) {
      const filePath = path.join(
        storageDir,
        pkg.namespace,
        pkg.name,
        ver.version,
        `${pkg.name}-${ver.version}.yaml`
      );

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        await db.query('UPDATE package_versions SET yaml_content = $1 WHERE id = $2', [
          content,
          ver.id,
        ]);

        console.log(`Migrated: ${pkg.namespace}/${pkg.name}@${ver.version}`);
      } else {
        console.warn(`Missing file: ${filePath}`);
      }
    }
  }

  console.log('Migration complete!');
}

migrateFilesToDatabase();
```

---

## 🚀 Deployment Plan

### Phase 1: Add Database Storage (Non-Breaking)

1. Add `yaml_content` column to database
2. Update upload handler to store in BOTH filesystem AND database
3. Update download handler to try database first, fallback to filesystem
4. Deploy
5. Test

### Phase 2: Migration

1. Run migration script to copy existing files to database
2. Verify all files migrated successfully
3. Test download functionality

### Phase 3: Remove Filesystem Dependency

1. Remove filesystem fallback from download handler
2. Remove filesystem write from upload handler
3. Remove `./storage/` directory
4. Deploy

### Phase 4: Cleanup

1. Remove Railway volume (if added)
2. Remove filesystem-related code
3. Update documentation

---

## ⚡ Quick Fix for Immediate Issue

**For the current problem (featured/base package):**

Since we can't deploy database changes immediately, you have three options:

### Option A: Add Railway Volume (Quick)

- Railway Dashboard → Volumes → Add `/app/storage`
- Redeploy
- Re-upload package
- Works until proper fix deployed

### Option B: Store Package in Database Manually

```sql
-- If you have database access
UPDATE package_versions
SET yaml_content = '
id: featured/base
version: 1.0.0
metadata:
  name: Base Package
  ...
'
WHERE package_id = (SELECT id FROM packages WHERE namespace = 'featured' AND name = 'base')
AND version = '1.0.0';
```

### Option C: Re-publish Package After Each Deploy

- Upload package through publish endpoint
- Files will exist until next deploy
- Temporary workaround

---

## 📝 Action Items

### For Marketplace Repository (`prompt-gen-marketplace`):

1. **Immediate:**
   - [ ] Add Railway Volume as temporary fix
   - [ ] Document the architectural issue

2. **Short-term (1-2 weeks):**
   - [ ] Create database migration for `yaml_content` column
   - [ ] Update `storage.service.ts` to use database
   - [ ] Update upload/download routes
   - [ ] Test with existing packages

3. **Medium-term (1 month):**
   - [ ] Migrate existing files to database
   - [ ] Remove filesystem dependencies
   - [ ] Remove Railway volume
   - [ ] Update documentation

4. **Optional (Future):**
   - [ ] Consider CDN/caching layer for performance
   - [ ] Consider moving to cloud storage if scale requires

### For Web App Repository (This Repo):

- ✅ Already done - Enhanced error handling
- ✅ Already done - Comprehensive documentation
- [ ] Update user documentation about reliability expectations

---

## 📚 References for Implementation

### Database Storage Examples:

- GitHub stores gists as text in PostgreSQL
- GitLab stores snippets in database
- Many CMSs store content in database

### Migration Patterns:

- Feature flags for gradual rollout
- Dual-write pattern (write to both old and new)
- Background migration jobs
- Verification before cutover

### Railway Volumes:

- https://docs.railway.app/reference/volumes
- Note: Single instance only, not for horizontal scaling

---

## 🎯 Summary

**Current State:** ❌ Files stored in ephemeral container filesystem  
**Impact:** Files lost on every deployment  
**Quick Fix:** Add Railway Volume (temporary)  
**Proper Fix:** Store YAML in database (recommended)  
**Alternative:** Cloud object storage (S3, etc.)  
**Timeline:** Quick fix now, proper fix in 1-2 weeks

The marketplace architecture needs to be updated to use persistent storage. Database storage is the recommended solution for this use case.

---

**Created:** 2025 M12 28  
**Status:** Architectural issue documented  
**Priority:** HIGH (affects production reliability)  
**Owner:** Marketplace repository maintainer  
**Related:** Web app already handles errors gracefully
