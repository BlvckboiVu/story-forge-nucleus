
import { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/components/ui/use-toast';
import { Draft } from '@/lib/db';
import { EditorToolbar } from './EditorToolbar';
import { EditorStatusBar } from './EditorStatusBar';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useWordCount } from '@/hooks/useWordCount';

interface RichTextEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  draft?: Draft | null;
  loading?: boolean;
  onEditorReady?: (editor: ReactQuill | null) => void;
}

const WORD_LIMIT = 50000;

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

const RichTextEditor = ({
  initialContent = '',
  onSave,
  draft,
  loading = false,
  onEditorReady,
}: RichTextEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Arial');
  const { toast } = useToast();
  const editorRef = useRef<ReactQuill>(null);
  const { wordCount, currentPage, calculateWordCount } = useWordCount();

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
      const range = quill.getSelection();
      if (range) {
        quill.format('font', fontFamily);
      }
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

  // Add accessibility labels after component mounts
  useEffect(() => {
    const addTooltips = () => {
      const toolbarButtons = document.querySelectorAll('.ql-toolbar button, .ql-toolbar .ql-picker');
      
      const tooltipMap: Record<string, string> = {
        'ql-bold': 'Bold (Ctrl+B)',
        'ql-italic': 'Italic (Ctrl+I)',
        'ql-underline': 'Underline (Ctrl+U)',
        'ql-strike': 'Strikethrough',
        'ql-header': 'Header',
        'ql-blockquote': 'Blockquote',
        'ql-code-block': 'Code Block',
        'ql-link': 'Insert Link',
        'ql-clean': 'Clear Formatting',
      };

      toolbarButtons.forEach((button) => {
        const className = button.className;
        
        for (const [key, title] of Object.entries(tooltipMap)) {
          if (className.includes(key)) {
            button.setAttribute('title', title);
            button.setAttribute('aria-label', title);
            break;
          }
        }
        
        if (className.includes('ql-list')) {
          const value = button.getAttribute('value');
          const title = value === 'ordered' ? 'Numbered List' : 'Bullet List';
          button.setAttribute('title', title);
          button.setAttribute('aria-label', title);
        }
      });
    };

    const timeout = setTimeout(addTooltips, 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar 
        selectedFont={selectedFont}
        onFontChange={handleFontChange}
      />

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
      
      <EditorStatusBar
        wordCount={wordCount}
        currentPage={currentPage}
        hasUnsavedChanges={hasUnsavedChanges}
        loading={loading}
        draft={draft}
        onSave={handleSave}
      />
    </div>
  );
};

export default RichTextEditor;
