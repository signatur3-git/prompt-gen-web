# Landing Page Visual Comparison Guide

## How to Compare Expected vs Actual

### Option 1: View the Preview HTML (Recommended)

I've created a standalone HTML preview file that shows exactly what the design should look like.

**Open in browser:**

```
http://localhost:5173/landing-preview.html
```

Or open directly:

```
D:\workspaces\prompt-gen-web\public\landing-preview.html
```

This shows the **EXPECTED design** with all gradients, colors, and styling.

### Option 2: Side-by-Side Comparison

1. **Open preview in one tab:** `http://localhost:5173/landing-preview.html`
2. **Open actual app in another tab:** `http://localhost:5173/`
3. **Compare visually**

## What You Should See (Expected)

### Hero Section

- **Background:** Purple gradient (#667eea → #764ba2)
- **Text color:** White
- **Shadow:** Soft purple glow around banner
- **Shape:** Rounded corners (16px)
- **Size:** Large, prominent, 3rem title

Should look like this:

```
┌──────────────────────────────────────┐
│                                      │
│  [PURPLE GRADIENT BACKGROUND]        │
│                                      │
│  Random Prompt Generator (white)     │
│  Create dynamic, randomized...       │
│  Build complex prompt templates...   │
│                                      │
└──────────────────────────────────────┘
```

### Getting Started Section

- **Card background:** Pink gradient (#f093fb → #f5576c)
- **Text:** White
- **Icon:** 🎁 (3rem size)
- **Shadow:** Pink glow
- **Button:** Purple with hover effect

Should look like this:

```
✨ Getting Started (black text)
New here? Try the sample package... (gray text)

┌──────────────────────────────────────┐
│                                      │
│  [PINK GRADIENT BACKGROUND]          │
│                                      │
│         🎁                           │
│  Load Sample Package (white)         │
│  Explore featured.common... (white)  │
│  [Load Sample & Start] (button)      │
│                                      │
└──────────────────────────────────────┘
```

### Generate Section

- **Card background:** Teal/pink gradient (#a8edea → #fed6e3)
- **Text:** Dark gray
- **Icon:** ⚡
- **Shape:** Rounded

Should look like this:

```
🚀 Generate Prompts (black text)
Use your packages to create... (gray text)

┌──────────────────────────────────────┐
│                                      │
│  [TEAL/PINK GRADIENT BACKGROUND]     │
│                                      │
│         ⚡                           │
│  Preview & Generate (dark text)      │
│  Generate prompts from... (dark)     │
│  [Open Generator] (button)           │
│                                      │
└──────────────────────────────────────┘
```

### Management Section

- **Card backgrounds:** White with gray border
- **Three columns:** Side by side on desktop
- **Icons:** ➕ 📂 📥
- **Hover:** Cards lift and border turns purple

Should look like this:

```
📦 Package Management (black text)
Create, import, and edit... (gray text)

┌────────┐  ┌────────┐  ┌────────┐
│  [WHITE]│  │  [WHITE]│  │  [WHITE]│
│   ➕   │  │   📂   │  │   📥   │
│ Create │  │  Load  │  │ Import │
│Package │  │Package │  │ Files  │
│[Button]│  │[Button]│  │[Button]│
└────────┘  └────────┘  └────────┘
```

## Troubleshooting: If You See All White

### Issue 1: Browser Cache

**Solution:** Hard refresh

- **Windows:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R

### Issue 2: Dev Server Not Updated

**Solution:** Restart dev server

```powershell
# Stop server (Ctrl+C)
npm run dev
```

### Issue 3: CSS Not Loading

**Check browser console (F12):**

- Look for CSS errors
- Check if styles are being applied

**In DevTools Elements tab:**

- Click on the hero div
- Check "Computed" styles
- Look for `background` - should show gradient

### Issue 4: Vue Scoped Styles Issue

If styles aren't applying, check if elements have `data-v-` attributes.

**Temporary fix:** Remove `scoped` from `<style scoped>` tag:

```vue
<!-- Change this: -->
<style scoped>

<!-- To this: -->
<style>
```

## Visual Indicators Checklist

Use this to verify the design is correct:

### Colors Present

- [ ] Purple gradient hero (top banner)
- [ ] Pink gradient "Load Sample" card
- [ ] Teal/pink gradient "Generate" card
- [ ] White cards with gray borders (management)

### Text Colors

- [ ] Hero text is white
- [ ] Section headers are dark (#2c3e50)
- [ ] Section intros are gray (#666)
- [ ] Pink card text is white
- [ ] Teal card text is dark

### Shadows & Effects

- [ ] Hero has purple glow
- [ ] Pink card has pink glow
- [ ] Teal card has soft shadow
- [ ] White cards have subtle shadows
- [ ] Cards lift on hover

### Layout

- [ ] Hero spans full width (max 1200px)
- [ ] Featured cards are centered (max 700px)
- [ ] Management cards are in 3-column grid
- [ ] Proper spacing between sections (4rem)

## Quick Visual Test

**If you see these colors, it's working:**

1. 🟣 Purple at the top (hero)
2. 🌸 Pink in the middle (sample card)
3. 🦄 Teal/pink below that (generate card)
4. ⬜ White cards at the bottom (management)

**If you only see white/gray, something is wrong.**

## Screenshots Comparison

If possible, take screenshots and compare:

**Expected (from landing-preview.html):**

- Colorful gradients
- Clear visual hierarchy
- Professional appearance

**Actual (from /):**

- Should match expected
- If all white: issue with CSS loading

## Getting Help

If it still looks wrong after trying the fixes above:

1. **Share screenshot** of what you see
2. **Open DevTools** (F12) → Console → Share any errors
3. **Check Elements** → Right-click hero div → Inspect → Share computed styles
4. **Try preview HTML** to confirm expectations

## File Locations

- **Preview HTML:** `D:\workspaces\prompt-gen-web\public\landing-preview.html`
- **Actual Component:** `D:\workspaces\prompt-gen-web\src\views\HomeView.vue`
- **Dev Server:** http://localhost:5173

---

**The design SHOULD be very colorful, not white!** If you're seeing mostly white, the CSS isn't being applied correctly.
