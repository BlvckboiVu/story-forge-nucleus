
import { EditorTheme } from '@/types/theme';

export const loadThemeFromStorage = (storageKey: string): string | null => {
  return localStorage.getItem(storageKey);
};

export const saveThemeToStorage = (storageKey: string, themeId: string): void => {
  localStorage.setItem(storageKey, themeId);
};

export const loadCustomThemesFromStorage = (storageKey: string): EditorTheme[] => {
  const savedCustomThemes = localStorage.getItem(`${storageKey}-custom`);
  if (savedCustomThemes) {
    try {
      return JSON.parse(savedCustomThemes);
    } catch (error) {
      console.error('Failed to load custom themes:', error);
    }
  }
  return [];
};

export const saveCustomThemesToStorage = (storageKey: string, themes: EditorTheme[]): void => {
  localStorage.setItem(`${storageKey}-custom`, JSON.stringify(themes));
};
