# Deployment Guide

## Recommended Hosting Options

This is a static Vue.js single-page application (SPA) that can be hosted on any static file hosting service with global CDN.

### GitHub Pages (Recommended - Default Setup)

**Pros:**
- Free hosting with custom domain support
- Global CDN via GitHub's infrastructure
- Automatic deployment via GitHub Actions (configured)
- Built-in HTTPS support

**Setup:**
1. Go to your repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Push a tag starting with `v` (e.g., `v1.0.0-rc`) to trigger deployment
4. Your app will be available at `https://<username>.github.io/prompt-gen-web/`

**Custom Domain:**
- Add a `CNAME` file in the `public/` directory with your domain
- Configure your DNS provider to point to GitHub Pages
- Update `vite.config.ts` base path if needed

### Alternative Hosting Options

#### Netlify
**Pros:** Excellent developer experience, preview deployments, form handling  
**Deploy:** Connect your GitHub repo, set build command to `npm run build`, publish directory to `dist`  
**Cost:** Free tier available with generous limits

#### Vercel
**Pros:** Zero-config deployments, excellent performance, serverless functions  
**Deploy:** Import GitHub repo, auto-detects Vite/Vue configuration  
**Cost:** Free tier available for personal projects

#### Cloudflare Pages
**Pros:** Extremely fast global CDN, generous free tier, DDoS protection  
**Deploy:** Connect GitHub repo, build command `npm run build`, output directory `dist`  
**Cost:** Free tier with unlimited bandwidth

#### AWS S3 + CloudFront
**Pros:** Highly scalable, full AWS integration, fine-grained control  
**Deploy:** Upload `dist/` to S3 bucket, configure CloudFront distribution  
**Cost:** Pay-as-you-go (low cost for static sites)

## Build Configuration

The application uses Vite for building. The production build is optimized for:
- Code splitting
- Tree shaking
- Asset optimization
- Modern browser targets

### Build Commands
```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables
Currently, the app doesn't require environment variables. All configuration is done at build time.

If you need to add environment variables in the future:
1. Create `.env.production` file
2. Prefix variables with `VITE_`
3. Access via `import.meta.env.VITE_YOUR_VAR`

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)
- Runs on every push/PR to main/develop branches
- Builds the application
- Runs unit tests with Vitest
- Runs E2E tests with Playwright
- Uploads build artifacts

### Release Workflow (`.github/workflows/release.yml`)
- Triggers on version tags (e.g., `v1.0.0-rc`)
- Runs full test suite
- Creates GitHub Release with downloadable archives
- Deploys to GitHub Pages automatically
- Marks pre-release for tags containing `-rc`, `-alpha`, or `-beta`

### Creating a Release
```bash
# Tag the release
git tag v1.0.0-rc
git push origin v1.0.0-rc

# Or use GitHub CLI
gh release create v1.0.0-rc --prerelease --generate-notes
```

## Performance Considerations

For optimal performance:
- Assets are fingerprinted for long-term caching
- Enable compression (gzip/brotli) on your hosting provider
- Configure proper cache headers
- Use HTTP/2 or HTTP/3 if available
- Consider enabling a CDN if not already provided

## Security

This is a client-side only application:
- No server-side secrets needed
- All processing happens in the browser
- LocalStorage is used for data persistence
- HTTPS is recommended (and required by modern browsers for some features)

