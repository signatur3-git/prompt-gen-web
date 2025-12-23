# What to Expect: Testing the Debugging Tools

## Important Note: Field Name Compatibility

The web application now supports **both field names** for entry points:

- `target` (used by web application internally)
- `prompt_section` (used by desktop application YAML files)

Both are valid and will work correctly. The application automatically detects which field name is used.

## When You Load the Application

### Step 1: Open Browser Console

- Press **F12**
- Go to the **Console** tab
- Keep it open while testing

### Step 2: Load Your Package

- Go to Editor and select your package
- Or reload the page if already loaded

### Step 3: Look for Inspection Logs

You should see output like this:

```
Rulebook inspection results: [
  "common.styles:fantasy_focused - Entry point 1 is VALID: target=\"some_scene\", weight=1.0",
  "common.styles:fantasy_focused - Entry point 2 is VALID: target=\"another_scene\", weight=2.0",
  "SUMMARY common.styles:fantasy_focused: All 2 entry points are valid ✓"
]
```

**If your data is correct**, you'll see all entry points marked as VALID ✓

**Note:** The inspector shows "target=" in the output, even if your YAML uses "prompt_section". This is normal - the application handles both field names automatically.

**If there's an issue**, you'll see something like:

```
"common.styles:fantasy_focused - Entry point 2 has no target or prompt_section field. Entry point: {\"weight\":1.0}"
```

## When You Try to Generate Prompts

### Step 4: Go to Preview

- Navigate to the Preview tab
- Select your rulebook (`common.styles:fantasy_focused`)
- Click **Generate**

### Step 5: Check Console Output

Before the error, you'll see:

```
Rendering rulebook common.styles:fantasy_focused
Entry points: [{target: "scene1", weight: 1.0}, {target: "scene2", weight: 2.0}]
Entry point count: 2
Selected entry point index 1: {target: "scene2", weight: 2.0}
```

This shows:

1. Which rulebook is being rendered
2. The complete array of entry points
3. How many entry points exist
4. Which one was randomly selected
5. The complete data of the selected entry point

## Analyzing the Output

### Scenario A: All Entry Points Valid

**Console shows:**

```
Rulebook inspection results: [
  "SUMMARY common.styles:fantasy_focused: All 2 entry points are valid ✓"
]

Rendering rulebook common.styles:fantasy_focused
Entry points: [{target: "scene1", weight: 1.0}, {target: "scene2", weight: 2.0}]
Selected entry point index 0: {target: "scene1", weight: 1.0}
```

**Result:** Generation succeeds! ✅

**Conclusion:** Your data is fine - the issue is likely in the webapp code handling the target resolution.

### Scenario B: Entry Point Missing Target

**Console shows:**

```
Rulebook inspection results: [
  "common.styles:fantasy_focused - Entry point 1 is VALID: target=\"scene1\", weight=1.0",
  "common.styles:fantasy_focused - Entry point 2 has no target field. Entry point: {\"weight\":2.0}",
  "SUMMARY common.styles:fantasy_focused: 1/2 valid entry points"
]

Rendering rulebook common.styles:fantasy_focused
Entry points: [{target: "scene1", weight: 1.0}, {weight: 2.0}]
Selected entry point index 1: {weight: 2.0}
ERROR: Entry point has no target defined. Entry point data: {"weight":2.0}
```

**Result:** Generation fails ❌

**Conclusion:** Entry point 2 is actually missing the target field in your data.

### Scenario C: Target Points to Non-Existent Prompt Section

**Console shows:**

```
Rulebook inspection results: [
  "common.styles:fantasy_focused - Entry point 1 is VALID: target=\"missing_scene\", weight=1.0",
  "SUMMARY common.styles:fantasy_focused: All 1 entry points are valid ✓"
]

Rendering rulebook common.styles:fantasy_focused
Entry points: [{target: "missing_scene", weight: 1.0}]
Selected entry point index 0: {target: "missing_scene", weight: 1.0}
ERROR: PromptSection not found: common.styles:missing_scene
```

**Result:** Generation fails ❌

**Conclusion:** The entry point has a target, but that prompt section doesn't exist.

## What This Tells Us

Based on the console output, we can determine:

1. **If all entry points show as VALID** → Data structure is correct, issue is in webapp logic
2. **If inspection shows missing targets** → Data actually has the issue
3. **If target exists but rendering fails** → Target references non-existent prompt section
4. **If rendering shows different data than expected** → Data may have been transformed during load

## Next Steps

After reviewing the console output:

1. **Share the console logs** - This will show exactly what's happening
2. **Verify your data** - Export the package and check the JSON/YAML directly
3. **Check target references** - Ensure all targets point to existing prompt sections
4. **Review recent changes** - Did the data work before? What changed?

## No Data Modification

Remember: The system **only inspects and reports**. Your data will not be modified. All changes must be made manually through the editor or by re-importing corrected data.
