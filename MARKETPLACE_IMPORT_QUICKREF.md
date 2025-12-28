# Quick Reference: Marketplace Import Feature

## 🎯 One-Page Developer Reference

### Feature Overview

Import marketplace packages directly to library with one click via details sidebar.

---

## 🔑 Key Concepts

### Package Selection

```typescript
const selectedPackage = ref<Package | null>(null);

function selectPackage(pkg: Package) {
  selectedPackage.value = pkg;
}
```

### Duplicate Detection

```typescript
const importedPackageIds = computed(() => {
  return new Set(
    packageStore.packages
      .filter((pkg: any) => pkg.source === 'marketplace')
      .map((pkg: any) => pkg.id)
  );
});

function isPackageImported(pkg: Package): boolean {
  return importedPackageIds.value.has(pkg.id);
}
```

### Import Process

```typescript
async function importPackage(pkg: Package) {
  // 1. Check duplicates
  if (isPackageImported(pkg)) return;

  // 2. Download YAML
  const content = await marketplaceClient.downloadPackage(pkg.namespace, pkg.name, pkg.version);

  // 3. Import to store
  await packageStore.importPackageFromString(content, 'yaml');

  // 4. Mark as marketplace source
  (packageStore.currentPackage as any).source = 'marketplace';
  await packageStore.savePackage();

  // 5. Refresh and notify
  await packageStore.loadPackageList();
  selectedPackage.value = null;
}
```

---

## 📐 Layout Structure

```vue
<div class="packages-layout">
  <!-- Left: Package Grid -->
  <div class="packages-grid">
    <div @click="selectPackage(pkg)"
         :class="{ selected: selectedPackage?.id === pkg.id }">
      <!-- Package card content -->
    </div>
  </div>

  <!-- Right: Details Sidebar -->
  <div v-if="selectedPackage" class="package-details-sidebar">
    <div class="sidebar-header">
      <h3>{{ selectedPackage.namespace }}/{{ selectedPackage.name }}</h3>
      <button @click="selectedPackage = null">✕</button>
    </div>
    <div class="sidebar-content">
      <!-- Package details -->
    </div>
    <div class="sidebar-actions">
      <button v-if="!isPackageImported(selectedPackage)"
              @click="importPackage(selectedPackage)">
        Import to Library
      </button>
      <button v-else disabled>Already Imported</button>
    </div>
  </div>
</div>
```

---

## 🎨 CSS Structure

```css
.packages-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
}

.package-card {
  cursor: pointer;
  transition: all 0.2s;
}

.package-card.selected {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.package-details-sidebar {
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
}

@media (max-width: 1200px) {
  .packages-layout {
    grid-template-columns: 1fr;
  }
  .package-details-sidebar {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 400px;
  }
}
```

---

## 🔄 State Flow

```
User Action          State Change              UI Update
──────────────────────────────────────────────────────────
Click package    →   selectedPackage = pkg  →  Sidebar shows
                                               Card highlighted

Click Import     →   importing = true       →  Button: "Importing..."

Download complete→   Package imported       →  Store updated

Import complete  →   importing = false      →  Success message
                     selectedPackage = null    Sidebar closes

Refresh list     →   packages refreshed     →  Library updated
```

---

## 🧩 Integration Points

### 1. Package Store

```typescript
import { usePackageStore } from '@/stores/packageStore';
const packageStore = usePackageStore();

// Import package
await packageStore.importPackageFromString(content, 'yaml');

// Save with source
await packageStore.savePackage();

// Refresh list
await packageStore.loadPackageList();
```

### 2. Marketplace Client

```typescript
import { marketplaceClient } from '@/services/marketplace-client';

// Download package
const content = await marketplaceClient.downloadPackage(namespace, name, version);
```

### 3. Library View

```typescript
// Marketplace packages appear in Library > Marketplace tab
const marketplacePackages = computed(() => {
  return packageStore.packages.filter((pkg: any) => pkg.source === 'marketplace');
});
```

---

## 🎯 User Flow

```
Browse → Select → Review → Import → Use
  ↓        ↓        ↓        ↓       ↓
/marketplace    Sidebar   Click   Library
               appears   Import  appears
```

---

## ✅ Testing Checklist

```
□ Click package → sidebar shows
□ Click Import → success message
□ Go to Library → package appears
□ Select same package → "Already Imported"
□ Click close → sidebar closes
□ Mobile view → overlay works
□ Download → YAML file downloads
```

---

## 🐛 Common Issues

### Sidebar Not Showing

```typescript
// Check selectedPackage is not null
console.log('selectedPackage:', selectedPackage.value);
```

### Import Not Working

```typescript
// Check marketplace connection
console.log('Authenticated:', oauthService.isAuthenticated());
console.log('Package:', pkg);
```

### "Already Imported" Incorrect

```typescript
// Check package IDs
console.log('Local IDs:', importedPackageIds.value);
console.log('Package ID:', pkg.id);
```

---

## 📊 Performance Tips

### Optimize Duplicate Check

```typescript
// Use Set for O(1) lookups
const importedPackageIds = computed(() => {
  return new Set(
    packageStore.packages.filter(pkg => pkg.source === 'marketplace').map(pkg => pkg.id)
  );
});
```

### Lazy Load Details

```typescript
// Only load full package on selection
async function selectPackage(pkg: Package) {
  selectedPackage.value = pkg;
  // Could fetch more details here if needed
}
```

---

## 🔐 Security Considerations

### OAuth Required

```typescript
// Import requires authentication
if (!oauthService.isAuthenticated()) {
  throw new Error('Authentication required');
}
```

### Safe Package Handling

```typescript
// Validate package before import
if (!pkg.id || !pkg.version || !pkg.metadata) {
  throw new Error('Invalid package structure');
}
```

---

## 📝 API Reference

### MarketplaceClient Methods

```typescript
// Download package YAML
downloadPackage(namespace: string, name: string, version: string): Promise<string>

// Search packages
searchPackages(query?: string, page?: number): Promise<SearchResult>

// Get package details
getPackage(namespace: string, name: string): Promise<PackageDetails>
```

### PackageStore Methods

```typescript
// Import from string
importPackageFromString(content: string, format: 'yaml' | 'json'): Promise<void>

// Save package
savePackage(): Promise<void>

// Load package list
loadPackageList(): Promise<void>

// Delete package
deletePackage(id: string): Promise<void>
```

---

## 🎨 Color Palette

```typescript
const COLORS = {
  primary: '#667eea', // Purple - Primary actions, selected
  success: '#48bb78', // Green - Import, success
  warning: '#ed8936', // Orange - Warnings
  info: '#38b2ac', // Teal - Info
  secondary: '#e2e8f0', // Gray - Disabled, secondary

  // Entity types
  rulebook: '#667eea', // Purple
  rule: '#48bb78', // Green
  promptSection: '#ed8936', // Orange
  datatype: '#38b2ac', // Teal
};
```

---

## 📦 Bundle Size

| File                | Size         | Gzipped     |
| ------------------- | ------------ | ----------- |
| MarketplaceView.css | 10.54 KB     | 2.28 KB     |
| MarketplaceView.js  | 12.86 KB     | 4.26 KB     |
| **Total**           | **23.40 KB** | **6.54 KB** |

---

## 🚀 Deployment

```bash
# Build
npm run build

# Test build
npm run preview

# Deploy
# (Follow your deployment process)
```

---

## 📚 Documentation

- **Feature Guide**: MARKETPLACE_IMPORT_FEATURE.md
- **Visual Guide**: MARKETPLACE_IMPORT_VISUAL_GUIDE.md
- **Implementation**: MARKETPLACE_IMPORT_IMPLEMENTATION.md
- **Testing**: MARKETPLACE_IMPORT_TESTING.md
- **Summary**: MARKETPLACE_IMPORT_COMPLETE.md
- **Quick Reference**: This file

---

## 🆘 Quick Help

**Issue**: Sidebar not appearing  
**Fix**: Check `v-if="selectedPackage"` and `selectedPackage.value`

**Issue**: Import button disabled  
**Fix**: Check `isPackageImported()` logic

**Issue**: Package not in Library  
**Fix**: Check `source: 'marketplace'` is set

**Issue**: Duplicate imports  
**Fix**: Verify `importedPackageIds` computation

---

**Created**: 2025 M12 28  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
