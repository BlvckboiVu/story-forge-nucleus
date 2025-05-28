
import { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from '@/components/ui/use-toast';
import { Draft } from '@/lib/db';
import { IntegratedToolbar } from './IntegratedToolbar';
import { EditorStatusBar } from './EditorStatusBar';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useWordCount } from '@/hooks/useWordCount';

interface RichTextEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  draft?: Draft | null;
  loading?: boolean;
  onEditorReady?: (editor: ReactQuill | null) => void;
  isFocusMode?: boolean;
  onToggleFocus?: () => void;
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
  'link'
];

const RichTextEditor = ({
  initialContent = '',
  onSave,
  draft,
  loading = false,
  onEditorReady,
  isFocusMode = false,
  onToggleFocus,
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

  return (
    <div className={`flex flex-col h-full ${isFocusMode ? 'focus-mode' : ''}`}>
      <IntegratedToolbar
        selectedFont={selectedFont}
        onFontChange={handleFontChange}
        isFocusMode={isFocusMode}
        onToggleFocus={handleToggleFocus}
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        onFormatClick={handleFormatClick}
      />

      <div className="flex-1 bg-white dark:bg-gray-900 border-x border-gray-200 dark:border-gray-700">
        <ReactQuill
          ref={editorRef}
          theme="snow"
          value={content}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          className={`h-full ${isFocusMode ? 'max-w-4xl mx-auto px-8' : ''}`}
          placeholder="Start writing your masterpiece..."
          readOnly={loading}
          style={{ 
            fontFamily: selectedFont,
            height: '100%'
          }}
        />
      </div>
      
      {!isFocusMode && (
        <EditorStatusBar
          wordCount={wordCount}
          currentPage={currentPage}
          hasUnsavedChanges={hasUnsavedChanges}
          loading={loading}
          draft={draft}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
