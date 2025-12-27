# Editor Menu Improvements

**Date:** 2025-12-27  
**Status:** ✅ Complete  
**Purpose:** Improve Editor page toolbar to show contextual actions based on whether a package is loaded

---

## Problem Statement

The Editor page had several UX issues:

1. **Fixed buttons regardless of state**: Save/Export/Preview/Home buttons shown even when no package is loaded
2. **Preview button risk**: Could navigate away from unsaved changes (Preview button removed)
3. **Home button redundant**: Logo in nav already navigates to home
4. **Missing create/import actions**: Users had to go to Home or Library to create/import, then navigate back to Editor
5. **Poor workflow**: Required unnecessary navigation between pages to perform common actions

---

## Solution Implemented

### Conditional Toolbar Buttons

The toolbar now shows **different buttons** based on whether a package is loaded:

#### When NO package is loaded:

- **➕ Create** - Creates a new package immediately
- **📥 Import** - Opens import dialog to paste YAML/JSON content
- **📚 Library** - Navigate to Library to load existing package

#### When package IS loaded:

- **💾 Save** - Saves the current package (Ctrl+S)
- **📤 Export** - Exports the package to YAML/JSON

### Removed Buttons

- **Preview** - Removed to prevent accidental navigation with unsaved changes
  - Users can use the "Generate" navigation item instead
- **Home** - Removed because logo provides this functionality

---

## Features Added

### 1. Import Dialog

New modal dialog for importing packages:

- Paste YAML or JSON content directly
- Format selection dropdown
- Error handling with clear messages
- Imports directly into editor without navigation

### 2. Create New Package

- Instant package creation with one click
- No navigation required
- Automatically selects metadata section for immediate editing

### 3. Enhanced Empty State

When no package is loaded, shows:

- Clear 📦 icon
- Helpful message explaining next steps
- Tip box with keyboard shortcut hint (Ctrl+N)
- Professional, centered design

### 4. Keyboard Shortcuts

Enhanced Ctrl+N behavior:

- **When no package loaded**: Creates new package
- **When package loaded**: Adds new namespace (existing behavior)
- Escape now closes import dialog as well

---

## User Workflow Improvements

### Before:

```
Editor (no package)
  → Navigate to Home
  → Click "Create" or "Import"
  → Package loads
  → Navigate back to Editor
  → Start editing
```

### After:

```
Editor (no package)
  → Click "Create" or "Import" (right there!)
  → Start editing immediately
```

### Editing Workflow:

```
Editor (package loaded)
  → Edit content
  → Save (Ctrl+S)
  → Export if needed
  → All without leaving the page!
```

---

## Technical Details

### Files Modified

1. **`src/views/EditorView.vue`**
   - Added conditional button rendering with `v-if`/`v-else`
   - Added import dialog UI
   - Added reactive refs: `showImportDialog`, `importFormat`, `importContent`, `importError`
   - Added functions: `createNewPackage()`, `importPackageContent()`, `closeImportDialog()`
   - Enhanced empty state with icon, better styling, and helpful tips
   - Updated keyboard shortcuts to handle Ctrl+N in both states
   - Added styles for: `.empty-icon`, `.empty-hint`, `kbd` tag

### New Functions

```typescript
function createNewPackage() {
  packageStore.createNew();
  selectedSection.value = 'metadata';
  selectedNamespace.value = null;
}

async function importPackageContent() {
  try {
    importError.value = '';
    await packageStore.importPackageFromString(importContent.value, importFormat.value);
    showImportDialog.value = false;
    importContent.value = '';
    selectedSection.value = 'metadata';
    selectedNamespace.value = null;
  } catch (error) {
    importError.value = error instanceof Error ? error.message : 'Failed to import package';
  }
}

function closeImportDialog() {
  showImportDialog.value = false;
  importContent.value = '';
  importError.value = '';
}
```

---

## Benefits

✅ **Reduced navigation** - Users can create/import without leaving Editor  
✅ **Contextual UI** - Only relevant buttons shown based on state  
✅ **Clearer workflow** - Obvious what to do when no package is loaded  
✅ **Safer navigation** - Removed Preview button that could lose unsaved changes  
✅ **Better keyboard support** - Ctrl+N adapts to context  
✅ **Consistent design** - Follows patterns from other views (Library, Home)  
✅ **Professional appearance** - Enhanced empty state with helpful guidance

---

## Future Enhancements (Optional)

- Add unsaved changes tracking with confirmation before navigation
- Add "Discard Changes" button when package has unsaved edits
- Add "Duplicate Package" button to copy existing package
- Consider adding breadcrumb navigation showing current package name

---

## Testing Checklist

- [x] Build succeeds without errors
- [x] Conditional buttons render correctly (no package)
- [x] Conditional buttons render correctly (package loaded)
- [x] Create button creates new package
- [x] Import dialog opens and closes
- [x] Import dialog imports valid YAML
- [x] Import dialog imports valid JSON
- [x] Import dialog shows errors for invalid content
- [x] Library button navigates to Library
- [x] Save button saves package
- [x] Export button exports package
- [x] Ctrl+N creates package when none loaded
- [x] Ctrl+N adds namespace when package loaded
- [x] Escape closes import dialog
- [x] Empty state displays properly with icon and tips
- [x] All buttons have proper icons and labels
- [x] Dark theme works correctly
- [x] Responsive design works on mobile

---

## Related Documentation

- M12_FEATURE_PARITY_AUDIT.md - Feature comparison between desktop/web
- FEATURE_PARITY_IMPLEMENTATION.md - Overall architecture improvements
- NAVIGATION_INTEGRATION_COMPLETE.md - Navigation improvements across app
