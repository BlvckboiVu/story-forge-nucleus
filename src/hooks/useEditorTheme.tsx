
import { useState, useCallback, useEffect } from 'react';

interface EditorTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    text: string;
    accent: string;
    border: string;
    selection: string;
  };
  font?: {
    family: string;
    size: string;
    lineHeight: string;
  };
}

const defaultThemes: EditorTheme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      background: '#ffffff',
      text: '#1f2937',
      accent: '#3b82f6',
      border: '#e5e7eb',
      selection: '#dbeafe',
    },
    font: {
      family: 'Inter, sans-serif',
      size: '16px',
      lineHeight: '1.6',
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      background: '#1a1a1a',
      text: '#f9fafb',
      accent: '#60a5fa',
      border: '#374151',
      selection: '#1e3a8a',
    },
    font: {
      family: 'Inter, sans-serif',
      size: '16px',
      lineHeight: '1.6',
    },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    colors: {
      background: '#f4f3e8',
      text: '#5c4b37',
      accent: '#92400e',
      border: '#d6d3d1',
      selection: '#fef3c7',
    },
    font: {
      family: 'Georgia, serif',
      size: '16px',
      lineHeight: '1.7',
    },
  },
  {
    id: 'focus',
    name: 'Focus Blue',
    colors: {
      background: '#f8fafc',
      text: '#1e293b',
      accent: '#0ea5e9',
      border: '#cbd5e1',
      selection: '#e0f2fe',
    },
    font: {
      family: 'Inter, sans-serif',
      size: '16px',
      lineHeight: '1.6',
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    colors: {
      background: '#fef7ed',
      text: '#9a3412',
      accent: '#ea580c',
      border: '#fed7aa',
      selection: '#ffedd5',
    },
    font: {
      family: 'Georgia, serif',
      size: '16px',
      lineHeight: '1.7',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      background: '#f0fdf4',
      text: '#14532d',
      accent: '#16a34a',
      border: '#bbf7d0',
      selection: '#dcfce7',
    },
    font: {
      family: 'Inter, sans-serif',
      size: '16px',
      lineHeight: '1.6',
    },
  },
];

interface UseEditorThemeOptions {
  defaultThemeId?: string;
  storageKey?: string;
  onThemeChange?: (theme: EditorTheme) => void;
}

export const useEditorTheme = ({
  defaultThemeId = 'default',
  storageKey = 'editor-theme',
  onThemeChange,
}: UseEditorThemeOptions = {}) => {
  const [currentTheme, setCurrentTheme] = useState<EditorTheme>(
    defaultThemes.find(t => t.id === defaultThemeId) || defaultThemes[0]
  );
  const [customThemes, setCustomThemes] = useState<EditorTheme[]>([]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem(storageKey);
    if (savedThemeId) {
      const allThemes = [...defaultThemes, ...customThemes];
      const savedTheme = allThemes.find(t => t.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }

    // Load custom themes
    const savedCustomThemes = localStorage.getItem(`${storageKey}-custom`);
    if (savedCustomThemes) {
      try {
        const parsed = JSON.parse(savedCustomThemes);
        setCustomThemes(parsed);
      } catch (error) {
        console.error('Failed to load custom themes:', error);
      }
    }
  }, [storageKey, customThemes]);

  // Apply theme to editor
  const applyTheme = useCallback((theme: EditorTheme) => {
    const editorElement = document.querySelector('.ql-editor') as HTMLElement;
    const toolbarElement = document.querySelector('.ql-toolbar') as HTMLElement;
    
    if (editorElement) {
      editorElement.style.backgroundColor = theme.colors.background;
      editorElement.style.color = theme.colors.text;
      editorElement.style.fontFamily = theme.font?.family || 'Inter, sans-serif';
      editorElement.style.fontSize = theme.font?.size || '16px';
      editorElement.style.lineHeight = theme.font?.lineHeight || '1.6';
    }

    if (toolbarElement) {
      toolbarElement.style.borderColor = theme.colors.border;
    }

    // Apply CSS custom properties for other elements
    const root = document.documentElement;
    root.style.setProperty('--editor-bg', theme.colors.background);
    root.style.setProperty('--editor-text', theme.colors.text);
    root.style.setProperty('--editor-accent', theme.colors.accent);
    root.style.setProperty('--editor-border', theme.colors.border);
    root.style.setProperty('--editor-selection', theme.colors.selection);
  }, []);

  // Change theme
  const changeTheme = useCallback((themeId: string) => {
    const allThemes = [...defaultThemes, ...customThemes];
    const newTheme = allThemes.find(t => t.id === themeId);
    
    if (newTheme) {
      setCurrentTheme(newTheme);
      localStorage.setItem(storageKey, themeId);
      applyTheme(newTheme);
      onThemeChange?.(newTheme);
    }
  }, [customThemes, storageKey, applyTheme, onThemeChange]);

  // Create custom theme
  const createCustomTheme = useCallback((theme: Omit<EditorTheme, 'id'>) => {
    const newTheme: EditorTheme = {
      ...theme,
      id: `custom-${Date.now()}`,
    };

    const updatedCustomThemes = [...customThemes, newTheme];
    setCustomThemes(updatedCustomThemes);
    localStorage.setItem(`${storageKey}-custom`, JSON.stringify(updatedCustomThemes));
    
    return newTheme;
  }, [customThemes, storageKey]);

  // Delete custom theme
  const deleteCustomTheme = useCallback((themeId: string) => {
    const updatedCustomThemes = customThemes.filter(t => t.id !== themeId);
    setCustomThemes(updatedCustomThemes);
    localStorage.setItem(`${storageKey}-custom`, JSON.stringify(updatedCustomThemes));
    
    // If deleted theme was current, switch to default
    if (currentTheme.id === themeId) {
      changeTheme('default');
    }
  }, [customThemes, currentTheme.id, storageKey, changeTheme]);

  // Get all available themes
  const getAllThemes = useCallback(() => {
    return [...defaultThemes, ...customThemes];
  }, [customThemes]);

  // Apply current theme on mount and when it changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  return {
    currentTheme,
    allThemes: getAllThemes(),
    defaultThemes,
    customThemes,
    changeTheme,
    createCustomTheme,
    deleteCustomTheme,
    applyTheme,
  };
};
