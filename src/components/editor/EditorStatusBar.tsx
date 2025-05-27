
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Save } from 'lucide-react';
import { Draft } from '@/lib/db';

interface EditorStatusBarProps {
  wordCount: number;
  currentPage: number;
  hasUnsavedChanges: boolean;
  loading: boolean;
  draft?: Draft | null;
  onSave: () => void;
}

const WORD_LIMIT = 50000;

export const EditorStatusBar = ({ 
  wordCount, 
  currentPage, 
  hasUnsavedChanges, 
  loading, 
  draft, 
  onSave 
}: EditorStatusBarProps) => {
  const isNearWordLimit = wordCount > WORD_LIMIT * 0.8;
  const isOverWordLimit = wordCount > WORD_LIMIT;

  return (
    <div className="flex items-center justify-between mt-4 px-2">
      <div className="text-sm">
        <span className={`${isOverWordLimit ? 'text-red-600 dark:text-red-400' : isNearWordLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
          {wordCount.toLocaleString()} words
        </span>
        {isOverWordLimit && (
          <span className="text-red-600 dark:text-red-400 ml-2">
            (Limit: {WORD_LIMIT.toLocaleString()})
          </span>
        )}
        <span className="text-muted-foreground ml-2">| Page {currentPage}</span>
        {hasUnsavedChanges && (
          <span className="text-orange-600 dark:text-orange-400 ml-2">• Unsaved changes</span>
        )}
      </div>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={onSave}
            disabled={loading}
            variant="default"
            className={hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            <Save className="mr-2 h-4 w-4" />
            Save {draft?.title ? `"${draft.title}"` : 'draft'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save your current draft (Ctrl+S)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
