# Local Development Setup - OAuth Testing

## 🔧 Port Configuration

For local OAuth testing, you need **both** applications running:

| Application     | Port | URL                     |
| --------------- | ---- | ----------------------- |
| **Marketplace** | 5174 | `http://localhost:5174` |
| **Web App**     | 5173 | `http://localhost:5173` |

## 🚀 Quick Start

### 1. Start Marketplace First

```bash
# Navigate to marketplace project
cd path/to/marketplace

# Start marketplace dev server
npm run dev
```

**Expected output:** Server running on `http://localhost:5174`

### 2. Start Web App

```bash
# Navigate to web app project
cd path/to/prompt-gen-web

# Start web app dev server
npm run dev
```

**Expected output:** Server running on `http://localhost:5173`

### 3. Test OAuth Flow

1. Open browser: `http://localhost:5173`
2. Navigate to Marketplace section
3. Click "Connect to Marketplace"
4. You'll be redirected to: `http://localhost:5174/oauth/authorize?...`
5. Sign in and approve
6. Redirected back to: `http://localhost:5173/oauth/callback`
7. Success! Browse packages

---

## 🔄 Environment Switching

The web app **automatically** detects the environment:

### Development Mode (`npm run dev`)

- Uses `http://localhost:5174` for marketplace
- Detected via `import.meta.env.DEV` flag
- Perfect for local testing with both apps running

### Production Mode (`npm run build`)

- Uses `https://prompt-gen-marketplace-production.up.railway.app`
- Production-ready marketplace API
- For GitHub Pages deployment

**No manual configuration needed!** ✨

---

## 🔍 How It Works

### Configuration Logic

```typescript
// src/config/marketplace.config.ts
const MARKETPLACE_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5174' // Dev: local marketplace
  : 'https://prompt-gen-marketplace-production.up.railway.app'; // Prod: Railway
```

### OAuth Flow

```
Development:
Web App (5173) → Marketplace (5174) → Web App (5173)
     ↓               ↓                    ↓
  Connect      Authorize/Login        Success!

Production:
Web App (GitHub) → Marketplace (Railway) → Web App (GitHub)
```

---

## 🐛 Troubleshooting

### Issue: "Connection refused" when clicking Connect

**Cause:** Marketplace not running on port 5174

**Solution:**

```bash
# Check if marketplace is running
curl http://localhost:5174/health

# If not running, start marketplace
cd path/to/marketplace
npm run dev
```

### Issue: Port 5173 already in use

**Cause:** Another app is using port 5173

**Solution:**

```bash
# Stop other process or use different port
npm run dev -- --port 5175
```

### Issue: Port 5174 already in use

**Cause:** Previous marketplace instance still running

**Solution:**

```bash
# Find and kill process
netstat -ano | findstr :5174
taskkill /PID <PID> /F

# Or restart marketplace
```

### Issue: OAuth redirect goes to production marketplace

**Cause:** Running production build instead of dev mode

**Solution:**

```bash
# Make sure you use dev mode, not build + preview
npm run dev    # ✅ Correct - uses localhost:5174
npm run build && npm run preview  # ❌ Wrong - uses production URL
```

---

## ✅ Verification Checklist

Before testing OAuth flow:

- [ ] Marketplace running on `http://localhost:5174`
- [ ] Web app running on `http://localhost:5173`
- [ ] Can access marketplace directly in browser
- [ ] Can access web app directly in browser
- [ ] No CORS errors in console
- [ ] Both apps in development mode (`npm run dev`)

---

## 🎯 Expected Behavior

### When Everything Works

1. **Marketplace responds:**

   ```bash
   curl http://localhost:5174/health
   # Should return: {"status":"ok"}
   ```

2. **Web app loads:** `http://localhost:5173`

3. **OAuth redirect works:**
   - Click "Connect to Marketplace"
   - Browser goes to `http://localhost:5174/oauth/authorize`
   - Marketplace authorization page loads
   - After approval, returns to `http://localhost:5173/oauth/callback`

4. **Packages load:**
   - Marketplace page shows package list
   - Can search and download packages
   - All API calls go to `http://localhost:5174/api/v1/*`

---

## 📝 Quick Reference

### Start Both Apps

```bash
# Terminal 1: Marketplace
cd marketplace && npm run dev

# Terminal 2: Web App
cd prompt-gen-web && npm run dev
```

### Test URLs

- Web App Home: `http://localhost:5173`
- Web App Marketplace: `http://localhost:5173/marketplace`
- Marketplace Auth: `http://localhost:5174/oauth/authorize`
- Marketplace API: `http://localhost:5174/api/v1/*`

### Environment Check

```javascript
// In browser console on web app page
console.log(import.meta.env.DEV); // Should be true
console.log(import.meta.env.PROD); // Should be false
```

---

## 🎉 Ready to Test!

With both apps running, you can test the complete OAuth flow locally without touching production services.

**Happy Testing! 🚀**
