
import { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { ModernToolbar } from './toolbar/ModernToolbar';
import { ModernStatusBar } from './ModernStatusBar';
import { EditorLoading } from './EditorLoading';
import { FocusMode } from './FocusMode';
import { useEnhancedAutoSave } from '@/hooks/useEnhancedAutoSave';
import { useEnhancedWordCount } from '@/hooks/useEnhancedWordCount';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEditorContent } from '@/hooks/useEditorContent';
import { useEditorScroll } from '@/hooks/useEditorScroll';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProjects } from '@/contexts/ProjectContext';
import { StoryBibleEntry, getStoryBibleEntriesByProject } from '@/lib/storyBibleDb';
import { debouncedHighlight, registerStoryBibleFormat, HighlightMatch } from '@/utils/highlighting';
import { EditorErrorDisplay } from './EditorErrorDisplay';
import { EditorValidationDisplay } from './EditorValidationDisplay';

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
  extraActions?: React.ReactElement;
}

const WORD_LIMIT = 50000;

const modules = {
  toolbar: false,
  history: {
    delay: 1000,
    maxStack: 100,
    userOnly: true
  },
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
  const [isRecovering, setIsRecovering] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();
  const editorRef = useRef<ReactQuill>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentProject } = useProjects();
  const deviceIsMobile = useIsMobile();

  // Enhanced hooks
  const { stats, updateWordCount, getWarningLevel } = useEnhancedWordCount({
    warningThreshold: 45000,
    limitThreshold: WORD_LIMIT,
  });

  const { 
    measureRenderTime,
    measureSaveTime,
    trackKeystroke,
    trackContentSize,
    getPerformanceData 
  } = usePerformanceMonitoring();

  const { 
    announce,
    announceWordCount,
    announceSaveStatus,
    announceValidationError,
    setupKeyboardNavigation 
  } = useAccessibility({
    announceChanges: true,
    keyboardNavigation: true,
    screenReaderOptimized: true,
  });

  const {
    trackEvent,
    trackError,
    trackUserAction,
    trackKeystroke: trackAnalyticsKeystroke,
    trackWordCount: trackAnalyticsWordCount
  } = useAnalytics();

  const { 
    content, 
    isValid, 
    validationErrors, 
    validationWarnings, 
    hasUnsavedChanges, 
    setHasUnsavedChanges, 
    handleChange,
    resetToLastValid 
  } = useEditorContent({
    initialContent,
    onContentChange: (newContent) => {
      trackContentSize(newContent);
      trackAnalyticsWordCount(stats.words);
      onContentChange?.(newContent);
    },
    onWordCountChange: (count) => {
      updateWordCount(content);
      announceWordCount(count);
      if (onWordCountChange) onWordCountChange(count);
    },
    validateOnChange: true,
    maxLength: 5000000
  });

  const { handleCursorScroll } = useEditorScroll({ 
    editorRef, 
    containerRef,
    onScrollPositionChange: (position) => {
      // Could save scroll position for restoration
    }
  });

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register custom Quill format with error handling
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

  // Load Story Bible entries with error handling
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

  const handleHighlighting = useCallback(() => {
    const quill = editorRef.current?.getEditor();
    if (!quill || !storyBibleEntries.length || isFocusMode) return;

    try {
      debouncedHighlight(quill, storyBibleEntries, setHighlightMatches);
    } catch (error) {
      console.error('Error during highlighting:', error);
    }
  }, [storyBibleEntries, isFocusMode]);

  // Enhanced save with performance and accessibility
  const handleSaveContent = useCallback(async (contentToSave: string) => {
    try {
      if (!isValid) {
        announceValidationError(validationErrors);
        throw new Error('Cannot save invalid content');
      }
      
      announceSaveStatus('saving');
      trackUserAction('save_document', { wordCount: stats.words, draftId: draft?.id });
      
      await measureSaveTime(async () => {
        await onSave(contentToSave);
      });
      
      setHasUnsavedChanges(false);
      setEditorError(null);
      announceSaveStatus('saved');
      
    } catch (error) {
      console.error('Save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save content';
      setEditorError(errorMessage);
      announceSaveStatus('error');
      trackError(error as Error, { action: 'save', wordCount: stats.words });
      throw error;
    }
  }, [isValid, validationErrors, stats.words, draft?.id, onSave, setHasUnsavedChanges, 
      measureSaveTime, announceSaveStatus, announceValidationError, trackUserAction, trackError]);

  const handleRecovery = useCallback(async () => {
    setIsRecovering(true);
    try {
      resetToLastValid();
      setEditorError(null);
      toast({
        title: "Content recovered",
        description: "Reverted to last valid content",
      });
    } catch (error) {
      console.error('Recovery failed:', error);
      toast({
        title: "Recovery failed",
        description: "Unable to recover content",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  }, [resetToLastValid, toast]);

  const handleEditorError = useCallback((error: Error) => {
    console.error('Editor error:', error);
    setEditorError(error.message);
    trackError(error, { component: 'RichTextEditor', draft: draft?.id });
    
    toast({
      title: "Editor Error",
      description: error.message,
      variant: "destructive",
      duration: 5000,
    });
  }, [toast, trackError, draft?.id]);

  // Enhanced content change with performance tracking
  const handleContentChangeWithTracking = useCallback((value: string) => {
    measureRenderTime(() => {
      handleChange(value);
      trackKeystroke();
      trackAnalyticsKeystroke();
    });
  }, [handleChange, measureRenderTime, trackKeystroke, trackAnalyticsKeystroke]);

  const handleFontChange = useCallback((fontFamily: string) => {
    if (!fontFamily?.trim()) {
      handleEditorError(new Error('Invalid font family'));
      return;
    }
    
    try {
      setSelectedFont(fontFamily);
      const quill = editorRef.current?.getEditor();
      if (quill) {
        const editor = quill.root;
        editor.style.fontFamily = fontFamily;
      }
    } catch (error) {
      handleEditorError(error as Error);
    }
  }, [handleEditorError]);

  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  // Check active formats from editor
  useEffect(() => {
    const checkFormats = () => {
      if (!editorRef?.current?.getEditor) return;
      
      try {
        const quill = editorRef.current.getEditor();
        const range = quill.getSelection();
        if (!range) return;

        const format = quill.getFormat(range);
        setActiveFormats({
          bold: Boolean(format.bold),
          italic: Boolean(format.italic),
          underline: Boolean(format.underline),
          strike: Boolean(format.strike),
          code: Boolean(format.code),
          align: typeof format.align === 'string' ? format.align : 'left',
          list: typeof format.list === 'string' ? format.list : undefined,
          blockquote: Boolean(format.blockquote),
          header: typeof format.header === 'string' ? format.header : false,
        });
      } catch (error) {
        console.error('Error checking formats:', error);
      }
    };

    const quill = editorRef?.current?.getEditor();
    if (quill) {
      quill.on('selection-change', checkFormats);
      quill.on('text-change', checkFormats);
      checkFormats();
      
      return () => {
        quill.off('selection-change', checkFormats);
        quill.off('text-change', checkFormats);
      };
    }
  }, [editorRef]);

  const handleFormatClick = useCallback((format: string, value?: any) => {
    try {
      const quill = editorRef.current?.getEditor();
      if (!quill) {
        throw new Error('Editor not available');
      }

      const range = quill.getSelection();
      if (!range) {
        // Create a selection if none exists
        quill.setSelection(0, 0);
      }

      trackUserAction('format_text', { format, value });

      switch (format) {
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strike':
        case 'code':
        case 'blockquote':
          quill.format(format, !quill.getFormat(range || { index: 0, length: 0 })[format]);
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
        default:
          console.warn(`Unknown format: ${format}`);
      }
    } catch (error) {
      handleEditorError(error as Error);
    }
  }, [handleEditorError, trackUserAction]);

  // Handle undo/redo
  const handleUndo = useCallback(() => {
    const quill = editorRef?.current?.getEditor();
    if (quill && quill.history) {
      quill.history.undo();
    }
  }, []);

  const handleRedo = useCallback(() => {
    const quill = editorRef?.current?.getEditor();
    if (quill && quill.history) {
      quill.history.redo();
    }
  }, []);

  const getHistoryState = useCallback(() => {
    const quill = editorRef?.current?.getEditor();
    if (quill && quill.history) {
      return {
        canUndo: quill.history.stack.undo.length > 0,
        canRedo: quill.history.stack.redo.length > 0,
      };
    }
    return { canUndo: false, canRedo: false };
  }, []);

  const { isSaving, saveError } = useEnhancedAutoSave({
    content,
    hasUnsavedChanges,
    onSave: handleSaveContent,
    onSaveStateChange: () => {},
    interval: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  });

  // Notify parent of changes with error handling
  useEffect(() => {
    try {
      if (onWordCountChange) onWordCountChange(stats.words);
    } catch (error) {
      console.error('Word count notification failed:', error);
    }
  }, [stats.words, onWordCountChange]);

  useEffect(() => {
    try {
      if (onCurrentPageChange) onCurrentPageChange(stats.pages);
    } catch (error) {
      console.error('Page count notification failed:', error);
    }
  }, [stats.pages, onCurrentPageChange]);

  useEffect(() => {
    try {
      if (onUnsavedChangesChange) onUnsavedChangesChange(hasUnsavedChanges);
    } catch (error) {
      console.error('Unsaved changes notification failed:', error);
    }
  }, [hasUnsavedChanges, onUnsavedChangesChange]);

  const historyState = getHistoryState();
  const performanceData = getPerformanceData();

  // Show loading state
  if (loading) {
    return <EditorLoading />;
  }

  // Error display component
  if (editorError && !isValid) {
    return (
      <EditorErrorDisplay
        editorError={editorError}
        validationErrors={validationErrors}
        isRecovering={isRecovering}
        onRecovery={handleRecovery}
        onReload={() => {
          setEditorError(null);
          window.location.reload();
        }}
      />
    );
  }

  const editorContent = (
    <div className="flex-1 w-full overflow-hidden">
      <ReactQuill
        ref={editorRef}
        theme="snow"
        value={content}
        onChange={handleContentChangeWithTracking}
        modules={modules}
        formats={formats}
        className="h-full w-full editor-modern"
        placeholder="Start writing your story..."
        readOnly={loading}
        style={{
          height: '100%',
          width: '100%',
          fontFamily: selectedFont,
        }}
      />
    </div>
  );

  // Focus mode wrapper
  if (isFocusMode) {
    return (
      <FocusMode
        onExitFocus={() => onToggleFocus?.()}
        onSave={() => handleSaveContent(content)}
        hasUnsavedChanges={hasUnsavedChanges}
        wordCount={stats.words}
      >
        {editorContent}
      </FocusMode>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900" role="application" aria-label="Rich text editor">
      {/* Modern toolbar */}
      <ModernToolbar
        selectedFont={selectedFont}
        onFontChange={handleFontChange}
        activeFormats={activeFormats}
        onFormatClick={handleFormatClick}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyState.canUndo}
        canRedo={historyState.canRedo}
        isMobile={isMobile || deviceIsMobile}
        isFocusMode={isFocusMode}
      />

      {/* Validation warnings */}
      <EditorValidationDisplay
        validationErrors={validationErrors}
        validationWarnings={validationWarnings}
      />

      {/* Editor content area */}
      <div 
        ref={containerRef}
        className="flex-1 w-full overflow-hidden"
      >
        {editorContent}
      </div>
      
      {/* Modern status bar */}
      <ModernStatusBar
        stats={{
          words: stats.words,
          pages: stats.pages,
          readingTime: `${stats.readingTime} min`
        }}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        saveError={saveError}
        isValid={isValid}
        isOnline={isOnline}
        performanceScore={performanceData.trends.performanceScore}
      />
    </div>
  );
};

export default RichTextEditor;
