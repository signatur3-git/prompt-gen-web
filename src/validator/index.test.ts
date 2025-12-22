/**
 * Validator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { PackageValidator } from './index';
import type { Package, Namespace } from '../models/package';
import { ValidationErrorType, ValidationWarningType } from './types';

// Helper to create minimal valid namespace
function createNamespace(overrides: Partial<Namespace> = {}): Namespace {
  return {
    id: 'test',
    datatypes: {},
    prompt_sections: {},
    separator_sets: {},
    rules: {},
    decisions: [],
    rulebooks: {},
    ...overrides,
  };
}

// Helper to create minimal valid package
function createPackage(overrides: Partial<Package> = {}): Package {
  return {
    id: 'test.package',
    version: '1.0.0',
    metadata: {
      name: 'Test Package',
      authors: [],
    },
    namespaces: {},
    ...overrides,
  };
}

describe('PackageValidator', () => {
  describe('Schema Validation', () => {
    it('should validate package ID format', () => {
      const pkg = createPackage({
        id: 'InvalidID', // Should start with lowercase
        namespaces: { test: createNamespace() },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('Invalid package ID');
    });

    it('should validate version format', () => {
      const pkg = createPackage({
        version: 'invalid', // Should be semver
        namespaces: { test: createNamespace() },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('Invalid version');
    });

    it('should require at least one namespace', () => {
      const pkg = createPackage({
        namespaces: {},
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('at least one namespace');
    });

    it('should validate namespace ID format', () => {
      const pkg = createPackage({
        namespaces: {
          'Invalid-Namespace': createNamespace(),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('Invalid namespace ID');
    });
  });

  describe('Reference Validation', () => {
    it('should detect missing datatype reference', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon',
                references: {
                  color: {
                    target: 'colors', // Doesn't exist
                    min: 1,
                    max: 1,
                  },
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.REFERENCE_NOT_FOUND);
      expect(result.errors[0]?.message).toContain('colors');
    });

    it('should validate cross-namespace references', () => {
      const pkg = createPackage({
        namespaces: {
          base: createNamespace({
            id: 'base',
            datatypes: {
              colors: {
                name: 'Colors',
                values: [{ text: 'red', weight: 1.0, tags: {} }],
              },
            },
          }),
          game: createNamespace({
            id: 'game',
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon',
                references: {
                  color: {
                    target: 'base:colors', // Cross-namespace
                    min: 1,
                    max: 1,
                  },
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBe(0);
    });

    it('should validate cross-package references with dependencies', () => {
      const mainPkg = createPackage({
        id: 'game.package',
        dependencies: [
          { package: 'base.package', version: '^1.0.0' },
        ],
        namespaces: {
          game: createNamespace({
            id: 'game',
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon',
                references: {
                  color: {
                    target: 'base:colors',
                    min: 1,
                    max: 1,
                  },
                },
              },
            },
          }),
        },
      });

      const basePkg = createPackage({
        id: 'base.package',
        namespaces: {
          base: createNamespace({
            id: 'base',
            datatypes: {
              colors: {
                name: 'Colors',
                values: [{ text: 'red', weight: 1.0, tags: {} }],
              },
            },
          }),
        },
      });

      const result = PackageValidator.validateWithDependencies(mainPkg, {
        'base.package': basePkg,
      });

      expect(result.errors.length).toBe(0);
    });

    it('should detect missing cross-package references', () => {
      const mainPkg = createPackage({
        id: 'game.package',
        namespaces: {
          game: createNamespace({
            id: 'game',
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon',
                references: {
                  color: {
                    target: 'base:colors', // Dependency not loaded
                    min: 1,
                    max: 1,
                  },
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validateWithDependencies(mainPkg, {});
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.REFERENCE_NOT_FOUND);
    });
  });

  describe('Template Reference Validation', () => {
    it('should detect undefined template references', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon with {texture} scales',
                references: {
                  color: { target: 'context:color', min: 1, max: 1 },
                  // 'texture' is not defined
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('texture'))).toBe(true);
    });

    it('should warn about unused references', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            datatypes: {
              colors: {
                name: 'Colors',
                values: [{ text: 'red', weight: 1.0, tags: {} }],
              },
            },
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A dragon',
                references: {
                  color: { target: 'colors', min: 1, max: 1 }, // Not used in template
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]?.type).toBe(ValidationWarningType.UNUSED_REFERENCE);
    });

    it('should ignore context references in template validation', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {context.article} dragon',
                references: {}, // No reference needed for context
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Circular Reference Detection', () => {
    it('should detect circular references', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            prompt_sections: {
              scene_a: {
                name: 'Scene A',
                template: 'Scene A with {b}',
                references: {
                  b: { target: 'scene_b', min: 1, max: 1 },
                },
              },
              scene_b: {
                name: 'Scene B',
                template: 'Scene B with {a}',
                references: {
                  a: { target: 'scene_a', min: 1, max: 1 },
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.CIRCULAR_REFERENCE);
    });
  });

  describe('Separator Set Validation', () => {
    it('should detect missing separator set', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            datatypes: {
              colors: {
                name: 'Colors',
                values: [{ text: 'red', weight: 1.0, tags: {} }],
              },
            },
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon',
                references: {
                  color: {
                    target: 'colors',
                    min: 1,
                    max: 3,
                    separator: 'comma_and', // Doesn't exist
                  },
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.SEPARATOR_NOT_FOUND);
    });
  });

  describe('Min/Max Validation', () => {
    it('should detect min > max', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            datatypes: {
              colors: {
                name: 'Colors',
                values: [{ text: 'red', weight: 1.0, tags: {} }],
              },
            },
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon',
                references: {
                  color: {
                    target: 'colors',
                    min: 5,
                    max: 2, // min > max
                  },
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.MIN_MAX_INVALID);
    });
  });

  describe('Unique Constraint Validation', () => {
    it('should detect infeasible unique constraints', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            datatypes: {
              colors: {
                name: 'Colors',
                values: [
                  { text: 'red', weight: 1.0, tags: {} },
                  { text: 'blue', weight: 1.0, tags: {} },
                ],
              },
            },
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon',
                references: {
                  color: {
                    target: 'colors',
                    min: 1,
                    max: 5, // Requesting 5 unique values but only 2 available
                    unique: true,
                  },
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.UNIQUE_CONSTRAINT_INFEASIBLE);
    });
  });

  describe('Best Practices', () => {
    it('should warn about unused datatypes', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            datatypes: {
              colors: {
                name: 'Colors',
                values: [{ text: 'red', weight: 1.0, tags: {} }],
              },
              unused_datatype: {
                name: 'Unused',
                values: [{ text: 'value', weight: 1.0, tags: {} }],
              },
            },
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon',
                references: {
                  color: { target: 'colors', min: 1, max: 1 },
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.type === ValidationWarningType.UNUSED_DATATYPE)).toBe(true);
    });

    it('should warn about large weight sums', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            datatypes: {
              colors: {
                name: 'Colors',
                values: [
                  { text: 'red', weight: 50.0, tags: {} },
                  { text: 'blue', weight: 60.0, tags: {} }, // Total = 110
                ],
              },
            },
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'A {color} dragon',
                references: {
                  color: { target: 'colors', min: 1, max: 1 },
                },
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.type === ValidationWarningType.LARGE_WEIGHT_SUM)).toBe(true);
    });
  });

  describe('Dependency Validation', () => {
    it('should validate dependency metadata', () => {
      const pkg = createPackage({
        dependencies: [
          { package: '', version: '1.0.0' }, // Empty package ID
        ],
        namespaces: {
          test: createNamespace(),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.INVALID_DEPENDENCY);
    });

    it('should validate dependency version format', () => {
      const pkg = createPackage({
        dependencies: [
          { package: 'base.package', version: 'invalid-version' },
        ],
        namespaces: {
          test: createNamespace(),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('version format'))).toBe(true);
    });
  });

  describe('Rulebook Validation', () => {
    it('should require at least one entry point', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            rulebooks: {
              scenes: {
                name: 'Scenes',
                entry_points: [], // Empty
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('at least one entry point');
    });

    it('should validate entry point targets', () => {
      const pkg = createPackage({
        namespaces: {
          test: createNamespace({
            rulebooks: {
              scenes: {
                name: 'Scenes',
                entry_points: [
                  { target: 'non_existent_scene', weight: 1.0 },
                ],
              },
            },
          }),
        },
      });

      const result = PackageValidator.validate(pkg);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.REFERENCE_NOT_FOUND);
    });
  });
});

