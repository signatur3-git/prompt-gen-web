# Suggested Commit Message

```
fix: enhance marketplace error handling and diagnostics for Railway 500 errors

## Changes

### Enhanced Error Handling
- Add detailed console logging for all marketplace operations
- Parse and display server error responses
- Provide specific guidance based on error type (500, 404, network)
- Log full context (URL, token status, package details)

### Files Modified
- src/services/marketplace-client.ts
  - Enhanced downloadPackage() with detailed error logging
  - Parse server error response body (JSON or text)
  - Better network error detection and messaging
  - Log download URL and authentication status

- src/views/MarketplaceView.vue
  - Enhanced importPackage() error handling
  - Log marketplace URL and package context
  - Provide user-friendly error messages with troubleshooting steps
  - Add specific guidance for 500, 404, and network errors

### Documentation Added
- MARKETPLACE_500_ERROR_TROUBLESHOOTING.md - Complete troubleshooting guide
- MARKETPLACE_500_ACTION_PLAN.md - Quick action plan for server investigation
- MARKETPLACE_500_RESOLUTION_SUMMARY.md - Full analysis and resolution steps
- MARKETPLACE_500_QUICKREF.md - Quick reference card

### Documentation Updated
- MARKETPLACE_VERSION_FIX.md - Added notes about Railway 500 error

## Issue

Users on Railway production encounter:
```

[Marketplace] Import failed: Error: Download failed: 500

```

This is a marketplace server error (not a web app issue).

## Root Cause

The web app is working correctly - sending proper requests with valid
authentication. The 500 error is being returned by the marketplace server,
indicating a server-side issue that needs investigation.

## Solution (Web App Side)

Enhanced error handling and diagnostics to:
1. Help identify the root cause through detailed logging
2. Provide users with helpful error messages and workarounds
3. Give developers full context for server-side investigation

## Testing

- ✅ Build passes without errors
- ✅ TypeScript compilation successful
- ✅ Enhanced logging verified
- ✅ Error messages tested

## Next Steps

Server-side investigation needed:
1. Check Railway marketplace logs for actual error
2. Verify package files exist in storage
3. Test database connectivity
4. Review environment configuration

See: MARKETPLACE_500_ACTION_PLAN.md for detailed investigation steps.

## Workaround

Users can download YAML and import manually from Library > Imported tab.

## Related

- Fixes #<issue-number> (if applicable)
- Relates to marketplace import feature implementation
- Part of Railway production debugging

---

Type: Fix
Scope: Marketplace, Error Handling
Breaking: No
```

---

## Alternative Short Version

```
fix: enhance marketplace error diagnostics for Railway 500 errors

Add detailed error logging and user-friendly messages for marketplace
import failures. Parse server error responses and provide specific
troubleshooting guidance.

The 500 error is a server-side issue requiring marketplace logs
investigation. Web app now provides full diagnostic context.

Files changed:
- src/services/marketplace-client.ts (enhanced error handling)
- src/views/MarketplaceView.vue (detailed logging)

Documentation added:
- MARKETPLACE_500_ERROR_TROUBLESHOOTING.md
- MARKETPLACE_500_ACTION_PLAN.md
- MARKETPLACE_500_RESOLUTION_SUMMARY.md
```

---

## Git Commands

```bash
# Stage changes
git add src/services/marketplace-client.ts
git add src/views/MarketplaceView.vue
git add MARKETPLACE_500_ERROR_TROUBLESHOOTING.md
git add MARKETPLACE_500_ACTION_PLAN.md
git add MARKETPLACE_500_RESOLUTION_SUMMARY.md
git add MARKETPLACE_500_QUICKREF.md
git add MARKETPLACE_VERSION_FIX.md

# Or stage all
git add .

# Commit with detailed message
git commit -F- << 'EOF'
fix: enhance marketplace error handling and diagnostics for Railway 500 errors

Enhanced error handling for marketplace import failures on Railway:

- Add detailed console logging for diagnostics
- Parse and display server error responses
- Provide context-specific error messages
- Log full request details (URL, auth, package info)

Files modified:
- src/services/marketplace-client.ts
- src/views/MarketplaceView.vue

Documentation added:
- MARKETPLACE_500_ERROR_TROUBLESHOOTING.md
- MARKETPLACE_500_ACTION_PLAN.md
- MARKETPLACE_500_RESOLUTION_SUMMARY.md
- MARKETPLACE_500_QUICKREF.md

The 500 error is a marketplace server issue requiring server-side
investigation. Web app now provides full diagnostic context to help
identify the root cause.

Users can work around by downloading YAML and importing from Library.
EOF

# Push to remote
git push origin main
```

---

## PR Description Template

```markdown
## Description

Enhances error handling and diagnostics for marketplace import failures on Railway production.

## Problem

Users on Railway encounter 500 Internal Server Error when importing packages:
```

[Marketplace] Import failed: Error: Download failed: 500

```

## Solution

### Web App Improvements
- ✅ Enhanced error logging with full context
- ✅ Parse server error response bodies
- ✅ User-friendly error messages with troubleshooting steps
- ✅ Specific guidance for different error types

### Investigation Support
- ✅ Detailed console logs for debugging
- ✅ Log marketplace URL and authentication status
- ✅ Log package details and request context
- ✅ Comprehensive troubleshooting documentation

## Changes

- `src/services/marketplace-client.ts` - Enhanced downloadPackage() error handling
- `src/views/MarketplaceView.vue` - Added detailed error logging and user guidance
- Documentation - Added comprehensive troubleshooting guides

## Testing

- [x] Build passes
- [x] TypeScript compilation successful
- [x] Error messages tested locally
- [x] Enhanced logging verified

## Next Steps

Server-side investigation needed (see MARKETPLACE_500_ACTION_PLAN.md):
1. Check Railway marketplace logs
2. Verify package files exist
3. Test database connectivity
4. Review environment configuration

## Workaround

Users can download YAML and import manually from Library > Imported tab.

## Screenshots

Console output with enhanced logging:
```

[Marketplace] Importing package: featured/base@1.0.0
[Marketplace] Marketplace URL: https://...
[Marketplace] Download URL: https://.../download
[Marketplace] Token present: true
[Marketplace] Download failed: {
status: 500,
statusText: "Internal Server Error",
errorDetails: "..."
}

```

## Documentation

- [MARKETPLACE_500_ERROR_TROUBLESHOOTING.md](./MARKETPLACE_500_ERROR_TROUBLESHOOTING.md)
- [MARKETPLACE_500_ACTION_PLAN.md](./MARKETPLACE_500_ACTION_PLAN.md)
- [MARKETPLACE_500_RESOLUTION_SUMMARY.md](./MARKETPLACE_500_RESOLUTION_SUMMARY.md)

## Breaking Changes

None

## Related Issues

- Part of marketplace import feature
- Railway production debugging
```
