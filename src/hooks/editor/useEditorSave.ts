
import { useCallback } from 'react';
import { Draft } from '@/lib/db';
import { createVersion } from '@/lib/versioning';
import { useToast } from '@/hooks/use-toast';

interface UseEditorSaveProps {
  draft?: Draft;
  onSave?: (content: string) => Promise<void>;
  selectedFont: string;
  viewMode: string;
  wordCount: number;
}

export function useEditorSave({
  draft,
  onSave,
  selectedFont,
  viewMode,
  wordCount,
}: UseEditorSaveProps) {
  const { toast } = useToast();

  const saveContent = useCallback(async (content: string) => {
    if (!content) return;
    
    try {
      if (onSave) {
        await onSave(content);
      }
      
      if (draft) {
        await createVersion(
          draft.id,
          content,
          wordCount,
          {
            font: selectedFont,
            viewMode,
          }
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [onSave, draft, wordCount, selectedFont, viewMode, toast]);

  return { saveContent };
}
