
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Setup and teardown for all tests
beforeAll(() => {
  // Setup global test environment
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
    writable: true,
  });

  // Mock console.error to avoid noise in tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Test Setup', () => {
  it('should have testing environment configured', () => {
    expect(true).toBe(true);
  });

  it('should have localStorage mocked', () => {
    expect(window.localStorage).toBeDefined();
    expect(typeof window.localStorage.getItem).toBe('function');
  });

  it('should have DOM testing utilities available', () => {
    expect(cleanup).toBeDefined();
  });
});
