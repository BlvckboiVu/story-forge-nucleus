import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { DocumentVersion, autoSaveVersion } from '@/lib/versioning';
import { useWordCount } from '@/hooks/useWordCount';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { StoryBibleEntry } from '@/lib/storyBibleDb';
import { debouncedHighlight, HighlightMatch } from '@/utils/highlighting';

// EditorCore.tsx
// A more efficient editor core built on top of contentEditable

interface EditorCoreProps {
  initialContent?: string;
  onSave: (content: string) => void;
  draft?: Draft | null;
  loading?: boolean;
  onEditorReady?: (editor: HTMLElement | null) => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  isMobile?: boolean;
  onWordCountChange?: (count: number) => void;
  onCurrentPageChange?: (page: number) => void;
  onUnsavedChangesChange?: (unsaved: boolean) => void;
}

const WORD_LIMIT = 50000;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const EditorCore = ({
  initialContent = '',
  onSave,
  draft,
  loading = false,
  onEditorReady,
  isFocusMode = false,
  onToggleFocus,
  isMobile = false,
  onWordCountChange,
  onCurrentPageChange,
  onUnsavedChangesChange,
}: EditorCoreProps) => {
  const [content, setContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('scroll');
  const [pageHeight, setPageHeight] = useState(800);
  const [storyBibleEntries, setStoryBibleEntries] = useState<StoryBibleEntry[]>([]);
  const [highlightMatches, setHighlightMatches] = useState<HighlightMatch[]>([]);
  const [editorError, setEditorError] = useState<string | null>(null);
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { wordCount, currentPage, calculateWordCount } = useWordCount();
  const { currentProject } = useProjects();
  const deviceIsMobile = useIsMobile();
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  // Initialize editor
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.contentEditable = 'true';
      editorRef.current.spellcheck = true;
      editorRef.current.style.fontFamily = selectedFont;
      
      if (onEditorReady) {
        onEditorReady(editorRef.current);
      }
    }
  }, [onEditorReady, selectedFont]);

  // Set up auto-save
  useEffect(() => {
    if (draft?.id && hasUnsavedChanges) {
      autoSaveTimerRef.current = setInterval(async () => {
        try {
          const versionId = await autoSaveVersion(
            draft.id,
            content,
            wordCount
          );
          
          if (versionId) {
            console.log('Auto-saved version:', versionId);
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, AUTO_SAVE_INTERVAL);
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [draft?.id, content, wordCount, hasUnsavedChanges]);

  // Handle content changes
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    setHasUnsavedChanges(true);
    
    const newWordCount = calculateWordCount(newContent);
    if (onWordCountChange) {
      onWordCountChange(newWordCount);
    }
    
    if (onUnsavedChangesChange) {
      onUnsavedChangesChange(true);
    }
  }, [calculateWordCount, onWordCountChange, onUnsavedChangesChange]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Save on Ctrl/Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    
    // Format shortcuts
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold', false);
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic', false);
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline', false);
          break;
      }
    }
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      onSave(content);
      setHasUnsavedChanges(false);
      setEditorError(null);
      
      if (onUnsavedChangesChange) {
        onUnsavedChangesChange(false);
      }
      
      toast({
        title: "Draft saved",
        description: "Your changes have been saved successfully",
      });
    } catch (error) {
      console.error('Save failed:', error);
      setEditorError('Failed to save content');
      toast({
        title: "Save failed",
        description: "Failed to save your changes",
        variant: "destructive",
      });
    }
  }, [content, onSave, onUnsavedChangesChange, toast]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Get plain text from clipboard
    const text = e.clipboardData.getData('text/plain');
    
    // Insert at cursor position
    document.execCommand('insertText', false, text);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      document.execCommand('insertText', false, text);
    }
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Handle selection change for highlighting
  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current || !storyBibleEntries.length || isFocusMode) return;
    
    try {
      debouncedHighlight(editorRef.current, storyBibleEntries, setHighlightMatches);
    } catch (error) {
      console.error('Error during highlighting:', error);
    }
  }, [storyBibleEntries, isFocusMode]);

  // Set up selection change listener
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Mobile-specific classes
  const mobileClasses = isMobile || deviceIsMobile ? 'mobile-editor' : '';
  const editorClasses = `
    editor-core
    ${mobileClasses}
    ${isFocusMode ? 'focus-mode max-w-4xl mx-auto px-4' : ''}
    ${viewMode === 'page' ? 'page-view' : 'scroll-view'}
  `.trim();

  const editorStyle = {
    fontFamily: selectedFont,
    height: '100%',
    ...(viewMode === 'page' && { 
      '--page-height': `${pageHeight}px`,
    } as any)
  };

  if (editorError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-red-500 mb-4">
          <h3 className="text-lg font-semibold">Editor Error</h3>
          <p className="text-sm">{editorError}</p>
        </div>
        <Button
          onClick={() => {
            setEditorError(null);
            window.location.reload();
          }}
          variant="outline"
        >
          Reload Editor
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full relative ${isFocusMode ? 'focus-mode' : ''}`}>
      <div 
        ref={containerRef}
        className="flex-1 bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-700 relative overflow-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div
          ref={editorRef}
          className={editorClasses}
          style={editorStyle}
          contentEditable={!loading}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          dangerouslySetInnerHTML={{ __html: content }}
          suppressContentEditableWarning
        />
      </div>
      
      {/* Status bar */}
      {!isFocusMode && (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className={wordCount > 50000 ? 'text-red-600' : wordCount > 45000 ? 'text-yellow-600' : ''}>
                {wordCount.toLocaleString()} words
              </span>
              {viewMode === 'page' && (
                <span>Page {currentPage}</span>
              )}
              {highlightMatches.length > 0 && (
                <span className="text-blue-600">
                  {highlightMatches.length} Story Bible {highlightMatches.length === 1 ? 'reference' : 'references'}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1 text-amber-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  Unsaved changes
                </span>
              )}
            </div>
            
            <Button
              onClick={handleSave}
              disabled={loading || !hasUnsavedChanges}
              size="sm"
              className={`
                transition-all duration-200 
                ${hasUnsavedChanges 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border'
                }
              `}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorCore; 