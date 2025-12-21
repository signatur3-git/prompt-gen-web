// Quick test to verify PreviewView can be imported
import { describe, it, expect } from 'vitest';

describe('PreviewView Module', () => {
  it('should be able to import PreviewView lazily', async () => {
    // This simulates what the router does
    const module = await import('../views/PreviewView.vue');
    expect(module).toBeDefined();
    expect(module.default).toBeDefined();
  });

  it('should be able to import rendering service', async () => {
    const { renderingService } = await import('../services/rendering');
    expect(renderingService).toBeDefined();
    expect(typeof renderingService.render).toBe('function');
    expect(typeof renderingService.renderRulebook).toBe('function');
  });
});

