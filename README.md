# Random Prompt Generator - Web Edition

[![CI](https://github.com/signatur3-git/prompt-gen-web/actions/workflows/ci.yml/badge.svg)](https://github.com/signatur3-git/prompt-gen-web/actions/workflows/ci.yml)
[![Release](https://github.com/signatur3-git/prompt-gen-web/actions/workflows/release.yml/badge.svg)](https://github.com/signatur3-git/prompt-gen-web/actions/workflows/release.yml)

> **Try it now:** [https://signatur3-git.github.io/prompt-gen-web/](https://signatur3-git.github.io/prompt-gen-web/)

## Welcome

The **Random Prompt Generator** is a powerful authoring tool for creating and managing prompt generation packages. This web edition runs entirely in your browser with no backend required - all your data is stored locally using browser storage.

### What Can You Do?

- **📝 Author Packages**: Create and edit prompt generation packages with an intuitive visual editor
- **🎲 Generate Prompts**: Live preview mode lets you generate single or batch prompts using rulebooks or prompt sections with seed-based deterministic generation
- **💾 Local Storage**: All your work is saved locally in your browser - no accounts, no uploads
- **📦 Import/Export**: Work with YAML package files compatible with the Random Prompt Generator specification
- **🔍 Validation**: Real-time validation ensures your packages follow the correct structure
- **🎯 Test & Iterate**: Instantly preview generated prompts to test your package configurations

### Key Features

- **Namespaces**: Organize your content into logical namespaces
- **Datatypes**: Define lists of values with weights, tags, and conditions
- **Prompt Sections**: Create reusable prompt templates with variable substitution
- **Rules & Rulebooks**: Build complex conditional logic for dynamic generation
- **Separator Sets**: Control how list items are joined in output
- **Dependency Resolution**: Automatically resolve and import package dependencies

## Getting Started

Just visit [https://signatur3-git.github.io/prompt-gen-web/](https://signatur3-git.github.io/prompt-gen-web/) and start creating!

For detailed instructions, see the [User Guide](./USER_GUIDE.md).

### Quick Workflow

1. **Create or Import** a package from the home page
2. **Edit** your package in the visual editor (namespaces, datatypes, prompt sections, rulebooks)
3. **Preview** your work - generate prompts with different seeds to test your configurations
4. **Export** your finished package as YAML for sharing or version control

## Development

### Prerequisites

- Node.js 20 or later
- npm

### Setup
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

- **[User Guide](./USER_GUIDE.md)** - Complete guide for using the application
- **[Release Checklist](./RELEASE_CHECKLIST.md)** - Pre-release validation checklist

## Architecture

This is a frontend-only Vue 3 application that:
- Uses **Vite** for blazing-fast development and optimized production builds
- Stores all data in **browser localStorage** (no backend required)
- Implements the **Random Prompt Generator specification**
- Provides a rich authoring experience with real-time validation
- Deploys as a static site to GitHub Pages (or any CDN)

## Related Projects

This web application is part of the Random Prompt Generator ecosystem:

- **RPG Spec** - The specification defining the package format (separate repository)
- **RPG Desktop** - Desktop application version (separate repository)
- **Package Repository** - Collection of community packages (separate repository)

## Contributing

This is currently a personal project. If you find bugs or have suggestions, please open an issue!

## Version

Current version: **v1.0.0-rc** (Release Candidate)

## License

See [LICENSE](./LICENSE) file for details.

---

**Built with ❤️ using Vue 3, TypeScript, and Vite**


