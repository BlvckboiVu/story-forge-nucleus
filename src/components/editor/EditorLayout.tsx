
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus, FolderOpen } from 'lucide-react';
import OutlinePanel from './OutlinePanel';
import LLMPanel from '../LLMPanel';
import RichTextEditor from './RichTextEditor';
import { MobileEditorHeader } from './MobileEditorHeader';
import { Draft } from '@/lib/db';
import { useIsMobile } from '@/hooks/use-mobile';

interface EditorLayoutProps {
  currentDraft: Draft | null;
  loading: boolean;
  onSaveDraft: (content: string) => void;
  onOpenDraft: () => void;
  onNewDraft: () => void;
  onInsertLLMResponse: (text: string) => void;
  onEditorReady: (editor: any) => void;
}

export const EditorLayout = ({
  currentDraft,
  loading,
  onSaveDraft,
  onOpenDraft,
  onNewDraft,
  onInsertLLMResponse,
  onEditorReady,
}: EditorLayoutProps) => {
  const [isOutlineVisible, setIsOutlineVisible] = useState(true);
  const [isLLMPanelCollapsed, setIsLLMPanelCollapsed] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
    if (!isFocusMode) {
      // Entering focus mode - hide sidebars
      setIsOutlineVisible(false);
      setIsLLMPanelCollapsed(true);
    } else {
      // Exiting focus mode - restore sidebars
      setIsOutlineVisible(true);
      setIsLLMPanelCollapsed(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <MobileEditorHeader
          currentDraft={currentDraft}
          onOpenDraft={onOpenDraft}
          onNewDraft={onNewDraft}
          onInsertLLMResponse={onInsertLLMResponse}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
        
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full bg-paper dark:bg-paper-dark">
            <RichTextEditor 
              initialContent={currentDraft?.content || ''} 
              onSave={onSaveDraft}
              draft={currentDraft}
              loading={loading}
              onEditorReady={onEditorReady}
              isFocusMode={isFullscreen}
              onToggleFocus={toggleFullscreen}
              isMobile={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 h-full overflow-hidden">
      {/* Desktop outline sidebar */}
      {!isFocusMode && (
        <div className="hidden md:block w-64 flex-shrink-0 overflow-auto">
          <OutlinePanel className="h-full" />
        </div>
      )}
      
      {/* Editor area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full bg-paper dark:bg-paper-dark shadow-sm border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <RichTextEditor 
            initialContent={currentDraft?.content || ''} 
            onSave={onSaveDraft}
            draft={currentDraft}
            loading={loading}
            onEditorReady={onEditorReady}
            isFocusMode={isFocusMode}
            onToggleFocus={toggleFocusMode}
          />
        </div>
      </div>

      {/* LLM Panel */}
      {!isFocusMode && (
        <div className="hidden lg:block">
          <LLMPanel
            isCollapsed={isLLMPanelCollapsed}
            onToggle={() => setIsLLMPanelCollapsed(!isLLMPanelCollapsed)}
            onInsertResponse={onInsertLLMResponse}
          />
        </div>
      )}

      {/* Desktop action buttons */}
      <div className="hidden md:flex lg:hidden fixed bottom-4 right-4 flex-col gap-2">
        <Button 
          onClick={onOpenDraft}
          size="icon"
          variant="secondary"
          className="rounded-full shadow-lg"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button 
          onClick={onNewDraft}
          size="icon"
          variant="secondary"
          className="rounded-full shadow-lg"
        >
          <FilePlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
