
import { useState, useCallback } from 'react';

export interface EditorState {
  content: string;
  isDirty: boolean;
  wordCount: number;
  selectedFont: string;
  viewMode: 'normal' | 'focus' | 'page';
}

export function useEditorState(initialContent = '') {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [viewMode, setViewMode] = useState<'normal' | 'focus' | 'page'>('normal');

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsDirty(true);
  }, []);

  const markSaved = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    content,
    setContent: updateContent,
    isDirty,
    markSaved,
    wordCount,
    setWordCount,
    selectedFont,
    setSelectedFont,
    viewMode,
    setViewMode,
  };
}
