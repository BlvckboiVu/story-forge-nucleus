
import React from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, FolderOpen, FilePlus } from 'lucide-react';

interface EditorHeaderProps {
  currentDraft: { title: string } | null;
  onOpenDraft: () => void;
  onNewDraft: () => void;
}

import { StoryBibleDrawer } from '../StoryBibleDrawer';
import { useProjects } from '@/contexts/ProjectContext';
import OutlinePopup from './OutlinePopup';

export const EditorHeader = ({ currentDraft, onOpenDraft, onNewDraft }: EditorHeaderProps) => {
  const { currentProject } = useProjects();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <PenTool className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Writer's Studio</h1>
          </div>
          
          {currentDraft && (
            <div className="text-sm text-muted-foreground">
              Editing: <span className="font-medium text-foreground">{currentDraft.title}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {currentProject && (
            <StoryBibleDrawer projectId={currentProject.id} />
          )}
          
          <OutlinePopup />

          <div className="flex items-center gap-2">
            <Button 
              onClick={onOpenDraft}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              Open
            </Button>
            <Button 
              onClick={onNewDraft}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <FilePlus className="h-4 w-4" />
              New
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
