
import { EditorTheme } from '@/types/theme';

export const applyThemeToEditor = (theme: EditorTheme): void => {
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
};
