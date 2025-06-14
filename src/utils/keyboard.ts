
type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
};

/**
 * Creates a keyboard event handler that matches shortcuts and executes their actions
 * @param shortcuts - Array of keyboard shortcut configurations
 * @returns Event handler function for keyboard events
 */
export function createKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  return (e: KeyboardEvent) => {
    // Find matching shortcut based on key combination
    const shortcut = shortcuts.find(
      (s) =>
        s.key === e.key &&
        s.ctrlKey === e.ctrlKey &&
        s.shiftKey === e.shiftKey &&
        s.altKey === e.altKey &&
        s.metaKey === e.metaKey
    );
    
    // Execute action if shortcut matches
    if (shortcut) {
      e.preventDefault();
      shortcut.action();
    }
  };
}

/**
 * Predefined keyboard shortcuts for text editor functionality
 * Includes common shortcuts like save, bold, italic, undo, etc.
 */
export const EDITOR_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 's',
    ctrlKey: true,
    action: () => document.execCommand('save'),
  },
  {
    key: 'b',
    ctrlKey: true,
    action: () => document.execCommand('bold'),
  },
  {
    key: 'i',
    ctrlKey: true,
    action: () => document.execCommand('italic'),
  },
  {
    key: 'u',
    ctrlKey: true,
    action: () => document.execCommand('underline'),
  },
  {
    key: 'z',
    ctrlKey: true,
    action: () => document.execCommand('undo'),
  },
  {
    key: 'y',
    ctrlKey: true,
    action: () => document.execCommand('redo'),
  },
  {
    key: 'a',
    ctrlKey: true,
    action: () => document.execCommand('selectAll'),
  },
]; 
