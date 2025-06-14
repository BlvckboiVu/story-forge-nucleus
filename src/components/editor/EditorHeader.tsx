
// EditorHeader.tsx
// Enhanced header with view options, focus mode, and proper spacing

import React from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, FolderOpen, FilePlus, Save, Maximize2, Minimize2 } from 'lucide-react';
import { StoryBibleDrawer } from '../StoryBibleDrawer';
import { useProjects } from '@/contexts/ProjectContext';
import OutlinePopup from './OutlinePopup';
import { WritingViewOptions } from './WritingViewOptions';

interface EditorHeaderProps {
  currentDraft: { title: string } | null;
  onOpenDraft: () => void;
  onNewDraft: () => void;
  wordCount: number;
  currentPage: number;
  hasUnsavedChanges: boolean;
  loading: boolean;
  onSave: () => void;
  // New props for view options and focus mode
  viewMode?: 'scroll' | 'page';
  onViewModeChange?: (mode: 'scroll' | 'page') => void;
  pageHeight?: number;
  onPageHeightChange?: (height: number) => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
}

const WORD_LIMIT = 50000;

export const EditorHeader = ({
  currentDraft,
  onOpenDraft,
  onNewDraft,
  wordCount,
  currentPage,
  hasUnsavedChanges,
  loading,
  onSave,
  viewMode = 'scroll',
  onViewModeChange = () => {},
  pageHeight = 800,
  onPageHeightChange = () => {},
  isFocusMode = false,
  onToggleFocus = () => {}
}: EditorHeaderProps) => {
  const { currentProject } = useProjects();
  const isNearWordLimit = wordCount > WORD_LIMIT * 0.8;
  const isOverWordLimit = wordCount > WORD_LIMIT;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Project and Draft Title */}
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <div className="flex items-center gap-3 min-w-0">
            <PenTool className="h-5 w-5 text-primary flex-shrink-0" />
            <h1 className="text-lg font-semibold">Story Forge</h1>
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

        {/* Right: View Options, Focus Mode, and Status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* View Options */}
          <WritingViewOptions
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            pageHeight={pageHeight}
            onPageHeightChange={onPageHeightChange}
          />

          {/* Focus Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            className="h-9 px-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            {isFocusMode ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Exit Focus
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Focus Mode
              </>
            )}
          </Button>

          {/* Status Info */}
          <div className="flex items-center gap-4 text-sm border-l border-gray-200 dark:border-gray-700 pl-4">
            <span className={
              isOverWordLimit ? 'text-red-600 dark:text-red-400' :
              isNearWordLimit ? 'text-yellow-600 dark:text-yellow-400' :
              'text-muted-foreground'
            }>
              {wordCount.toLocaleString()} words
            </span>
            <span className="text-muted-foreground">Page {currentPage}</span>
            {hasUnsavedChanges && (
              <span className="text-orange-600 dark:text-orange-400">• Unsaved</span>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={onSave}
            disabled={loading || !hasUnsavedChanges}
            variant="default"
            size="sm"
            className={hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </header>
  );
};
