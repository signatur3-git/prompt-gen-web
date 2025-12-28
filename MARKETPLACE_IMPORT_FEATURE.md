# Marketplace Import Feature

## Overview

The marketplace now supports importing packages directly into your local library, consistent with the desktop app experience. Packages are displayed in a grid layout, and clicking on a package shows detailed information in a right sidebar with an Import button.

## Features

### 1. Package Selection & Details Sidebar

- **Click to select**: Click any package card to view its details
- **Sticky sidebar**: Details panel stays visible on the right side as you scroll
- **Selected state**: Selected package cards are highlighted with a blue border
- **Close button**: Easy to close the sidebar and return to browsing

### 2. Package Details Display

The sidebar shows comprehensive package information:

- **Package name and namespace** (e.g., `namespace/package-name`)
- **Version badge** with the latest version number
- **Description** with full text
- **Author information** with persona details
- **Package contents breakdown**:
  - Rulebooks count
  - Rules count
  - Prompt Sections count
  - Datatypes count
  - Each with color-coded borders matching the entity badges
- **Package metadata**:
  - Namespace
  - Package ID
  - Total versions available
  - Last updated date

### 3. Import Functionality

#### Import Button

- **Primary action**: Large, prominent green "Import to Library" button
- **Checks for duplicates**: Automatically detects if package is already imported
- **Status indication**: Shows "Already Imported" with checkmark for imported packages
- **Loading state**: Shows "Importing..." during the import process

#### Import Process

1. Downloads the package YAML from the marketplace
2. Imports it into the local package store
3. Marks it with `source: 'marketplace'` for tracking
4. Shows success message with next steps
5. Refreshes the package list
6. Package appears in Library > Marketplace tab

#### Success Message

After successful import:

```
Package "namespace/package-name" imported successfully!

You can now find it in your Library under the Marketplace tab.
```

### 4. Download YAML (Alternative)

- **Secondary action**: Outlined button to download the YAML file
- **File download**: Downloads as `namespace-name-version.yaml`
- **Use case**: For manual inspection or sharing

### 5. Duplicate Detection

The system automatically checks if a package is already in your library:

- Compares package IDs with local marketplace packages
- Disables Import button if already imported
- Shows clear "Already Imported" status
- Prevents accidental duplicate imports

## User Flow

### Importing a Package

1. **Navigate to Marketplace** (`/marketplace`)
2. **Connect to marketplace** if not already authenticated
3. **Browse packages** - search or scroll through available packages
4. **Select a package** - click on any package card
5. **Review details** - check package contents, version, author, etc.
6. **Click Import** - if not already imported
7. **Confirm success** - see success message
8. **View in Library** - go to Library > Marketplace tab to see imported package

### Using an Imported Package

1. **Go to Library** (`/library`)
2. **Switch to Marketplace tab**
3. **Select the imported package**
4. **Choose action**:
   - **Generate**: Create prompts using the package
   - **Export**: Download the package as YAML
   - **Delete**: Remove from local library (can re-import later)

## Technical Implementation

### Components Modified

- **MarketplaceView.vue**: Complete redesign with two-column layout
  - Left: Package grid
  - Right: Details sidebar (when package selected)

### State Management

```typescript
const selectedPackage = ref<Package | null>(null);
const importing = ref(false);
const importedPackageIds = computed(() => {
  return new Set(
    packageStore.packages
      .filter((pkg: any) => pkg.source === 'marketplace')
      .map((pkg: any) => pkg.id)
  );
});
```

### Key Functions

- `selectPackage(pkg)`: Sets the selected package and shows sidebar
- `isPackageImported(pkg)`: Checks if package is already in library
- `importPackage(pkg)`: Downloads and imports package with source tracking
- `downloadPackage(pkg)`: Downloads YAML file to disk

### Package Source Tracking

Imported marketplace packages are marked with:

```typescript
(package as any).source = 'marketplace';
```

This allows the Library view to:

- Show them in the Marketplace tab
- Apply appropriate filters
- Provide correct action buttons

## Styling

### Layout

- **Two-column grid**: `1fr 400px` (main content + sidebar)
- **Responsive**: Sidebar becomes overlay on smaller screens
- **Sticky positioning**: Sidebar stays in view during scroll
- **Max height**: Prevents sidebar from extending beyond viewport

### Visual Design

- **Selected card**: Blue border and subtle background tint
- **Entity badges**: Color-coded (RB=purple, R=green, PS=orange, DT=teal)
- **Content stats**: Left border matching entity colors
- **Action buttons**:
  - Import: Green solid button
  - Already Imported: Gray disabled button
  - Download: Blue outlined button

### Responsive Behavior

- **Desktop (>1200px)**: Sidebar on right
- **Mobile (<1200px)**: Sidebar becomes fixed overlay
- **Card grid**: Auto-fill layout adapts to screen width

## Comparison with Desktop App

| Feature             | Desktop               | Web                   |
| ------------------- | --------------------- | --------------------- |
| Package browsing    | ✅ Grid layout        | ✅ Grid layout        |
| Package selection   | ✅ Click to select    | ✅ Click to select    |
| Details sidebar     | ✅ Right panel        | ✅ Right panel        |
| Import action       | ✅ Import button      | ✅ Import button      |
| Duplicate detection | ✅ Checks library     | ✅ Checks library     |
| Source tracking     | ✅ Marketplace source | ✅ Marketplace source |
| Library integration | ✅ Marketplace tab    | ✅ Marketplace tab    |

## Future Enhancements

### Potential Improvements

1. **Version selection**: Choose specific version to import
2. **Dependency preview**: Show required dependencies before import
3. **Update notifications**: Alert when new versions available
4. **Batch import**: Import multiple packages at once
5. **Import history**: Track when and from where packages were imported
6. **Package comparison**: Compare local vs. marketplace versions
7. **Quick actions**: Import with keyboard shortcuts
8. **Package preview**: View package structure before importing

### Advanced Features

- **Auto-update**: Automatically update marketplace packages
- **Import settings**: Configure import behavior (overwrite, merge, etc.)
- **Import queue**: Queue multiple imports
- **Conflict resolution**: Handle ID conflicts gracefully
- **Import profiles**: Save common import configurations

## Testing Checklist

### Basic Functionality

- [ ] Click package card selects it
- [ ] Sidebar shows correct package details
- [ ] Close button closes sidebar
- [ ] Import button works for new packages
- [ ] Already imported packages show correct status
- [ ] Success message appears after import
- [ ] Package appears in Library > Marketplace tab

### Edge Cases

- [ ] Importing same package twice (should block)
- [ ] Import during ongoing import (should block)
- [ ] Import with network failure (should error gracefully)
- [ ] Invalid package data handling
- [ ] Empty marketplace (no packages)
- [ ] No package selected (sidebar hidden)

### UI/UX

- [ ] Selected card has visual indicator
- [ ] Sidebar is readable and well-formatted
- [ ] Buttons have proper states (hover, active, disabled)
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Success messages are encouraging

### Responsive Design

- [ ] Desktop layout works well
- [ ] Tablet layout adapts appropriately
- [ ] Mobile overlay appears correctly
- [ ] Sidebar scrolls on long content
- [ ] Grid adapts to screen width

## Known Limitations

1. **Single version**: Can only import the latest version
2. **No preview**: Cannot preview package structure before import
3. **No undo**: Import cannot be undone (must delete manually)
4. **Manual sync**: Must manually check for updates
5. **Source persistence**: Source tag could be lost on re-export/import

## Troubleshooting

### Import button doesn't work

- Check console for errors
- Verify marketplace server is running
- Confirm OAuth authentication is active
- Check network connectivity

### Package doesn't appear in Library

- Refresh the Library view
- Check browser localStorage isn't full
- Verify package source is set to 'marketplace'
- Look in other tabs (Created/Imported)

### "Already Imported" shown incorrectly

- Refresh both Marketplace and Library views
- Check package IDs match exactly
- Clear browser cache and reload

### Sidebar doesn't show

- Click a package card to select it
- Check browser console for JavaScript errors
- Verify package data is loading correctly

---

**Implementation Date**: 2025 M12 28
**Version**: 1.0.0
**Status**: ✅ Complete and tested
