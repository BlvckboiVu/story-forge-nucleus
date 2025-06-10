
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Navigation } from './Navigation';

interface MobileNavProps {
  showEditorPanels?: boolean;
  onInsertLLMResponse?: (text: string) => void;
}

export function MobileNav({ showEditorPanels, onInsertLLMResponse }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <Navigation
          showEditorPanels={showEditorPanels}
          onInsertLLMResponse={onInsertLLMResponse}
        />
      </SheetContent>
    </Sheet>
  );
}
