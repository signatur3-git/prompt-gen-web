# Quick Testing Guide - Marketplace Import Feature

## Pre-requisites

### Required Services

1. **Web App**: Running on `http://localhost:5173` (or configured port)

   ```bash
   npm run dev
   ```

2. **Marketplace Server**: Running on `http://localhost:5174`

   ```bash
   cd ../prompt-gen-marketplace
   npm run dev
   ```

3. **OAuth**: Authenticated with marketplace
   - Go to Marketplace page
   - Click "Connect to Marketplace"
   - Complete OAuth flow

## Test Scenarios

### Scenario 1: Basic Package Selection

**Steps:**

1. Go to `/marketplace`
2. Ensure you're authenticated (see green checkmark)
3. Click any package card
4. **Expected**: Sidebar appears on the right with package details

**Success Criteria:**

- ✅ Sidebar appears smoothly
- ✅ Package card has blue border
- ✅ Package name/namespace shown correctly
- ✅ All details populated (description, author, contents, etc.)
- ✅ Close button (×) visible in top-right

### Scenario 2: First-Time Package Import

**Steps:**

1. Select a package you haven't imported yet
2. Check that Import button shows "📥 Import to Library"
3. Click the Import button
4. **Expected**:
   - Button shows "Importing..."
   - Success alert appears
   - Sidebar closes
   - Package is now in library

**Success Criteria:**

- ✅ Import button is green and enabled
- ✅ Loading state appears during import
- ✅ Success message shows package name
- ✅ Message mentions Library > Marketplace tab
- ✅ No errors in console

**Verification:**

1. Go to `/library`
2. Click "Marketplace" tab
3. **Expected**: Imported package appears in the list

### Scenario 3: Duplicate Import Prevention

**Steps:**

1. Import a package (if not done already)
2. Go back to marketplace
3. Select the same package again
4. **Expected**: Button shows "✓ Already Imported" and is disabled

**Success Criteria:**

- ✅ Button is gray and disabled
- ✅ Button text shows "Already Imported"
- ✅ Checkmark icon visible
- ✅ Cannot click the button
- ✅ Tooltip explains it's already in library

### Scenario 4: Download YAML Alternative

**Steps:**

1. Select any package
2. Click "💾 Download YAML" button
3. **Expected**: YAML file downloads to your downloads folder

**Success Criteria:**

- ✅ File downloads immediately
- ✅ Filename format: `namespace-name-version.yaml`
- ✅ File contains valid YAML
- ✅ File can be opened in text editor
- ✅ No errors in console

### Scenario 5: Multiple Package Selection

**Steps:**

1. Select Package A
2. Review its details
3. Click Package B (without closing sidebar)
4. **Expected**: Sidebar updates to show Package B details

**Success Criteria:**

- ✅ Sidebar content changes smoothly
- ✅ Package A loses blue border
- ✅ Package B gains blue border
- ✅ No flashing or layout issues
- ✅ All Package B details load correctly

### Scenario 6: Close Sidebar

**Steps:**

1. Select any package
2. Click the × (close) button in sidebar header
3. **Expected**: Sidebar disappears, no package selected

**Success Criteria:**

- ✅ Sidebar closes smoothly
- ✅ Selected package loses blue border
- ✅ Can select packages again
- ✅ No console errors

### Scenario 7: Responsive Mobile View

**Steps:**

1. Resize browser to mobile width (<1200px)
2. Select a package
3. **Expected**: Sidebar appears as full-screen overlay

**Success Criteria:**

- ✅ Sidebar covers entire screen
- ✅ Sidebar has proper backdrop
- ✅ Close button still works
- ✅ Content is readable on mobile
- ✅ Buttons are touch-friendly

### Scenario 8: Search and Import

**Steps:**

1. Use search bar to find a specific package
2. Click the package in search results
3. Import the package
4. **Expected**: All functionality works with searched packages

**Success Criteria:**

- ✅ Search results are selectable
- ✅ Details sidebar works
- ✅ Import works correctly
- ✅ Package appears in library

### Scenario 9: Import then Generate

**Steps:**

1. Import a package from marketplace
2. Go to Library > Marketplace tab
3. Click "Generate" on the imported package
4. **Expected**: Navigate to preview with package loaded

**Success Criteria:**

- ✅ Package appears in marketplace tab
- ✅ Generate button visible
- ✅ Clicking generates navigates to `/preview`
- ✅ Package is loaded in generator
- ✅ Can generate prompts using the package

### Scenario 10: Import Error Handling

**Steps:**

1. Stop the marketplace server
2. Try to import a package
3. **Expected**: Error alert appears with helpful message

**Success Criteria:**

- ✅ Error alert shows
- ✅ Error message is clear
- ✅ Import button resets (not stuck in loading)
- ✅ Console shows error details
- ✅ Can retry after restarting server

## Visual Checks

### Package Cards

- [ ] Cards have consistent size
- [ ] Hover effect works (lift + shadow)
- [ ] Selected state is obvious (blue border)
- [ ] Entity badges are visible and color-coded
- [ ] Text is readable and not truncated

### Sidebar

- [ ] Sidebar is properly aligned
- [ ] Content sections are well-spaced
- [ ] Scrolling works for long content
- [ ] Buttons are prominent and accessible
- [ ] Close button is easy to find
- [ ] Version badge stands out

### Buttons

- [ ] Import button is green and prominent
- [ ] Already Imported button is gray and clear
- [ ] Download button is visually secondary
- [ ] Hover effects work on all buttons
- [ ] Disabled states are obvious
- [ ] Button text is clear

### Layout

- [ ] Two-column layout works on desktop
- [ ] Sidebar doesn't overlap content
- [ ] Spacing is consistent
- [ ] No horizontal scrolling
- [ ] Content is centered properly

## Console Checks

### Expected Log Messages

```
[Marketplace] Loaded X packages
[Marketplace] First package structure: {...}
[Marketplace] Importing package: namespace/name@version
[Marketplace] Downloading package: namespace/name@version
[Marketplace] Downloaded XXXX bytes
[Marketplace] Package imported successfully
```

### No Errors Should Appear

- ❌ No TypeScript errors
- ❌ No "null is not an object" errors
- ❌ No "cannot read property" errors
- ❌ No CORS errors (if marketplace is running)
- ❌ No duplicate key warnings

## Performance Checks

### Loading Times

- [ ] Marketplace packages load in <2 seconds
- [ ] Sidebar appears instantly on click
- [ ] Import completes in <5 seconds
- [ ] Download starts immediately

### Responsiveness

- [ ] Page doesn't freeze during import
- [ ] Can browse while package loads
- [ ] Sidebar scroll is smooth
- [ ] Animations are smooth (60fps)

## Browser Compatibility

Test in multiple browsers:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Mobile Chrome (responsive mode)
- [ ] Mobile Safari (responsive mode)

## Edge Cases

### Empty States

- [ ] No packages: Shows empty state
- [ ] No search results: Shows appropriate message
- [ ] No package selected: Sidebar hidden

### Network Issues

- [ ] Marketplace offline: Error shown
- [ ] Slow network: Loading indicators work
- [ ] Timeout: Error shown with retry option

### Data Issues

- [ ] Missing content_counts: Sidebar still works
- [ ] Missing author: Shows "Unknown"
- [ ] Missing description: Shows fallback text
- [ ] Invalid package ID: Error handled gracefully

## Regression Checks

Ensure existing features still work:

- [ ] Package search still works
- [ ] OAuth login still works
- [ ] Download without import still works
- [ ] Library view still works
- [ ] Other tabs (Created, Imported) still work
- [ ] Navigation between pages works

## Final Checklist

- [ ] All test scenarios pass
- [ ] No console errors
- [ ] Visual design matches mockups
- [ ] Responsive design works
- [ ] Performance is acceptable
- [ ] Documentation is complete
- [ ] Code is committed
- [ ] Ready for production

## Quick Smoke Test (2 minutes)

1. ✅ Open marketplace → See packages
2. ✅ Click package → See sidebar
3. ✅ Click Import → See success
4. ✅ Go to Library → See imported package
5. ✅ Click Generate → Navigate to preview

If all 5 steps work, core functionality is confirmed! ✅

## Reporting Issues

If you find issues, report with:

1. **Browser**: Name and version
2. **Steps**: What you did
3. **Expected**: What should happen
4. **Actual**: What actually happened
5. **Console**: Any error messages
6. **Screenshot**: If visual issue

---

**Testing Date**: **\*\***\_**\*\***
**Tester**: **\*\***\_**\*\***
**Result**: ☐ Pass ☐ Fail ☐ Needs Work
**Notes**: ****\*\*****\*\*****\*\*****\_****\*\*****\*\*****\*\*****
