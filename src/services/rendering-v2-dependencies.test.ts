// Tests for cross-package references (dependencies)
// Ensures normalization and dependency resolution work correctly

import { describe, it, expect } from 'vitest';
import { RenderingEngineV2 } from './rendering-v2';
import { normalizePackageReferences } from './packageNormalizer';
import type { Package } from '../models/package';

describe('RenderingEngineV2 - Cross-Package References', () => {
  // Provider package with relative references (will be normalized)
  const createProviderPackage = (): Package => ({
    id: 'test.provider',
    version: '1.0.0',
    metadata: {
      name: 'Test Provider Package',
      authors: ['Test'],
    },
    namespaces: {
      provider: {
        id: 'provider',
        datatypes: {
          colors: {
            name: 'colors',
            values: [
              { text: 'crimson', tags: {} },
              { text: 'azure', tags: {} },
              { text: 'emerald', tags: {} },
            ],
          },
          sizes: {
            name: 'sizes',
            values: [
              { text: 'tiny', tags: {} },
              { text: 'small', tags: {} },
              { text: 'large', tags: {} },
            ],
          },
        },
        prompt_sections: {
          item_name: {
            name: 'item_name',
            template: '{size} {color} item',
            references: {
              size: { target: 'sizes' }, // Relative - will be normalized
              color: { target: 'colors' }, // Relative - will be normalized
            },
          },
        },
        separator_sets: {},
        rules: {},
        decisions: [],
        rulebooks: {},
      },
    },
  });

  // Consumer package with absolute cross-package references
  const createConsumerPackage = (): Package => ({
    id: 'test.consumer',
    version: '1.0.0',
    metadata: {
      name: 'Test Consumer Package',
      authors: ['Test'],
    },
    dependencies: [
      {
        package: 'test.provider', // Use 'package' field (YAML format)
        version: '1.0.0',
      },
    ],
    namespaces: {
      consumer: {
        id: 'consumer',
        datatypes: {
          actions: {
            name: 'actions',
            values: [
              { text: 'wielding', tags: {} },
              { text: 'carrying', tags: {} },
            ],
          },
        },
        prompt_sections: {
          // Test 1: Cross-package datatype reference
          colored_item: {
            name: 'colored_item',
            template: 'a {color} object',
            references: {
              color: { target: 'provider:colors' }, // Absolute cross-package ref
            },
          },
          // Test 2: Cross-package promptsection reference
          action_with_item: {
            name: 'action_with_item',
            template: '{action} {item}',
            references: {
              action: { target: 'actions' }, // Local reference
              item: { target: 'provider:item_name' }, // Cross-package promptsection
            },
          },
          // Test 3: Multiple cross-package datatype references
          full_description: {
            name: 'full_description',
            template: '{size} {color} thing',
            references: {
              size: { target: 'provider:sizes' },
              color: { target: 'provider:colors' },
            },
          },
        },
        separator_sets: {},
        rules: {},
        decisions: [],
        rulebooks: {
          consumer_demo: {
            name: 'consumer_demo',
            entry_points: [
              { prompt_section: 'consumer:colored_item', weight: 1.0 },
            ],
          },
        },
      },
    },
  });

  describe('Normalization', () => {
    it('should normalize relative references in provider package', () => {
      const provider = createProviderPackage();

      // Before normalization
      const namespace = provider.namespaces.provider;
      expect(namespace).toBeDefined();
      const itemNameBefore = namespace?.prompt_sections.item_name;
      expect(itemNameBefore).toBeDefined();
      expect(itemNameBefore?.references.size?.target).toBe('sizes');
      expect(itemNameBefore?.references.color?.target).toBe('colors');

      // Normalize
      normalizePackageReferences(provider);

      // After normalization
      const itemNameAfter = provider.namespaces.provider?.prompt_sections.item_name;
      expect(itemNameAfter).toBeDefined();
      expect(itemNameAfter?.references.size?.target).toBe('provider:sizes');
      expect(itemNameAfter?.references.color?.target).toBe('provider:colors');
    });

    it('should not modify already-absolute references', () => {
      const consumer = createConsumerPackage();

      // Already absolute
      const namespace = consumer.namespaces.consumer;
      expect(namespace).toBeDefined();
      const coloredItem = namespace?.prompt_sections.colored_item;
      expect(coloredItem).toBeDefined();
      expect(coloredItem?.references.color?.target).toBe('provider:colors');

      // Normalize
      normalizePackageReferences(consumer);

      // Should remain absolute
      expect(coloredItem?.references.color?.target).toBe('provider:colors');
    });

    it('should not modify context references', () => {
      const pkg: Package = {
        id: 'test.pkg',
        version: '1.0.0',
        metadata: { name: 'Test', authors: [] },
        namespaces: {
          test: {
            id: 'test',
            datatypes: {},
            prompt_sections: {
              section: {
                name: 'section',
                template: '{ctx}',
                references: {
                  ctx: { target: 'context:article' }, // Context ref
                },
              },
            },
            separator_sets: {},
            rules: {},
            decisions: [],
            rulebooks: {},
          },
        },
      };

      normalizePackageReferences(pkg);

      // Context ref should not be modified
      const section = pkg.namespaces.test?.prompt_sections.section;
      expect(section).toBeDefined();
      expect(section?.references.ctx?.target).toBe('context:article');
    });
  });

  describe('Cross-Package Datatype References', () => {
    it('should resolve cross-package datatype reference', async () => {
      const provider = createProviderPackage();
      const consumer = createConsumerPackage();

      // Normalize provider (simulates loading from YAML)
      normalizePackageReferences(provider);

      const engine = new RenderingEngineV2(consumer, 12345, [provider]);
      const result = await engine.render('consumer:colored_item');

      expect(result).toBeDefined();
      expect(result.text).toMatch(/^a (crimson|azure|emerald) object$/);
    });

    it('should resolve multiple cross-package datatype references', async () => {
      const provider = createProviderPackage();
      const consumer = createConsumerPackage();

      normalizePackageReferences(provider);

      const engine = new RenderingEngineV2(consumer, 12345, [provider]);
      const result = await engine.render('consumer:full_description');

      expect(result).toBeDefined();
      expect(result.text).toMatch(/^(tiny|small|large) (crimson|azure|emerald) thing$/);
    });

    it('should throw error if dependency not provided', async () => {
      const consumer = createConsumerPackage();

      // No dependencies provided
      const engine = new RenderingEngineV2(consumer, 12345, []);

      await expect(engine.render('consumer:colored_item')).rejects.toThrow('Namespace not found: provider');
    });
  });

  describe('Cross-Package PromptSection References', () => {
    it('should resolve cross-package promptsection reference', async () => {
      const provider = createProviderPackage();
      const consumer = createConsumerPackage();

      normalizePackageReferences(provider);

      const engine = new RenderingEngineV2(consumer, 12345, [provider]);
      const result = await engine.render('consumer:action_with_item');

      expect(result).toBeDefined();
      // Should contain action (wielding/carrying) + nested item (size + color + "item")
      expect(result.text).toMatch(/(wielding|carrying) (tiny|small|large) (crimson|azure|emerald) item/);
    });

    it('should handle nested promptsections with normalized references', async () => {
      const provider = createProviderPackage();
      const consumer = createConsumerPackage();

      normalizePackageReferences(provider);

      const engine = new RenderingEngineV2(consumer, 12345, [provider]);

      // This tests: consumer:action_with_item -> provider:item_name -> provider:sizes, provider:colors
      const result = await engine.render('consumer:action_with_item');

      expect(result.text).toBeTruthy();
      // Verify structure is correct (action + size + color + "item")
      const words = result.text.split(' ');
      expect(words.length).toBe(4); // e.g., "wielding tiny crimson item"
      expect(['wielding', 'carrying']).toContain(words[0]);
      expect(['tiny', 'small', 'large']).toContain(words[1]);
      expect(['crimson', 'azure', 'emerald']).toContain(words[2]);
      expect(words[3]).toBe('item');
    });
  });

  describe('Rulebook with Cross-Package References', () => {
    it('should render from rulebook using cross-package references', async () => {
      const provider = createProviderPackage();
      const consumer = createConsumerPackage();

      normalizePackageReferences(provider);

      const engine = new RenderingEngineV2(consumer, 12345, [provider]);
      const result = await engine.renderRulebook('consumer', 'consumer_demo');

      expect(result).toBeDefined();
      expect(result.text).toMatch(/^a (crimson|azure|emerald) object$/);
    });
  });

  describe('Deterministic Results with Dependencies', () => {
    it('should produce same results with same seed', async () => {
      const provider = createProviderPackage();
      const consumer = createConsumerPackage();

      normalizePackageReferences(provider);

      const engine1 = new RenderingEngineV2(consumer, 999, [provider]);
      const result1 = await engine1.render('consumer:action_with_item');

      const engine2 = new RenderingEngineV2(consumer, 999, [provider]);
      const result2 = await engine2.render('consumer:action_with_item');

      expect(result1.text).toBe(result2.text);
    });
  });

  describe('Error Cases', () => {
    it('should throw clear error for missing namespace in dependencies', async () => {
      const consumer = createConsumerPackage();

      // Provider not included
      const engine = new RenderingEngineV2(consumer, 12345, []);

      await expect(engine.render('consumer:colored_item')).rejects.toThrow('Namespace not found: provider');
    });

    it('should throw clear error for missing datatype in dependency', async () => {
      const provider = createProviderPackage();
      const consumer: Package = {
        id: 'test.consumer',
        version: '1.0.0',
        metadata: { name: 'Test', authors: [] },
        dependencies: [{ package: 'test.provider', version: '1.0.0' }],
        namespaces: {
          consumer: {
            id: 'consumer',
            datatypes: {},
            prompt_sections: {
              invalid: {
                name: 'invalid',
                template: '{missing}',
                references: {
                  missing: { target: 'provider:nonexistent' }, // Doesn't exist
                },
              },
            },
            separator_sets: {},
            rules: {},
            decisions: [],
            rulebooks: {},
          },
        },
      };

      normalizePackageReferences(provider);

      const engine = new RenderingEngineV2(consumer, 12345, [provider]);

      await expect(engine.render('consumer:invalid')).rejects.toThrow('Datatype not found');
    });
  });

  describe('Dependency Field Name Compatibility', () => {
    it('should handle "package" field name (YAML format)', () => {
      const consumer = createConsumerPackage();

      // Uses 'package' field
      expect(consumer.dependencies).toBeDefined();
      expect(consumer.dependencies?.[0]).toHaveProperty('package');
      expect(consumer.dependencies?.[0]?.package).toBe('test.provider');
    });

    it('should handle "package" field name (DEC-0012 canonical)', () => {
      const consumer: Package = {
        ...createConsumerPackage(),
        dependencies: [
          {
            package: 'test.provider', // TypeScript format
            version: '1.0.0',
          },
        ],
      };

      expect(consumer.dependencies).toBeDefined();
      expect(consumer.dependencies?.[0]).toHaveProperty('package');
      expect(consumer.dependencies?.[0]?.package).toBe('test.provider');
    });
  });
});

