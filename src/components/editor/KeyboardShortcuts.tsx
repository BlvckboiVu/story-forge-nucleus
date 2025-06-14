import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  description: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

const SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'S',
    description: 'Save document',
    ctrlKey: true,
  },
  {
    key: 'B',
    description: 'Bold text',
    ctrlKey: true,
  },
  {
    key: 'I',
    description: 'Italic text',
    ctrlKey: true,
  },
  {
    key: 'U',
    description: 'Underline text',
    ctrlKey: true,
  },
  {
    key: 'Z',
    description: 'Undo',
    ctrlKey: true,
  },
  {
    key: 'Y',
    description: 'Redo',
    ctrlKey: true,
  },
  {
    key: 'A',
    description: 'Select all',
    ctrlKey: true,
  },
  {
    key: 'F',
    description: 'Focus mode',
    ctrlKey: true,
  },
  {
    key: 'P',
    description: 'Page view',
    ctrlKey: true,
  },
];

interface KeyboardShortcutsProps {
  className?: string;
}

export function KeyboardShortcuts({ className }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              
              <div className="flex items-center gap-1">
                {shortcut.ctrlKey && (
                  <kbd className="px-2 py-1 text-xs font-semibold rounded bg-muted">
                    Ctrl
                  </kbd>
                )}
                
                {shortcut.shiftKey && (
                  <kbd className="px-2 py-1 text-xs font-semibold rounded bg-muted">
                    Shift
                  </kbd>
                )}
                
                {shortcut.altKey && (
                  <kbd className="px-2 py-1 text-xs font-semibold rounded bg-muted">
                    Alt
                  </kbd>
                )}
                
                {shortcut.metaKey && (
                  <kbd className="px-2 py-1 text-xs font-semibold rounded bg-muted">
                    ⌘
                  </kbd>
                )}
                
                <kbd className="px-2 py-1 text-xs font-semibold rounded bg-muted">
                  {shortcut.key}
                </kbd>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 