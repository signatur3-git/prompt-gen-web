// Utility to fix invalid rulebook entry points in packages

import type { Package } from '../models/package';

/**
 * Validates and inspects rulebook entry points in a package
 * Does NOT modify the package - only reports issues
 */
export function fixInvalidRulebookEntryPoints(pkg: Package): {
  fixed: boolean;
  changes: string[];
} {
  const changes: string[] = [];
  let hasIssues = false;

  for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
    for (const [rbId, rulebook] of Object.entries(namespace.rulebooks || {})) {
      if (!rulebook.entry_points || rulebook.entry_points.length === 0) {
        continue;
      }

      const originalLength = rulebook.entry_points.length;

      // Detailed inspection of each entry point
      rulebook.entry_points.forEach((ep, index) => {
        if (!ep) {
          hasIssues = true;
          changes.push(`${nsId}:${rbId} - Entry point ${index + 1} is null/undefined`);
        } else {
          // Handle both 'target' and 'prompt_section' field names (backwards compatibility)
          const target = ep.target || (ep as any).prompt_section;

          if (!target) {
            hasIssues = true;
            changes.push(
              `${nsId}:${rbId} - Entry point ${index + 1} has no target or prompt_section field. Entry point: ${JSON.stringify(ep)}`
            );
          } else if (target.trim().length === 0) {
            hasIssues = true;
            changes.push(
              `${nsId}:${rbId} - Entry point ${index + 1} has empty target. Entry point: ${JSON.stringify(ep)}`
            );
          } else {
            // Valid entry point - report it
            changes.push(
              `${nsId}:${rbId} - Entry point ${index + 1} is VALID: target="${target}", weight=${ep.weight || 1.0}`
            );
          }
        }
      });

      // Summary for this rulebook
      const validCount = rulebook.entry_points.filter(ep => {
        if (!ep) return false;
        const target = ep.target || (ep as any).prompt_section;
        return target && target.trim().length > 0;
      }).length;

      if (validCount !== originalLength) {
        hasIssues = true;
        changes.push(`SUMMARY ${nsId}:${rbId}: ${validCount}/${originalLength} valid entry points`);
      } else {
        changes.push(`SUMMARY ${nsId}:${rbId}: All ${originalLength} entry points are valid ✓`);
      }
    }
  }

  return { fixed: hasIssues, changes };
}

/**
 * Check if a package has any invalid rulebook entry points
 */
export function hasInvalidRulebookEntryPoints(pkg: Package): boolean {
  for (const namespace of Object.values(pkg.namespaces || {})) {
    for (const rulebook of Object.values(namespace.rulebooks || {})) {
      if (!rulebook.entry_points) continue;

      for (const ep of rulebook.entry_points) {
        // Handle both 'target' and 'prompt_section' field names (backwards compatibility)
        const target = ep?.target || (ep as any)?.prompt_section;
        if (!ep || !target || target.trim().length === 0) {
          return true;
        }
      }
    }
  }
  return false;
}
