# Quick Debug Guide: "Entry point has no target defined"

## What to Do Right Now

1. **Open the browser console** (press **F12**)
2. **Reload the page** (F5 or Ctrl+R)
3. **Look for inspection logs** showing entry point details
4. **Try generating again** - check what entry point was selected
5. **Review the error message** - it now shows the exact data

## What The Console Will Show

### When Loading the Package:
```
Rulebook inspection results: [
  "common.styles:fantasy_focused - Entry point 1 is VALID: target=\"forest_scene\", weight=2.0",
  "common.styles:fantasy_focused - Entry point 2 has no target field. Entry point: {\"weight\":1.0}",
  "SUMMARY common.styles:fantasy_focused: 1/2 valid entry points"
]
```

### When Generating:
```
Rendering rulebook common.styles:fantasy_focused
Entry points: [{target: "forest_scene", weight: 2.0}, {weight: 1.0}]
Entry point count: 2
Selected entry point index 1: {weight: 1.0}
ERROR: Entry point has no target defined. Entry point data: {"weight":1.0}
```

## What This Tells You

From the logs above, you can see:
- Entry point 1 is **valid** ✅
- Entry point 2 is **missing the target field** ❌
- The random selection picked entry point 2 (index 1)
- That's why generation failed

## How to Fix

## How to Fix

### Option 1: Edit in the UI

1. Go to **Editor** tab
2. Select your package
3. Go to the namespace (e.g., `common.styles`)
4. Click on **Rulebooks** section
5. Select the problematic rulebook (e.g., `fantasy_focused`)
6. Review **Entry Points**:
   - Find the entry point with missing target (check console for which index)
   - Fill in the **Target** field with a valid prompt section name
   - Or remove the invalid entry point using the **✕** button
7. Click **Save**

### Option 2: Edit the Data Directly

1. Go to **Editor** tab
2. Click **Export** button
3. Choose JSON or YAML format
4. Find the problematic rulebook in the exported data
5. Look at the `entry_points` array
6. Fix or remove the invalid entry point
7. Click **Import** and paste the corrected data

## Example: What Valid Data Looks Like

```yaml
namespaces:
  common.styles:
    rulebooks:
      fantasy_focused:
        name: "Fantasy Focused"
        entry_points:
          - target: "forest_scene"
            weight: 2.0
          - target: "dungeon_scene"  # ← Must have target!
            weight: 1.0
```

## What Invalid Data Looks Like

```yaml
namespaces:
  common.styles:
    rulebooks:
      fantasy_focused:
        name: "Fantasy Focused"
        entry_points:
          - target: "forest_scene"
            weight: 2.0
          - weight: 1.0  # ❌ Missing target field!
```

## Why This Happens

This usually occurs if:
1. The Rulebook Editor had a bug that allowed saving without validation
2. Data was manually edited and target was accidentally removed
3. Import from an older format that didn't require targets

## Prevention

The Rulebook Editor now has validation that prevents saving entry points without targets, so this shouldn't happen again for new entries.

## Still Need Help?

Check the detailed technical documentation in `RULEBOOK_ENTRY_POINT_FIX.md` for more information about:
- Detailed inspection output
- Common scenarios
- Developer tools
- Data structure details

