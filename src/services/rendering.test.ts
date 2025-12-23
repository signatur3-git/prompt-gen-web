// Test file for rendering service
import { describe, it, expect } from 'vitest';
import { RenderingService } from './rendering';
import type { Package } from '../models/package';

describe('RenderingService', () => {
  const service = new RenderingService();

  describe('Phase-based rendering with context references', () => {
    it('should handle context references set by rules', async () => {
      const pkg: Package = {
        id: 'test-pkg',
        version: '1.0.0',

        metadata: { name: 'Test', authors: ['Test'] },
        namespaces: {
          test: {
            id: 'test',
            datatypes: {
              creatures: {
                name: 'Creatures',
                values: [
                  { text: 'dragon', weight: 1.0, tags: { article: 'a' } },
                  { text: 'elf', weight: 1.0, tags: { article: 'an' } },
                  { text: 'unicorn', weight: 1.0, tags: { article: 'a' } },
                ],
              },
            },
            prompt_sections: {
              scene: {
                name: 'Scene',
                template: 'There is {context.article} {creature} in the forest.',
                references: {
                  creature: { target: 'creatures', min: 1, max: 1 },
                  'context.article': { target: 'context:article', min: 1, max: 1 },
                },
              },
            },
            rules: {
              set_article: {
                when: 'creature',
                set: 'article',
                value: 'ref:creature.tags.article',
              },
            },
            separator_sets: {},
            rulebooks: {},
            decisions: [],
          },
        },
      };

      const result = await service.render(pkg, 'test', 'scene', 12345);

      // Should contain "a dragon", "an elf", or "a unicorn" with correct article
      expect(result.text).toMatch(/There is (a dragon|an elf|a unicorn) in the forest\./);

      // Verify the article matches the creature
      if (result.text.includes('dragon')) {
        expect(result.text).toContain('a dragon');
      } else if (result.text.includes('elf')) {
        expect(result.text).toContain('an elf');
      } else if (result.text.includes('unicorn')) {
        expect(result.text).toContain('a unicorn');
      }
    });

    it('should handle multiple context references', async () => {
      const pkg: Package = {
        id: 'test-pkg',
        version: '1.0.0',

        metadata: { name: 'Test', authors: ['Test'] },
        namespaces: {
          test: {
            id: 'test',
            datatypes: {
              colors: {
                name: 'Colors',
                values: [
                  { text: 'red', weight: 1.0, tags: { brightness: 'bright', mood: 'warm' } },
                  { text: 'blue', weight: 1.0, tags: { brightness: 'cool', mood: 'calm' } },
                ],
              },
            },
            prompt_sections: {
              description: {
                name: 'Description',
                template: 'A {context.brightness} {color} sky feels {context.mood}.',
                references: {
                  color: { target: 'colors', min: 1, max: 1 },
                  'context.brightness': { target: 'context:brightness', min: 1, max: 1 },
                  'context.mood': { target: 'context:mood', min: 1, max: 1 },
                },
              },
            },
            rules: {
              set_brightness: {
                when: 'color',
                set: 'brightness',
                value: 'ref:color.tags.brightness',
              },
              set_mood: {
                when: 'color',
                set: 'mood',
                value: 'ref:color.tags.mood',
              },
            },
            separator_sets: {},
            rulebooks: {},
            decisions: [],
          },
        },
      };

      const result = await service.render(pkg, 'test', 'description', 54321);

      // Should have proper substitutions
      expect(result.text).toMatch(/A (bright|cool) (red|blue) sky feels (warm|calm)\./);
    });

    it('should throw error if context variable not set', async () => {
      const pkg: Package = {
        id: 'test-pkg',
        version: '1.0.0',

        metadata: { name: 'Test', authors: ['Test'] },
        namespaces: {
          test: {
            id: 'test',
            datatypes: {
              things: {
                name: 'Things',
                values: [{ text: 'item', weight: 1.0, tags: {} }],
              },
            },
            prompt_sections: {
              broken: {
                name: 'Broken',
                template: 'A {context.missing} thing.',
                references: {
                  thing: { target: 'things', min: 1, max: 1 },
                  'context.missing': { target: 'context:missing', min: 1, max: 1 },
                },
              },
            },
            rules: {},
            separator_sets: {},
            rulebooks: {},
            decisions: [],
          },
        },
      };

      await expect(service.render(pkg, 'test', 'broken', 99999)).rejects.toThrow(
        /Context variable 'missing' not found/
      );
    });
  });

  describe('Backward compatibility', () => {
    it('should still work with traditional references', async () => {
      const pkg: Package = {
        id: 'test-pkg',
        version: '1.0.0',

        metadata: { name: 'Test', authors: ['Test'] },
        namespaces: {
          test: {
            id: 'test',
            datatypes: {
              animals: {
                name: 'Animals',
                values: [
                  { text: 'cat', weight: 1.0, tags: {} },
                  { text: 'dog', weight: 1.0, tags: {} },
                ],
              },
            },
            prompt_sections: {
              simple: {
                name: 'Simple',
                template: 'A {animal} is running.',
                references: {
                  animal: { target: 'animals', min: 1, max: 1 },
                },
              },
            },
            rules: {},
            separator_sets: {},
            rulebooks: {},
            decisions: [],
          },
        },
      };

      const result = await service.render(pkg, 'test', 'simple', 12345);
      expect(result.text).toMatch(/A (cat|dog) is running\./);
    });
  });
});
