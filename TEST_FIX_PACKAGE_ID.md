# Test Fix: rendering-v2-dependencies.test.ts

**Date:** 2025-12-22  
**Status:** ✅ FIXED  
**Repository:** prompt-gen-web

---

## Issue

After running `fix-web-dec-0012.ps1`, one test was failing:

```
FAIL  src/services/rendering-v2-dependencies.test.ts > 
  should handle "package_id" field name (TypeScript format)

AssertionError: expected { package: 'test.provider', ... } 
  to have property "package_id"
```

---

## Root Cause

The test was checking for backwards compatibility with `package_id` field, but DEC-0012 intentionally removes this compatibility.

**Test at line 375:**
```typescript
expect(consumer.dependencies?.[0]).toHaveProperty('package_id'); // ❌ OLD
```

---

## Fix Applied

Updated the test to expect only the canonical `package` field:

```typescript
// Before (expected both fields)
expect(consumer.dependencies?.[0]).toHaveProperty('package_id');
expect(consumer.dependencies?.[0]?.package).toBe('test.provider');

// After (expects only canonical field)
expect(consumer.dependencies?.[0]).toHaveProperty('package');
expect(consumer.dependencies?.[0]?.package).toBe('test.provider');
```

Also updated test name:
```typescript
// Before
it('should handle "package_id" field name (TypeScript format)', ...)

// After  
it('should handle "package" field name (DEC-0012 canonical)', ...)
```

---

## Verification

✅ **All tests now pass:**

```
Test Files  8 passed  1 skipped (9)
     Tests  77 passed  1 skipped (78)
  Duration  2.58s
```

**Note:** stderr messages about "Namespace 'provider' not found" are EXPECTED - those are error handling tests that intentionally trigger errors to verify proper error messages.

---

## Manual Fix Steps

If you need to apply this fix manually:

1. **Open:** `src/services/rendering-v2-dependencies.test.ts`
2. **Find line 375:** `expect(consumer.dependencies?.[0]).toHaveProperty('package_id');`
3. **Change to:** `expect(consumer.dependencies?.[0]).toHaveProperty('package');`
4. **Find test name:** `should handle "package_id" field name (TypeScript format)`
5. **Change to:** `should handle "package" field name (DEC-0012 canonical)`
6. **Save and run:** `npm run test:run`

---

## Why This Was Necessary

Per **DEC-0012**, we are enforcing a **clean canonical spec** with NO backwards compatibility:
- Only `package:` field is supported
- `package_id:` is no longer recognized
- Tests must reflect this new reality

---

## Status

✅ **FIXED** - All tests passing  
✅ **Compliant with DEC-0012**  
✅ **Ready to commit**

---

## Related

- **DEC-0012 Decision:** `archive/decisions/DEC-0012_SPEC_CANONICALIZATION.md`
- **Fix Script:** `scripts/fix-web-dec-0012.ps1`
- **Test Results:** 77 passed, 1 skipped

