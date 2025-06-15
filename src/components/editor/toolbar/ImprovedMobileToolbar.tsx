
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, Italic, Underline, Code, List, ListOrdered, Quote,
  Undo, Redo, Type, Palette, MoreHorizontal
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ImprovedMobileToolbarProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  activeFormats: Record<string, any>;
  onFormatClick: (format: string, value?: any) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const fonts = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Roboto', label: 'Roboto' },
];

const headings = [
  { value: 'false', label: 'Normal' },
  { value: '1', label: 'Heading 1' },
  { value: '2', label: 'Heading 2' },
  { value: '3', label: 'Heading 3' },
];

export const ImprovedMobileToolbar = ({
  selectedFont,
  onFontChange,
  activeFormats,
  onFormatClick,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: ImprovedMobileToolbarProps) => {
  const currentHeaderValue = activeFormats.header === false ? 'false' : String(activeFormats.header);

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Primary toolbar row */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Essential formatting with better touch targets */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-11 w-11 p-0 touch-manipulation"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 w-11 p-0 touch-manipulation"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo className="h-5 w-5" />
          </Button>
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2" />
          <Button
            variant="ghost"
            size="sm"
            className={`h-11 w-11 p-0 touch-manipulation ${
              Boolean(activeFormats.bold) ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : ''
            }`}
            onClick={() => onFormatClick('bold')}
          >
            <Bold className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-11 w-11 p-0 touch-manipulation ${
              Boolean(activeFormats.italic) ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : ''
            }`}
            onClick={() => onFormatClick('italic')}
          >
            <Italic className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-11 w-11 p-0 touch-manipulation ${
              Boolean(activeFormats.underline) ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : ''
            }`}
            onClick={() => onFormatClick('underline')}
          >
            <Underline className="h-5 w-5" />
          </Button>
        </div>

        {/* More options */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-11 w-11 p-0 touch-manipulation">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              {/* Font and style selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Font</label>
                  <Select value={selectedFont} onValueChange={onFontChange}>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map((font) => (
                        <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Style</label>
                  <Select 
                    value={currentHeaderValue} 
                    onValueChange={(value) => onFormatClick('header', value === 'false' ? false : value)}
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {headings.map((heading) => (
                        <SelectItem key={heading.value} value={heading.value}>
                          {heading.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional formatting options */}
              <div>
                <label className="text-sm font-medium mb-3 block">Formatting</label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-11 w-11 p-0 touch-manipulation ${
                      Boolean(activeFormats.code) ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : ''
                    }`}
                    onClick={() => onFormatClick('code')}
                  >
                    <Code className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-11 w-11 p-0 touch-manipulation ${
                      activeFormats.list === 'bullet' ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : ''
                    }`}
                    onClick={() => onFormatClick('list', 'bullet')}
                  >
                    <List className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-11 w-11 p-0 touch-manipulation ${
                      activeFormats.list === 'ordered' ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : ''
                    }`}
                    onClick={() => onFormatClick('list', 'ordered')}
                  >
                    <ListOrdered className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-11 w-11 p-0 touch-manipulation ${
                      Boolean(activeFormats.blockquote) ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : ''
                    }`}
                    onClick={() => onFormatClick('blockquote')}
                  >
                    <Quote className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
