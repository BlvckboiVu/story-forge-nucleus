
import React from 'react';
import { Button } from '@/components/ui/button';
import { PenTool, FolderOpen, FilePlus, Save, Maximize2, Minimize2, Menu } from 'lucide-react';
import { StoryBibleDrawer } from '../StoryBibleDrawer';
import { useProjects } from '@/contexts/ProjectContext';
import OutlinePopup from './OutlinePopup';
import { WritingViewOptions } from './WritingViewOptions';
import { MobileNav } from '../layout/MobileNav';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface EditorHeaderProps {
  currentDraft: { title: string } | null;
  onOpenDraft: () => void;
  onNewDraft: () => void;
  wordCount: number;
  currentPage: number;
  hasUnsavedChanges: boolean;
  loading: boolean;
  onSave: () => void;
  viewMode?: 'scroll' | 'page';
  onViewModeChange?: (mode: 'scroll' | 'page') => void;
  pageHeight?: number;
  onPageHeightChange?: (height: number) => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
}

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
  const isMobile = useIsMobile();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-2 sm:px-4 lg:px-6 py-2 lg:py-3">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Navigation and Project Info */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          {isMobile ? (
            <MobileNav />
          ) : (
            <SidebarTrigger className="h-8 w-8 lg:h-9 lg:w-9" />
          )}
          
          <div className="flex items-center gap-2 lg:gap-3 min-w-0">
            <PenTool className="h-4 w-4 lg:h-5 lg:w-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex flex-col">
              <h1 className="text-sm lg:text-lg font-semibold">StoryForge</h1>
              {currentDraft && (
                <div className="text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground">{currentDraft.title}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Quick Actions - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-2">
          {currentProject && <StoryBibleDrawer projectId={currentProject.id} />}
          <OutlinePopup />
        </div>

        {/* Right: View Options and Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Mobile Action Buttons */}
          {isMobile && (
            <>
              <Button onClick={onOpenDraft} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <FolderOpen className="h-4 w-4" />
              </Button>
              <Button onClick={onNewDraft} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <FilePlus className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Desktop Action Buttons */}
          {!isMobile && (
            <>
              <Button onClick={onOpenDraft} variant="outline" size="sm" className="hidden xl:flex gap-2">
                <FolderOpen className="h-4 w-4" />
                <span>Open</span>
              </Button>
              <Button onClick={onNewDraft} variant="outline" size="sm" className="hidden xl:flex gap-2">
                <FilePlus className="h-4 w-4" />
                <span>New</span>
              </Button>

              {/* View Options - Desktop only */}
              <div className="hidden lg:block">
                <WritingViewOptions
                  viewMode={viewMode}
                  onViewModeChange={onViewModeChange}
                  pageHeight={pageHeight}
                  onPageHeightChange={onPageHeightChange}
                />
              </div>
            </>
          )}

          {/* Focus Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            className="h-8 w-8 sm:w-auto sm:px-3 p-0 sm:p-2"
          >
            {isFocusMode ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Exit Focus</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:ml-2 sm:inline">Focus</span>
              </>
            )}
          </Button>

          {/* Status and Save */}
          <div className="flex items-center gap-1 sm:gap-2">
            {hasUnsavedChanges && (
              <span className="text-orange-600 dark:text-orange-400 text-xs">
                <span className="hidden sm:inline">Unsaved</span>
                <span className="sm:hidden">•</span>
              </span>
            )}
            
            <Button
              onClick={onSave}
              disabled={loading || !hasUnsavedChanges}
              variant="default"
              size="sm"
              className={`h-8 w-8 p-0 ${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              title="Save"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
