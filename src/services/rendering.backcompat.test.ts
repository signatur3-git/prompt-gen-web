// Test backwards compatibility for entry point field names
import { describe, it, expect } from 'vitest';
import { RenderingService } from './rendering';
import type { Package } from '../models/package';

describe('RenderingService - Backwards Compatibility', () => {
  const renderingService = new RenderingService();

  const createTestPackage = (entryPointField: 'target' | 'prompt_section'): Package => ({
    id: 'test.package',
    version: '1.0.0',
    metadata: {
      name: 'Test Package',
      authors: ['Test'],
    },
    namespaces: {
      'test.ns': {
        id: 'test.ns',
        datatypes: {
          test_datatype: {
            name: 'test_datatype',
            values: [
              { text: 'value1', tags: {} },
              { text: 'value2', tags: {} },
            ],
          },
        },
        prompt_sections: {
          test_section: {
            name: 'test_section',
            template: 'Test: {value}',
            references: {
              value: {
                target: 'test.ns:test_datatype',
              },
            },
          },
        },
        separator_sets: {},
        rules: {},
        decisions: [],
        rulebooks: {
          test_rulebook: {
            name: 'Test Rulebook',
            entry_points:
              entryPointField === 'target'
                ? [{ target: 'test.ns:test_section', weight: 1.0 }]
                : [{ prompt_section: 'test.ns:test_section', weight: 1.0 } as any],
          },
        },
      },
    },
  });

  it('should render with target field (web app format)', async () => {
    const pkg = createTestPackage('target');
    const result = await renderingService.renderRulebook(pkg, 'test.ns', 'test_rulebook', 12345);

    expect(result).toBeDefined();
    expect(result.text).toContain('Test:');
    expect(result.seed).toBe(12345);
  });

  it('should render with prompt_section field (desktop app format)', async () => {
    const pkg = createTestPackage('prompt_section');
    const result = await renderingService.renderRulebook(pkg, 'test.ns', 'test_rulebook', 12345);

    expect(result).toBeDefined();
    expect(result.text).toContain('Test:');
    expect(result.seed).toBe(12345);
  });

  it('should throw error when neither field is present', async () => {
    const pkg: Package = {
      id: 'test.package',
      version: '1.0.0',
      metadata: {
        name: 'Test Package',
        authors: ['Test'],
      },
      namespaces: {
        'test.ns': {
          id: 'test.ns',
          datatypes: {},
          prompt_sections: {
            test_section: {
              name: 'test_section',
              template: 'Test',
              references: {},
            },
          },
          separator_sets: {},
          rules: {},
          decisions: [],
          rulebooks: {
            test_rulebook: {
              name: 'Test Rulebook',
              entry_points: [{ weight: 1.0 } as any], // Missing both fields
            },
          },
        },
      },
    };

    await expect(
      renderingService.renderRulebook(pkg, 'test.ns', 'test_rulebook', 12345)
    ).rejects.toThrow('has no target defined');
  });

  it('should prefer target field when both are present', async () => {
    const pkg: Package = {
      id: 'test.package',
      version: '1.0.0',
      metadata: {
        name: 'Test Package',
        authors: ['Test'],
      },
      namespaces: {
        'test.ns': {
          id: 'test.ns',
          datatypes: {
            test_datatype: {
              name: 'test_datatype',
              values: [{ text: 'correct', tags: {} }],
            },
          },
          prompt_sections: {
            correct_section: {
              name: 'correct_section',
              template: 'Correct: {value}',
              references: {
                value: { target: 'test.ns:test_datatype' },
              },
            },
            wrong_section: {
              name: 'wrong_section',
              template: 'Wrong',
              references: {},
            },
          },
          separator_sets: {},
          rules: {},
          decisions: [],
          rulebooks: {
            test_rulebook: {
              name: 'Test Rulebook',
              entry_points: [
                {
                  target: 'test.ns:correct_section',
                  prompt_section: 'test.ns:wrong_section', // Should be ignored
                  weight: 1.0,
                } as any,
              ],
            },
          },
        },
      },
    };

    const result = await renderingService.renderRulebook(pkg, 'test.ns', 'test_rulebook', 12345);
    expect(result.text).toContain('Correct:');
    expect(result.text).not.toContain('Wrong');
  });
});
