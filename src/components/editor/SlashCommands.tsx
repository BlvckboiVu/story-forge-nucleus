
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Heading, List, ListOrdered, Quote, Code } from 'lucide-react';

interface SlashCommand {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

interface SlashCommandsProps {
  editor: any;
  onFormatClick: (format: string, value?: any) => void;
}

export const SlashCommands = ({ editor, onFormatClick }: SlashCommandsProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const commands: SlashCommand[] = [
    {
      id: 'heading1',
      label: 'Heading 1',
      icon: Heading,
      action: () => onFormatClick('header', '1')
    },
    {
      id: 'heading2',
      label: 'Heading 2',
      icon: Heading,
      action: () => onFormatClick('header', '2')
    },
    {
      id: 'heading3',
      label: 'Heading 3',
      icon: Heading,
      action: () => onFormatClick('header', '3')
    },
    {
      id: 'bullet',
      label: 'Bullet List',
      icon: List,
      action: () => onFormatClick('list', 'bullet')
    },
    {
      id: 'numbered',
      label: 'Numbered List',
      icon: ListOrdered,
      action: () => onFormatClick('list', 'ordered')
    },
    {
      id: 'quote',
      label: 'Quote',
      icon: Quote,
      action: () => onFormatClick('blockquote')
    },
    {
      id: 'code',
      label: 'Code Block',
      icon: Code,
      action: () => onFormatClick('code-block')
    }
  ];

  useEffect(() => {
    if (!editor) return;

    const handleTextChange = () => {
      const selection = editor.getSelection();
      if (!selection) return;

      const text = editor.getText(Math.max(0, selection.index - 10), 10);
      const slashIndex = text.lastIndexOf('/');
      
      if (slashIndex >= 0 && slashIndex === text.length - 1) {
        const bounds = editor.getBounds(selection.index - 1, 1);
        const editorBounds = editor.container.getBoundingClientRect();
        
        setPosition({
          top: editorBounds.top + bounds.top + bounds.height + 5,
          left: editorBounds.left + bounds.left
        });
        setIsVisible(true);
        setSelectedIndex(0);
      } else {
        setIsVisible(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % commands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
          break;
        case 'Enter':
          e.preventDefault();
          executeCommand(selectedIndex);
          break;
        case 'Escape':
          e.preventDefault();
          setIsVisible(false);
          break;
      }
    };

    editor.on('text-change', handleTextChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      editor.off('text-change', handleTextChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, isVisible, selectedIndex]);

  const executeCommand = (index: number) => {
    const command = commands[index];
    if (!command) return;

    const selection = editor.getSelection();
    if (!selection) return;

    // Remove the slash
    editor.deleteText(selection.index - 1, 1);
    command.action();
    setIsVisible(false);
  };

  if (!isVisible || !position) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-48 animate-fade-in"
      style={{
        top: position.top,
        left: position.left
      }}
    >
      {commands.map((command, index) => {
        const Icon = command.icon;
        return (
          <Button
            key={command.id}
            variant="ghost"
            className={`w-full justify-start px-3 py-2 h-auto text-left ${
              index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
            onClick={() => executeCommand(index)}
          >
            <Icon className="h-4 w-4 mr-3" />
            {command.label}
          </Button>
        );
      })}
    </div>
  );
};
