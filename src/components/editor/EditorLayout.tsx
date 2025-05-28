
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, FilePlus, FolderOpen } from 'lucide-react';
import OutlinePanel from './OutlinePanel';
import LLMPanel from '../LLMPanel';
import RichTextEditor from './RichTextEditor';
import { Draft } from '@/lib/db';

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

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 h-full overflow-hidden">
      {/* Mobile outline toggle */}
      {!isFocusMode && (
        <div className="md:hidden">
          <Collapsible
            open={isOutlineVisible}
            onOpenChange={setIsOutlineVisible}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full mb-2 flex items-center justify-between">
                <span>Outline</span>
                {isOutlineVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mb-4">
              <OutlinePanel />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
      
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

      {/* Mobile action buttons */}
      {!isFocusMode && (
        <div className="md:hidden mt-4 space-y-2">
          <Button 
            onClick={onOpenDraft}
            className="w-full"
            variant="outline"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Open Draft
          </Button>
          <Button 
            onClick={onNewDraft}
            className="w-full" 
            variant="outline"
          >
            <FilePlus className="mr-2 h-4 w-4" />
            New Draft
          </Button>
        </div>
      )}
    </div>
  );
};
