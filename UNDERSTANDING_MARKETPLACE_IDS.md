# Understanding Marketplace vs Package IDs

## The Key Distinction

There are **three separate identifiers** involved when working with marketplace packages:

### 1. Marketplace Database UUID

- **Where it lives:** Marketplace server database
- **What it looks like:** `"4be538b9-8d90-42f9-a6d8-fb2d3f01042b"`
- **Purpose:** Internal database primary key
- **Set by:** Marketplace server (auto-generated)
- **Used for:** Marketplace API endpoints

### 2. Marketplace Namespace/Name

- **Where it lives:** Marketplace server database (separate fields)
- **What it looks like:**
  - `namespace: "featured/base"` (full package identifier)
  - `name: "Featured Base"` (display name)
- **Purpose:**
  - `namespace`: Package identifier (matches YAML id by convention)
  - `name`: Human-readable display name
- **Set by:** User when publishing to marketplace
- **Used for:** Display and package identification

**Important:** The `namespace` field contains the full package identifier (e.g., `"featured/base"`), NOT just a category. The `name` field is the display name (e.g., `"Featured Base"`).

### 3. Package YAML ID

- **Where it lives:** Inside the package YAML file
- **What it looks like:** `"featured/base"` (should match marketplace namespace)
- **Purpose:** Package identification and dependency resolution
- **Set by:** Package author in the YAML
- **Used for:** Runtime package identification

**Convention:** The package YAML `id` should match the marketplace `namespace` field.

## The Actual Structure

These three things are related but stored separately:

```
Marketplace UUID:       4be538b9-8d90-42f9-a6d8-fb2d3f01042b  (database key)
Marketplace namespace:  featured/base                          (package identifier)
Marketplace name:       Featured Base                          (display name)
Package YAML id:        featured/base                          (should match namespace)
```

**Key insight:** The marketplace `namespace` field already contains the full package identifier (e.g., `"featured/base"`). The `name` field is just the display name (e.g., `"Featured Base"`).

## The Convention

**By convention**, package authors:

1. Choose a package identifier (e.g., `"featured/base"`)
2. Use this as the marketplace `namespace` field
3. Choose a display name (e.g., `"Featured Base"`) for the `name` field
4. Use the same identifier in their YAML `id` field

So:

```yaml
# In the YAML file
id: featured/base # ← Should match marketplace namespace field
```

And on the marketplace:

- `namespace`: `"featured/base"` (matches YAML id)
- `name`: `"Featured Base"` (display name)

This is **not enforced** but is the typical pattern.

## How Duplicate Detection Works

### The Challenge

When checking if a package is already imported:

- We have the **marketplace object** with UUID, namespace, and name
- We have **imported packages** with their YAML IDs
- We need to match them somehow

### The Solution

Compare marketplace's `namespace` field (which already contains the full identifier) against imported package IDs:

```typescript
// Marketplace package
const marketplacePackage = {
  id: '4be538b9-...', // Can't use this (database UUID)
  namespace: 'featured/base', // Use this (full package identifier)
  name: 'Featured Base', // Display name only
};

// Check if any imported package has this ID
const isImported = importedPackageIds.has(marketplacePackage.namespace);
// → true if package author used "featured/base" as their YAML id
```

### Why It Works (Usually)

Most package authors follow the convention:

- They set marketplace `namespace` to `"featured/base"`
- They set their YAML `id` to `"featured/base"`
- So the comparison matches! ✅

### When It Fails

If a package author doesn't follow the convention:

- Marketplace `namespace`: `"acme/core"`
- YAML `id`: `"acme.core"` (using dot instead of slash)
- Comparison: `"acme/core"` vs `"acme.core"`
- Result: No match ❌

## Real-World Example

### Publishing Process

1. **Author creates package YAML:**

```yaml
id: featured/base
version: 1.0.0
metadata:
  name: Base Package
```

2. **Author publishes to marketplace:**

- Set `namespace`: `"featured/base"` (package identifier)
- Set `name`: `"Featured Base"` (display name)
- Upload YAML file

3. **Marketplace creates database record:**

```json
{
  "id": "4be538b9-...",
  "namespace": "featured/base",
  "name": "Featured Base",
  "version": "1.0.0"
}
```

### Import Process

1. **User clicks "Import"**
2. **Download YAML from marketplace**
3. **Parse YAML, get `id: "featured/base"`**
4. **Save to localStorage:**

```json
{
  "featured/base": {
    "id": "featured/base",
    "version": "1.0.0",
    "source": "marketplace"
  }
}
```

### Duplicate Detection

1. **User views marketplace again**
2. **Load marketplace packages (with UUIDs)**
3. **For each marketplace package:**
   - Get the `namespace` field (already contains full identifier like `"featured/base"`)
   - Check if this ID exists in localStorage
4. **If match found → Show "Already Imported"**

## Summary Table

| Field           | Source         | Example         | Used For               |
| --------------- | -------------- | --------------- | ---------------------- |
| Database UUID   | Marketplace DB | `4be538b9-...`  | API endpoints          |
| Namespace       | Marketplace DB | `featured/base` | Package identifier     |
| Name            | Marketplace DB | `Featured Base` | Display name           |
| Package YAML ID | Package YAML   | `featured/base` | Package identification |

**Key insight:** The marketplace `namespace` field contains the full package identifier and should match the package YAML `id` field.

---

**Created:** 2025 M12 28  
**Purpose:** Clarify the relationship between marketplace and package IDs  
**Status:** Documentation
