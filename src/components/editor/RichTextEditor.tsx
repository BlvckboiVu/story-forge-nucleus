
import { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Draft } from '@/lib/db';

interface RichTextEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  draft?: Draft | null;
  loading?: boolean;
}

const WORD_LIMIT = 50000;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

const RichTextEditor = ({
  initialContent = '',
  onSave,
  draft,
  loading = false,
}: RichTextEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const { toast } = useToast();
  const editorRef = useRef<ReactQuill>(null);
  const [wordCount, setWordCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const averageWordsPerPage = 250;
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      calculateWordCount(initialContent);
    }
  }, [initialContent]);

  // Auto-save functionality
  const autoSave = useCallback(() => {
    if (hasUnsavedChanges && content.trim()) {
      onSave(content);
      setHasUnsavedChanges(false);
      toast({
        title: "Auto-saved",
        description: "Your draft has been automatically saved",
        duration: 2000,
      });
    }
  }, [content, hasUnsavedChanges, onSave, toast]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      autoSaveTimeoutRef.current = setTimeout(autoSave, AUTO_SAVE_INTERVAL);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, autoSave]);

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'align': [] }],
        ['clean']
      ],
      handlers: {
        // Add ARIA labels to toolbar buttons
        bold: function() {
          const button = document.querySelector('.ql-bold');
          if (button) {
            button.setAttribute('aria-label', 'Bold text');
          }
          this.quill.format('bold', !this.quill.getFormat().bold);
        },
        italic: function() {
          const button = document.querySelector('.ql-italic');
          if (button) {
            button.setAttribute('aria-label', 'Italic text');
          }
          this.quill.format('italic', !this.quill.getFormat().italic);
        }
      }
    },
  };

  const calculateWordCount = (text: string) => {
    if (!text) return 0;
    const plainText = text.replace(/<[^>]*>/g, ' ');
    const words = plainText.trim().split(/\s+/).filter(word => word !== '');
    setWordCount(words.length);
    return words.length;
  };

  const handleChange = (value: string) => {
    const newWordCount = calculateWordCount(value);
    
    // Check word limit
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
    setWordCount(newWordCount);
    setHasUnsavedChanges(true);
    
    const pageNum = Math.max(1, Math.ceil(newWordCount / averageWordsPerPage));
    setCurrentPage(pageNum);
  };

  const handleSave = () => {
    onSave(content);
    setHasUnsavedChanges(false);
    
    // Clear auto-save timeout since we just saved manually
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    toast({
      title: "Draft saved",
      description: `Your document has been saved successfully`,
      duration: 3000,
    });
  };

  // Add accessibility labels after component mounts
  useEffect(() => {
    const addAriaLabels = () => {
      const toolbarButtons = document.querySelectorAll('.ql-toolbar button, .ql-toolbar select');
      toolbarButtons.forEach((button) => {
        const className = button.className;
        if (className.includes('ql-bold') && !button.getAttribute('aria-label')) {
          button.setAttribute('aria-label', 'Bold text');
        } else if (className.includes('ql-italic') && !button.getAttribute('aria-label')) {
          button.setAttribute('aria-label', 'Italic text');
        } else if (className.includes('ql-underline') && !button.getAttribute('aria-label')) {
          button.setAttribute('aria-label', 'Underline text');
        } else if (className.includes('ql-list') && !button.getAttribute('aria-label')) {
          const value = button.getAttribute('value');
          button.setAttribute('aria-label', value === 'ordered' ? 'Numbered list' : 'Bullet list');
        } else if (className.includes('ql-header') && !button.getAttribute('aria-label')) {
          button.setAttribute('aria-label', 'Text heading');
        }
      });
    };

    // Add labels after a short delay to ensure Quill is fully initialized
    const timeout = setTimeout(addAriaLabels, 100);
    return () => clearTimeout(timeout);
  }, []);

  const isNearWordLimit = wordCount > WORD_LIMIT * 0.8;
  const isOverWordLimit = wordCount > WORD_LIMIT;

  return (
    <div className="flex flex-col h-full">
      <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 shadow-sm">
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          className="h-[500px] mb-12"
          placeholder="Start writing your masterpiece..."
          readOnly={loading}
        />
      </div>
      
      <div className="flex items-center justify-between mt-4 px-2">
        <div className="text-sm">
          <span className={`${isOverWordLimit ? 'text-red-600 dark:text-red-400' : isNearWordLimit ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
            {wordCount.toLocaleString()} words
          </span>
          {isOverWordLimit && (
            <span className="text-red-600 dark:text-red-400 ml-2">
              (Limit: {WORD_LIMIT.toLocaleString()})
            </span>
          )}
          <span className="text-muted-foreground ml-2">| Page {currentPage}</span>
          {hasUnsavedChanges && (
            <span className="text-orange-600 dark:text-orange-400 ml-2">• Unsaved changes</span>
          )}
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={loading}
          variant="default"
          className={hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          <Save className="mr-2 h-4 w-4" />
          Save {draft?.title ? `"${draft.title}"` : 'draft'}
        </Button>
      </div>
    </div>
  );
};

export default RichTextEditor;
