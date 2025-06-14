
export interface EditorTheme {
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

export interface UseEditorThemeOptions {
  defaultThemeId?: string;
  storageKey?: string;
  onThemeChange?: (theme: EditorTheme) => void;
}
