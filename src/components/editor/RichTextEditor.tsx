
import { useEffect, useRef, useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

const fonts = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Palatino', label: 'Palatino' },
];

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
  const [selectedFont, setSelectedFont] = useState('Arial');
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

  const handleFontChange = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    const quill = editorRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        quill.format('font', fontFamily);
      }
    }
  };

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link'],
        ['clean']
      ],
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
    'link'
  ];

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

  // Add accessibility labels and tooltips after component mounts
  useEffect(() => {
    const addTooltips = () => {
      const toolbarButtons = document.querySelectorAll('.ql-toolbar button, .ql-toolbar .ql-picker');
      
      toolbarButtons.forEach((button) => {
        const className = button.className;
        let title = '';
        
        if (className.includes('ql-bold')) title = 'Bold (Ctrl+B)';
        else if (className.includes('ql-italic')) title = 'Italic (Ctrl+I)';
        else if (className.includes('ql-underline')) title = 'Underline (Ctrl+U)';
        else if (className.includes('ql-strike')) title = 'Strikethrough';
        else if (className.includes('ql-header')) title = 'Header';
        else if (className.includes('ql-list')) {
          const value = button.getAttribute('value');
          title = value === 'ordered' ? 'Numbered List' : 'Bullet List';
        }
        else if (className.includes('ql-script')) {
          const value = button.getAttribute('value');
          title = value === 'sub' ? 'Subscript' : 'Superscript';
        }
        else if (className.includes('ql-indent')) {
          const value = button.getAttribute('value');
          title = value === '+1' ? 'Increase Indent' : 'Decrease Indent';
        }
        else if (className.includes('ql-align')) title = 'Text Align';
        else if (className.includes('ql-color')) title = 'Text Color';
        else if (className.includes('ql-background')) title = 'Background Color';
        else if (className.includes('ql-blockquote')) title = 'Blockquote';
        else if (className.includes('ql-code-block')) title = 'Code Block';
        else if (className.includes('ql-link')) title = 'Insert Link';
        else if (className.includes('ql-clean')) title = 'Clear Formatting';
        
        if (title) {
          button.setAttribute('title', title);
          button.setAttribute('aria-label', title);
        }
      });
    };

    // Add tooltips after a short delay to ensure Quill is fully initialized
    const timeout = setTimeout(addTooltips, 100);
    return () => clearTimeout(timeout);
  }, []);

  const isNearWordLimit = wordCount > WORD_LIMIT * 0.8;
  const isOverWordLimit = wordCount > WORD_LIMIT;

  return (
    <div className="flex flex-col h-full">
      {/* Custom font selector */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="font-select" className="text-sm font-medium">Font:</label>
          <Select value={selectedFont} onValueChange={handleFontChange}>
            <SelectTrigger className="w-[180px]" id="font-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((font) => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 shadow-sm">
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          className="h-[500px] mb-12"
          placeholder="Start writing your masterpiece..."
          readOnly={loading}
          style={{ 
            fontFamily: selectedFont,
          }}
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
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleSave}
              disabled={loading}
              variant="default"
              className={hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              <Save className="mr-2 h-4 w-4" />
              Save {draft?.title ? `"${draft.title}"` : 'draft'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save your current draft (Ctrl+S)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default RichTextEditor;
