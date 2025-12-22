/**
 * Package Validator
 * Ported from rpg-desktop/src-tauri/src/validator/mod.rs
 *
 * Validates package structure, references, and dependencies
 */

import type { Package } from '../models/package';
import type {
  ValidationResult,
} from './types';
import {
  createValidationResult,
  addError,
  addWarning,
  createReferenceNotFoundError,
  createCircularReferenceError,
  createSeparatorNotFoundError,
  createMinMaxInvalidError,
  createUniqueConstraintInfeasibleError,
  createUnusedDatatypeWarning,
  createUnusedSeparatorSetWarning,
  createUnusedReferenceWarning,
  createLargeWeightSumWarning,
  createInvalidDependencyError,
} from './types';

export class PackageValidator {
  /**
   * Validate a package without dependencies
   */
  static validate(pkg: Package): ValidationResult {
    return this.validateWithDependencies(pkg, {});
  }

  /**
   * Validate a package with its dependencies
   * Allows validation of cross-package references
   */
  static validateWithDependencies(
    pkg: Package,
    dependencies: Record<string, Package>
  ): ValidationResult {
    const result = createValidationResult();

    // Schema validation (basic structure checks)
    this.validateSchema(pkg, result);

    // Semantic validation (with dependencies context)
    this.validateSemanticsWithDeps(pkg, dependencies, result);

    // Best practices (warnings)
    this.validateBestPractices(pkg, result);

    return result;
  }

  /**
   * Schema validation - structure and types
   */
  private static validateSchema(pkg: Package, result: ValidationResult): void {
    // Validate package ID format
    if (!pkg.id || !/^[a-z][a-z0-9_.]*$/.test(pkg.id)) {
      addError(result, {
        type: 'INVALID_NAMING' as any,
        message: `Invalid package ID: '${pkg.id}' - must start with lowercase letter and contain only lowercase letters, numbers, dots, and underscores`,
        location: 'package.id',
      });
    }

    // Validate version format
    if (!pkg.version || !/^\d+\.\d+\.\d+/.test(pkg.version)) {
      addError(result, {
        type: 'INVALID_NAMING' as any,
        message: `Invalid version: '${pkg.version}' - must follow semver format (e.g., 1.0.0)`,
        location: 'package.version',
      });
    }

    // Validate namespaces exist
    if (!pkg.namespaces || Object.keys(pkg.namespaces).length === 0) {
      addError(result, {
        type: 'INVALID_NAMING' as any,
        message: 'Package must have at least one namespace',
        location: 'package.namespaces',
      });
    }

    // Validate namespace IDs
    for (const nsId of Object.keys(pkg.namespaces || {})) {
      if (!/^[a-z][a-z0-9_.]*$/.test(nsId)) {
        addError(result, {
          type: 'INVALID_NAMING' as any,
          message: `Invalid namespace ID: '${nsId}' - must start with lowercase letter and contain only lowercase letters, numbers, dots, and underscores`,
          location: `namespaces.${nsId}`,
        });
      }
    }
  }

  /**
   * Semantic validation with dependencies
   */
  private static validateSemanticsWithDeps(
    pkg: Package,
    dependencies: Record<string, Package>,
    result: ValidationResult
  ): void {
    // Validate dependencies first
    this.validateDependencies(pkg, result);

    // Validate all references resolve (with dependencies)
    this.validateReferencesWithDeps(pkg, dependencies, result);

    // Validate that template references are defined
    this.validateTemplateReferences(pkg, result);

    // Check for circular references
    this.validateNoCircularReferences(pkg, result);

    // Validate separator sets exist
    this.validateSeparatorSets(pkg, result);

    // Validate min/max constraints
    this.validateMinMax(pkg, result);

    // Validate unique constraints are feasible
    this.validateUniqueConstraints(pkg, result);

    // Validate rulebooks
    this.validateRulebooks(pkg, dependencies, result);
  }

  /**
   * Validate dependencies metadata
   */
  private static validateDependencies(pkg: Package, result: ValidationResult): void {
    if (!pkg.dependencies) return;

    for (const dep of pkg.dependencies) {
            const packageId = dep.package;

      // Validate package ID exists
      if (!packageId || typeof packageId !== 'string') {
        addError(result, createInvalidDependencyError(
          packageId || '(missing)',
          'package field is required (DEC-0012)'
        ));
        continue;
      }

      // Validate version format
      if (!dep.version || typeof dep.version !== 'string') {
        addError(result, createInvalidDependencyError(
          packageId,
          'version field is required'
        ));
        continue;
      }

      // Check version format (semver-like)
      if (!/^[\^~]?\d+\.\d+\.\d+/.test(dep.version)) {
        addError(result, {
          type: 'INVALID_DEPENDENCY_VERSION' as any,
          message: `Invalid version format: '${dep.version}' in dependency '${packageId}' - expected semver format like 1.0.0, ^1.0.0, or ~1.2.0`,
          location: `dependencies[${packageId}]`,
        });
      }
    }
  }

  /**
   * Validate all references resolve (with dependencies)
   */
  private static validateReferencesWithDeps(
    pkg: Package,
    dependencies: Record<string, Package>,
    result: ValidationResult
  ): void {
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const [psName, promptSection] of Object.entries(namespace.prompt_sections || {})) {
        for (const [refName, reference] of Object.entries(promptSection.references || {})) {
          // Skip invalid references
          if (!reference || typeof reference !== 'object') continue;
          if (!('target' in reference)) continue;

          const target = reference.target;

          // Skip if target is not a string
          if (!target || typeof target !== 'string') continue;

          // Skip context references
          if (target.startsWith('context:')) {
            continue;
          }

          // Parse the target (format: "namespace:name" or "name")
          const parts = target.split(':');
          const targetNs = parts.length === 2 ? parts[0]! : nsId;
          const targetName = parts.length === 2 ? parts[1]! : parts[0]!;

          // Check if target exists (in package or dependencies)
          if (!this.referenceExistsWithDeps(pkg, dependencies, targetNs, targetName)) {
            const suggestion = this.findSimilarNameWithDeps(pkg, dependencies, targetNs, targetName);
            addError(result, createReferenceNotFoundError(
              target,
              `${nsId}:${psName}.references.${refName}`,
              suggestion
            ));
          }
        }
      }
    }
  }

  /**
   * Check if a reference exists in package or dependencies
   */
  private static referenceExistsWithDeps(
    pkg: Package,
    dependencies: Record<string, Package>,
    targetNs: string,
    targetName: string
  ): boolean {
    // Check in main package first
    if (this.referenceExists(pkg, targetNs, targetName)) {
      return true;
    }

    // Check in dependencies
    for (const depPkg of Object.values(dependencies)) {
      if (this.referenceExists(depPkg, targetNs, targetName)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if reference exists in a single package
   */
  private static referenceExists(pkg: Package, targetNs: string, targetName: string): boolean {
    const namespace = pkg.namespaces?.[targetNs];
    if (!namespace) return false;

    return !!(namespace.datatypes?.[targetName] || namespace.prompt_sections?.[targetName]);
  }

  /**
   * Find similar names for helpful suggestions
   */
  private static findSimilarNameWithDeps(
    pkg: Package,
    dependencies: Record<string, Package>,
    targetNs: string,
    targetName: string
  ): string | undefined {
    // Try main package first
    const mainSuggestion = this.findSimilarName(pkg, targetNs, targetName);
    if (mainSuggestion) return mainSuggestion;

    // Try dependencies
    for (const [depId, depPkg] of Object.entries(dependencies)) {
      const depSuggestion = this.findSimilarName(depPkg, targetNs, targetName);
      if (depSuggestion) {
        return `${depSuggestion} (from dependency ${depId})`;
      }
    }

    return undefined;
  }

  /**
   * Find similar name in a single package
   */
  private static findSimilarName(
    pkg: Package,
    namespace: string,
    target: string
  ): string | undefined {
    const ns = pkg.namespaces?.[namespace];
    if (!ns) return undefined;

    // Check datatypes
    for (const dtName of Object.keys(ns.datatypes || {})) {
      if (this.isSimilar(dtName, target)) {
        return `${namespace}:${dtName} (datatype)`;
      }
    }

    // Check prompt sections
    for (const psName of Object.keys(ns.prompt_sections || {})) {
      if (this.isSimilar(psName, target)) {
        return `${namespace}:${psName} (prompt_section)`;
      }
    }

    return undefined;
  }

  /**
   * Simple similarity check
   */
  private static isSimilar(a: string, b: string): boolean {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    // Check if one starts with the other
    if (aLower.startsWith(bLower) || bLower.startsWith(aLower)) {
      return true;
    }

    // Check if one contains the other
    if (aLower.includes(bLower) || bLower.includes(aLower)) {
      return true;
    }

    // Check if they start the same (at least 3 chars)
    if (aLower.length >= 3 && bLower.length >= 3) {
      if (aLower.substring(0, 3) === bLower.substring(0, 3)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Validate template references are defined
   */
  private static validateTemplateReferences(pkg: Package, result: ValidationResult): void {
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const [psName, promptSection] of Object.entries(namespace.prompt_sections || {})) {
        const templateRefs = this.extractTemplateReferences(promptSection.template);

        // Check each reference in template is defined
        for (const refName of templateRefs) {
          if (!promptSection.references?.[refName]) {
            addError(result, createReferenceNotFoundError(
              refName,
              `${nsId}:${psName}`,
              `Add reference definition for '${refName}' in the references section`
            ));
          }
        }

        // Check for unused references (WARNING)
        for (const refName of Object.keys(promptSection.references || {})) {
          if (!templateRefs.includes(refName)) {
            addWarning(result, createUnusedReferenceWarning(refName, `${nsId}:${psName}`));
          }
        }
      }
    }
  }

  /**
   * Extract reference names from template
   */
  private static extractTemplateReferences(template: string): string[] {
    const refs: string[] = [];
    const regex = /\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      const refName = match[1];
      // Skip context references
      if (refName && !refName.startsWith('context.')) {
        refs.push(refName);
      }
    }

    return refs;
  }

  /**
   * Check for circular references
   */
  private static validateNoCircularReferences(pkg: Package, result: ValidationResult): void {
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const psName of Object.keys(namespace.prompt_sections || {})) {
        const fullName = `${nsId}:${psName}`;
        const visited: string[] = [];
        const chain = this.findCircularRef(pkg, fullName, visited);
        if (chain) {
          addError(result, createCircularReferenceError(chain));
        }
      }
    }
  }

  /**
   * Recursively check for circular references
   */
  private static findCircularRef(
    pkg: Package,
    current: string,
    visited: string[]
  ): string[] | null {
    // If we've seen this before, we have a cycle
    if (visited.includes(current)) {
      return [...visited, current];
    }

    // Add to visited
    visited.push(current);

    // Parse current (format: "namespace:name")
    const parts = current.split(':');
    if (parts.length !== 2) return null;

    const nsId = parts[0];
    const psName = parts[1];
    if (!nsId || !psName) return null;
    const namespace = pkg.namespaces?.[nsId];
    const promptSection = namespace?.prompt_sections?.[psName];
    if (!promptSection) return null;

    // Check all references
    for (const reference of Object.values(promptSection.references || {})) {
      // Skip invalid references or context references
      if (!reference || typeof reference !== 'object') continue;
      if (!('target' in reference) || typeof reference.target !== 'string') continue;
      if (reference.target.startsWith('context:')) {
        continue;
      }

      // Parse the target
      const targetParts = reference.target.split(':');
      let targetNs: string;
      let targetName: string;
      if (targetParts.length === 2) {
        targetNs = targetParts[0] || nsId;
        targetName = targetParts[1] || '';
      } else {
        targetNs = nsId;
        targetName = targetParts[0] || '';
      }
      if (!targetNs || !targetName) continue;
      const targetFull = `${targetNs}:${targetName}`;

      // Check if target is a prompt section (only prompt sections can cause cycles)
      const targetNsObj = pkg.namespaces?.[targetNs];
      if (targetNsObj?.prompt_sections?.[targetName]) {
        const chain = this.findCircularRef(pkg, targetFull, [...visited]);
        if (chain) return chain;
      }
    }

    return null;
  }

  /**
   * Validate separator sets exist
   */
  private static validateSeparatorSets(pkg: Package, result: ValidationResult): void {
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const [psName, promptSection] of Object.entries(namespace.prompt_sections || {})) {
        for (const [refName, reference] of Object.entries(promptSection.references || {})) {
          // Skip invalid references
          if (!reference || typeof reference !== 'object') continue;

          if (reference.separator && typeof reference.separator === 'string') {
            const sepParts = reference.separator.split(':');
            const sepNs = sepParts.length === 2 ? sepParts[0]! : nsId;
            const sepName = sepParts.length === 2 ? sepParts[1]! : sepParts[0]!;

            const sepNsObj = pkg.namespaces?.[sepNs];
            if (!sepNsObj?.separator_sets?.[sepName]) {
              addError(result, createSeparatorNotFoundError(
                reference.separator,
                `${nsId}:${psName}.references.${refName}`
              ));
            }
          }
        }
      }
    }
  }

  /**
   * Validate min/max constraints
   */
  private static validateMinMax(pkg: Package, result: ValidationResult): void {
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const [psName, promptSection] of Object.entries(namespace.prompt_sections || {})) {
        for (const [refName, reference] of Object.entries(promptSection.references || {})) {
          const min = reference.min ?? 1;
          const max = reference.max ?? 1;

          if (min > max) {
            addError(result, createMinMaxInvalidError(
              min,
              max,
              `${nsId}:${psName}.references.${refName}`
            ));
          }
        }
      }
    }
  }

  /**
   * Validate unique constraints are feasible
   */
  private static validateUniqueConstraints(pkg: Package, result: ValidationResult): void {
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const [, promptSection] of Object.entries(namespace.prompt_sections || {})) {
        for (const [, reference] of Object.entries(promptSection.references || {})) {
          if (reference.unique) {
            const max = reference.max ?? 1;

            // Find the target datatype
            const targetParts = reference.target.split(':');
            const targetNs = targetParts.length === 2 ? targetParts[0]! : nsId;
            const targetName = targetParts.length === 2 ? targetParts[1]! : targetParts[0]!;

            const targetNsObj = pkg.namespaces?.[targetNs];
            const datatype = targetNsObj?.datatypes?.[targetName];

            if (datatype) {
              const available = datatype.values?.length ?? 0;
              if (max > available) {
                addError(result, createUniqueConstraintInfeasibleError(
                  max,
                  available,
                  `${targetNs}:${targetName}`
                ));
              }
            }
          }
        }
      }
    }
  }

  /**
   * Validate rulebooks
   */
  private static validateRulebooks(
    pkg: Package,
    dependencies: Record<string, Package>,
    result: ValidationResult
  ): void {
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const [rbName, rulebook] of Object.entries(namespace.rulebooks || {})) {
        // Validate entry points
        if (!rulebook.entry_points || rulebook.entry_points.length === 0) {
          addError(result, {
            type: 'INVALID_NAMING' as any,
            message: `Rulebook '${nsId}:${rbName}' must have at least one entry point`,
            location: `${nsId}:${rbName}.entry_points`,
          });
        }

        // Validate each entry point target exists
        for (const entryPoint of rulebook.entry_points || []) {
                    const target = entryPoint.target || (entryPoint as any).prompt_section;

          // Skip if target is undefined or null
          if (!target || typeof target !== 'string') {
            const targetInfo = target === undefined ? 'undefined' :
                              target === null ? 'null' :
                              `type: ${typeof target}, value: ${JSON.stringify(target)}`;
            addError(result, {
              type: 'INVALID_NAMING' as any,
              message: `Entry point in rulebook '${nsId}:${rbName}' has invalid or missing target (found: ${targetInfo}). Use 'target' or 'prompt_section' field.`,
              location: `${nsId}:${rbName}.entry_points`,
            });
            continue;
          }

          const targetParts = target.split(':');
          let targetNs: string;
          let targetName: string;
          if (targetParts.length === 2) {
            targetNs = targetParts[0] || nsId;
            targetName = targetParts[1] || '';
          } else {
            targetNs = nsId;
            targetName = targetParts[0] || '';
          }

          if (!targetNs || !targetName) {
            addError(result, {
              type: 'INVALID_NAMING' as any,
              message: `Invalid entry point target: '${target}'`,
              location: `${nsId}:${rbName}.entry_points`,
            });
            continue;
          }

          if (!this.referenceExistsWithDeps(pkg, dependencies, targetNs, targetName)) {
            const suggestion = this.findSimilarNameWithDeps(pkg, dependencies, targetNs, targetName);
            addError(result, createReferenceNotFoundError(
              target,
              `${nsId}:${rbName}.entry_points`,
              suggestion
            ));
          }
        }
      }
    }
  }

  /**
   * Best practices validation - warnings
   */
  private static validateBestPractices(pkg: Package, result: ValidationResult): void {
    this.checkUnusedComponents(pkg, result);
    this.checkWeightSums(pkg, result);
  }

  /**
   * Check for unused components
   */
  private static checkUnusedComponents(pkg: Package, result: ValidationResult): void {
    const usedDatatypes = new Set<string>();
    const usedSeparatorSets = new Set<string>();

    // Collect all used datatypes and separator sets
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const promptSection of Object.values(namespace.prompt_sections || {})) {
        for (const reference of Object.values(promptSection.references || {})) {
          // Skip invalid references
          if (!reference || typeof reference !== 'object') continue;

          const target = reference.target;
          if (target && typeof target === 'string' && !target.startsWith('context:')) {
            const targetParts = target.split(':');
            const targetFull = targetParts.length === 2 ? target : `${nsId}:${target}`;
            usedDatatypes.add(targetFull);
          }

          if (reference.separator && typeof reference.separator === 'string') {
            const sepParts = reference.separator.split(':');
            const sepFull = sepParts.length === 2 ? reference.separator : `${nsId}:${reference.separator}`;
            usedSeparatorSets.add(sepFull);
          }
        }
      }

      // Also check rulebooks
      for (const rulebook of Object.values(namespace.rulebooks || {})) {
        for (const entryPoint of rulebook.entry_points || []) {
          const target = entryPoint.target;

          // Skip if target is undefined or not a string
          if (!target || typeof target !== 'string') continue;

          const targetParts = target.split(':');
          const targetFull = targetParts.length === 2 ? target : `${nsId}:${target}`;
          usedDatatypes.add(targetFull);
        }
      }
    }

    // Check for unused datatypes
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const dtName of Object.keys(namespace.datatypes || {})) {
        const fullName = `${nsId}:${dtName}`;
        if (!usedDatatypes.has(fullName)) {
          addWarning(result, createUnusedDatatypeWarning(dtName, nsId));
        }
      }

      // Check for unused separator sets
      for (const sepName of Object.keys(namespace.separator_sets || {})) {
        const fullName = `${nsId}:${sepName}`;
        if (!usedSeparatorSets.has(fullName)) {
          addWarning(result, createUnusedSeparatorSetWarning(sepName, nsId));
        }
      }
    }
  }

  /**
   * Check weight sums
   */
  private static checkWeightSums(pkg: Package, result: ValidationResult): void {
    for (const [nsId, namespace] of Object.entries(pkg.namespaces || {})) {
      for (const [dtName, datatype] of Object.entries(namespace.datatypes || {})) {
        const sum = datatype.values?.reduce((acc, val) => acc + (val.weight ?? 1.0), 0) ?? 0;
        if (sum > 100) {
          addWarning(result, createLargeWeightSumWarning(`${nsId}:${dtName}`, sum));
        }
      }
    }
  }
}

