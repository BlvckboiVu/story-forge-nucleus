
import { useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions {
  onSave: (content: string) => Promise<boolean>;
  interval?: number;
  enabled?: boolean;
}

export function useAutoSave({ onSave, interval = 3000, enabled = true }: UseAutoSaveOptions) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<number>(0);
  const pendingContentRef = useRef<string>('');
  const isSavingRef = useRef<boolean>(false);

  const scheduleAutoSave = useCallback((content: string) => {
    if (!enabled || isSavingRef.current) return;

    pendingContentRef.current = content;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      const now = Date.now();
      if (now - lastSaveRef.current < 1000) return; // Prevent rapid saves

      isSavingRef.current = true;
      lastSaveRef.current = now;

      try {
        const success = await onSave(pendingContentRef.current);
        if (!success) {
          toast({
            title: 'Auto-save failed',
            description: 'Your changes could not be saved automatically',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        isSavingRef.current = false;
      }
    }, interval);
  }, [enabled, interval, onSave, toast]);

  const saveNow = useCallback(async (content?: string) => {
    const contentToSave = content || pendingContentRef.current;
    if (!contentToSave.trim() || isSavingRef.current) return false;

    isSavingRef.current = true;
    
    try {
      const success = await onSave(contentToSave);
      lastSaveRef.current = Date.now();
      return success;
    } catch (error) {
      console.error('Manual save error:', error);
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    scheduleAutoSave,
    saveNow,
    isSaving: isSavingRef.current,
  };
}
