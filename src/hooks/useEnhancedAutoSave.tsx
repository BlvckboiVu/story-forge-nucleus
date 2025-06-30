import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { validateEditorContent } from '@/utils/editorValidation';

interface AutoSaveOptions {
  content: string;
  hasUnsavedChanges: boolean;
  onSave: (content: string) => void;
  onSaveStateChange?: (saving: boolean) => void;
  interval?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export function useEnhancedAutoSave({
  content,
  hasUnsavedChanges,
  onSave,
  onSaveStateChange,
  interval = 10000, // 10 seconds
  retryAttempts = 3,
  retryDelay = 1000
}: AutoSaveOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const lastErrorRef = useRef<string | null>(null);

  const performSave = useCallback(async (contentToSave: string) => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    onSaveStateChange?.(true);

    try {
      // Validate content before saving
      const validation = validateEditorContent(contentToSave);
      
      if (!validation.isValid) {
        throw new Error(`Content validation failed: ${validation.errors.join(', ')}`);
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast({
          title: "Content Warning",
          description: validation.warnings[0],
          variant: "default",
          duration: 1200,
        });
      }

      // Save with sanitized content
      await onSave(validation.sanitizedContent || contentToSave);
      
      setLastSaveTime(new Date());
      retryCountRef.current = 0;
      lastErrorRef.current = null;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setSaveError(errorMessage);
      
      // Only show toast if error message changes
      if (lastErrorRef.current !== errorMessage) {
        if (retryCountRef.current < retryAttempts) {
          retryCountRef.current++;
          setTimeout(() => {
            performSave(contentToSave);
          }, retryDelay * retryCountRef.current);
          
          toast({
            title: `Save failed (attempt ${retryCountRef.current}/${retryAttempts})`,
            description: "Retrying automatically...",
            variant: "destructive",
            duration: 2000,
          });
        } else {
          toast({
            title: "Save failed",
            description: errorMessage,
            variant: "destructive",
            duration: 2000,
          });
        }
        lastErrorRef.current = errorMessage;
      }
    } finally {
      setIsSaving(false);
      onSaveStateChange?.(false);
    }
  }, [isSaving, onSave, onSaveStateChange, retryAttempts, retryDelay, toast]);

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges || !content.trim()) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave(content);
    }, interval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, hasUnsavedChanges, interval, performSave]);

  const clearAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return {
    isSaving,
    lastSaveTime,
    saveError,
    clearAutoSave,
    manualSave: () => performSave(content)
  };
}
