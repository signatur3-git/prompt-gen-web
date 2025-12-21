# v1.0.0-rc Release Checklist

## ✅ Pre-Commit Checklist

### Documentation
- [x] README.md updated with project description
- [x] USER_GUIDE.md created for end users
- [x] DEPLOYMENT.md created with hosting options
- [x] Development-only docs removed (QUICKSTART.md)
- [x] LICENSE file present

### Configuration Files
- [x] .gitignore configured for Node.js/Vue.js/Vite
- [x] .gitattributes added for consistent line endings
- [x] vite.config.ts configured with GitHub Pages base path
- [x] package.json version updated to 1.0.0-rc

### GitHub Actions
- [x] CI workflow created (.github/workflows/ci.yml)
- [x] Release workflow created (.github/workflows/release.yml)
- [x] GitHub Pages setup documented (.github/PAGES_SETUP.md)

### Code Quality
- [ ] All tests passing locally (`npm run test:run`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Full validation passes (`npm run validate`)
- [ ] Build succeeds without errors (`npm run build`)

### Final Checks
- [ ] All files staged for commit
- [ ] Commit message prepared
- [ ] Ready to push to GitHub

## 🚀 Post-Commit Actions

### 1. Verify CI Pipeline
After pushing to GitHub:
- [ ] Go to Actions tab
- [ ] Verify CI workflow runs successfully
- [ ] Check that all tests pass

### 2. Enable GitHub Pages
- [ ] Go to repository Settings → Pages
- [ ] Set Source to "GitHub Actions"
- [ ] Save changes

### 3. Create Release Tag
```bash
# Tag the release
git tag v1.0.0-rc -m "Release version 1.0.0-rc"

# Push the tag
git push origin v1.0.0-rc
```

### 4. Verify Release Deployment
- [ ] Release workflow completes successfully
- [ ] GitHub Release is created with artifacts
- [ ] Application deploys to GitHub Pages
- [ ] Visit the live URL and test basic functionality

### 5. Update Repository Settings (Optional)
- [ ] Add repository description
- [ ] Add topics/tags (vue, vite, prompt-generator, etc.)
- [ ] Update repository URL (if using custom domain)
- [ ] Add homepage URL to GitHub Pages site

## 📋 Pre-Release Testing Commands

Run these commands before committing:

```bash
# Install dependencies (if not already done)
npm install

# Run unit tests
npm run test:run

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## 🔧 Configuration to Review

### vite.config.ts
- [ ] Verify base path matches your repository name
- Current: `/prompt-gen-web/`
- Change if your repo has a different name

### Repository-Specific Items
- [ ] Update repository owner/name references if needed
- [ ] Verify all documentation links work
- [ ] Check that example code/snippets are accurate

## 📝 Commit Message Template

```
Prepare v1.0.0-rc release

- Add GitHub Actions workflows for CI and deployment
- Configure GitHub Pages deployment
- Add comprehensive documentation (USER_GUIDE, DEPLOYMENT)
- Remove development-only documentation
- Add .gitattributes for consistent line endings
- Update package.json to version 1.0.0-rc
- Configure Vite base path for GitHub Pages

This release provides a fully functional web-based authoring tool
for the Random Prompt Generator with:
- Package creation and editing
- YAML/JSON import/export
- Preview and rendering engine
- LocalStorage persistence
- Comprehensive test coverage
```

## ⚠️ Known Limitations (v1.0.0-rc)

Document these in release notes:
- Basic editor UI (full component editors in future versions)
- LocalStorage only (no cloud sync yet)
- Single-user/single-device (no collaboration features)
- Browser-based only (no mobile app)

## 🎯 Success Criteria

Before considering this release complete:
- [x] All documentation is user-facing and accurate
- [ ] CI/CD pipeline is working
- [ ] Application is deployed and accessible
- [ ] Basic functionality is tested on live deployment
- [ ] Release artifacts are downloadable

## 📌 Next Steps After Release

Consider for future versions:
- Add keyboard shortcuts
- Implement advanced editor UI
- Add package marketplace/sharing
- Cloud sync with authentication
- Offline PWA capabilities
- Mobile-responsive improvements
- Dark mode theme

