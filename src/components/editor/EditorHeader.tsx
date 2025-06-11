// EditorHeader.tsx
// Merged header and status bar for the main editor, showing draft title, navigation, actions, and status in a single line

import React from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, FolderOpen, FilePlus, Save } from 'lucide-react';
import { StoryBibleDrawer } from '../StoryBibleDrawer';
import { useProjects } from '@/contexts/ProjectContext';
import OutlinePopup from './OutlinePopup';

/**
 * Props for the merged EditorHeader component
 * @property currentDraft - The current draft object (title only)
 * @property onOpenDraft - Callback to open the draft modal
 * @property onNewDraft - Callback to create a new draft
 * @property wordCount - Current word count
 * @property currentPage - Current page number
 * @property hasUnsavedChanges - Whether there are unsaved changes
 * @property loading - Whether the editor is saving
 * @property onSave - Callback to save the draft
 */
interface EditorHeaderProps {
  currentDraft: { title: string } | null;
  onOpenDraft: () => void;
  onNewDraft: () => void;
  wordCount: number;
  currentPage: number;
  hasUnsavedChanges: boolean;
  loading: boolean;
  onSave: () => void;
}

const WORD_LIMIT = 50000;

/**
 * EditorHeader - Displays the editor's header, navigation, and status bar in a single horizontal row
 */
export const EditorHeader = ({
  currentDraft,
  onOpenDraft,
  onNewDraft,
  wordCount,
  currentPage,
  hasUnsavedChanges,
  loading,
  onSave
}: EditorHeaderProps) => {
  const { currentProject } = useProjects();
  const isNearWordLimit = wordCount > WORD_LIMIT * 0.8;
  const isOverWordLimit = wordCount > WORD_LIMIT;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      {/* Left: Project and Draft Title */}
      <div className="flex items-center gap-6 min-w-0 flex-1">
        <div className="flex items-center gap-3 min-w-0">
          <PenTool className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold truncate">Writer's Studio</h1>
        </div>
        {currentDraft && (
          <div className="text-sm text-muted-foreground truncate">
            Editing: <span className="font-medium text-foreground">{currentDraft.title}</span>
          </div>
        )}
      </div>

      {/* Center: Navigation/Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {currentProject && <StoryBibleDrawer projectId={currentProject.id} />}
        <OutlinePopup />
        <Button onClick={onOpenDraft} variant="outline" size="sm" className="gap-2">
          <FolderOpen className="h-4 w-4" /> Open
        </Button>
        <Button onClick={onNewDraft} variant="outline" size="sm" className="gap-2">
          <FilePlus className="h-4 w-4" /> New
        </Button>
      </div>

      {/* Right: Status Bar */}
      <div className="flex items-center gap-4 flex-shrink-0 text-sm">
        <span className={
          isOverWordLimit ? 'text-red-600 dark:text-red-400' :
          isNearWordLimit ? 'text-yellow-600 dark:text-yellow-400' :
          'text-muted-foreground'
        }>
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
        <Button
          onClick={onSave}
          disabled={loading}
          variant="default"
          size="sm"
          className={hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          <Save className="mr-2 h-4 w-4" />
          Save {currentDraft?.title ? `"${currentDraft.title}"` : 'draft'}
        </Button>
      </div>
    </header>
  );
};
