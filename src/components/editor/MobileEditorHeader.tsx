// MobileEditorHeader.tsx
// Header for the mobile editor view, showing draft title, navigation, and actions

import { Button } from '@/components/ui/button';
import { FilePlus, FolderOpen, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { MobileNav } from '@/components/layout/MobileNav';
import { Draft } from '@/lib/db';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import LLMPanel from '../LLMPanel';

/**
 * Props for the MobileEditorHeader component
 * @property currentDraft - The current draft object (or null)
 * @property onOpenDraft - Callback to open the draft modal
 * @property onNewDraft - Callback to create a new draft
 * @property onInsertLLMResponse - Optional callback to insert LLM response
 * @property isFullscreen - Whether the editor is in fullscreen/focus mode
 * @property onToggleFullscreen - Callback to toggle fullscreen mode
 */
interface MobileEditorHeaderProps {
  currentDraft: Draft | null;
  onOpenDraft: () => void;
  onNewDraft: () => void;
  onInsertLLMResponse?: (text: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

/**
 * MobileEditorHeader - Header for the mobile editor, showing draft title, navigation, and actions
 */
export const MobileEditorHeader = ({ 
  currentDraft, 
  onOpenDraft, 
  onNewDraft, 
  onInsertLLMResponse,
  isFullscreen = false,
  onToggleFullscreen
}: MobileEditorHeaderProps) => {
  const formatLastSaved = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 min-h-[56px]">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MobileNav />
        <div className="flex flex-col min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {currentDraft ? currentDraft.title : "New Draft"}
          </h1>
          {currentDraft && (
            <p className="text-xs text-muted-foreground hidden xs:block">
              {formatLastSaved(new Date(currentDraft.updatedAt))}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {onInsertLLMResponse && (
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                title="AI Assistant"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <div className="h-full">
                <LLMPanel
                  isCollapsed={false}
                  onToggle={() => {}}
                  onInsertResponse={onInsertLLMResponse}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onOpenDraft}
          className="h-8 w-8 sm:h-9 sm:w-9"
          title="Open Draft"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onNewDraft}
          className="h-8 w-8 sm:h-9 sm:w-9"
          title="New Draft"
        >
          <FilePlus className="h-4 w-4" />
        </Button>
        {onToggleFullscreen && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleFullscreen}
            className="h-8 w-8 sm:h-9 sm:w-9"
            title={isFullscreen ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            {isFullscreen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
        <DarkModeToggle />
      </div>
    </div>
  );
};
