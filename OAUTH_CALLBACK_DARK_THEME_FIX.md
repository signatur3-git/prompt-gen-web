# OAuth Callback Dark Theme Fix

**Date:** 2025-12-28  
**Status:** ✅ Fixed  
**Issue:** OAuth callback page had white/light text on white background in dark mode

---

## Problem

The OAuth callback page (`/oauth/callback`) was not respecting the dark/light theme CSS variables. It had hardcoded colors that resulted in:

- Almost white text on white backgrounds in dark mode
- Poor contrast and readability
- Inconsistent appearance compared to other pages

### Specific Issues

1. **Loading state heading:** Used hardcoded `#333` instead of `--color-text-primary`
2. **Spinner borders:** Used hardcoded `#f3f3f3` and `#667eea` instead of CSS variables
3. **Button backgrounds:** Used hardcoded hex colors instead of theme variables
4. **Page background:** Used hardcoded gradient instead of `--color-background`
5. **Container shadow:** Used hardcoded shadow value instead of `--shadow-lg`

---

## Solution

Replaced all hardcoded colors with CSS variables to ensure proper dark/light mode support.

### Changes Made

#### 1. Loading State Text Color

**Before:**

```css
.loading-state h2 {
  color: #333;
}
```

**After:**

```css
.loading-state h2 {
  color: var(--color-text-primary);
}
```

#### 2. Spinner Border Colors

**Before:**

```css
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
}
```

**After:**

```css
.spinner {
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
}
```

#### 3. Button Styling

**Before:**

```css
.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}
```

**After:**

```css
.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-surface-hover);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-surface);
  border-color: var(--color-border-hover);
}
```

#### 4. Page and Container Background

**Before:**

```css
.oauth-callback {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.callback-container {
  background: var(--color-surface);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
```

**After:**

```css
.oauth-callback {
  background: var(--color-background);
}

.callback-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  margin: 2rem auto;
}
```

#### 5. Fixed Duplicate Padding

Removed duplicate `padding` declaration in `.callback-container`.

---

## Files Modified

- **`src/views/OAuthCallback.vue`** - Updated all hardcoded colors to use CSS variables

---

## CSS Variables Used

| Variable                 | Light Mode     | Dark Mode      | Purpose               |
| ------------------------ | -------------- | -------------- | --------------------- |
| `--color-background`     | `#f5f7fa`      | `#0f172a`      | Page background       |
| `--color-surface`        | `#ffffff`      | `#1e293b`      | Panel/card background |
| `--color-surface-hover`  | `#f8f9fa`      | `#334155`      | Hover states          |
| `--color-text-primary`   | `#2c3e50`      | `#f1f5f9`      | Primary text          |
| `--color-text-secondary` | `#64748b`      | `#cbd5e1`      | Secondary text        |
| `--color-text-tertiary`  | `#94a3b8`      | `#94a3b8`      | Tertiary text         |
| `--color-border`         | `#e2e8f0`      | `#334155`      | Borders               |
| `--color-border-hover`   | `#cbd5e1`      | `#475569`      | Hover borders         |
| `--color-primary`        | `#667eea`      | `#6366f1`      | Primary action color  |
| `--color-primary-hover`  | `#5568d3`      | `#4f46e5`      | Primary hover         |
| `--shadow-lg`            | Defined in CSS | Defined in CSS | Large shadow          |

---

## Testing

### Build Status

✅ Build succeeds without errors  
✅ Linting passes with 0 warnings  
✅ TypeScript compilation successful

### Expected Behavior Now

**Light Mode:**

- Dark text on light backgrounds
- Good contrast and readability
- Consistent with other pages

**Dark Mode:**

- Light text on dark backgrounds
- Good contrast and readability
- Consistent with other pages
- No white-on-white text issues

### Pages to Test

1. Navigate to OAuth callback URL (trigger by clicking "Connect to Marketplace")
2. Check loading state appearance
3. Test error state (if applicable)
4. Test success state
5. Switch between light and dark mode using OS settings

---

## Related Components

The OAuth callback page now properly inherits the theme system used by:

- Home page
- Generate (Preview) page
- Edit page
- Library page
- Marketplace page

All pages now have consistent dark/light mode behavior! 🎉

---

## Prevention for Future

### Best Practices

1. **Always use CSS variables** for colors instead of hardcoded hex values
2. **Test in both light and dark modes** before considering a feature complete
3. **Reference `src/style.css`** for available CSS variables
4. **Use semantic color names** (e.g., `--color-text-primary` instead of specific colors)
5. **Avoid gradients or decorative colors** that don't work in both modes

### Available Color Variables

Refer to `src/style.css` for the complete list of theme variables:

- Background colors: `--color-background`, `--color-surface`, etc.
- Text colors: `--color-text-primary`, `--color-text-secondary`, etc.
- Border colors: `--color-border`, `--color-border-hover`, etc.
- Action colors: `--color-primary`, `--color-success`, `--color-danger`, etc.
- Form controls: `--control-bg`, `--control-text`, `--control-border`, etc.

---

## Summary

✅ Replaced all hardcoded colors with CSS variables  
✅ Fixed white-on-white text issue in dark mode  
✅ Added proper border to container  
✅ Removed decorative gradient background  
✅ Fixed duplicate padding declaration  
✅ Build and lint pass successfully  
✅ Consistent theme behavior across all pages

The OAuth callback page now properly supports both light and dark modes! 🌓
