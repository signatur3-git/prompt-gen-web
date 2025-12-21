# Systematic Rendering Implementation Plan

## Problem Analysis

The web application's rendering logic is incomplete compared to the desktop application (Rust). This causes multiple cascading errors when trying to render prompts from production packages.

## Desktop Implementation Architecture (from engine.rs)

### Three-Phase Rendering Pipeline

**Phase 1: SELECTION**
- Parse template into tokens
- Compute selection order based on filter dependencies (topological sort)
- Select values for each reference in dependency order
- Support nested promptsections (recursion with depth tracking)
- Support min/max/unique for multi-selection
- Build selection context for cross-reference filtering

**Phase 2: ENRICHMENT**
- Execute rules from all namespaces (package-wide)
- Execute rules from dependencies (cross-package)
- Rules read selected values' tags and write to context
- Context scopes: `prompt`, `global`, custom

**Phase 3: RENDERING**  
- Replace tokens with selected values
- Handle multi-values with separator sets (primary, secondary, tertiary)
- Handle context references (read from context, not from datatypes)
- Return final text + metadata

### Key Features Missing in Web App

1. ❌ **Dependency ordering** - References with filters must be selected after their dependencies
2. ❌ **Cross-reference filtering** - Filters like `ref:creature.tags.can_fly` need access to already-selected values
3. ❌ **Context references** - `context:article` type references
4. ❌ **Rule execution** - Phase 2 enrichment not implemented
5. ❌ **Package-wide rule execution** - Rules from all namespaces, not just current one
6. ❌ **Cross-package rule execution** - Rules from dependencies
7. ❌ **Proper separator handling** - Tertiary separator logic
8. ❌ **Selection context** - Passing already-selected values to subsequent selections
9. ❌ **Topological sort** - Detecting and handling circular dependencies
10. ❌ **Recursion depth limits** - MAX_RECURSION_DEPTH = 10

## Implementation Strategy

### Option 1: Port Rust Implementation (RECOMMENDED)
**Pros:**
- Guaranteed compatibility with desktop app
- All edge cases already handled
- Well-tested (desktop app is v1.0.0-rc)
- Can be done systematically

**Cons:**
- More work upfront
- Need to understand Rust code

**Estimated Time:** 4-6 hours of focused work

### Option 2: Incremental Fixes
**Pros:**
- Can fix one thing at a time
- Learn as you go

**Cons:**
- Will encounter 20+ issues
- Each fix may break something else
- Never confident it's complete
- User goes insane (your words!)

**Estimated Time:** 10-20 hours of frustration

## Recommended Approach: Systematic Port

### Step 1: Create New Renderer (rendering-v2.ts)
- Copy structure from engine.rs
- Implement three phases as separate methods
- Keep existing renderer.ts as fallback

### Step 2: Implement Phase 1 - Selection
- [ ] Parse template (already working)
- [ ] Implement dependency graph builder
- [ ] Implement topological sort with cycle detection
- [ ] Implement selection_context tracking
- [ ] Update selector to accept selection_context
- [ ] Implement cross-reference filter evaluation

### Step 3: Implement Phase 2 - Enrichment
- [ ] Create Context class (if not exists)
- [ ] Implement context scopes (prompt, global)
- [ ] Implement rule processor
- [ ] Execute rules from current namespace
- [ ] Execute rules from all namespaces in package
- [ ] Execute rules from dependencies

### Step 4: Implement Phase 3 - Rendering
- [ ] Handle context references
- [ ] Implement proper separator logic
- [ ] Handle multi-value rendering
- [ ] Build complete RenderResult

### Step 5: Integration & Testing
- [ ] Update PreviewView to use new renderer
- [ ] Create comprehensive tests
- [ ] Test with featured.common package
- [ ] Compare output with desktop app

## File Structure

```
src/services/
  rendering.ts              # Old renderer (keep as fallback)
  rendering-v2.ts           # New three-phase renderer
  rendering-v2.test.ts      # Comprehensive tests
  
src/renderer/               # New directory for renderer components
  engine.ts                 # Main RenderingEngine class
  selector.ts               # Value selection with context
  context.ts                # Context management
  rules.ts                  # Rule execution
  template.ts               # Template parsing (reuse existing)
  separator.ts              # Separator set handling
  dependency-graph.ts       # Topological sort
  types.ts                  # Shared types
```

## Testing Strategy

### Unit Tests
- Topological sort with various dependency graphs
- Cycle detection
- Context scopes
- Rule execution
- Separator logic

### Integration Tests  
- Render simple promptsection (no dependencies)
- Render with cross-reference filtering
- Render with context rules
- Render with nested promptsections
- Render from rulebook

### Validation Tests
- Load featured.common package
- Render fantasy_focused rulebook
- Compare output structure with desktop app
- Verify no errors in browser console

## Success Criteria

✅ Can render prompts from featured.common package without errors  
✅ Generated prompts make sense (correct grammar, coherent structure)  
✅ Console shows clean execution (no errors, proper logging)  
✅ Output matches desktop app behavior  
✅ All tests passing  
✅ Performance acceptable (<100ms per prompt)

## Timeline Estimate

| Task | Time | Cumulative |
|------|------|------------|
| Study Rust implementation | 1h | 1h |
| Create renderer structure | 1h | 2h |
| Implement Phase 1 (Selection) | 2h | 4h |
| Implement Phase 2 (Enrichment) | 1h | 5h |
| Implement Phase 3 (Rendering) | 0.5h | 5.5h |
| Write tests | 1h | 6.5h |
| Integration & debugging | 1.5h | 8h |
| **Total** | **8h** | - |

## Decision Point

**Question:** Should I proceed with the systematic port?

**If YES:**
1. I'll create the new renderer structure
2. Port each phase systematically
3. Write tests as I go
4. Switch to new renderer when complete

**If NO:**
- What alternative approach would you prefer?
- Are there specific constraints I should know about?

Let me know and I'll proceed accordingly!

