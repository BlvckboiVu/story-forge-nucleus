import { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { EnhancedToolbar } from './EnhancedToolbar';
import { useEnhancedAutoSave } from '@/hooks/useEnhancedAutoSave';
import { useEnhancedWordCount } from '@/hooks/useEnhancedWordCount';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEditorContent } from '@/hooks/useEditorContent';
import { useEditorScroll } from '@/hooks/useEditorScroll';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
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

  const handleSaveContent = useCallback(async (contentToSave: string) => {
    try {
      if (!isValid) {
        throw new Error('Cannot save invalid content');
      }
      
      await onSave(contentToSave);
      setHasUnsavedChanges(false);
      setEditorError(null);
    } catch (error) {
      console.error('Save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save content';
      setEditorError(errorMessage);
      throw error; // Re-throw for the autosave hook to handle
    }
  }, [isValid, onSave, setHasUnsavedChanges]);

  const { isSaving, saveError, clearAutoSave } = useEnhancedAutoSave({
    content,
    hasUnsavedChanges,
    onSave: handleSaveContent,
    onSaveStateChange: () => {},
    interval: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  });

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

  const handleFontChange = useCallback((fontFamily: string) => {
    if (!fontFamily?.trim()) {
      handleEditorError(new Error('Invalid font family'));
      return;
    }
    
    try {
      const quill = editorRef.current?.getEditor();
      if (quill) {
        const editor = quill.root;
        editor.style.fontFamily = fontFamily;
      }
    } catch (error) {
      handleEditorError(error as Error);
    }
  }, [handleEditorError]);

  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      const cleanup = setupKeyboardNavigation(editor.root);
      return cleanup;
    }
  }, [setupKeyboardNavigation]);

  const handleFormatClick = useCallback((format: string, value?: any) => {
    try {
      const quill = editorRef.current?.getEditor();
      if (!quill) {
        throw new Error('Editor not available');
      }

      const range = quill.getSelection();
      if (!range) {
        throw new Error('No text selected');
      }

      trackUserAction('format_text', { format, value });

      switch (format) {
        case 'bold':
          quill.format('bold', !quill.getFormat(range).bold);
          announce('Bold formatting toggled');
          break;
        case 'italic':
          quill.format('italic', !quill.getFormat(range).italic);
          announce('Italic formatting toggled');
          break;
        case 'underline':
          quill.format('underline', !quill.getFormat(range).underline);
          announce('Underline formatting toggled');
          break;
        case 'strike':
          quill.format('strike', !quill.getFormat(range).strike);
          announce('Strikethrough formatting toggled');
          break;
        case 'code':
          quill.format('code', !quill.getFormat(range).code);
          announce('Code formatting toggled');
          break;
        case 'header':
          quill.format('header', value);
          announce(`Header set to level ${value}`);
          break;
        case 'align':
          quill.format('align', value === 'left' ? false : value);
          announce(`Text aligned ${value}`);
          break;
        case 'list':
          quill.format('list', value);
          announce(`List formatting applied: ${value}`);
          break;
        case 'blockquote':
          quill.format('blockquote', !quill.getFormat(range).blockquote);
          announce('Blockquote formatting toggled');
          break;
        default:
          console.warn(`Unknown format: ${format}`);
      }
    } catch (error) {
      handleEditorError(error as Error);
    }
  }, [handleEditorError, trackUserAction, announce]);

  const handleToggleFocus = useCallback(() => {
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
      handleEditorError(error as Error);
    }
  }, [isFocusMode, onToggleFocus, toast, handleEditorError]);

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

  // Performance monitoring effect
  useEffect(() => {
    const interval = setInterval(() => {
      const perfData = getPerformanceData();
      if (perfData.trends.performanceScore < 70) {
        console.warn('Performance degradation detected:', perfData);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [getPerformanceData]);

  // Error display component
  if (editorError && !isValid) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-red-500 mb-4">
          <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Editor Error</h3>
          <p className="text-sm mb-4">{editorError}</p>
          {validationErrors.length > 0 && (
            <div className="text-xs text-left bg-red-50 p-2 rounded mb-4">
              <strong>Validation Errors:</strong>
              <ul className="list-disc list-inside mt-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRecovery}
            disabled={isRecovering}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
            Recover Content
          </Button>
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
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" role="application" aria-label="Rich text editor">
      {/* Enhanced toolbar */}
      <div className="flex-shrink-0">
        <EnhancedToolbar
          selectedFont="Inter"
          onFontChange={(font) => {
            trackUserAction('change_font', { font });
          
            handleFontChange(font);
          }}
          isFocusMode={isFocusMode}
          onToggleFocus={() => {
            trackUserAction('toggle_focus_mode', { enabled: !isFocusMode });
            onToggleFocus?.();
          }}
          onSave={() => {}}
          hasUnsavedChanges={hasUnsavedChanges}
          onFormatClick={handleFormatClick}
          isMobile={isMobile || deviceIsMobile}
          editorRef={editorRef}
          extraActions={extraActions}
        />
      </div>

      {/* Validation warnings */}
      {validationWarnings.length > 0 && (
        <div className="flex-shrink-0 bg-yellow-50 border-l-4 border-yellow-400 p-2">
          <div className="flex">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700">
              <strong>Warning:</strong> {validationWarnings[0]}
            </div>
          </div>
        </div>
      )}

      {/* Editor content area */}
      <div 
        ref={containerRef}
        className="flex-1 w-full overflow-hidden"
        style={{ backgroundColor: '#ffffff' }}
      >
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={content}
          onChange={handleContentChangeWithTracking}
          modules={modules}
          formats={formats}
          className={`h-full w-full ${isFocusMode ? 'focus-mode' : ''}`}
          placeholder="Start writing your masterpiece..."
          readOnly={loading}
          style={{
            height: '100%',
            width: '100%',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: '#ffffff',
            color: '#1f2937',
          }}
        />
      </div>
      
      {/* Enhanced status bar with performance indicators */}
      {!isFocusMode && (
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 overflow-hidden">
              <span className={`flex-shrink-0 font-medium ${
                getWarningLevel() === 'danger' ? 'text-red-600' : 
                getWarningLevel() === 'warning' ? 'text-yellow-600' : 
                'text-gray-700 dark:text-gray-300'
              }`}>
                {stats.words.toLocaleString()} words
              </span>
              <span className="flex-shrink-0 text-gray-600 dark:text-gray-400">Page {stats.pages}</span>
              <span className="flex-shrink-0 text-gray-600 dark:text-gray-400">{stats.readingTime} min read</span>
              
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

              {saveError && (
                <span className="flex items-center gap-2 text-red-600 dark:text-red-400 flex-shrink-0">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="hidden sm:inline font-medium">Save failed</span>
                  <span className="sm:hidden font-medium">Error</span>
                </span>
              )}

              {!isValid && (
                <span className="flex items-center gap-2 text-red-600 dark:text-red-400 flex-shrink-0">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="hidden sm:inline font-medium">Invalid content</span>
                  <span className="sm:hidden font-medium">Invalid</span>
                </span>
              )}

              {/* Performance indicator */}
              <span className="text-blue-600 dark:text-blue-400 flex-shrink-0 hidden lg:inline">
                Perf: {getPerformanceData().trends.performanceScore}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
