
import { useState, useCallback, useEffect, useRef } from 'react';
import { validateEditorContent } from '@/utils/editorValidation';
import { useToast } from './use-toast';

interface UseEditorContentProps {
  initialContent: string;
  onContentChange?: (content: string) => void;
  onWordCountChange?: (count: number) => void;
  validateOnChange?: boolean;
  maxLength?: number;
}

interface ContentState {
  content: string;
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  hasUnsavedChanges: boolean;
  lastValidContent: string;
}

export const useEditorContent = ({
  initialContent,
  onContentChange,
  onWordCountChange,
  validateOnChange = true,
  maxLength = 5000000
}: UseEditorContentProps) => {
  const { toast } = useToast();
  const lastValidationRef = useRef<number>(0);
  
  const [state, setState] = useState<ContentState>({
    content: initialContent,
    isValid: true,
    validationErrors: [],
    validationWarnings: [],
    hasUnsavedChanges: false,
    lastValidContent: initialContent
  });

  const calculateWordCount = useCallback((text: string): number => {
    if (!text) return 0;
    const plainText = text.replace(/<[^>]*>/g, ' ');
    return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  const validateContent = useCallback((content: string) => {
    if (!validateOnChange) return { isValid: true, errors: [], warnings: [] };
    
    const validation = validateEditorContent(content, { 
      maxContentLength: maxLength,
      maxWordCount: 100000,
      maxCharactersPerLine: 1000,
      allowedTags: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'div', 'span'
      ],
      allowedAttributes: ['class', 'style', 'data-*']
    });

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
      sanitizedContent: validation.sanitizedContent
    };
  }, [validateOnChange, maxLength]);

  const handleChange = useCallback((value: string) => {
    const now = Date.now();
    
    // Throttle validation for performance
    if (now - lastValidationRef.current < 500) {
      setState(prev => ({
        ...prev,
        content: value,
        hasUnsavedChanges: true
      }));
      
      if (onContentChange) {
        onContentChange(value);
      }
      return;
    }

    lastValidationRef.current = now;

    try {
      const validation = validateContent(value);
      const wordCount = calculateWordCount(value);
      
      setState(prev => ({
        ...prev,
        content: validation.sanitizedContent || value,
        isValid: validation.isValid,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
        hasUnsavedChanges: true,
        lastValidContent: validation.isValid ? (validation.sanitizedContent || value) : prev.lastValidContent
      }));

      // Show validation warnings
      if (validation.warnings.length > 0 && validateOnChange) {
        toast({
          title: "Content Warning",
          description: validation.warnings[0],
          variant: "default",
          duration: 3000,
        });
      }

      // Show validation errors
      if (validation.errors.length > 0 && validateOnChange) {
        toast({
          title: "Content Error",
          description: validation.errors[0],
          variant: "destructive",
          duration: 5000,
        });
      }
      
      if (onContentChange) {
        onContentChange(validation.sanitizedContent || value);
      }
      
      if (onWordCountChange) {
        onWordCountChange(wordCount);
      }
    } catch (error) {
      console.error('Content validation failed:', error);
      
      setState(prev => ({
        ...prev,
        content: value,
        isValid: false,
        validationErrors: ['Content validation failed'],
        validationWarnings: [],
        hasUnsavedChanges: true
      }));
    }
  }, [calculateWordCount, onContentChange, onWordCountChange, validateContent, validateOnChange, toast]);

  const setHasUnsavedChanges = useCallback((value: boolean) => {
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: value
    }));
  }, []);

  const resetToLastValid = useCallback(() => {
    setState(prev => ({
      ...prev,
      content: prev.lastValidContent,
      isValid: true,
      validationErrors: [],
      validationWarnings: []
    }));
    
    if (onContentChange) {
      onContentChange(state.lastValidContent);
    }
  }, [state.lastValidContent, onContentChange]);

  useEffect(() => {
    if (initialContent && initialContent !== state.content) {
      const validation = validateContent(initialContent);
      const wordCount = calculateWordCount(initialContent);
      
      setState({
        content: validation.sanitizedContent || initialContent,
        isValid: validation.isValid,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
        hasUnsavedChanges: false,
        lastValidContent: validation.sanitizedContent || initialContent
      });
      
      if (onWordCountChange) {
        onWordCountChange(wordCount);
      }
    }
  }, [initialContent, calculateWordCount, onWordCountChange, validateContent]);

  return {
    content: state.content,
    isValid: state.isValid,
    validationErrors: state.validationErrors,
    validationWarnings: state.validationWarnings,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastValidContent: state.lastValidContent,
    setHasUnsavedChanges,
    handleChange,
    resetToLastValid
  };
};
