
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, Link, Code } from 'lucide-react';
import { createPortal } from 'react-dom';

interface FloatingToolbarProps {
  editor: any;
  onFormatClick: (format: string, value?: any) => void;
  activeFormats: Record<string, any>;
}

export const FloatingToolbar = ({ editor, onFormatClick, activeFormats }: FloatingToolbarProps) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionChange = () => {
      const selection = editor.getSelection();
      
      if (!selection || selection.length === 0) {
        setIsVisible(false);
        return;
      }

      const bounds = editor.getBounds(selection.index, selection.length);
      const editorBounds = editor.container.getBoundingClientRect();
      
      setPosition({
        top: editorBounds.top + bounds.top - 50,
        left: editorBounds.left + bounds.left + (bounds.width / 2)
      });
      setIsVisible(true);
    };

    editor.on('selection-change', handleSelectionChange);
    
    const handleClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        const selection = editor.getSelection();
        if (!selection || selection.length === 0) {
          setIsVisible(false);
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      editor.off('selection-change', handleSelectionChange);
      document.removeEventListener('click', handleClick);
    };
  }, [editor]);

  if (!isVisible || !position) return null;

  const toolbar = (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 flex items-center gap-1 animate-fade-in"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)'
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onFormatClick('bold')}
        data-active={Boolean(activeFormats.bold)}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onFormatClick('italic')}
        data-active={Boolean(activeFormats.italic)}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onFormatClick('underline')}
        data-active={Boolean(activeFormats.underline)}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onFormatClick('code')}
        data-active={Boolean(activeFormats.code)}
      >
        <Code className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => onFormatClick('link')}
      >
        <Link className="h-4 w-4" />
      </Button>
    </div>
  );

  return createPortal(toolbar, document.body);
};
