// Package normalization - converts relative references to absolute
// Based on: prompt-gen-desktop/src-tauri/src/parser/package_loader.rs

import type { Package } from '../models/package';

/**
 * Normalize all relative references to absolute references
 *
 * Converts relative references (e.g., "colors") to absolute (e.g., "provider:colors")
 * This is critical for packages loaded as dependencies, where references must be
 * fully qualified to avoid namespace collisions.
 *
 * Example:
 * Before normalization:
 *   color:
 *     target: colors  # Relative
 *
 * After normalization:
 *   color:
 *     target: provider:colors  # Absolute
 */
export function normalizePackageReferences(pkg: Package): void {
  for (const [namespaceId, namespace] of Object.entries(pkg.namespaces)) {
    // Normalize references in all promptsections
    if (namespace.prompt_sections) {
      for (const promptSection of Object.values(namespace.prompt_sections)) {
        if (promptSection.references) {
          for (const reference of Object.values(promptSection.references)) {
            // Skip empty, context references, and already-absolute references
            if (
              reference.target &&
              reference.target.length > 0 &&
              !reference.target.startsWith('context:') &&
              !reference.target.includes(':')
            ) {
              // Make relative reference absolute by prepending namespace
              reference.target = `${namespaceId}:${reference.target}`;
            }
          }
        }
      }
    }
  }
}

