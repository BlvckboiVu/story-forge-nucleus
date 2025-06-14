import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Book, X } from 'lucide-react';

interface StoryBibleEntry {
  id: string;
  title: string;
  content: string;
  type: string;
}

interface StoryBiblePanelProps {
  entries: StoryBibleEntry[];
  selectedEntry: StoryBibleEntry | null;
  onEntrySelect: (entry: StoryBibleEntry | null) => void;
  className?: string;
}

export function StoryBiblePanel({
  entries,
  selectedEntry,
  onEntrySelect,
  className,
}: StoryBiblePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'relative',
            selectedEntry && 'text-primary',
            className
          )}
        >
          <Book className="h-4 w-4" />
          {selectedEntry && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Story Bible</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'p-2 rounded-md cursor-pointer hover:bg-muted',
                    selectedEntry?.id === entry.id && 'bg-muted'
                  )}
                  onClick={() => onEntrySelect(entry)}
                >
                  <h3 className="font-medium">{entry.title}</h3>
                  <p className="text-sm text-muted-foreground">{entry.type}</p>
                </div>
              ))}
            </ScrollArea>
          </div>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedEntry.title}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEntrySelect(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p>{selectedEntry.content}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 