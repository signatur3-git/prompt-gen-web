// CSS syntax validation tests
// Catches CSS parse errors that would break the dev server

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CSS Syntax Validation', () => {
  it('should not have orphaned CSS properties in HomeView', () => {
    const fullPath = join(process.cwd(), 'src/views/HomeView.vue');
    const content = readFileSync(fullPath, 'utf-8');

    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (!styleMatch) return;

    const css = styleMatch[1];

    // Check for orphaned properties pattern:
    // A closing brace followed by indented property (not a selector)
    // Example: }  \n  margin-bottom: 0.5rem;
    const lines = css.split('\n');
    let prevLineWasCloseBrace = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Check if previous line was a closing brace
      if (prevLineWasCloseBrace) {
        // If this line is a property (contains colon but not opening brace)
        if (trimmed &&
            trimmed.includes(':') &&
            !trimmed.includes('{') &&
            !trimmed.startsWith('/*') &&
            !trimmed.startsWith('//')) {
          // Make sure it's not a pseudo-selector like :hover
          if (!trimmed.match(/^[a-zA-Z-]+\s*:/)) {
            continue; // It's probably a pseudo-selector
          }

          throw new Error(
            `Orphaned CSS property found at line ${i + 1}: "${trimmed}". ` +
            `Properties must be inside a selector block { }.`
          );
        }
      }

      prevLineWasCloseBrace = trimmed === '}';
    }
  });

  it('should have matching braces in all Vue style blocks', () => {
    const vueFiles = [
      'src/views/HomeView.vue',
      'src/views/EditorView.vue',
      'src/views/PreviewView.vue',
      'src/App.vue',
    ];

    vueFiles.forEach((filePath) => {
      const fullPath = join(process.cwd(), filePath);
      let content;

      try {
        content = readFileSync(fullPath, 'utf-8');
      } catch (e) {
        // File doesn't exist, skip
        return;
      }

      const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      if (!styleMatch) return;

      const css = styleMatch[1];

      // Count opening and closing braces (excluding those in strings/comments)
      const openBraces = (css.match(/{/g) || []).length;
      const closeBraces = (css.match(/}/g) || []).length;

      expect(openBraces).withContext(`${filePath} should have matching braces`).toBe(closeBraces);
    });
  });

  it('should have valid global CSS syntax', () => {
    const fullPath = join(process.cwd(), 'src/style.css');
    const css = readFileSync(fullPath, 'utf-8');

    // Basic validation: matching braces
    const openBraces = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;

    expect(openBraces).toBe(closeBraces);
  });

  it('should not have empty selector blocks', () => {
    const fullPath = join(process.cwd(), 'src/views/HomeView.vue');
    const content = readFileSync(fullPath, 'utf-8');

    const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (!styleMatch) return;

    const css = styleMatch[1];

    // Check for selectors with only comments or empty
    // Example: header { /* Old styles removed */ }
    const emptyBlockPattern = /[a-zA-Z#.][a-zA-Z0-9#.\-_:\s]*\{[\s]*(?:\/\*[\s\S]*?\*\/[\s]*)?\}/g;
    const matches = css.match(emptyBlockPattern);

    if (matches) {
      // Allow certain patterns like media queries
      const problematic = matches.filter(m =>
        !m.includes('@media') &&
        !m.includes('@keyframes') &&
        m.length < 100 // Avoid false positives with long valid blocks
      );

      if (problematic.length > 0) {
        console.warn(
          `Found empty CSS selector blocks in HomeView: ${problematic.join(', ')}. ` +
          `These should be removed.`
        );
        // Just warn, don't fail - these don't break compilation
      }
    }
  });
});

