import { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { IntegratedToolbar } from './IntegratedToolbar';
import { WritingViewOptions } from './WritingViewOptions';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useWordCount } from '@/hooks/useWordCount';
import { useIsMobile } from '@/hooks/use-mobile';
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
  'story-bible-highlight' // Custom format for highlighting
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
}: RichTextEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('scroll');
  const [pageHeight, setPageHeight] = useState(800);
  const [storyBibleEntries, setStoryBibleEntries] = useState<StoryBibleEntry[]>([]);
  const [highlightMatches, setHighlightMatches] = useState<HighlightMatch[]>([]);
  const { toast } = useToast();
  const editorRef = useRef<ReactQuill>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { wordCount, currentPage, calculateWordCount } = useWordCount();
  const { currentProject } = useProjects();
  const deviceIsMobile = useIsMobile();

  // Register custom Quill format for Story Bible highlighting
  useEffect(() => {
    if (Quill) {
      registerStoryBibleFormat(Quill);
    }
  }, []);

  // Load Story Bible entries for current project
  useEffect(() => {
    const loadStoryBibleEntries = async () => {
      if (!currentProject) return;
      
      try {
        const entries = await getStoryBibleEntriesByProject(currentProject.id, 0, 100);
        setStoryBibleEntries(entries);
      } catch (error) {
        console.error('Failed to load Story Bible entries:', error);
      }
    };

    loadStoryBibleEntries();
  }, [currentProject]);

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      calculateWordCount(initialContent);
    }
  }, [initialContent, calculateWordCount]);

  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editorRef.current);
    }
  }, [onEditorReady]);

  // Apply font change to the editor
  useEffect(() => {
    const quill = editorRef.current?.getEditor();
    if (quill && selectedFont) {
      const editor = quill.root;
      editor.style.fontFamily = selectedFont;
    }
  }, [selectedFont]);

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
      
      // Calculate position relative to container
      const cursorTop = editorRect.top + bounds.top - containerRect.top;
      const cursorBottom = cursorTop + bounds.height;
      
      // Trigger scroll when cursor gets within 100px of bottom edge (not at the edge)
      const scrollThreshold = containerRect.height - 100;
      const topThreshold = 50;
      
      if (cursorBottom > scrollThreshold) {
        // Scroll down to keep cursor in comfortable view
        const targetScrollTop = container.scrollTop + (cursorBottom - scrollThreshold) + 50;
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      } else if (cursorTop < topThreshold) {
        // Scroll up if cursor is too close to top
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
      // Delay both highlighting and scroll to allow text changes to settle
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
    onSave(contentToSave);
    setHasUnsavedChanges(false);
  };

  const { clearAutoSave } = useAutoSave({
    content,
    hasUnsavedChanges,
    onSave: handleSaveContent,
  });

  const handleFontChange = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    const quill = editorRef.current?.getEditor();
    if (quill) {
      const editor = quill.root;
      editor.style.fontFamily = fontFamily;
    }
  };

  const handleFormatClick = (format: string) => {
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
      case 'align-left':
        quill.format('align', false);
        break;
      case 'align-center':
        quill.format('align', 'center');
        break;
      case 'align-right':
        quill.format('align', 'right');
        break;
      case 'list-bullet':
        quill.format('list', 'bullet');
        break;
      case 'list-ordered':
        quill.format('list', 'ordered');
        break;
      case 'blockquote':
        quill.format('blockquote', !quill.getFormat(range).blockquote);
        break;
    }
  };

  const handleChange = (value: string) => {
    const newWordCount = calculateWordCount(value);
    
    if (newWordCount > WORD_LIMIT) {
      toast({
        title: "Word limit exceeded",
        description: `Your draft has exceeded the ${WORD_LIMIT.toLocaleString()} word limit. Consider splitting into multiple drafts.`,
        variant: "destructive",
        duration: 5000,
      });
    } else if (newWordCount > WORD_LIMIT * 0.9) {
      toast({
        title: "Approaching word limit",
        description: `You're approaching the ${WORD_LIMIT.toLocaleString()} word limit (${newWordCount.toLocaleString()} words).`,
        duration: 4000,
      });
    }

    setContent(value);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    handleSaveContent(content);
    clearAutoSave();
    
    toast({
      title: "Draft saved",
      description: `Your document has been saved successfully`,
      duration: 3000,
    });
  };

  const handleToggleFocus = () => {
    if (onToggleFocus) {
      onToggleFocus();
    }
    toast({
      title: isFocusMode ? "Focus mode disabled" : "Focus mode enabled",
      description: isFocusMode ? "Regular editing mode restored" : "Distraction-free writing mode activated",
      duration: 2000,
    });
  };

  // Mobile-specific classes
  const mobileClasses = isMobile || deviceIsMobile ? 'mobile-editor' : '';
  const editorClasses = `
    rich-text-editor
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

  return (
    <div className={`flex flex-col h-full relative ${isFocusMode ? 'focus-mode' : ''}`}>
      {/* Move toolbar to top */}
      <IntegratedToolbar
        selectedFont={selectedFont}
        onFontChange={handleFontChange}
        isFocusMode={isFocusMode}
        onToggleFocus={handleToggleFocus}
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        onFormatClick={handleFormatClick}
        isMobile={isMobile || deviceIsMobile}
        editorRef={editorRef}
        extraActions={
          !isFocusMode ? (
            <WritingViewOptions
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              pageHeight={pageHeight}
              onPageHeightChange={setPageHeight}
            />
          ) : undefined
        }
      />

      <div 
        ref={containerRef}
        className="flex-1 bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-700 relative overflow-auto"
        style={{ scrollBehavior: 'smooth' }}
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

export default RichTextEditor;
