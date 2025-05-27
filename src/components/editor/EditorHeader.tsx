
import { Button } from '@/components/ui/button';
import { FilePlus, FolderOpen } from 'lucide-react';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { Draft } from '@/lib/db';

interface EditorHeaderProps {
  currentDraft: Draft | null;
  onOpenDraft: () => void;
  onNewDraft: () => void;
}

export const EditorHeader = ({ currentDraft, onOpenDraft, onNewDraft }: EditorHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h1 className="text-2xl font-bold">
          {currentDraft ? currentDraft.title : "New Draft"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentDraft ? `Last saved ${currentDraft.updatedAt.toLocaleTimeString()}` : "Not saved yet"}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <DarkModeToggle />
        <div className="hidden sm:flex space-x-2">
          <Button variant="outline" onClick={onOpenDraft}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </Button>
          <Button variant="outline" onClick={onNewDraft}>
            <FilePlus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>
    </div>
  );
};
