# User Guide

## What is the Random Prompt Generator?

The Random Prompt Generator is a web-based authoring tool for creating and managing prompt generation packages. You can define data types, templates, and rules to generate randomized prompts based on your specifications.

## Getting Started

### Accessing the Application

If you're using the hosted version, simply visit the URL provided by your deployment.

For local development:

```bash
npm install
npm run dev
```

## Core Concepts

### Packages

A package is a collection of namespaces, data types, prompt sections, and rules that define how prompts are generated. Packages are stored as YAML or JSON files.

### Namespaces

Namespaces organize your content into logical groups. Each namespace contains:

- **Datatypes**: Lists of values (e.g., colors, names, adjectives)
- **Prompt Sections**: Templates that reference datatypes
- **Rules**: Logic for conditional rendering
- **Separator Sets**: Formatting for lists

### Datatypes

Collections of values that can be referenced in prompt sections. Each value can have:

- Text content
- Tags for categorization
- Weights for probability

### Prompt Sections

Templates that define how prompts are generated. Use `{reference}` syntax to insert values from datatypes.

Example:

```
A {color} {object} on a {surface}
```

## Using the Application

### Creating a New Package

1. Open the application
2. Click **"Create Package"**
3. Fill in the metadata:
   - **Package ID**: Unique identifier (e.g., `my.package`)
   - **Name**: Display name
   - **Version**: Semantic version (e.g., `1.0.0`)
   - **Authors**: List of author names
   - **Description**: What the package does
4. Click **"Save"**

### Importing a Package

1. Click **"Import from File"**
2. Choose format (YAML or JSON)
3. Paste or upload your package content
4. Click **"Import"**

Your package will be loaded and stored in the browser's LocalStorage.

### Editing a Package

1. Navigate to the **Editor** tab
2. Select the package you want to edit
3. Modify the package structure:
   - Add/edit namespaces
   - Create datatypes
   - Define prompt sections
   - Configure rules and rulesets

### Generating Prompts

1. Go to the **Preview** tab
2. Select a namespace
3. Select a prompt section
4. (Optional) Set a seed for reproducible results
5. Click **"Generate"**

The rendered prompt will appear below.

### Exporting a Package

1. In the **Editor** tab, select your package
2. Click **"Export"**
3. Choose your preferred format (YAML or JSON)
4. Copy to clipboard or download the file

## Example Package

Here's a minimal example to get started:

```yaml
id: example.simple
version: 1.0.0
metadata:
  name: Simple Example
  description: A basic prompt generator
  authors:
    - Your Name

namespaces:
  main:
    id: main
    datatypes:
      colors:
        name: colors
        values:
          - text: red
          - text: blue
          - text: green

      objects:
        name: objects
        values:
          - text: ball
          - text: cube
          - text: sphere

    prompt_sections:
      simple_prompt:
        name: simple_prompt
        template: 'A {color} {object}'
        references:
          color:
            target: colors
          object:
            target: objects

    separator_sets: {}
    rules: {}
    decisions: []
    rulebooks: {}

dependencies: []
```

## Tips and Best Practice

### Organizing Your Package

- Use descriptive IDs and names
- Group related datatypes in the same namespace
- Use semantic versioning for package versions

### Creating Datatypes

- Keep values focused and related
- Use tags to categorize values
- Add weights to control probability

### Writing Templates

- Use clear placeholder names
- Test with different seeds
- Consider edge cases (empty results, long text)

### Reproducibility

- Use the seed value to generate the same prompt consistently
- Document your seed for important generations
- Share packages and seeds with others for exact reproduction

## Data Storage

All packages are stored in your browser's LocalStorage. This means:

- ✅ Data persists between sessions
- ✅ Works completely offline
- ✅ No account required
- ⚠️ Data is device-specific (not synced)
- ⚠️ Clearing browser data will delete packages

**Recommendation**: Export important packages regularly as backups.

## Keyboard Shortcuts

(Coming in future versions)

## Troubleshooting

### Package won't import

- Verify the YAML/JSON syntax is valid
- Check that all required fields are present
- Ensure IDs are unique within the package

### Prompt generates blank output

- Verify the datatypes have values
- Check that references match datatype names
- Inspect browser console for errors

### Changes not saving

- Check that LocalStorage is enabled in your browser
- Verify you have storage space available
- Try exporting and re-importing the package

### Browser compatibility

The application works best on modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Need Help?

- Check the [README](./README.md) for technical information
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for hosting options
- File issues on the GitHub repository

## Advanced Topics

### Dependencies

Packages can depend on other packages, allowing you to:

- Reuse common datatypes
- Build modular prompt systems
- Share community packages

### Rules and Rulesets

Define conditional logic for advanced prompt generation:

- Show/hide sections based on conditions
- Apply transformations to text
- Create complex decision trees

### Validation

The application validates packages against the specification:

- Check for missing required fields
- Verify reference integrity
- Ensure proper structure

For more details, see the Random Prompt Generator specification repository.
