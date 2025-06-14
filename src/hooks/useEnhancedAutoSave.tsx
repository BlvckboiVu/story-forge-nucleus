
import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface UseEnhancedAutoSaveOptions {
  content: string;
  hasUnsavedChanges: boolean;
  onSave: (content: string) => Promise<void> | void;
  interval?: number;
  debounceMs?: number;
  enableAutoSave?: boolean;
  onSaveStateChange?: (isSaving: boolean) => void;
  onErrorStateChange?: (hasError: boolean) => void;
}

export const useEnhancedAutoSave = ({ 
  content, 
  hasUnsavedChanges, 
  onSave, 
  interval = 30000,
  debounceMs = 2000,
  enableAutoSave = true,
  onSaveStateChange,
  onErrorStateChange
}: UseEnhancedAutoSaveOptions) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedContentRef = useRef<string>(content);
  const isSavingRef = useRef<boolean>(false);
  const hasErrorRef = useRef<boolean>(false);
  const saveAttemptsRef = useRef<number>(0);
  const lastSaveTimeRef = useRef<Date | null>(null);

  // Enhanced save function with retry logic and error handling
  const performSave = useCallback(async (contentToSave: string, isManual = false) => {
    if (isSavingRef.current || !contentToSave.trim()) {
      return { success: false, error: 'Already saving or empty content' };
    }

    // Don't save if content hasn't actually changed (unless manual)
    if (!isManual && contentToSave === lastSavedContentRef.current) {
      return { success: true, error: null };
    }

    isSavingRef.current = true;
    onSaveStateChange?.(true);
    
    try {
      await onSave(contentToSave);
      lastSavedContentRef.current = contentToSave;
      lastSaveTimeRef.current = new Date();
      saveAttemptsRef.current = 0;
      hasErrorRef.current = false;
      onErrorStateChange?.(false);
      
      if (isManual) {
        toast({
          title: t('saved', 'Saved'),
          description: t('draftSavedSuccessfully', 'Draft saved successfully'),
          duration: 2000,
        });
      } else {
        toast({
          title: t('autoSaved', 'Auto-saved'),
          description: t('draftAutoSavedSuccessfully', 'Draft auto-saved successfully'),
          duration: 1500,
        });
      }
      
      return { success: true, error: null };
    } catch (error) {
      saveAttemptsRef.current++;
      hasErrorRef.current = true;
      onErrorStateChange?.(true);
      
      const errorMessage = error instanceof Error ? error.message : t('unknownError', 'Unknown error');
      
      console.error('Save failed:', error);
      toast({
        title: isManual ? t('saveFailedTitle', 'Save Failed') : t('autoSaveFailedTitle', 'Auto-save Failed'),
        description: `${t('saveFailedDescription', 'Failed to save')}: ${errorMessage}`,
        variant: "destructive",
        duration: 4000,
      });
      
      // Retry logic for auto-save
      if (!isManual && saveAttemptsRef.current < 3) {
        setTimeout(() => {
          if (hasUnsavedChanges) {
            performSave(contentToSave, false);
          }
        }, Math.pow(2, saveAttemptsRef.current) * 1000); // Exponential backoff
      }
      
      return { success: false, error: errorMessage };
    } finally {
      isSavingRef.current = false;
      onSaveStateChange?.(false);
    }
  }, [onSave, hasUnsavedChanges, onSaveStateChange, onErrorStateChange, toast, t]);

  // Debounced auto-save - triggers after user stops typing
  useEffect(() => {
    if (!enableAutoSave) return;
    
    if (hasUnsavedChanges && content !== lastSavedContentRef.current) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        performSave(content, false);
      }, debounceMs);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [content, hasUnsavedChanges, enableAutoSave, performSave, debounceMs]);

  // Interval-based auto-save - backup mechanism
  useEffect(() => {
    if (!enableAutoSave) return;
    
    if (hasUnsavedChanges && !hasErrorRef.current) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        performSave(content, false);
      }, interval);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, enableAutoSave, performSave, interval, content]);

  // Clear all pending saves
  const clearAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, []);

  // Force immediate save
  const forceSave = useCallback(async () => {
    clearAutoSave();
    return await performSave(content, true);
  }, [clearAutoSave, performSave, content]);

  // Get save status info
  const getSaveStatus = useCallback(() => ({
    isSaving: isSavingRef.current,
    hasError: hasErrorRef.current,
    lastSaveTime: lastSaveTimeRef.current,
    saveAttempts: saveAttemptsRef.current,
    hasUnsavedChanges: content !== lastSavedContentRef.current,
  }), [content]);

  return { 
    clearAutoSave, 
    forceSave,
    getSaveStatus,
    isSaving: isSavingRef.current,
    hasError: hasErrorRef.current,
    lastSaveTime: lastSaveTimeRef.current,
  };
};
