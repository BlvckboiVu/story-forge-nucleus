
import { useState, useCallback } from 'react';
import { EditorTheme } from '@/types/theme';
import { loadCustomThemesFromStorage, saveCustomThemesToStorage } from '@/utils/themeStorage';

export const useCustomThemes = (storageKey: string) => {
  const [customThemes, setCustomThemes] = useState<EditorTheme[]>(() => 
    loadCustomThemesFromStorage(storageKey)
  );

  const createCustomTheme = useCallback((theme: Omit<EditorTheme, 'id'>) => {
    const newTheme: EditorTheme = {
      ...theme,
      id: `custom-${Date.now()}`,
    };

    const updatedCustomThemes = [...customThemes, newTheme];
    setCustomThemes(updatedCustomThemes);
    saveCustomThemesToStorage(storageKey, updatedCustomThemes);
    
    return newTheme;
  }, [customThemes, storageKey]);

  const deleteCustomTheme = useCallback((themeId: string) => {
    const updatedCustomThemes = customThemes.filter(t => t.id !== themeId);
    setCustomThemes(updatedCustomThemes);
    saveCustomThemesToStorage(storageKey, updatedCustomThemes);
    return updatedCustomThemes;
  }, [customThemes, storageKey]);

  return {
    customThemes,
    createCustomTheme,
    deleteCustomTheme,
  };
};
