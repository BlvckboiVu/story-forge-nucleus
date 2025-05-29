
import * as React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/lib/db';
import { sanitizeHtml } from '@/utils/security';

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
  const { toast } = useToast();
  const editorRef = React.useRef<ReactQuill>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>();

  // Debounced save function
  const debouncedSave = React.useCallback((contentToSave: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      onSave(contentToSave);
      setHasUnsavedChanges(false);
    }, 2000); // Save after 2 seconds of inactivity
  }, [onSave]);

  // Memoized word count calculation
  const calculateWordCount = React.useMemo(() => {
    return (text: string): number => {
      if (!text) return 0;
      const plainText = text.replace(/<[^>]*>/g, ' ');
      return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
    };
  }, []);

  // Update content and trigger auto-save
  const handleChange = React.useCallback((value: string) => {
    const sanitizedValue = sanitizeHtml(value);
    const newWordCount = calculateWordCount(sanitizedValue);
    
    setContent(sanitizedValue);
    setWordCount(newWordCount);
    setHasUnsavedChanges(true);
    
    // Auto-save with debouncing
    debouncedSave(sanitizedValue);
    
    // Word limit warning
    if (newWordCount > 45000) {
      toast({
        title: "Approaching word limit",
        description: `You're close to the 50,000 word limit (${newWordCount.toLocaleString()} words).`,
        duration: 4000,
      });
    }
  }, [calculateWordCount, debouncedSave, toast]);

  // Manual save
  const handleSave = React.useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    onSave(content);
    setHasUnsavedChanges(false);
    
    toast({
      title: "Draft saved",
      description: "Your document has been saved successfully",
      duration: 3000,
    });
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
      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder="Start writing your masterpiece..."
          readOnly={loading}
          className="h-full"
          style={{ height: 'calc(100% - 42px)' }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-4 px-2 py-2 bg-gray-50 dark:bg-gray-800 rounded">
        <div className="text-sm text-muted-foreground">
          <span className={wordCount > 50000 ? 'text-red-600' : wordCount > 45000 ? 'text-yellow-600' : ''}>
            {wordCount.toLocaleString()} words
          </span>
          {hasUnsavedChanges && (
            <span className="text-orange-600 ml-2">• Unsaved changes</span>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={loading}
          className={`px-4 py-2 rounded text-sm font-medium ${
            hasUnsavedChanges 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Save {draft?.title ? `"${draft.title}"` : 'draft'}
        </button>
      </div>
    </div>
  );
});

OptimizedRichTextEditor.displayName = 'OptimizedRichTextEditor';

export default OptimizedRichTextEditor;
