import { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { ModernToolbar } from './toolbar/ModernToolbar';
import { ImprovedMobileToolbar } from './toolbar/ImprovedMobileToolbar';
import { FloatingToolbar } from './FloatingToolbar';
import { SlashCommands } from './SlashCommands';
import { MarkdownShortcuts } from './MarkdownShortcuts';
import { ModernStatusBar } from './ModernStatusBar';
import { EditorLoading } from './EditorLoading';
import { FocusMode } from './FocusMode';
import { useEnhancedAutoSave } from '@/hooks/useEnhancedAutoSave';
import { useEnhancedWordCount } from '@/hooks/useEnhancedWordCount';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEditorScroll } from '@/hooks/useEditorScroll';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProjects } from '@/contexts/ProjectContext';
import { StoryBibleEntry, getStoryBibleEntriesByProject } from '@/lib/storyBibleDb';
import { debouncedHighlight, registerStoryBibleFormat, HighlightMatch } from '@/utils/highlighting';
import { EditorErrorDisplay } from './EditorErrorDisplay';
import { EditorValidationDisplay } from './EditorValidationDisplay';
import { useEditorSync } from './hooks/useEditorSync';
import { useEditorFormatting } from './hooks/useEditorFormatting';

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

  // Content sync (SRP)
  const {
    content,
    isValid,
    validationErrors,
    validationWarnings,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    handleChange,
    resetToLastValid
  } = useEditorSync({
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
    }
  });

  // Formatting logic (SRP)
  const {
    handleFormatClick,
    activeFormats,
    handleUndo,
    handleRedo,
    getHistoryState,
    setQuillEditor,
    checkFormats,
    quillEditor
  } = useEditorFormatting(editorRef, trackUserAction);

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

  // Reset editor content when a new draft is loaded
  useEffect(() => {
    if (initialContent !== content) {
      handleChange(initialContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent]);

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

  // Check active formats from editor
  useEffect(() => {
    const quill = editorRef?.current?.getEditor();
    if (quill) {
      setQuillEditor(quill);
      quill.on('selection-change', checkFormats);
      quill.on('text-change', checkFormats);
      checkFormats();
      
      return () => {
        quill.off('selection-change', checkFormats);
        quill.off('text-change', checkFormats);
      };
    }
  }, [editorRef]);

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
    <div className="flex-1 w-full overflow-hidden relative">
      <ReactQuill
        ref={editorRef}
        theme="snow"
        value={content}
        onChange={handleContentChangeWithTracking}
        modules={modules}
        formats={formats}
        className="h-full w-full editor-modern"
        placeholder="Start writing your story... Try typing '/' for quick formatting or use **bold** and *italic* markdown shortcuts."
        readOnly={loading}
        style={{
          height: '100%',
          width: '100%',
          fontFamily: selectedFont,
        }}
      />
      
      {/* Floating toolbar for text selection */}
      {!isFocusMode && quillEditor && (
        <FloatingToolbar
          editor={quillEditor}
          onFormatClick={handleFormatClick}
          activeFormats={activeFormats}
        />
      )}
      
      {/* Slash commands */}
      {!isFocusMode && quillEditor && (
        <SlashCommands
          editor={quillEditor}
          onFormatClick={handleFormatClick}
        />
      )}
      
      {/* Markdown shortcuts */}
      {quillEditor && (
        <MarkdownShortcuts
          editor={quillEditor}
          onFormatClick={handleFormatClick}
        />
      )}
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

  const { isSaving, saveError } = useEnhancedAutoSave({
    content,
    hasUnsavedChanges,
    onSave: handleSaveContent,
    onSaveStateChange: () => {},
    interval: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-gray-900" role="application" aria-label="Rich text editor">
      {/* Choose toolbar based on device */}
      {isMobile || deviceIsMobile ? (
        <ImprovedMobileToolbar
          selectedFont={selectedFont}
          onFontChange={handleFontChange}
          activeFormats={activeFormats}
          onFormatClick={handleFormatClick}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyState.canUndo}
          canRedo={historyState.canRedo}
        />
      ) : (
        <ModernToolbar
          selectedFont={selectedFont}
          onFontChange={handleFontChange}
          activeFormats={activeFormats}
          onFormatClick={handleFormatClick}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={historyState.canUndo}
          canRedo={historyState.canRedo}
          isMobile={false}
          isFocusMode={isFocusMode}
        />
      )}

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
