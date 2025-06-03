
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import OutlinePanel from './OutlinePanel';

interface OutlinePopupProps {
  className?: string;
}

export default function OutlinePopup({ className }: OutlinePopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 ${className}`}
          title="Story Outline"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Story Outline</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <OutlinePanel className="border-0 shadow-none p-0" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
