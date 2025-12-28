# Fix: Package Version Undefined Error (404 on Import/Download)

## Issue

When trying to import or download packages from the marketplace, users encountered:

```
Failed to import package: Download failed: 404 Not Found

GET http://localhost:5174/api/v1/packages/featured/base/undefined/download 404 (Not Found)
```

The URL showed `undefined` in place of the version number.

## Root Cause

The marketplace API returns packages with `latest_version` field instead of `version` field for the latest version. The import and download functions were only checking `pkg.version`, which was `undefined`.

The template was already handling this correctly:

```vue
v{{ pkg.latest_version || pkg.version }}
```

But the JavaScript functions were not.

## Solution

Updated both `importPackage()` and `downloadPackage()` functions to use the same fallback logic as the template:

### Before:

```typescript
async function importPackage(pkg: Package) {
  // ...
  const content = await marketplaceClient.downloadPackage(
    pkg.namespace,
    pkg.name,
    pkg.version // ❌ pkg.version is undefined
  );
  // ...
}
```

### After:

```typescript
async function importPackage(pkg: Package) {
  // Use latest_version if version is undefined
  const version = pkg.latest_version || pkg.version;

  if (!version) {
    throw new Error('Package version is not available');
  }

  const content = await marketplaceClient.downloadPackage(
    pkg.namespace,
    pkg.name,
    version // ✅ Uses latest_version first
  );
  // ...
}
```

Same fix applied to `downloadPackage()` function.

## Changes Made

### File: `src/views/MarketplaceView.vue`

1. **importPackage() function** (lines ~313-318)
   - Added version resolution logic
   - Added version validation
   - Updated download call to use resolved version
   - Improved console logging

2. **downloadPackage() function** (lines ~407-415)
   - Added version resolution logic
   - Added version validation
   - Updated download call to use resolved version
   - Updated filename to use resolved version

3. **TypeScript safety improvements**
   - Added optional chaining to `selectedPackage?.content_counts` checks
   - Added optional chaining to `selectedPackage?.version_count` check

## Testing

### Build Status

✅ TypeScript compilation successful  
✅ Vite build passes  
✅ No errors or warnings

### How to Verify Fix

1. Start dev server: `npm run dev`
2. Navigate to `/marketplace`
3. Connect to marketplace
4. Select any package
5. Click "Import to Library" button
6. **Expected**: Package imports successfully
7. **Expected**: No 404 errors in console
8. **Expected**: URL shows actual version number, not "undefined"

### Console Output (Expected)

```
[Marketplace] Importing package: namespace/name@1.0.0
[Marketplace] Downloading package: namespace/name@1.0.0
[Marketplace] Downloaded 12345 bytes
[Marketplace] Package imported successfully
```

## Package Object Structure

### Marketplace API Returns:

```typescript
{
  id: "namespace/name",
  namespace: "namespace",
  name: "name",
  version: undefined,              // ❌ Not set for latest
  latest_version: "1.0.0",         // ✅ Set to latest version
  description: "...",
  author: "...",
  content_counts: { ... }
}
```

### Older Packages Might Have:

```typescript
{
  id: "namespace/name",
  namespace: "namespace",
  name: "name",
  version: "1.0.0",                // ✅ Set directly
  latest_version: undefined,        // ❌ Not set
  description: "...",
  author: "...",
  content_counts: { ... }
}
```

### The Fix Handles Both:

```typescript
const version = pkg.latest_version || pkg.version;
// Works regardless of which field is set
```

## Related Files

- `src/views/MarketplaceView.vue` - Fixed import and download functions
- `src/services/marketplace-client.ts` - No changes needed (already correct)

## Deployment

✅ **Ready for deployment**

- Build passes
- No breaking changes
- Backward compatible (handles both version fields)
- Enhanced error handling

## Additional Improvements

As part of this fix, also added:

1. **Better error messages**: Clear message when version is not available
2. **Enhanced logging**: Shows resolved version in console logs
3. **Type safety**: Added optional chaining for TypeScript warnings
4. **Consistent handling**: Both import and download use same logic

## Prevention

To prevent similar issues in the future:

1. **Always use fallback**: `pkg.latest_version || pkg.version`
2. **Validate before use**: Check if version exists before API calls
3. **Console logging**: Log resolved values for debugging
4. **Test with real data**: Test with actual marketplace API responses

---

**Fixed**: 2025 M12 28  
**Status**: ✅ Resolved (404 version issue)  
**Severity**: High (blocking import/download)  
**Impact**: All marketplace users  
**Build**: ✅ Passing

---

## Update: Railway Production 500 Error

After deploying this fix, a new issue was discovered on Railway production:

```
[Marketplace] Import failed: Error: Download failed: 500
```

This is a **server-side issue** (marketplace server error), not related to the version fix.

**See**: [MARKETPLACE_500_ERROR_TROUBLESHOOTING.md](./MARKETPLACE_500_ERROR_TROUBLESHOOTING.md) for:

- Detailed diagnostics
- Server-side investigation steps
- Enhanced error logging (now deployed)
- Workarounds for users

**Status of 500 Error:**

- ✅ Enhanced client-side error handling deployed
- ⏳ Server-side investigation needed
- ✅ Workaround available (download YAML, import from Library)
