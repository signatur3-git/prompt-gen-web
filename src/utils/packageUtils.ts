// Utility to calculate content counts from a package
// M12: Entity badges feature

import type { Package } from '../models/package';

export interface ContentCounts {
  rulebooks: number;
  rules: number;
  prompt_sections: number;
  datatypes: number;
}

/**
 * Calculate entity counts across all namespaces in a package
 */
export function calculateContentCounts(pkg: Package): ContentCounts {
  let rulebooks = 0;
  let rules = 0;
  let prompt_sections = 0;
  let datatypes = 0;

  // Iterate through all namespaces and count entities
  for (const namespace of Object.values(pkg.namespaces || {})) {
    rulebooks += Object.keys(namespace.rulebooks || {}).length;
    rules += Object.keys(namespace.rules || {}).length;
    prompt_sections += Object.keys(namespace.prompt_sections || {}).length;
    datatypes += Object.keys(namespace.datatypes || {}).length;
  }

  return {
    rulebooks,
    rules,
    prompt_sections,
    datatypes,
  };
}
