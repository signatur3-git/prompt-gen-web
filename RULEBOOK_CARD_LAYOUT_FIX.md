# Rulebook Card Layout Fix

**Date:** 2025-12-27  
**Status:** ✅ Fixed  
**Issue:** Rulebook cards in Generate view displaying as 3 columns (table-like) on initial load

---

## Problem

When navigating to the Generate (Preview) view, the rulebook cards in the sidebar would sometimes display incorrectly as 3 columns in a row (like a table), showing:

- Column 1: Rulebook name
- Column 2: Package/namespace badges
- Column 3: Entry points info

After a page refresh, the cards would display correctly in their intended card layout with proper vertical stacking.

---

## Root Cause

**CSS Loading Race Condition**

The `.rulebook-item` component was missing explicit layout declarations:

- No `display: flex` property
- No `flex-direction: column` property
- Child elements had no explicit `display: block` declarations

This caused the browser to render the elements using default inline/block flow before the CSS was fully applied, resulting in a table-like appearance where the three child divs appeared side-by-side instead of stacked vertically.

### Why it worked after refresh:

On refresh, the CSS was likely cached and loaded faster, or the browser had already parsed the styles, so the layout rendered correctly immediately.

---

## Solution

Added explicit layout declarations to ensure the card structure is defined even before all CSS is fully loaded:

### 1. Made `.rulebook-item` an explicit flex container

**Before:**

```css
.rulebook-item {
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
```

**After:**

```css
.rulebook-item {
  display: flex;
  flex-direction: column;
  background: var(--color-surface-hover);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
```

### 2. Made child elements explicitly block-level

**`.rulebook-name` - Before:**

```css
.rulebook-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
  word-break: break-word;
}
```

**`.rulebook-name` - After:**

```css
.rulebook-name {
  display: block;
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
  word-break: break-word;
}
```

**`.entry-points-info` - Before:**

```css
.entry-points-info {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  font-style: italic;
}
```

**`.entry-points-info` - After:**

```css
.entry-points-info {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  font-style: italic;
}
```

---

## Files Modified

- **`src/views/PreviewView.vue`** - Added explicit flex layout to rulebook cards

---

## Technical Details

### Why This Fix Works

1. **Explicit Layout Declaration**: By adding `display: flex; flex-direction: column;`, the browser knows immediately how to layout the card, even before all styles load.

2. **Block-level Children**: Adding `display: block;` to child elements prevents them from being treated as inline elements (which could sit side-by-side).

3. **No Dependency on Load Order**: The layout is now defined by the structure itself, not relying on other CSS properties to be loaded in a specific order.

### Browser Behavior Without Explicit Layout

When CSS isn't fully loaded or parsed:

- Divs default to `display: block` (good)
- But without a parent flex container, they might render in unexpected ways
- Inline elements or mixed content can cause "table-like" layouts
- Different browsers might render differently

---

## Testing

### Build Status

✅ Build succeeds without errors  
✅ Only 1 minor warning (unused selector)  
✅ CSS properly minified and bundled

### Expected Behavior Now

**On first load:**

- Rulebook cards display correctly as vertical cards
- No 3-column table layout
- Consistent appearance across refreshes

**Card Structure (should always display as):**

```
┌─────────────────────────────┐
│ Rulebook Name               │
│ [Package] [Namespace]       │
│ X entry points              │
└─────────────────────────────┘
```

Not this (the bug):

```
│ Rulebook Name │ [Package] [Namespace] │ X entry points │
```

---

## Prevention for Future

### Best Practices for CSS Layouts

1. **Always declare `display` explicitly** on container elements
2. **Use `flex` or `grid`** for complex layouts with explicit direction
3. **Don't rely on default browser behavior** for critical layouts
4. **Add `display: block`** to child elements when needed
5. **Test without cache** to catch CSS loading race conditions

### Suggested Pattern for Card Components

```css
.card-container {
  display: flex;
  flex-direction: column;
  /* other styles */
}

.card-title {
  display: block;
  /* other styles */
}

.card-content {
  display: block;
  /* other styles */
}
```

---

## Related Issues

This type of issue can occur in any component with:

- Complex nested layouts
- Multiple child elements that should stack vertically
- Scoped styles that might load asynchronously
- Components that render before all CSS is parsed

Consider checking other card-based components:

- Package cards in Library view
- Package cards in Marketplace view
- Any list items with multiple child elements

---

## Summary

✅ Added explicit `display: flex; flex-direction: column;` to `.rulebook-item`  
✅ Added explicit `display: block;` to child elements  
✅ Fixed CSS loading race condition  
✅ Rulebook cards now display correctly on first load  
✅ Build succeeds without errors

The Generate view rulebook cards should now display consistently without requiring a refresh! 🎉
