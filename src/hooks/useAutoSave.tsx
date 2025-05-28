import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions {
  content: string;
  hasUnsavedChanges: boolean;
  onSave: (content: string) => void;
  interval?: number;
}

export const useAutoSave = ({ 
  content, 
  hasUnsavedChanges, 
  onSave, 
  interval = 30000 
}: UseAutoSaveOptions) => {
  const { toast } = useToast();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const autoSave = useCallback(() => {
    if (hasUnsavedChanges && content.trim()) {
      onSave(content);
      toast({
        title: "Auto-saved",
        description: "Your draft has been automatically saved",
        duration: 2000,
      });
    }
  }, [content, hasUnsavedChanges, onSave, toast]);

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

  const clearAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, []);

  return { clearAutoSave };
};
