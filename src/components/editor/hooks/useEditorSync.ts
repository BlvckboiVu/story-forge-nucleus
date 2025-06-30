import { useEffect } from 'react';
import { useEditorContent } from '@/hooks/useEditorContent';

export function useEditorSync({
  initialContent,
  onContentChange,
  onWordCountChange,
}: {
  initialContent: string;
  onContentChange?: (content: string) => void;
  onWordCountChange?: (count: number) => void;
}) {
  const {
    content,
    isValid,
    validationErrors,
    validationWarnings,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleChange,
    resetToLastValid
  } = useEditorContent({
    initialContent,
    onContentChange,
    onWordCountChange,
    validateOnChange: true,
    maxLength: 5000000
  });

  // Sync content when initialContent changes
  useEffect(() => {
    if (initialContent !== content) {
      handleChange(initialContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent]);

  return {
    content,
    isValid,
    validationErrors,
    validationWarnings,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleChange,
    resetToLastValid
  };
} 