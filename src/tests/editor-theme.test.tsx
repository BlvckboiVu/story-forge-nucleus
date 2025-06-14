
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEditorTheme } from '@/hooks/useEditorTheme';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock DOM methods
Object.defineProperty(document, 'querySelector', {
  value: vi.fn(),
});

Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: vi.fn(),
    },
  },
});

describe('useEditorTheme Hook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with default theme', () => {
    const { result } = renderHook(() => useEditorTheme());

    expect(result.current.currentTheme.id).toBe('default');
    expect(result.current.currentTheme.name).toBe('Default');
    expect(result.current.currentTheme.colors.background).toBe('#ffffff');
  });

  it('loads saved theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    const { result } = renderHook(() => useEditorTheme());

    expect(result.current.currentTheme.id).toBe('dark');
  });

  it('changes theme correctly', () => {
    const { result } = renderHook(() => useEditorTheme());

    act(() => {
      result.current.changeTheme('sepia');
    });

    expect(result.current.currentTheme.id).toBe('sepia');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('editor-theme', 'sepia');
  });

  it('provides all default themes', () => {
    const { result } = renderHook(() => useEditorTheme());

    const themeIds = result.current.allThemes.map(t => t.id);
    expect(themeIds).toContain('default');
    expect(themeIds).toContain('dark');
    expect(themeIds).toContain('sepia');
    expect(themeIds).toContain('focus');
    expect(themeIds).toContain('warm');
    expect(themeIds).toContain('forest');
  });

  it('creates custom theme', () => {
    const { result } = renderHook(() => useEditorTheme());

    const customTheme = {
      name: 'Custom Test',
      colors: {
        background: '#123456',
        text: '#abcdef',
        accent: '#ff0000',
        border: '#00ff00',
        selection: '#0000ff',
      },
    };

    act(() => {
      const newTheme = result.current.createCustomTheme(customTheme);
      expect(newTheme.id).toMatch(/^custom-\d+$/);
      expect(newTheme.name).toBe('Custom Test');
    });

    expect(result.current.customThemes).toHaveLength(1);
  });

  it('deletes custom theme', () => {
    const { result } = renderHook(() => useEditorTheme());

    // First create a custom theme
    let customThemeId: string;
    act(() => {
      const newTheme = result.current.createCustomTheme({
        name: 'Test Theme',
        colors: {
          background: '#000000',
          text: '#ffffff',
          accent: '#ff0000',
          border: '#00ff00',
          selection: '#0000ff',
        },
      });
      customThemeId = newTheme.id;
    });

    expect(result.current.customThemes).toHaveLength(1);

    // Then delete it
    act(() => {
      result.current.deleteCustomTheme(customThemeId);
    });

    expect(result.current.customThemes).toHaveLength(0);
  });

  it('switches to default when deleting current custom theme', () => {
    const { result } = renderHook(() => useEditorTheme());

    // Create and switch to custom theme
    let customThemeId: string;
    act(() => {
      const newTheme = result.current.createCustomTheme({
        name: 'Test Theme',
        colors: {
          background: '#000000',
          text: '#ffffff',
          accent: '#ff0000',
          border: '#00ff00',
          selection: '#0000ff',
        },
      });
      customThemeId = newTheme.id;
      result.current.changeTheme(customThemeId);
    });

    expect(result.current.currentTheme.id).toBe(customThemeId);

    // Delete the current theme
    act(() => {
      result.current.deleteCustomTheme(customThemeId);
    });

    expect(result.current.currentTheme.id).toBe('default');
  });

  it('applies theme with custom storage key', () => {
    const { result } = renderHook(() => 
      useEditorTheme({ storageKey: 'custom-storage-key' })
    );

    act(() => {
      result.current.changeTheme('dark');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('custom-storage-key', 'dark');
  });

  it('calls onThemeChange callback', () => {
    const onThemeChange = vi.fn();
    const { result } = renderHook(() => 
      useEditorTheme({ onThemeChange })
    );

    act(() => {
      result.current.changeTheme('sepia');
    });

    expect(onThemeChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sepia' })
    );
  });
});
