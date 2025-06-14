
import * as React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { validateEditorContent } from '@/utils/editorValidation';

interface OptimizedRichTextEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  draft?: Draft | null;
  loading?: boolean;
  onEditorReady?: (editor: ReactQuill | null) => void;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote'],
    ['clean']
  ],
};

const formats = [
  'header', 'bold', 'italic', 'underline',
  'list', 'bullet', 'blockquote'
];

const OptimizedRichTextEditor = React.memo(({
  initialContent = '',
  onSave,
  draft,
  loading = false,
  onEditorReady,
}: OptimizedRichTextEditorProps) => {
  const [content, setContent] = React.useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [wordCount, setWordCount] = React.useState(0);
  const [isValid, setIsValid] = React.useState(true);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  const { toast } = useToast();
  const editorRef = React.useRef<ReactQuill>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Enhanced save function with validation
  const debouncedSave = React.useCallback((contentToSave: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Validate content before saving
        const validation = validateEditorContent(contentToSave);
        
        if (!validation.isValid) {
          setValidationErrors(validation.errors);
          setIsValid(false);
          toast({
            title: "Content validation failed",
            description: validation.errors[0],
            variant: "destructive",
          });
          return;
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
          toast({
            title: "Content warning",
            description: validation.warnings[0],
            duration: 4000,
          });
        }

        // Save with sanitized content
        await onSave(validation.sanitizedContent || contentToSave);
        setHasUnsavedChanges(false);
        setIsValid(true);
        setValidationErrors([]);
        
      } catch (error) {
        console.error('Save failed:', error);
        toast({
          title: "Save failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    }, 2000);
  }, [onSave, toast]);

  // Memoized word count calculation
  const calculateWordCount = React.useMemo(() => {
    return (text: string): number => {
      if (!text) return 0;
      const plainText = text.replace(/<[^>]*>/g, ' ');
      return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
    };
  }, []);

  // Enhanced content change handler with validation
  const handleChange = React.useCallback((value: string) => {
    try {
      // Basic validation for immediate feedback
      const validation = validateEditorContent(value);
      const newWordCount = calculateWordCount(validation.sanitizedContent || value);
      
      setContent(validation.sanitizedContent || value);
      setWordCount(newWordCount);
      setHasUnsavedChanges(true);
      setIsValid(validation.isValid);
      setValidationErrors(validation.errors);
      
      // Auto-save with debouncing
      debouncedSave(validation.sanitizedContent || value);
      
      // Word limit warning
      if (newWordCount > 45000) {
        toast({
          title: "Approaching word limit",
          description: `You're close to the 50,000 word limit (${newWordCount.toLocaleString()} words).`,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Content change failed:', error);
      setIsValid(false);
      setValidationErrors(['Content processing failed']);
    }
  }, [calculateWordCount, debouncedSave, toast]);

  // Manual save with enhanced validation
  const handleSave = React.useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    try {
      const validation = validateEditorContent(content);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setIsValid(false);
        toast({
          title: "Cannot save invalid content",
          description: validation.errors[0],
          variant: "destructive",
        });
        return;
      }

      await onSave(validation.sanitizedContent || content);
      setHasUnsavedChanges(false);
      setIsValid(true);
      setValidationErrors([]);
      
      toast({
        title: "Draft saved",
        description: "Your document has been saved successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Manual save failed:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [content, onSave, toast]);

  // Initialize content
  React.useEffect(() => {
    if (initialContent && initialContent !== content) {
      setContent(initialContent);
      setWordCount(calculateWordCount(initialContent));
      setHasUnsavedChanges(false);
    }
  }, [initialContent, content, calculateWordCount]);

  // Editor ready callback
  React.useEffect(() => {
    if (onEditorReady && editorRef.current) {
      onEditorReady(editorRef.current);
    }
  }, [onEditorReady]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [handleSave]);

  return (
    <div className="h-full flex flex-col">
      {/* Validation errors display */}
      {!isValid && validationErrors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Content Validation Errors</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder="Start writing your masterpiece..."
          readOnly={loading || !isValid}
          className="h-full"
          style={{ height: 'calc(100% - 42px)' }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-4 px-2 py-2 bg-gray-50 dark:bg-gray-800 rounded">
        <div className="text-sm text-muted-foreground">
          <span className={
            wordCount > 50000 ? 'text-red-600' : 
            wordCount > 45000 ? 'text-yellow-600' : 
            !isValid ? 'text-red-600' : ''
          }>
            {wordCount.toLocaleString()} words
          </span>
          {hasUnsavedChanges && (
            <span className="text-orange-600 ml-2">• Unsaved changes</span>
          )}
          {!isValid && (
            <span className="text-red-600 ml-2">• Invalid content</span>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={loading || !isValid}
          className={`px-4 py-2 rounded text-sm font-medium ${
            hasUnsavedChanges && isValid
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : !isValid
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {!isValid ? 'Fix errors to save' : `Save ${draft?.title ? `"${draft.title}"` : 'draft'}`}
        </button>
      </div>
    </div>
  );
});

OptimizedRichTextEditor.displayName = 'OptimizedRichTextEditor';

export default OptimizedRichTextEditor;
