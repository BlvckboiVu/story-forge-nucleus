
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Settings2, BookOpen, Scroll } from 'lucide-react';

interface WritingViewOptionsProps {
  viewMode: 'scroll' | 'page';
  onViewModeChange: (mode: 'scroll' | 'page') => void;
  pageHeight?: number;
  onPageHeightChange?: (height: number) => void;
}

export const WritingViewOptions = ({
  viewMode,
  onViewModeChange,
  pageHeight = 800,
  onPageHeightChange
}: WritingViewOptionsProps) => {
  const [open, setOpen] = useState(false);

  const pageHeights = [
    { label: 'A4 (210mm)', value: 800 },
    { label: 'Letter (8.5")', value: 850 },
    { label: 'Legal (14")', value: 1100 },
    { label: 'Custom', value: pageHeight }
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">View</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Writing Mode</Label>
            <RadioGroup
              value={viewMode}
              onValueChange={(value) => onViewModeChange(value as 'scroll' | 'page')}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scroll" id="scroll" />
                <Label htmlFor="scroll" className="flex items-center gap-2 text-sm">
                  <Scroll className="h-4 w-4" />
                  Continuous Scroll
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="page" id="page" />
                <Label htmlFor="page" className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4" />
                  Page View
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {viewMode === 'page' && onPageHeightChange && (
            <div>
              <Label className="text-sm font-medium">Page Size</Label>
              <RadioGroup
                value={pageHeight.toString()}
                onValueChange={(value) => onPageHeightChange(parseInt(value))}
                className="mt-2"
              >
                {pageHeights.map((size) => (
                  <div key={size.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={size.value.toString()} id={size.value.toString()} />
                    <Label htmlFor={size.value.toString()} className="text-sm">
                      {size.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
