
import { useState, useCallback, useEffect } from 'react';
import { sanitizeHtml } from '@/utils/security';

interface UseEditorContentProps {
  initialContent: string;
  onContentChange?: (content: string) => void;
  onWordCountChange?: (count: number) => void;
}

export const useEditorContent = ({
  initialContent,
  onContentChange,
  onWordCountChange,
}: UseEditorContentProps) => {
  const [content, setContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const calculateWordCount = useCallback((text: string): number => {
    if (!text) return 0;
    const plainText = text.replace(/<[^>]*>/g, ' ');
    return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  const handleChange = useCallback((value: string) => {
    try {
      const sanitizedValue = sanitizeHtml ? sanitizeHtml(value) : value;
      const wordCount = calculateWordCount(sanitizedValue);
      
      setContent(sanitizedValue);
      setHasUnsavedChanges(true);
      
      if (onContentChange) {
        onContentChange(sanitizedValue);
      }
      
      if (onWordCountChange) {
        onWordCountChange(wordCount);
      }
    } catch (error) {
      console.error('Content change failed:', error);
    }
  }, [calculateWordCount, onContentChange, onWordCountChange]);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      const wordCount = calculateWordCount(initialContent);
      if (onWordCountChange) {
        onWordCountChange(wordCount);
      }
    }
  }, [initialContent, calculateWordCount, onWordCountChange]);

  return {
    content,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleChange,
  };
};
