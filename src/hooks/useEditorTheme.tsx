
import { useState, useCallback, useEffect } from 'react';
import { EditorTheme, UseEditorThemeOptions } from '@/types/theme';
import { defaultThemes } from '@/data/defaultThemes';
import { loadThemeFromStorage, saveThemeToStorage } from '@/utils/themeStorage';
import { applyThemeToEditor } from '@/utils/themeApplicator';
import { useCustomThemes } from './useCustomThemes';

export const useEditorTheme = ({
  defaultThemeId = 'default',
  storageKey = 'editor-theme',
  onThemeChange,
}: UseEditorThemeOptions = {}) => {
  const [currentTheme, setCurrentTheme] = useState<EditorTheme>(
    defaultThemes.find(t => t.id === defaultThemeId) || defaultThemes[0]
  );

  const { customThemes, createCustomTheme, deleteCustomTheme } = useCustomThemes(storageKey);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = loadThemeFromStorage(storageKey);
    if (savedThemeId) {
      const allThemes = [...defaultThemes, ...customThemes];
      const savedTheme = allThemes.find(t => t.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
  }, [storageKey, customThemes]);

  // Change theme
  const changeTheme = useCallback((themeId: string) => {
    const allThemes = [...defaultThemes, ...customThemes];
    const newTheme = allThemes.find(t => t.id === themeId);
    
    if (newTheme) {
      setCurrentTheme(newTheme);
      saveThemeToStorage(storageKey, themeId);
      applyThemeToEditor(newTheme);
      onThemeChange?.(newTheme);
    }
  }, [customThemes, storageKey, onThemeChange]);

  // Handle custom theme deletion with fallback
  const handleDeleteCustomTheme = useCallback((themeId: string) => {
    deleteCustomTheme(themeId);
    
    // If deleted theme was current, switch to default
    if (currentTheme.id === themeId) {
      changeTheme('default');
    }
  }, [deleteCustomTheme, currentTheme.id, changeTheme]);

  // Get all available themes
  const getAllThemes = useCallback(() => {
    return [...defaultThemes, ...customThemes];
  }, [customThemes]);

  // Apply current theme on mount and when it changes
  useEffect(() => {
    applyThemeToEditor(currentTheme);
  }, [currentTheme]);

  return {
    currentTheme,
    allThemes: getAllThemes(),
    defaultThemes,
    customThemes,
    changeTheme,
    createCustomTheme,
    deleteCustomTheme: handleDeleteCustomTheme,
    applyTheme: applyThemeToEditor,
  };
};
