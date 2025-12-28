# Railway Configuration Alternative (If Default Fails)

If you encounter build issues with the default `railway.json`, try this simpler configuration:

## Option 1: Minimal railway.json

Replace the contents of `railway.json` with:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npx serve -s dist -p $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Then set the build command manually in Railway Dashboard:

- Go to Settings → Build Command
- Set to: `npm install && npm run build`

## Option 2: Use Railway's Auto-Detection

Delete `railway.json` and `nixpacks.toml` entirely and let Railway auto-detect everything:

1. Railway Dashboard → Settings → Build Command: `npm install && npm run build`
2. Railway Dashboard → Settings → Start Command: `npx serve -s dist -p $PORT`

## Option 3: Dockerfile (Most Control)

Create a `Dockerfile` in the root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install
RUN npm ci --prefer-offline --no-audit

# Copy source
COPY . .

# Build
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Expose port
EXPOSE $PORT

# Start
CMD ["sh", "-c", "serve -s dist -p $PORT"]
```

Then in Railway Dashboard:

- Settings → Builder: Docker
- It will automatically use the Dockerfile

## When to Use Each Option

- **Default (railway.json)**: Best for most cases, includes cache cleaning
- **Option 1 (Minimal)**: If you get cache errors despite fixes
- **Option 2 (Auto-detect)**: Simplest, let Railway figure it out
- **Option 3 (Dockerfile)**: Maximum control, best for complex setups

## Testing Locally

For Dockerfile option:

```bash
docker build -t prompt-gen-web .
docker run -p 5173:5173 -e PORT=5173 prompt-gen-web
```
