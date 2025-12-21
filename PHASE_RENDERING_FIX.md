# Phase-Based Rendering Fix

## Problem

The original rendering implementation had a critical flaw where placeholder values were resolved sequentially in a single pass:

```
For each template token:
  1. Select value from datatype
  2. Store in context
  3. Apply rules
  4. Format output
```

This caused **context references** (like `{context.article}`) to fail because:
- Rules compute derived context values based on selected values
- Context references try to read those derived values
- But the sequential approach meant context references were resolved BEFORE rules had run

## Solution: Maven-Inspired Phases

The fix implements a **multi-phase rendering pipeline** that separates concerns and ensures proper dependency ordering:

### Phase 1: Parse & Classify
- Parse the template into tokens
- Identify which references are context references (target starts with `context:`)
- Classify tokens as: `text`, `reference`, or `context`

### Phase 2: Select Values
- For all non-context references, select values from datatypes/prompt sections
- Store selected values in intermediate state (not yet in context)
- Skip context references (they'll be resolved later)

### Phase 3: Store in Context
- Copy all selected values into the context map
- This makes them available for rules to read

### Phase 4: Apply Rules
- Execute ALL rules once
- Rules can now read from any previously-selected reference
- Rules compute derived values and write them to context

### Phase 5: Resolve Tokens
- Resolve regular references using pre-selected values
- Resolve context references by reading from context
- Context values are guaranteed to exist (set by Phase 4)

### Phase 6: Format Output
- Join all resolved parts
- Return final output string

## Code Changes

### 1. Context Class Enhancement
```typescript
class Context {
  // Changed from "first write wins" to "last write wins"
  // This allows rules to overwrite initial values
  set(key: string, value: unknown): void {
    this.data.set(key, value);
  }
  
  // New method for better error messages
  getOrThrow(key: string, context: string): unknown {
    if (!this.data.has(key)) {
      throw new Error(`Context variable '${key}' not found. ${context}`);
    }
    return this.data.get(key);
  }
}
```

### 2. RenderState Interface
```typescript
interface RenderState {
  tokens: Array</* classified tokens */>;
  selectedValues: Map<string, SelectedValue[]>;
  contextRefs: string[];
}
```

### 3. Phased renderTemplate Method
The `renderTemplate` method was completely refactored to implement the 6-phase approach.

## Benefits

1. **Context References Work**: Rules run before context values are read
2. **Deterministic**: Clear phase ordering ensures consistent behavior
3. **Better Errors**: Phase-aware error messages help debugging
4. **Maintainable**: Separation of concerns makes code easier to understand
5. **Backward Compatible**: Traditional references still work as before

## Testing

Added comprehensive test suite (`src/services/rendering.test.ts`) covering:
- Context references set by rules
- Multiple context references
- Error cases (missing context variables)
- Backward compatibility with traditional references

All 47 tests pass ✅

## Example Usage

```yaml
namespaces:
  fantasy:
    datatypes:
      creatures:
        values:
          - text: "dragon"
            tags: { article: "a" }
          - text: "elf"
            tags: { article: "an" }
    
    prompt_sections:
      scene:
        template: "There is {context.article} {creature} in the forest."
        references:
          creature:
            target: creatures
          context.article:
            target: context:article
    
    rules:
      set_article:
        when: creature
        set: article
        value: ref:creature.tags.article
```

This now correctly produces:
- "There is **a dragon** in the forest."
- "There is **an elf** in the forest."

## Migration Guide

No migration needed! The changes are backward compatible. Existing packages without context references continue to work exactly as before.

If you want to use context references:
1. Add a reference with `target: context:keyname`
2. Create a rule that sets the context variable
3. Use `{context.keyname}` in your template

## Related Files

- `src/services/rendering.ts` - Main implementation
- `src/services/rendering.test.ts` - Test suite
- `src/utils/templateParser.ts` - Added `isContextReference` helper

