# 🐛 Tomorrow's Fix: Broken Buttons on Landing Page

## Problem

After the landing page redesign, the following buttons stopped working:
- ❌ Create New Package
- ❌ Load Existing Package  
- ❌ Import Package(s)

The hero CTA button ("Start Generating Prompts") and "Load Sample Package" work fine.

## Quick Diagnosis Notes

### What I Checked (All Look OK)
1. ✅ Button HTML exists in template
2. ✅ Click handlers are bound (`@click="createNew"`, `@click="openLoadDialog"`, `@click="showImportDialog = true"`)
3. ✅ Methods exist in script section (`createNew()`, `openLoadDialog()`)
4. ✅ No TypeScript/build errors

### What to Check Tomorrow

1. **Browser Console Errors**
   - Open DevTools (F12)
   - Click the broken buttons
   - Look for JavaScript errors
   - Check if click events are firing

2. **CSS Z-index Issues**
   - Possible overlay covering buttons
   - Check if another element is intercepting clicks
   - Use DevTools Elements inspector to check what's under the cursor

3. **Vue Reactivity Issues**
   - Check if `showLoadDialog` and `showImportDialog` refs are defined
   - Verify modal dialogs render when refs are set to true

4. **Event Handler Scope**
   - Make sure methods are exposed to template
   - Check if there's a closure/scope issue

## Most Likely Culprits

### 1. CSS Overlay (Most Likely)
The new landing page might have an element with high z-index covering the buttons.

**Check:** 
```css
/* Look for these in HomeView.vue <style> section */
.hero { z-index: ??? }
.getting-started { z-index: ??? }
.quick-actions { z-index: ??? }
.package-management { z-index: ??? }
```

**Fix:** Ensure `.package-management` section is not covered.

### 2. Missing Ref Definitions
The `showImportDialog` ref might not be initialized.

**Check:**
```typescript
const showImportDialog = ref(false)
```

Should be in the `<script setup>` section.

### 3. Event Propagation Issue
Click events might be stopped by parent elements.

**Check:** Look for `.stop` modifiers that shouldn't be there.

## Quick Test

1. Open browser DevTools
2. In Console, type: `document.querySelector('button:has-text("Create Package")').click()`
3. If this works, it's a CSS/overlay issue
4. If this doesn't work, it's a JavaScript issue

## Expected Behavior

- **Create Package** → Should navigate to `/editor` with empty package
- **Load Package** → Should show modal with list of packages
- **Import Files** → Should show import dialog with file upload

## Files to Check

- `src/views/HomeView.vue` (lines 50-120 for buttons, 497+ for methods)
- Look for z-index issues in `<style scoped>` section
- Check browser console for runtime errors

## Temporary Workaround

If users need access, they can:
1. Navigate directly to `/editor` in URL
2. Use the old URLs if they know them
3. Use "Load Sample Package" which still works

## Priority

This is a **critical bug** - it breaks core functionality. Should be first priority tomorrow morning.

## What We Know Works

✅ Hero CTA button → Routes to `/preview`  
✅ Load Sample Package → Fetches and imports  
❌ Create New Package → Not working  
❌ Load Existing Package → Not working  
❌ Import Package(s) → Not working

The fact that some buttons work and others don't suggests it's either:
- CSS positioning issue (buttons covered by another element)
- Or a scoping issue with the specific methods

---

## Tomorrow's Action Plan

1. **Open app in browser** (npm run dev)
2. **Open DevTools** (F12)
3. **Click "Create Package"**
4. **Check Console** for errors
5. **Inspect Element** to see if anything is covering it
6. **Fix based on findings**

Should take 5-10 minutes once you identify the root cause!

**Good luck tomorrow! 🍀**

