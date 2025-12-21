# Random Prompt Generator - Web Application

A frontend-only web application for authoring and rendering random prompts. This is an authoring tool that can load packages (YAML files), edit them, and render prompts based on configured rules.

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Lint code
npm run lint

# Type check
npm run type-check

# Run all validations (lint + type-check + tests)
npm run validate
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting options and deployment instructions.

The default configuration deploys to GitHub Pages. You may need to update the `base` path in `vite.config.ts` based on your repository name.

## Documentation

- [USER_GUIDE.md](./USER_GUIDE.md) - Complete guide for using the application
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment and hosting options

## Related Repositories

- Spec repository (separate)
- Desktop application (separate)

## License

See [LICENSE](./LICENSE) file for details.


