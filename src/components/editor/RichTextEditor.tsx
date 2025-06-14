import { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { EnhancedToolbar } from './EnhancedToolbar';
import { WritingViewOptions } from './WritingViewOptions';
import { useEnhancedAutoSave } from '@/hooks/useEnhancedAutoSave';
import { useEnhancedWordCount } from '@/hooks/useEnhancedWordCount';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { StoryBibleEntry, getStoryBibleEntriesByProject } from '@/lib/storyBibleDb';
import { debouncedHighlight, registerStoryBibleFormat, HighlightMatch } from '@/utils/highlighting';

// RichTextEditor.tsx
// Main rich text editor component for writing, editing, and formatting story drafts

interface RichTextEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  draft?: Draft | null;
  loading?: boolean;
  onEditorReady?: (editor: ReactQuill | null) => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
  isMobile?: boolean;
  onWordCountChange?: (count: number) => void;
  onCurrentPageChange?: (page: number) => void;
  onUnsavedChangesChange?: (unsaved: boolean) => void;
  extraActions?: React.ReactNode;
}

const WORD_LIMIT = 50000;

const modules = {
  toolbar: false, // We'll use our custom toolbar
};

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'list', 'bullet', 'indent',
  'align',
  'blockquote', 'code-block',
  'link',
  'story-bible-highlight'
];

const RichTextEditor = ({
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
  extraActions,
}: RichTextEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('scroll');
  const [pageHeight, setPageHeight] = useState(800);
  const [storyBibleEntries, setStoryBibleEntries] = useState<StoryBibleEntry[]>([]);
  const [highlightMatches, setHighlightMatches] = useState<HighlightMatch[]>([]);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const editorRef = useRef<ReactQuill>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentProject } = useProjects();
  const deviceIsMobile = useIsMobile();

  // Use editor theme hook
  const { currentTheme, changeTheme } = useEditorTheme({
    defaultThemeId: 'default',
    storageKey: 'editor-theme',
  });

  // Enhanced word count hook
  const { stats, updateWordCount } = useEnhancedWordCount({
    warningThreshold: 45000,
    limitThreshold: WORD_LIMIT,
  });

  // Register custom Quill format for Story Bible highlighting
  useEffect(() => {
    try {
      if (Quill) {
        registerStoryBibleFormat(Quill);
      }
    } catch (error) {
      console.error('Failed to register Story Bible format:', error);
      setEditorError('Failed to initialize editor formatting');
    }
  }, []);

  // Load Story Bible entries for current project
  useEffect(() => {
    const loadStoryBibleEntries = async () => {
      if (!currentProject) return;
      
      try {
        const entries = await getStoryBibleEntriesByProject(currentProject.id, 0, 100);
        setStoryBibleEntries(entries);
        setEditorError(null);
      } catch (error) {
        console.error('Failed to load Story Bible entries:', error);
        setEditorError('Failed to load Story Bible entries');
      }
    };

    loadStoryBibleEntries();
  }, [currentProject]);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      updateWordCount(initialContent);
    }
  }, [initialContent, updateWordCount]);

  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editorRef.current);
    }
  }, [onEditorReady]);

  // Apply theme to editor
  useEffect(() => {
    try {
      const quill = editorRef.current?.getEditor();
      if (quill && currentTheme) {
        const editor = quill.root;
        editor.style.fontFamily = currentTheme.font?.family || 'Inter, sans-serif';
        editor.style.fontSize = currentTheme.font?.size || '16px';
        editor.style.lineHeight = currentTheme.font?.lineHeight || '1.6';
        editor.style.backgroundColor = currentTheme.colors.background;
        editor.style.color = currentTheme.colors.text;
      }
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }, [currentTheme]);

  // Auto-scroll to keep cursor in view with early trigger
  const handleCursorScroll = useCallback(() => {
    const quill = editorRef.current?.getEditor();
    const container = containerRef.current;
    if (!quill || !container) return;

    const selection = quill.getSelection();
    if (!selection) return;

    try {
      const bounds = quill.getBounds(selection.index);
      const containerRect = container.getBoundingClientRect();
      const editorRect = quill.root.getBoundingClientRect();
      
      const cursorTop = editorRect.top + bounds.top - containerRect.top;
      const cursorBottom = cursorTop + bounds.height;
      
      const scrollThreshold = containerRect.height - 100;
      const topThreshold = 50;
      
      if (cursorBottom > scrollThreshold) {
        const targetScrollTop = container.scrollTop + (cursorBottom - scrollThreshold) + 50;
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      } else if (cursorTop < topThreshold) {
        const targetScrollTop = Math.max(0, container.scrollTop - (topThreshold - cursorTop) - 50);
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }
    } catch (error) {
      console.error('Error handling cursor scroll:', error);
    }
  }, []);

  // Set up cursor position tracking
  useEffect(() => {
    const quill = editorRef.current?.getEditor();
    if (!quill) return;

    const handleSelectionChange = () => {
      handleCursorScroll();
      handleHighlighting();
    };

    const handleTextChange = () => {
      setTimeout(() => {
        handleHighlighting();
        handleCursorScroll();
      }, 50);
    };

    quill.on('selection-change', handleSelectionChange);
    quill.on('text-change', handleTextChange);

    return () => {
      quill.off('selection-change', handleSelectionChange);
      quill.off('text-change', handleTextChange);
    };
  }, [handleCursorScroll]);

  // Handle highlighting when content or selection changes
  const handleHighlighting = useCallback(() => {
    const quill = editorRef.current?.getEditor();
    if (!quill || !storyBibleEntries.length || isFocusMode) return;

    try {
      debouncedHighlight(quill, storyBibleEntries, setHighlightMatches);
    } catch (error) {
      console.error('Error during highlighting:', error);
    }
  }, [storyBibleEntries, isFocusMode]);

  const handleSaveContent = (contentToSave: string) => {
    try {
      onSave(contentToSave);
      setHasUnsavedChanges(false);
      setEditorError(null);
    } catch (error) {
      console.error('Save failed:', error);
      setEditorError('Failed to save content');
    }
  };

  const { clearAutoSave } = useEnhancedAutoSave({
    content,
    hasUnsavedChanges,
    onSave: handleSaveContent,
    onSaveStateChange: setIsSaving,
  });

  const handleFontChange = (fontFamily: string) => {
    if (!fontFamily?.trim()) return;
    
    try {
      const quill = editorRef.current?.getEditor();
      if (quill) {
        const editor = quill.root;
        editor.style.fontFamily = fontFamily;
      }
    } catch (error) {
      console.error('Font change failed:', error);
    }
  };

  const handleFormatClick = (format: string, value?: any) => {
    try {
      const quill = editorRef.current?.getEditor();
      if (!quill) return;

      const range = quill.getSelection();
      if (!range) return;

      switch (format) {
        case 'bold':
          quill.format('bold', !quill.getFormat(range).bold);
          break;
        case 'italic':
          quill.format('italic', !quill.getFormat(range).italic);
          break;
        case 'underline':
          quill.format('underline', !quill.getFormat(range).underline);
          break;
        case 'strike':
          quill.format('strike', !quill.getFormat(range).strike);
          break;
        case 'code':
          quill.format('code', !quill.getFormat(range).code);
          break;
        case 'header':
          quill.format('header', value);
          break;
        case 'align':
          quill.format('align', value === 'left' ? false : value);
          break;
        case 'list':
          quill.format('list', value);
          break;
        case 'blockquote':
          quill.format('blockquote', !quill.getFormat(range).blockquote);
          break;
        default:
          console.warn(`Unknown format: ${format}`);
      }
    } catch (error) {
      console.error('Format failed:', error);
      setEditorError('Formatting operation failed');
    }
  };

  const handleChange = (value: string) => {
    try {
      updateWordCount(value);
      setContent(value);
      setHasUnsavedChanges(true);
      setEditorError(null);
    } catch (error) {
      console.error('Content change failed:', error);
      setEditorError('Failed to update content');
    }
  };

  const handleSave = () => {
    try {
      handleSaveContent(content);
      clearAutoSave();
      
      toast({
        title: "Draft saved",
        description: `Your document has been saved successfully`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Manual save failed:', error);
      toast({
        title: "Save failed",
        description: "Failed to save your document",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleToggleFocus = () => {
    try {
      if (onToggleFocus) {
        onToggleFocus();
      }
      toast({
        title: isFocusMode ? "Focus mode disabled" : "Focus mode enabled",
        description: isFocusMode ? "Regular editing mode restored" : "Distraction-free writing mode activated",
        duration: 2000,
      });
    } catch (error) {
      console.error('Focus toggle failed:', error);
    }
  };

  // Mobile-specific classes - simplified
  const editorClasses = `
    rich-text-editor h-full
    ${isFocusMode ? 'focus-mode' : ''}
    ${viewMode === 'page' ? 'page-view' : 'scroll-view'}
  `.trim();

  const editorStyle = {
    fontFamily: currentTheme.font?.family || 'Inter, sans-serif',
    backgroundColor: currentTheme.colors.background,
    color: currentTheme.colors.text,
    ...(viewMode === 'page' && { 
      '--page-height': `${pageHeight}px`,
    } as any)
  };

  // Notify parent of word count and page changes
  useEffect(() => {
    if (onWordCountChange) onWordCountChange(stats.words);
  }, [stats.words, onWordCountChange]);
  useEffect(() => {
    if (onCurrentPageChange) onCurrentPageChange(stats.pages);
  }, [stats.pages, onCurrentPageChange]);
  useEffect(() => {
    if (onUnsavedChangesChange) onUnsavedChangesChange(hasUnsavedChanges);
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

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
    <div className="editor-container">
      {/* Enhanced toolbar with theme support */}
      <EnhancedToolbar
        selectedFont={currentTheme.font?.family || 'Inter'}
        onFontChange={handleFontChange}
        selectedTheme={currentTheme.id}
        onThemeChange={changeTheme}
        isFocusMode={isFocusMode}
        onToggleFocus={handleToggleFocus}
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        onFormatClick={handleFormatClick}
        isMobile={isMobile || deviceIsMobile}
        editorRef={editorRef}
        extraActions={
          !isFocusMode ? (
            <div className="flex items-center gap-2">
              <WritingViewOptions
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                pageHeight={pageHeight}
                onPageHeightChange={setPageHeight}
              />
              {extraActions}
            </div>
          ) : undefined
        }
      />

      <div 
        ref={containerRef}
        className="flex-1 bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-700 relative overflow-auto"
        style={{ 
          scrollBehavior: 'smooth',
          backgroundColor: currentTheme.colors.background 
        }}
      >
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          className={editorClasses}
          placeholder="Start writing your masterpiece..."
          readOnly={loading}
          style={editorStyle}
        />
      </div>
      
      {/* Professional status bar with save button */}
      {!isFocusMode && (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className={stats.words > 50000 ? 'text-red-600' : stats.words > 45000 ? 'text-yellow-600' : ''}>
                {stats.words.toLocaleString()} words
              </span>
              {viewMode === 'page' && (
                <span>Page {stats.pages}</span>
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
              {isSaving && (
                <span className="flex items-center gap-1 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Saving...
                </span>
              )}
            </div>
            
            <Button
              onClick={handleSave}
              disabled={loading || !hasUnsavedChanges || isSaving}
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
              {isSaving ? 'Saving...' : loading ? 'Loading...' : 'Save Draft'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
