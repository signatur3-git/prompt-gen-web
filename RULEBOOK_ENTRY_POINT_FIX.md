# Rulebook Entry Point Fix

## Problem

When trying to render prompts from a rulebook, you may encounter this error:

```
Entry point in rulebook common.styles:fantasy_focused has no target defined
```

## Root Cause

One or more entry points in your rulebook has an **empty or missing `target` field**. This can happen if:

1. An entry point was created but the target was never filled in
2. Data was corrupted during save/load
3. An older version of the editor allowed saving without validation

## The Fix

We've implemented **three layers of protection**:

### 1. Better Error Messages (Immediate)

The rendering service now provides more detailed error messages:

```typescript
// Before:
"Entry point in rulebook X:Y has no target defined"

// After:
"Rulebook X:Y has no valid entry points. Found 3 entry point(s), 
but 2 have missing or empty targets. Please edit the rulebook 
and ensure all entry points have a target defined."
```

### 2. Automatic Data Repair (On Load)

When you load a package, the system automatically:
- Detects entry points with empty/missing targets
- Removes invalid entry points
- Saves the repaired package back to storage
- Logs warnings to console about what was fixed

```typescript
// Automatically runs when loading package
const { fixed, changes } = fixInvalidRulebookEntryPoints(pkg);
if (fixed) {
  console.warn('Auto-fixed invalid rulebook entry points:', changes);
  await platformService.savePackage(pkg);
}
```

### 3. Validation in Editor (Prevention)

The Rulebook Editor already validates entry points before saving:

```typescript
// Validates each entry point
for (let i = 0; i < entry_points.length; i++) {
  const ep = entry_points[i];
  if (!ep.target.trim()) {
    validationError.value = `Entry point ${i + 1}: Target is required`;
    return;
  }
}
```

## How to Fix Your Existing Data

### Option 1: Automatic Fix (Recommended)

1. **Reload the page** or **switch to a different package and back**
2. The system will automatically detect and fix invalid entry points
3. Check the browser console (F12) for messages like:
   ```
   Auto-fixed invalid rulebook entry points: 
   ["Fixed common.styles:fantasy_focused - removed 1 invalid entry point(s) (2 valid remaining)"]
   ```

### Option 2: Manual Fix

1. Go to the **Editor** tab
2. Select the namespace (e.g., `common.styles`)
3. Go to the **Rulebooks** section
4. Click on the problematic rulebook (e.g., `fantasy_focused`)
5. Review the **Entry Points** section
6. For any entry point with an empty **Target** field:
   - Either fill in a valid target (e.g., `scene_generator` or `namespace:promptsection`)
   - Or click the **✕ Remove** button to delete it
7. Click **Save**

## What is a Valid Target?

A target must be one of these formats:

1. **Same namespace**: `promptsection_id`
   - Example: `forest_scene`
   
2. **Different namespace**: `namespace:promptsection_id`
   - Example: `common.scenes:forest_scene`

The target must point to an existing prompt section in your package.

## Example: Fixing a Rulebook

**Before (Invalid):**
```yaml
rulebooks:
  fantasy_focused:
    name: "Fantasy Focused Scenes"
    entry_points:
      - target: "forest_scene"  # Valid ✅
        weight: 2.0
      - target: ""              # INVALID ❌
        weight: 1.0
      - target: "dungeon_scene" # Valid ✅
        weight: 1.0
```

**After (Auto-Fixed):**
```yaml
rulebooks:
  fantasy_focused:
    name: "Fantasy Focused Scenes"
    entry_points:
      - target: "forest_scene"  # Valid ✅
        weight: 2.0
      - target: "dungeon_scene" # Valid ✅
        weight: 1.0
```

The invalid entry point was automatically removed!

## Checking if Your Package Needs Fixing

To check if your package has invalid entry points, look at the browser console (F12) after loading. You'll see messages like:

```
Auto-fixed invalid rulebook entry points: 
[
  "Fixed namespace:rulebook - removed 1 invalid entry point(s) (2 valid remaining)"
]
```

If you see this, your package was repaired automatically.

## Files Changed

- `src/services/rendering.ts` - Better error messages and filtering
- `src/utils/rulebookFixer.ts` - NEW: Automatic repair utility
- `src/stores/packageStore.ts` - Integrated auto-fix on package load

## Testing

All 47 tests pass ✅, including validation and rendering tests.

## Prevention Going Forward

The Rulebook Editor now enforces validation, so you cannot save a rulebook with empty targets. This prevents the issue from happening again.

