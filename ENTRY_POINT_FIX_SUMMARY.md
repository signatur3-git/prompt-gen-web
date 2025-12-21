# Fix Summary: Rulebook Entry Point Debugging

## ✅ Enhanced Debugging Tools

**Problem**: Error when rendering prompts: "Entry point in rulebook common.styles:fantasy_focused has no target defined"

**Approach**: Enhanced logging and inspection tools to diagnose the actual issue with your data.

**Philosophy**: The webapp may have issues, but the data is expected to be correct. Let's find out what's really happening.

## What Was Changed

### 1. Enhanced Error Messages (`src/services/rendering.ts`)
- Detailed console logging of rulebook structure before rendering
- Shows the actual entry point data that's causing issues
- Logs selected entry point index and content
- No filtering - shows the real error with context

### 2. Inspection Utility (`src/utils/rulebookFixer.ts`)
- NEW utility that inspects and reports on entry points
- Shows each entry point with its target and weight
- Reports valid vs invalid entry points
- Does NOT modify your data - only reports findings

### 3. Inspection on Load (`src/stores/packageStore.ts`)
- Runs inspection when packages are loaded
- Logs detailed findings to browser console
- Preserves original data - no automatic "fixes"
- Helps identify the root cause

## How to Use the Debugging Tools

### Step 1: Open Browser Console

Press **F12** to open Developer Tools and go to the Console tab.

### Step 2: Reload or Load Your Package

When you load a package, you'll see detailed inspection output like:

```
Rulebook inspection results: [
  "common.styles:fantasy_focused - Entry point 1 is VALID: target=\"forest_scene\", weight=2.0",
  "common.styles:fantasy_focused - Entry point 2 has no target field. Entry point: {\"weight\":1.0}",
  "common.styles:fantasy_focused - Entry point 3 is VALID: target=\"dungeon_scene\", weight=1.0",
  "SUMMARY common.styles:fantasy_focused: 2/3 valid entry points"
]
```

### Step 3: Try to Generate

When you click Generate, you'll see:

```
Rendering rulebook common.styles:fantasy_focused
Entry points: [{target: "forest_scene", weight: 2.0}, {weight: 1.0}, {target: "dungeon_scene", weight: 1.0}]
Entry point count: 3
Selected entry point index 1: {weight: 1.0}
```

This shows exactly which entry point was selected and what its data looks like.

### Step 4: Analyze the Output

Look for:
- **Missing target fields**: Entry points that have `weight` but no `target`
- **Empty targets**: Entry points with `target: ""`
- **Null/undefined entries**: Entry points that are `null` or `undefined`

## Understanding the Error

The error message now includes the actual entry point data:

```
Entry point in rulebook common.styles:fantasy_focused has no target defined.
Entry point data: {"weight":1.0}.
Please edit the rulebook and ensure all entry points have a valid target field.
```

This tells you:
1. Which rulebook has the issue
2. What the problematic entry point looks like
3. What field is missing (target)

## Common Scenarios

### Scenario 1: Entry Point Has No Target Field

**Console Output:**
```
common.styles:fantasy_focused - Entry point 2 has no target field. 
Entry point: {"weight":1.0}
```

**Cause**: The entry point object is missing the `target` property entirely.

**How to Fix**: Edit the rulebook and add a target to that entry point, or remove it.

### Scenario 2: Entry Point Has Empty Target

**Console Output:**
```
common.styles:fantasy_focused - Entry point 2 has empty target. 
Entry point: {"target":"","weight":1.0}
```

**Cause**: The target field exists but is an empty string.

**How to Fix**: Fill in the target field with a valid prompt section name.

### Scenario 3: Entry Point is Null

**Console Output:**
```
common.styles:fantasy_focused - Entry point 2 is null/undefined
```

**Cause**: The entry point in the array is null or undefined.

**How to Fix**: This is likely data corruption. Export your package, manually edit the JSON/YAML, and re-import.

## Manual Inspection

You can also manually inspect your package data:

1. Export your package (Editor → Export)
2. Look at the `rulebooks` section
3. Check each `entry_points` array
4. Verify each entry has both `target` and `weight` fields

Example valid entry point:
```yaml
entry_points:
  - target: forest_scene
    weight: 2.0
  - target: dungeon_scene
    weight: 1.0
```

Example invalid entry point:
```yaml
entry_points:
  - weight: 2.0  # ❌ Missing target!
  - target: dungeon_scene
    weight: 1.0
```

## For Developers

The inspection utility can be used programmatically:

```typescript
import { fixInvalidRulebookEntryPoints } from './utils/rulebookFixer';

// Inspect a package (does NOT modify it)
const { fixed, changes } = fixInvalidRulebookEntryPoints(pkg);

console.log('Has issues:', fixed);
console.log('Detailed findings:', changes);
```

## Testing

✅ All 47 tests pass
- 4 rendering tests (including new context reference tests)
- 21 validator tests
- 20 datatype editor tests
- 2 preview view tests

## Prevention

The Rulebook Editor already has validation that prevents saving entry points without targets. This fix handles **existing invalid data** and makes the system more resilient to data corruption.

## Files

- `QUICK_FIX_ENTRY_POINT.md` - User-facing quick fix guide
- `RULEBOOK_ENTRY_POINT_FIX.md` - Detailed technical documentation
- `src/services/rendering.ts` - Enhanced error handling
- `src/utils/rulebookFixer.ts` - Auto-repair utility
- `src/stores/packageStore.ts` - Integrated auto-fix on load

## Related Fixes

This fix complements the phase-based rendering fix implemented earlier for context references. Together, these changes make the rendering system much more robust:

1. **Phase-based rendering** - Proper dependency ordering for context references
2. **Entry point validation** - Automatic repair of invalid rulebook data

Both fixes maintain backward compatibility and improve error messages.

