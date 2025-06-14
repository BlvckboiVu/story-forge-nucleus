import { useState, useEffect, useCallback, useRef } from 'react';
import { Draft } from '@/lib/db';
import { createVersion, DocumentVersion } from '@/lib/versioning';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface UseEditorProps {
  initialContent?: string;
  draft?: Draft;
  onSave?: (content: string) => Promise<void>;
  onWordCountChange?: (count: number) => void;
  onStoryBibleHighlight?: (text: string) => void;
  autoSaveInterval?: number;
  wordLimit?: number;
}

interface UseEditorReturn {
  content: string;
  setContent: (content: string) => void;
  isDirty: boolean;
  wordCount: number;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  viewMode: 'normal' | 'focus' | 'page';
  setViewMode: (mode: 'normal' | 'focus' | 'page') => void;
  isMobile: boolean;
  handleSave: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleSelectionChange: () => void;
}

const DEFAULT_AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DEFAULT_WORD_LIMIT = 100000;

export function useEditor({
  initialContent = '',
  draft,
  onSave,
  onWordCountChange,
  onStoryBibleHighlight,
  autoSaveInterval = DEFAULT_AUTO_SAVE_INTERVAL,
  wordLimit = DEFAULT_WORD_LIMIT,
}: UseEditorProps): UseEditorReturn {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [viewMode, setViewMode] = useState<'normal' | 'focus' | 'page'>('normal');
  const [isMobile, setIsMobile] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Debounced save function
  const debouncedSave = useDebounce(async (content: string) => {
    if (!content || !isDirty) return;
    
    try {
      if (onSave) {
        await onSave(content);
      }
      
      if (draft) {
        await createVersion({
          draftId: draft.id,
          content,
          wordCount,
          metadata: {
            font: selectedFont,
            viewMode,
          },
        });
      }
      
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    }
  }, autoSaveInterval);
  
  // Update word count
  useEffect(() => {
    const count = content.trim().split(/\s+/).length;
    setWordCount(count);
    onWordCountChange?.(count);
    
    if (count > wordLimit) {
      toast({
        title: 'Word Limit Reached',
        description: `You've reached the maximum word limit of ${wordLimit} words.`,
        variant: 'destructive',
      });
    }
  }, [content, wordLimit, onWordCountChange, toast]);
  
  // Auto-save on content change
  useEffect(() => {
    if (content !== initialContent) {
      setIsDirty(true);
      debouncedSave(content);
    }
  }, [content, initialContent, debouncedSave]);
  
  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle save
  const handleSave = useCallback(async () => {
    if (!content || !isDirty) return;
    
    try {
      if (onSave) {
        await onSave(content);
      }
      
      if (draft) {
        await createVersion({
          draftId: draft.id,
          content,
          wordCount,
          metadata: {
            font: selectedFont,
            viewMode,
          },
        });
      }
      
      setIsDirty(false);
      toast({
        title: 'Saved',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    }
  }, [content, isDirty, onSave, draft, wordCount, selectedFont, viewMode, toast]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);
  
  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);
  
  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const selection = window.getSelection();
      if (selection) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
      }
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  }, []);
  
  // Handle selection change for story bible highlights
  const handleSelectionChange = useCallback(() => {
    if (!onStoryBibleHighlight) return;
    
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      onStoryBibleHighlight(selection.toString().trim());
    }
  }, [onStoryBibleHighlight]);
  
  return {
    content,
    setContent,
    isDirty,
    wordCount,
    selectedFont,
    setSelectedFont,
    viewMode,
    setViewMode,
    isMobile,
    handleSave,
    handleKeyDown,
    handlePaste,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleSelectionChange,
  };
} 