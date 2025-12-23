// Basic tests for RenderingEngineV2
import { describe, it, expect } from 'vitest';
import { RenderingEngineV2 } from './rendering-v2';
import type { Package } from '../models/package';

describe('RenderingEngineV2', () => {
  const createSimplePackage = (): Package => ({
    id: 'test.pkg',
    version: '1.0.0',
    metadata: {
      name: 'Test Package',
      authors: ['Test'],
    },
    namespaces: {
      'test.ns': {
        id: 'test.ns',
        datatypes: {
          colors: {
            name: 'colors',
            values: [
              { text: 'red', tags: { article: 'a' } },
              { text: 'blue', tags: { article: 'a' } },
              { text: 'green', tags: { article: 'a' } },
            ],
          },
        },
        prompt_sections: {
          simple: {
            name: 'simple',
            template: 'A {color} sky',
            references: {
              color: { target: 'test.ns:colors' },
            },
          },
        },
        separator_sets: {},
        rules: {},
        decisions: [],
        rulebooks: {
          test_book: {
            name: 'Test Book',
            entry_points: [{ prompt_section: 'test.ns:simple', weight: 1.0 }],
          },
        },
      },
    },
  });

  it('should render a simple promptsection', async () => {
    const pkg = createSimplePackage();
    const engine = new RenderingEngineV2(pkg, 12345);

    const result = await engine.render('test.ns:simple');

    expect(result).toBeDefined();
    expect(result.text).toMatch(/^A (red|blue|green) sky$/);
    expect(result.seed).toBe(12345);
  });

  it('should render from a rulebook', async () => {
    const pkg = createSimplePackage();
    const engine = new RenderingEngineV2(pkg, 12345);

    const result = await engine.renderRulebook('test.ns', 'test_book');

    expect(result).toBeDefined();
    expect(result.text).toMatch(/^A (red|blue|green) sky$/);
  });

  it('should use the same seed for deterministic results', async () => {
    const pkg = createSimplePackage();

    const engine1 = new RenderingEngineV2(pkg, 999);
    const result1 = await engine1.render('test.ns:simple');

    const engine2 = new RenderingEngineV2(pkg, 999);
    const result2 = await engine2.render('test.ns:simple');

    expect(result1.text).toBe(result2.text);
  });
});
