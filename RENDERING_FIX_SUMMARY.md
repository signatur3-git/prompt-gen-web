# Rendering Fix - Implementation Summary

## ✅ Completed Tasks

### 1. Root Cause Analysis
**Problem Identified**: Sequential token-by-token rendering caused context references to fail because:
- Rules that compute derived context values run AFTER each reference is selected
- Context references like `{context.article}` tried to read values that didn't exist yet

### 2. Solution Design
**Maven-Inspired Phase System**: Implemented 6-phase rendering pipeline:
1. **Parse & Classify** - Identify context vs regular references
2. **Select Values** - Choose values for all non-context references
3. **Store in Context** - Make selected values available to rules
4. **Apply Rules** - Compute all derived context values
5. **Resolve Tokens** - Substitute all placeholders (including context refs)
6. **Format Output** - Join and return final text

### 3. Code Changes

#### Files Modified:
- **`src/services/rendering.ts`** (3 changes)
  - Enhanced `Context` class with `getOrThrow` method
  - Added `RenderState` interface for intermediate state
  - Completely refactored `renderTemplate` to use 6 phases

- **`src/utils/templateParser.ts`** (1 change)
  - Added `isContextReference` helper function

#### Files Created:
- **`src/services/rendering.test.ts`** - Comprehensive test suite with 4 test cases
- **`PHASE_RENDERING_FIX.md`** - Detailed documentation

### 4. Testing & Validation

✅ **Unit Tests**: 47/47 tests pass
- 21 validator tests
- 20 datatype editor tests  
- 2 preview view tests
- **4 new rendering tests** covering:
  - Context references set by rules ✅
  - Multiple context references ✅
  - Error handling for missing context ✅
  - Backward compatibility ✅

✅ **Type Checking**: No TypeScript errors

✅ **Linting**: No ESLint errors

### 5. Key Features

#### Backward Compatibility
- Existing packages without context references work unchanged
- No breaking changes to API or data structures

#### Better Error Messages
```typescript
// Before: "undefined"
// After: "Context variable 'article' not found. Make sure it's set by a rule..."
```

#### Clear Phase Separation
Each phase has a single responsibility, making the code:
- Easier to understand
- Easier to debug
- Easier to extend

## How to Use Context References

### Step 1: Define a datatype with tags
```yaml
datatypes:
  creatures:
    values:
      - text: "dragon"
        tags: { article: "a" }
      - text: "elf"
        tags: { article: "an" }
```

### Step 2: Add a rule to extract the tag
```yaml
rules:
  set_article:
    when: creature
    set: article
    value: ref:creature.tags.article
```

### Step 3: Reference it in your template
```yaml
prompt_sections:
  scene:
    template: "There is {context.article} {creature}."
    references:
      creature:
        target: creatures
      context.article:
        target: context:article
```

### Result
- Input: seed 12345
- Output: "There is **a dragon**." (or "There is **an elf**." with different seed)
- The article correctly matches the creature!

## Next Steps

### Testing the Fix
1. Start dev server: `npm run dev`
2. Create a test package with:
   - Datatype with tags
   - Rule that sets context variable
   - Prompt section using `{context.xxx}`
3. Generate prompts and verify context values are correctly substituted

### Example Test Case
Try creating a package with the creature/article example above and generate multiple prompts with different seeds. Each should have the grammatically correct article.

## Performance Notes

The 6-phase approach adds minimal overhead:
- **Simple templates** (no context refs): ~same performance
- **Complex templates** (with context refs): Much more reliable, slight overhead acceptable
- **All templates**: Benefit from clearer error messages and deterministic behavior

## Related Documentation

- **Phase-based rendering details**: See `PHASE_RENDERING_FIX.md`
- **Test coverage**: See `src/services/rendering.test.ts`
- **User guide**: See `USER_GUIDE.md` (may need updates for context references)

---

**Status**: ✅ **READY FOR TESTING**

The phase-based rendering system is fully implemented, tested, and documented. All existing tests pass, and new tests verify context reference functionality works correctly.

