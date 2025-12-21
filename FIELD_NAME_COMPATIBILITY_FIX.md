# Field Name Compatibility Fix

## Issue Summary

When attempting to render prompts using rulebooks from the desktop application, the web application was throwing the error:

```
Entry point in rulebook common.styles:fantasy_focused has no target defined
```

## Root Cause

The issue was a **field name mismatch** between the desktop application's YAML format and the web application's expectations:

- **Desktop Application YAML files** use: `prompt_section`
- **Web Application code** was expecting: `target`

Example from `featured.common.yaml`:
```yaml
rulebooks:
  fantasy_generator:
    name: "Fantasy Scene Generator"
    entry_points:
      - prompt_section: common.fantasy:fantasy_scene  # Desktop uses this field name
        weight: 1.0
```

The web application was only checking for `target`, causing valid entry points to be rejected.

## Solution

Added backwards compatibility to accept **both field names** throughout the codebase:

### 1. TypeScript Model (`src/models/package.ts`)

Updated the `EntryPoint` interface to support both field names:

```typescript
export interface EntryPoint {
  /** Target promptsection (namespace:name format). Also accepts 'prompt_section' for backwards compatibility. */
  target?: string;

  /** Alternative field name used by desktop app (backwards compatibility) */
  prompt_section?: string;

  /** Optional weight for selection probability */
  weight?: number;
}
```

### 2. Rendering Service (`src/services/rendering.ts`)

Added field name detection in the `renderRulebook` method:

```typescript
// Handle both 'target' and 'prompt_section' field names (backwards compatibility with desktop app)
const target = entryPoint.target || (entryPoint as any).prompt_section;

if (!target) {
  throw new Error(
    `Entry point in rulebook ${namespaceName}:${rulebookName} has no target defined. ` +
    `Entry point data: ${JSON.stringify(entryPoint)}. ` +
    `Please edit the rulebook and ensure all entry points have a valid target or prompt_section field.`
  );
}

// Use the detected target for parsing
const parts = target.includes(':')
  ? target.split(':')
  : [namespaceName, target];
```

### 3. Rulebook Fixer (`src/utils/rulebookFixer.ts`)

Updated inspection logic to handle both field names:

```typescript
// Handle both 'target' and 'prompt_section' field names (backwards compatibility)
const target = ep.target || (ep as any).prompt_section;

if (!target) {
  hasIssues = true;
  changes.push(
    `${nsId}:${rbId} - Entry point ${index + 1} has no target or prompt_section field. Entry point: ${JSON.stringify(ep)}`
  );
}
```

### 4. Validator (`src/validator/index.ts`)

The validator already had this compatibility (line 560-561), which was the correct pattern to follow.

## Testing

The application now correctly handles rulebooks from both sources:

### Desktop Application Format
```yaml
entry_points:
  - prompt_section: common.fantasy:fantasy_scene
    weight: 1.0
```

### Web Application Format
```yaml
entry_points:
  - target: common.fantasy:fantasy_scene
    weight: 1.0
```

Both formats are now supported and will work identically.

## Files Modified

1. `src/models/package.ts` - Updated EntryPoint interface
2. `src/services/rendering.ts` - Added field detection logic
3. `src/utils/rulebookFixer.ts` - Updated inspection logic
4. `TESTING_GUIDE.md` - Added documentation about field compatibility

## Verification

To verify the fix:

1. Load a package with `prompt_section` field names (from desktop app)
2. Open browser console (F12)
3. Navigate to Preview
4. Select a rulebook
5. Click Generate

You should see in the console:
```
Rendering rulebook common.styles:fantasy_focused
Entry points: [{prompt_section: "...", weight: 1.0}]
Selected entry point index 0: {prompt_section: "...", weight: 1.0}
```

And the prompt should generate successfully without errors.

## No Data Changes Required

**Important:** This fix requires **NO changes to your YAML/JSON data files**. The web application now understands both field names automatically.

## Future Considerations

For new packages created in the web application, the editor should ideally:
- Use `target` as the primary field name (for consistency with other Reference types)
- Optionally support exporting to desktop format with `prompt_section` field names
- Validate that at least one of the two fields is present

## Compatibility Matrix

| Source | Field Name | Web App Support | Desktop App Support |
|--------|-----------|-----------------|---------------------|
| Desktop YAML | `prompt_section` | ✅ (after fix) | ✅ |
| Web Editor | `target` | ✅ | ❓ (needs testing) |

Note: Desktop application's support for `target` field name should be verified.

