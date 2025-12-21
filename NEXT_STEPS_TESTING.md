# Next Steps - Testing the Fix

## Summary of Changes

✅ **Fixed the field name compatibility issue** - The web application now accepts both `target` and `prompt_section` field names in rulebook entry points.

✅ **All tests passing** - Including new backwards compatibility tests.

✅ **No data changes needed** - Your existing YAML files from the desktop app will work as-is.

## How to Test with Your Data

### 1. Load Your Rulebook

1. Start the dev server (if not already running):
   ```powershell
   npm run dev
   ```

2. Open the application in your browser (usually http://localhost:5173)

3. Load your package (the one with `featured.common.yaml`)

### 2. Verify in Console

Open the browser console (F12) and look for:

```
Rendering rulebook common.styles:fantasy_focused
Entry points: [{prompt_section: "common.styles:styled_fantasy", weight: 3.0}, ...]
Entry point count: 2
Selected entry point index 0: {prompt_section: "common.styles:styled_fantasy", weight: 3.0}
```

The key thing to look for: **No error about "has no target defined"**

### 3. Generate Prompts

1. Go to the Preview tab
2. Select your rulebook (e.g., `common.styles:fantasy_focused`)
3. Click **Generate** (or set quantity to 5 and click)
4. Check if prompts are generated successfully

### 4. Expected Results

✅ **Success**: You should see generated prompts like:
```
a mystical dragon perched atop an ancient tower, dramatic golden light
an ethereal phoenix hovering near a crystal cave, soft ethereal glow
```

❌ **If you see another error**, check the console for details. It might be:
- A reference to a non-existent prompt section
- A missing datatype
- A template parsing issue
- Phase ordering issues (context values not set)

## If You Still See Errors

### Common Next Issues

Based on your mention of "Phase" logic and placeholder resolution, you might encounter:

1. **Context values not set before they're read**
   - Error: "Context variable 'X' not found"
   - Solution: Implement Phase-based rendering (PREPARE → CONSTRUCT → FINALIZE)

2. **Missing referenced prompt sections**
   - Error: "PromptSection not found: X:Y"
   - Solution: Verify all references point to existing sections

3. **Circular references**
   - Error: Stack overflow or "Maximum call stack exceeded"
   - Solution: Implement cycle detection

4. **Tag filtering issues**
   - Wrong values selected
   - Solution: Implement proper tag filter evaluation

## Desktop vs Web Differences

The desktop application (Rust) likely has:
- Phase-based rendering (Maven-style)
- Proper context resolution order
- Full tag filtering support
- Cycle detection

The web application currently has:
- ✅ Basic template rendering
- ✅ Cross-references
- ✅ Backwards compatible field names
- ❌ Phase-based rendering (TODO)
- ❌ Advanced context rules (TODO)
- ❌ Full tag filtering (TODO)

## What to Share

If you encounter more issues, please share:

1. **Console output** - The complete error message and logs
2. **Which rulebook** - The namespace:name you're trying to render
3. **Expected vs actual** - What you expect to see vs what you get
4. **Desktop comparison** - Does the same rulebook work in the desktop app?

## Files to Review

- `FIELD_NAME_COMPATIBILITY_FIX.md` - Details of what was fixed
- `TESTING_GUIDE.md` - Updated guide with field name info
- `src/services/rendering.backcompat.test.ts` - Test coverage for the fix

## Next Development Steps

To fully align with desktop app, implement:

1. **Phase system** - PREPARE, CONSTRUCT, FINALIZE phases
2. **Context rules** - Proper rule evaluation order
3. **Tag filtering** - Full expression evaluation
4. **Cycle detection** - Prevent infinite loops
5. **Better error messages** - Show the full render stack

Let me know what happens when you test with your data!

