// Test setup file
import { vi } from 'vitest';

// Mock console methods to avoid noise in test output
(globalThis as any).console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

// Mock window.confirm
(globalThis as any).confirm = vi.fn(() => true);

// Mock window.alert
(globalThis as any).alert = vi.fn();
