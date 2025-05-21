
import { useEffect, useRef, useState } from 'react';
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
  const averageWordsPerPage = 250; // Approximate words per page like Word/Google Docs

  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      calculateWordCount(initialContent);
    }
  }, [initialContent]);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const calculateWordCount = (text: string) => {
    if (!text) return 0;
    // Strip HTML tags and count words
    const plainText = text.replace(/<[^>]*>/g, ' ');
    const words = plainText.trim().split(/\s+/).filter(word => word !== '');
    setWordCount(words.length);
    return words.length;
  };

  const handleChange = (value: string) => {
    setContent(value);
    calculateWordCount(value);
    
    // Calculate current page based on word count
    const pageNum = Math.max(1, Math.ceil(calculateWordCount(value) / averageWordsPerPage));
    setCurrentPage(pageNum);
  };

  const handleSave = () => {
    onSave(content);
    toast({
      title: "Draft saved",
      description: `Your document has been saved successfully`,
      duration: 3000,
    });
  };

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
        <div className="text-sm text-muted-foreground">
          {wordCount} words | Page {currentPage}
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={loading}
          variant="default"
        >
          <Save className="mr-2 h-4 w-4" />
          Save {draft?.title ? `"${draft.title}"` : 'draft'}
        </Button>
      </div>
    </div>
  );
};

export default RichTextEditor;
