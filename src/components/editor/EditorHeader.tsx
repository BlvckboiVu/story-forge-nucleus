
import { Button } from '@/components/ui/button';
import { FilePlus, FolderOpen } from 'lucide-react';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import OutlinePopup from './OutlinePopup';
import { Draft } from '@/lib/db';

interface EditorHeaderProps {
  currentDraft: Draft | null;
  onOpenDraft: () => void;
  onNewDraft: () => void;
}

export const EditorHeader = ({ currentDraft, onOpenDraft, onNewDraft }: EditorHeaderProps) => {
  const formatLastSaved = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className="flex items-center justify-between mb-4 p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {currentDraft ? currentDraft.title : "New Draft"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentDraft 
            ? `Last saved at ${formatLastSaved(new Date(currentDraft.updatedAt))}` 
            : "Not saved yet - create or open a draft to begin"
          }
        </p>
      </div>
      
      <div className="flex items-center space-x-3">
        <DarkModeToggle />
        
        <div className="hidden sm:flex space-x-2">
          <OutlinePopup />
          <Button 
            variant="outline" 
            onClick={onOpenDraft}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Open Draft
          </Button>
          <Button 
            variant="outline" 
            onClick={onNewDraft}
            className="flex items-center gap-2"
          >
            <FilePlus className="h-4 w-4" />
            New Draft
          </Button>
        </div>
      </div>
    </div>
  );
};
