# Testing Duplicate Detection - Debug Guide

## What I Added

Added console logging to help diagnose why packages show "Import" instead of "Already Imported".

## How to Test

### Step 1: Deploy and Open Browser Console

1. Deploy the new build to Railway (or run locally)
2. Navigate to `/marketplace`
3. Open browser console (F12)

### Step 2: Check Imported Package IDs

When the page loads, you should see:

```
[Marketplace] Imported package IDs: Array(X) [ "package-id-1", "package-id-2", ... ]
```

This shows which package IDs are in your local library with `source: 'marketplace'`.

### Step 3: Select a Package

Click on any package card. You should see:

```
[Marketplace] Selected package ID: "featured/base"
[Marketplace] Checking if featured/base is imported: true/false
[Marketplace] Is imported? true/false
```

### Step 4: Compare IDs

**The key question:** Do the IDs match?

- **Marketplace package ID:** Usually `"namespace/name"` (e.g., `"featured/base"`)
- **Local package ID:** Might be different format

## Possible Issues

### Issue 1: ID Format Mismatch

**Marketplace package:**

```json
{
  "id": "featured/base",
  "namespace": "featured",
  "name": "base"
}
```

**Local package after import:**

```json
{
  "id": "featured/base", // ← Should match
  "source": "marketplace"
}
```

If local ID is different (e.g., just `"base"` or `"featured-base"`), they won't match.

### Issue 2: Source Not Set

After import, we set `source: 'marketplace'`, but maybe it's not saving correctly.

Check localStorage:

```javascript
// In browser console
JSON.parse(localStorage.getItem('rpg-packages'));
```

Look for the imported package and check if `source === 'marketplace'`.

### Issue 3: Package List Not Refreshed

The `importedPackageIds` is a computed property, but maybe `packageStore.packages` isn't updating.

## What the Logs Will Tell Us

### Scenario A: IDs Match, Detection Works ✅

```
[Marketplace] Imported package IDs: ["featured/base"]
[Marketplace] Selected package ID: "featured/base"
[Marketplace] Checking if featured/base is imported: true
```

**Result:** Button shows "Already Imported" ✅

### Scenario B: IDs Don't Match ❌

```
[Marketplace] Imported package IDs: ["base"]  ← Missing namespace
[Marketplace] Selected package ID: "featured/base"
[Marketplace] Checking if featured/base is imported: false
```

**Problem:** Local package ID doesn't include namespace

### Scenario C: Source Not Set ❌

```
[Marketplace] Imported package IDs: []  ← Empty!
[Marketplace] Selected package ID: "featured/base"
[Marketplace] Checking if featured/base is imported: false
```

**Problem:** Package imported but source not set to 'marketplace'

### Scenario D: Package List Not Loaded ❌

```
[Marketplace] Imported package IDs: []  ← Empty!
```

**Problem:** `packageStore.loadPackageList()` didn't run or failed

## If Detection Still Fails

### Quick Fix 1: Check localStorage Directly

```javascript
// In browser console
const storage = JSON.parse(localStorage.getItem('rpg-packages'));
console.log('All packages:', storage.packages);
console.log(
  'Marketplace packages:',
  Object.values(storage.packages).filter(p => p.source === 'marketplace')
);
```

### Quick Fix 2: Manually Set Source

If you already imported a package but source isn't set:

```javascript
// In browser console
const storage = JSON.parse(localStorage.getItem('rpg-packages'));
const pkg = storage.packages['featured/base']; // Use actual package ID
if (pkg) {
  pkg.source = 'marketplace';
  localStorage.setItem('rpg-packages', JSON.stringify(storage));
  console.log('Source set! Refresh page.');
}
```

### Quick Fix 3: Check Package ID Format

```javascript
// In browser console - Check local package
const storage = JSON.parse(localStorage.getItem('rpg-packages'));
Object.keys(storage.packages).forEach(id => {
  console.log('Local ID:', id);
});

// Compare with marketplace package ID
// (You'll see this in network tab when viewing package)
```

## Expected Behavior After Import

1. Import button clicked
2. Package downloaded and imported
3. `source: 'marketplace'` set
4. Package list refreshed
5. `importedPackageIds` computed property updates
6. Button changes to "Already Imported"

## Action Items Based on Logs

### If IDs Don't Match

- Need to fix the ID format when importing
- Either normalize marketplace ID or local ID

### If Source Not Set

- Check if `savePackage()` is working
- Verify localStorage is writable

### If List Not Refreshed

- Add explicit `packageStore.loadPackageList()` after import
- Or add a watcher on `packageStore.packages`

---

## Next Steps

1. **Deploy** the new build
2. **Open browser console**
3. **Select a package** you've already imported
4. **Copy the console logs** and share them
5. We'll see exactly why detection isn't working

The logs will show us whether:

- ✅ IDs match but detection broken
- ❌ IDs don't match (format issue)
- ❌ Source not being set
- ❌ Package list not loading

---

**Created:** 2025 M12 28  
**Purpose:** Debug duplicate detection issue  
**Status:** Awaiting test results
