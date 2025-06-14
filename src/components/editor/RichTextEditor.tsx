
import { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { EnhancedToolbar } from './EnhancedToolbar';
import { useEnhancedAutoSave } from '@/hooks/useEnhancedAutoSave';
import { useEnhancedWordCount } from '@/hooks/useEnhancedWordCount';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { useEditorContent } from '@/hooks/useEditorContent';
import { useEditorScroll } from '@/hooks/useEditorScroll';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { StoryBibleEntry, getStoryBibleEntriesByProject } from '@/lib/storyBibleDb';
import { debouncedHighlight, registerStoryBibleFormat, HighlightMatch } from '@/utils/highlighting';

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
  onContentChange?: (content: string) => void;
  extraActions?: React.ReactNode;
}

const WORD_LIMIT = 50000;

const modules = {
  toolbar: false,
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
  onContentChange,
  extraActions,
}: RichTextEditorProps) => {
  const [storyBibleEntries, setStoryBibleEntries] = useState<StoryBibleEntry[]>([]);
  const [highlightMatches, setHighlightMatches] = useState<HighlightMatch[]>([]);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const editorRef = useRef<ReactQuill>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentProject } = useProjects();
  const deviceIsMobile = useIsMobile();

  const { currentTheme, changeTheme } = useEditorTheme({
    defaultThemeId: 'default',
    storageKey: 'editor-theme',
  });

  const { stats, updateWordCount } = useEnhancedWordCount({
    warningThreshold: 45000,
    limitThreshold: WORD_LIMIT,
  });

  const { content, hasUnsavedChanges, setHasUnsavedChanges, handleChange } = useEditorContent({
    initialContent,
    onContentChange,
    onWordCountChange: (count) => {
      updateWordCount(initialContent);
      if (onWordCountChange) onWordCountChange(count);
    },
  });

  const { handleCursorScroll } = useEditorScroll({ editorRef, containerRef });

  // Register custom Quill format
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

  // Load Story Bible entries
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
      handleChange(initialContent);
      updateWordCount(initialContent);
    }
  }, [initialContent, updateWordCount, handleChange]);

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

  // Notify parent of changes
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
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Enhanced toolbar */}
      <div className="flex-shrink-0">
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
          extraActions={extraActions}
        />
      </div>

      {/* Editor content area */}
      <div 
        ref={containerRef}
        className="flex-1 w-full overflow-hidden"
        style={{ 
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
          className={`h-full w-full ${isFocusMode ? 'focus-mode' : ''}`}
          placeholder="Start writing your masterpiece..."
          readOnly={loading}
          style={{
            height: '100%',
            width: '100%',
            fontFamily: currentTheme.font?.family || 'Inter, sans-serif',
            backgroundColor: currentTheme.colors.background,
            color: currentTheme.colors.text,
          }}
        />
      </div>
      
      {/* Status bar */}
      {!isFocusMode && (
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 overflow-hidden">
              <span className={`flex-shrink-0 font-medium ${stats.words > 50000 ? 'text-red-600' : stats.words > 45000 ? 'text-yellow-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {stats.words.toLocaleString()} words
              </span>
              <span className="flex-shrink-0 text-gray-600 dark:text-gray-400">Page {stats.pages}</span>
              {highlightMatches.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400 flex-shrink-0 hidden sm:inline">
                  {highlightMatches.length} Story Bible {highlightMatches.length === 1 ? 'reference' : 'references'}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 flex-shrink-0">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline font-medium">Unsaved changes</span>
                  <span className="sm:hidden font-medium">Unsaved</span>
                </span>
              )}
              {isSaving && (
                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="hidden sm:inline font-medium">Saving...</span>
                  <span className="sm:hidden font-medium">Saving</span>
                </span>
              )}
            </div>
            
            <Button
              onClick={handleSave}
              disabled={loading || !hasUnsavedChanges || isSaving}
              size="sm"
              className={`
                transition-all duration-200 flex-shrink-0 font-medium
                ${hasUnsavedChanges 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
                  : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-300'
                }
              `}
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">
                {isSaving ? 'Saving...' : loading ? 'Loading...' : 'Save Draft'}
              </span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
