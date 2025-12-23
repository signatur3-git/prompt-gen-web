# Quick Start: Testing Context References

## What Was Fixed?

Context references like `{context.article}` now work properly! Rules can set context variables, and templates can read them.

## Quick Test

### 1. Start the application

```bash
npm run dev
```

### 2. Create a new package with this structure:

**Datatype** (creatures):

```
dragon | weight: 1.0 | tags: { article: "a" }
elf    | weight: 1.0 | tags: { article: "an" }
```

**Rule** (set_article):

```
when: creature
set: article
value: ref:creature.tags.article
```

**Prompt Section** (scene):

```
template: "There is {context.article} {creature} in the forest."

references:
  - creature -> creatures
  - context.article -> context:article
```

### 3. Generate prompts

Click "Preview" and generate multiple prompts. You should see:

- "There is **a dragon** in the forest."
- "There is **an elf** in the forest."

The article correctly matches the creature! ✅

## What Changed Internally?

**Before** (broken):

```
Process creature → Store → Apply rules → Format
Process article → ERROR: article not in context yet!
```

**After** (fixed):

```
Phase 1: Parse template
Phase 2: Select creature value
Phase 3: Store creature in context
Phase 4: Run rule (sets article in context)
Phase 5: Resolve {context.article} (now exists!)
Phase 6: Format output
```

## Common Issues

### "Context variable 'xxx' not found"

**Cause**: No rule sets this context variable

**Fix**: Add a rule that sets the variable:

```yaml
rules:
  set_xxx:
    when: some_reference
    set: xxx
    value: ref:some_reference.tags.xxx
```

### "Reference not found: context.xxx"

**Cause**: Missing reference definition

**Fix**: Add the reference:

```yaml
references:
  context.xxx:
    target: context:xxx
```

## More Examples

### Color Coordination

```yaml
datatypes:
  colors:
    values:
      - text: red
        tags: { complement: blue }
      - text: blue
        tags: { complement: orange }

rules:
  set_complement:
    when: primary_color
    set: complement
    value: ref:primary_color.tags.complement

prompt_sections:
  palette:
    template: '{primary_color} and {context.complement}'
    references:
      primary_color: { target: colors }
      context.complement: { target: context:complement }
```

Output: "red and blue" or "blue and orange" ✅

### Multiple Context Variables

You can have multiple rules setting different context variables, all resolved in Phase 4 before templates use them in Phase 5.

## Documentation

- Full details: `PHASE_RENDERING_FIX.md`
- Implementation: `RENDERING_FIX_SUMMARY.md`
- Tests: `src/services/rendering.test.ts`
