import { cn } from '@/lib/utils';
import { Loader2, Save } from 'lucide-react';

interface EditorStatusBarProps {
  wordCount: number;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: Date;
  isMobile?: boolean;
}

export function EditorStatusBar({
  wordCount,
  isDirty,
  isSaving,
  lastSaved,
  isMobile = false,
}: EditorStatusBarProps) {
  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-2 text-sm text-muted-foreground border-t',
      isMobile ? 'flex-col gap-2' : ''
    )}>
      <div className="flex items-center gap-4">
        <span>{wordCount} words</span>
        
        {isDirty && (
          <span className="flex items-center gap-1">
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                Unsaved changes
              </>
            )}
          </span>
        )}
      </div>
      
      {lastSaved && (
        <span>
          Last saved {lastSaved.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
} 