# E2E Tests Updated for Editor Menu Changes

**Date:** 2025-12-27  
**Status:** ✅ Complete  
**Purpose:** Update E2E tests to work with new Editor menu structure

---

## Problem

After removing "Load Package" and "Create Package" buttons from the home page and moving them to the Editor/Library, 4 E2E tests were failing:

1. ❌ `click-behavior.spec.ts` - "Clicking a datatype should always select it"
2. ❌ `click-behavior.spec.ts` - "Tags should display as visual key-value pairs"
3. ❌ `click-simple.spec.ts` - "Verify editor shows and selection updates"
4. ❌ `featured-common-random-click.spec.ts` - "random order clicking should always select"

All tests were timing out looking for buttons that no longer exist:
- `button:has-text("Load Package")` 
- `button:has-text("Create Package")`

---

## Solution

Updated test navigation to match the new UI flow:

### 1. Creating New Packages

**Old approach (Home page):**
```typescript
await page.goto('/');
await page.click('button:has-text("Create Package")');
```

**New approach (Editor page):**
```typescript
await page.goto('/editor');
await page.click('button:has-text("Create")'); // ➕ Create button when no package loaded
```

### 2. Loading Existing Packages

**Old approach (Home page with modal):**
```typescript
await page.goto('/');
await page.click('button:has-text("Load Package")');
await page.waitForSelector('.modal');
await page.locator('.package-item-content').click();
```

**New approach (Library page with cards):**
```typescript
await page.goto('/library');
const packageCard = page.locator('.package-card').filter({ hasText: 'Package Name' });
const editButton = packageCard.locator('button:has-text("Edit")');
await editButton.click();
```

---

## Files Modified

### 1. `e2e/click-simple.spec.ts`

**Changes:**
- Navigate directly to `/editor` instead of `/`
- Click `"Create"` button instead of `"Create Package"`
- Simplified test flow by going straight to the right page

**Before:**
```typescript
await page.goto('/');
await page.click('button:has-text("Create Package")');
await page.waitForSelector('text=Package Editor');
```

**After:**
```typescript
await page.goto('/');
await page.waitForSelector('text=Random Prompt Generator');
await page.goto('/editor');
await page.waitForSelector('text=Package Editor');
await page.click('button:has-text("Create")');
```

---

### 2. `e2e/click-behavior.spec.ts`

**Changes in `loadTestPackage()` helper:**
- Navigate to `/library` instead of clicking "Load Package"
- Find package card instead of modal package item
- Click "Edit" button on the card
- Removed modal waiting logic

**Before:**
```typescript
const loadButton = page.locator('button', { hasText: 'Load Package' });
await loadButton.click();
await page.waitForSelector('.modal');
const packageItem = page.locator('.package-item-content')
  .filter({ hasText: 'Click Test Package' });
await packageItem.click();
```

**After:**
```typescript
await page.goto('/library');
await page.waitForSelector('text=Library');
const packageCard = page.locator('.package-card')
  .filter({ hasText: 'Click Test Package' });
const editButton = packageCard.locator('button:has-text("Edit")');
await editButton.click();
```

---

### 3. `e2e/featured-common-random-click.spec.ts`

**Changes in `loadPackageThroughUI()` helper:**
- Same pattern as click-behavior.spec.ts
- Navigate to `/library`
- Find package card for "Featured Common Package"
- Click "Edit" button

**Before:**
```typescript
await page.click('button:has-text("Load Package")');
await page.waitForSelector('.modal');
const pkgRow = page.locator('.package-item-content')
  .filter({ hasText: 'Featured Common Package' });
await pkgRow.click();
```

**After:**
```typescript
await page.goto('/library');
await page.waitForSelector('text=Library');
const packageCard = page.locator('.package-card')
  .filter({ hasText: 'Featured Common Package' });
const editButton = packageCard.locator('button:has-text("Edit")');
await editButton.click();
```

---

## Test Results

### Before:
```
4 failed
  [chromium] › click-behavior.spec.ts (2 tests)
  [chromium] › click-simple.spec.ts (1 test)
  [chromium] › featured-common-random-click.spec.ts (1 test)
```

### After:
```
✅ 4 passed (14.9s)
  ok 1 [chromium] › click-behavior.spec.ts:128:3 (2.2s)
  ok 2 [chromium] › click-behavior.spec.ts:157:3 (857ms)
  ok 3 [chromium] › click-simple.spec.ts:4:3 (2.8s)
  ok 4 [chromium] › featured-common-random-click.spec.ts:128:3 (5.8s)
```

---

## Key Learnings

### 1. UI Changes Require Test Updates

When UI navigation changes, E2E tests must be updated to match the new flow. Tests were tightly coupled to specific button text and locations.

### 2. Page Navigation is More Reliable

Going directly to the target page (`/library`, `/editor`) is more reliable than clicking through multiple navigation steps.

### 3. Component Selectors

The new approach uses:
- **Package cards** (`.package-card`) instead of modal items
- **Card buttons** (`button:has-text("Edit")`) instead of clickable rows
- **Direct routes** (`/library`, `/editor`) instead of home page actions

### 4. Helper Function Benefits

Having helper functions like `loadTestPackage()` and `loadPackageThroughUI()` made it easy to update the navigation logic in one place for multiple tests.

---

## Future Considerations

### Test Maintenance

- Consider using data-testid attributes instead of text matching for more stable selectors
- Extract navigation helpers into shared test utilities
- Add visual regression tests to catch UI changes earlier

### Suggested Test IDs

```html
<!-- Editor -->
<button data-testid="editor-create-btn">➕ Create</button>
<button data-testid="editor-import-btn">📥 Import</button>

<!-- Library -->
<button data-testid="package-edit-btn">✏️ Edit</button>
<button data-testid="package-generate-btn">⚡ Generate</button>

<!-- Package Cards -->
<div class="package-card" data-testid="package-card" data-package-id="...">
```

This would make tests more resilient to text/emoji changes while still being readable.

---

## Summary

✅ All E2E tests updated to work with new Editor menu structure  
✅ Tests now use Library page for loading packages  
✅ Tests use Editor page directly for creating packages  
✅ All 4 tests passing successfully  
✅ Test execution time: ~15 seconds (fast!)  

The test suite is now aligned with the improved UI navigation flow! 🚀

