
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

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 lg:px-6 py-3 lg:py-4">
      <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
        {/* Left: Project and Draft Title */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0 flex-1">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            <PenTool className="h-4 w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0" />
            <h1 className="text-base lg:text-lg font-semibold hidden sm:block">Story Forge</h1>
          </div>
          {currentDraft && (
            <div className="text-xs sm:text-sm text-muted-foreground truncate">
              <span className="hidden md:inline">Editing: </span>
              <span className="font-medium text-foreground">{currentDraft.title}</span>
            </div>
          )}
        </div>

        {/* Center: Navigation/Actions - Hidden on mobile, selective on tablet */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {currentProject && <StoryBibleDrawer projectId={currentProject.id} />}
          <OutlinePopup />
          <Button onClick={onOpenDraft} variant="outline" size="sm" className="gap-2 hidden lg:flex">
            <FolderOpen className="h-4 w-4" /> 
            <span className="hidden xl:inline">Open</span>
          </Button>
          <Button onClick={onNewDraft} variant="outline" size="sm" className="gap-2 hidden lg:flex">
            <FilePlus className="h-4 w-4" /> 
            <span className="hidden xl:inline">New</span>
          </Button>
        </div>

        {/* Right: View Options, Focus Mode, and Save */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
          {/* View Options - Hidden on mobile */}
          <div className="hidden lg:block">
            <WritingViewOptions
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              pageHeight={pageHeight}
              onPageHeightChange={onPageHeightChange}
            />
          </div>

          {/* Focus Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            className="h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            {isFocusMode ? (
              <>
                <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit Focus</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Focus Mode</span>
              </>
            )}
          </Button>

          {/* Status Info - Only unsaved indicator, responsive */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            {hasUnsavedChanges && (
              <span className="text-orange-600 dark:text-orange-400 text-xs">
                <span className="hidden sm:inline">• Unsaved</span>
                <span className="sm:hidden">•</span>
              </span>
            )}
          </div>

          {/* Save Button - Icon only */}
          <Button
            onClick={onSave}
            disabled={loading || !hasUnsavedChanges}
            variant="default"
            size="sm"
            className={`h-8 w-8 sm:h-9 sm:w-9 p-0 ${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            title="Save"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
