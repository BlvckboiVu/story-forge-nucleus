
import { useEffect } from 'react';

interface MarkdownShortcutsProps {
  editor: any;
  onFormatClick: (format: string, value?: any) => void;
}

export const MarkdownShortcuts = ({ editor, onFormatClick }: MarkdownShortcutsProps) => {
  useEffect(() => {
    if (!editor) return;

    const handleTextChange = (delta: any, oldDelta: any, source: string) => {
      if (source !== 'user') return;

      const selection = editor.getSelection();
      if (!selection) return;

      // Get the text around the cursor
      const text = editor.getText(Math.max(0, selection.index - 20), 20);
      const cursorPos = Math.min(20, selection.index);

      // Check for markdown patterns
      const patterns = [
        {
          regex: /\*\*(.+?)\*\*$/,
          format: 'bold',
          replacement: (match: string, content: string) => content
        },
        {
          regex: /\*(.+?)\*$/,
          format: 'italic',
          replacement: (match: string, content: string) => content
        },
        {
          regex: /`(.+?)`$/,
          format: 'code',
          replacement: (match: string, content: string) => content
        },
        {
          regex: /^(#{1,3})\s(.+)$/,
          format: 'header',
          replacement: (match: string, hashes: string, content: string) => {
            onFormatClick('header', hashes.length.toString());
            return content;
          }
        }
      ];

      const textToCheck = text.substring(0, cursorPos);
      
      for (const pattern of patterns) {
        const match = textToCheck.match(pattern.regex);
        if (match) {
          const startIndex = selection.index - match[0].length;
          const endIndex = selection.index;
          
          // Replace the markdown syntax with formatted text
          editor.deleteText(startIndex, match[0].length);
          
          const replacement = pattern.replacement(match[0], match[1], match[2]);
          editor.insertText(startIndex, replacement);
          
          // Apply formatting
          if (pattern.format === 'header') {
            // Header formatting is handled in the replacement function
          } else {
            editor.setSelection(startIndex, replacement.length);
            onFormatClick(pattern.format);
            editor.setSelection(startIndex + replacement.length, 0);
          }
          
          break;
        }
      }
    };

    editor.on('text-change', handleTextChange);

    return () => {
      editor.off('text-change', handleTextChange);
    };
  }, [editor, onFormatClick]);

  return null; // This component doesn't render anything
};
