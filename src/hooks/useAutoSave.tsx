
import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions {
  content: string;
  hasUnsavedChanges: boolean;
  onSave: (content: string) => Promise<void> | void;
  interval?: number;
  debounceMs?: number;
}

/**
 * Custom hook for automatic saving functionality with debouncing
 * Provides both interval-based and debounced auto-save mechanisms
 * @param options - Configuration object for auto-save behavior
 * @returns Object with save control functions
 */
export const useAutoSave = ({ 
  content, 
  hasUnsavedChanges, 
  onSave, 
  interval = 30000,
  debounceMs = 2000
}: UseAutoSaveOptions) => {
  const { toast } = useToast();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedContentRef = useRef<string>(content);
  const isSavingRef = useRef<boolean>(false);

  /**
   * Performs automatic save operation with error handling
   * Prevents duplicate saves and validates content changes
   */
  const autoSave = useCallback(async () => {
    if (isSavingRef.current || !hasUnsavedChanges || !content.trim()) {
      return;
    }

    // Don't save if content hasn't actually changed
    if (content === lastSavedContentRef.current) {
      return;
    }

    isSavingRef.current = true;
    
    try {
      await onSave(content);
      lastSavedContentRef.current = content;
      
      toast({
        title: "Auto-saved",
        description: "Your draft has been automatically saved",
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: "Failed to save your draft. Please save manually.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [content, hasUnsavedChanges, onSave, toast]);

  // Debounced auto-save - triggers after user stops typing
  useEffect(() => {
    if (hasUnsavedChanges && content !== lastSavedContentRef.current) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, debounceMs);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [content, hasUnsavedChanges, autoSave, debounceMs]);

  // Interval-based auto-save - backup mechanism
  useEffect(() => {
    if (hasUnsavedChanges) {
      autoSaveTimeoutRef.current = setTimeout(autoSave, interval);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, autoSave, interval]);

  /**
   * Clears all pending auto-save timers
   */
  const clearAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  /**
   * Forces an immediate save operation bypassing timers
   */
  const forceSave = useCallback(async () => {
    clearAutoSave();
    await autoSave();
  }, [clearAutoSave, autoSave]);

  return { 
    clearAutoSave, 
    forceSave,
    isSaving: isSavingRef.current 
  };
};
