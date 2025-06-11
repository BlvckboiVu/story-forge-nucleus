// EditorLayout.tsx
// Layout component for the main editor view, handling both desktop and mobile layouts

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, FolderOpen } from 'lucide-react';
import OutlinePopup from './OutlinePopup';
import LLMPanel from '../LLMPanel';
import RichTextEditor from './RichTextEditor';
import { MobileEditorHeader } from './MobileEditorHeader';
import { Draft } from '@/lib/db';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFocusMode } from '@/hooks/use-focus-mode';
import { EditorHeader } from './EditorHeader';

/**
 * Props for the EditorLayout component
 * @property currentDraft - The current draft being edited
 * @property loading - Whether the editor is loading
 * @property onSaveDraft - Callback to save the draft
 * @property onOpenDraft - Callback to open the draft modal
 * @property onNewDraft - Callback to create a new draft
 * @property onInsertLLMResponse - Callback to insert LLM response
 * @property onEditorReady - Callback when the editor is ready
 */
interface EditorLayoutProps {
  currentDraft: Draft | null;
  loading: boolean;
  onSaveDraft: (content: string) => void;
  onOpenDraft: () => void;
  onNewDraft: () => void;
  onInsertLLMResponse: (text: string) => void;
  onEditorReady: (editor: any) => void;
}

/**
 * DesktopLayout - Renders the editor and LLM panel for desktop screens
 */
const DesktopLayout = ({
  currentDraft,
  loading,
  onSaveDraft,
  onOpenDraft,
  onNewDraft,
  onInsertLLMResponse,
  onEditorReady,
  isFocusMode,
  isPanelCollapsed,
  toggleFocusMode,
  togglePanel
}: EditorLayoutProps & {
  isFocusMode: boolean;
  isPanelCollapsed: boolean;
  toggleFocusMode: () => void;
  togglePanel: () => void;
}) => {
  // Real state for word count, page, unsaved changes
  const [wordCount, setWordCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleEditorReady = (editor: any) => {
    if (onEditorReady) onEditorReady(editor);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Merged Header with status bar info */}
      <EditorHeader
        currentDraft={currentDraft}
        onOpenDraft={onOpenDraft}
        onNewDraft={onNewDraft}
        wordCount={wordCount}
        currentPage={currentPage}
        hasUnsavedChanges={hasUnsavedChanges}
        loading={loading}
        onSave={() => onSaveDraft(currentDraft?.content || '')}
      />
      <div className="flex-1 flex gap-3 lg:gap-4 h-full overflow-hidden p-3 lg:p-4">
        {/* Main editor area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full bg-paper dark:bg-paper-dark shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <RichTextEditor 
              initialContent={currentDraft?.content || ''} 
              onSave={onSaveDraft}
              draft={currentDraft}
              loading={loading}
              onEditorReady={handleEditorReady}
              isFocusMode={isFocusMode}
              onToggleFocus={toggleFocusMode}
              onWordCountChange={setWordCount}
              onCurrentPageChange={setCurrentPage}
              onUnsavedChangesChange={setHasUnsavedChanges}
            />
          </div>
        </div>

        {/* LLM Panel (hidden in focus mode) */}
        {!isFocusMode && (
          <div className="hidden lg:block">
            <LLMPanel
              isCollapsed={isPanelCollapsed}
              onToggle={togglePanel}
              onInsertResponse={onInsertLLMResponse}
            />
          </div>
        )}

        {/* Floating action buttons for outline and drafts (desktop only) */}
        <div className="hidden md:flex lg:hidden fixed bottom-6 right-6 flex-col gap-3">
          <OutlinePopup />
          <Button 
            onClick={onOpenDraft}
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg h-12 w-12"
            title="Open Draft"
          >
            <FolderOpen className="h-5 w-5" />
          </Button>
          <Button 
            onClick={onNewDraft}
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg h-12 w-12"
            title="New Draft"
          >
            <FilePlus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * MobileLayout - Renders the editor and controls for mobile screens
 */
const MobileLayout = ({
  currentDraft,
  loading,
  onSaveDraft,
  onOpenDraft,
  onNewDraft,
  onInsertLLMResponse,
  onEditorReady,
  isFullscreen,
  onToggleFullscreen
}: EditorLayoutProps & {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) => {
  // Real state for word count, page, unsaved changes
  const [wordCount, setWordCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MobileEditorHeader
        currentDraft={currentDraft}
        onOpenDraft={onOpenDraft}
        onNewDraft={onNewDraft}
        onInsertLLMResponse={onInsertLLMResponse}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
      <div className="flex-1 min-h-0 overflow-hidden bg-paper dark:bg-paper-dark">
        <RichTextEditor 
          initialContent={currentDraft?.content || ''} 
          onSave={onSaveDraft}
          draft={currentDraft}
          loading={loading}
          onEditorReady={onEditorReady}
          isFocusMode={isFullscreen}
          onToggleFocus={onToggleFullscreen}
          isMobile={true}
          onWordCountChange={setWordCount}
          onCurrentPageChange={setCurrentPage}
          onUnsavedChangesChange={setHasUnsavedChanges}
        />
      </div>
    </div>
  );
};

/**
 * EditorLayout - Main exported component that chooses between desktop and mobile layouts
 */
export const EditorLayout = ({
  currentDraft,
  loading,
  onSaveDraft,
  onOpenDraft,
  onNewDraft,
  onInsertLLMResponse,
  onEditorReady,
}: EditorLayoutProps) => {
  // Detect if device is mobile
  const isMobile = useIsMobile();
  // State for fullscreen mode (mobile focus mode)
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Focus mode and panel collapse state from custom hook
  const { 
    isFocusMode, 
    isPanelCollapsed, 
    toggleFocusMode, 
    togglePanel 
  } = useFocusMode();

  // Toggle fullscreen for mobile
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render mobile or desktop layout
  if (isMobile) {
    return (
      <MobileLayout
        currentDraft={currentDraft}
        loading={loading}
        onSaveDraft={onSaveDraft}
        onOpenDraft={onOpenDraft}
        onNewDraft={onNewDraft}
        onInsertLLMResponse={onInsertLLMResponse}
        onEditorReady={onEditorReady}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
    );
  }

  return (
    <DesktopLayout
      currentDraft={currentDraft}
      loading={loading}
      onSaveDraft={onSaveDraft}
      onOpenDraft={onOpenDraft}
      onNewDraft={onNewDraft}
      onInsertLLMResponse={onInsertLLMResponse}
      onEditorReady={onEditorReady}
      isFocusMode={isFocusMode}
      isPanelCollapsed={isPanelCollapsed}
      toggleFocusMode={toggleFocusMode}
      togglePanel={togglePanel}
    />
  );
};
