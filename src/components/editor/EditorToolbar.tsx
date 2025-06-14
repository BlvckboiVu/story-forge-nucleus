import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Maximize2,
  Minimize2,
  FileText,
} from 'lucide-react';

interface EditorToolbarProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  viewMode: 'normal' | 'focus' | 'page';
  onViewModeChange: (mode: 'normal' | 'focus' | 'page') => void;
  onFormat: (format: string) => void;
  isMobile?: boolean;
  children?: React.ReactNode;
}

const FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Source Serif Pro', label: 'Source Serif Pro' },
  { value: 'Roboto Mono', label: 'Roboto Mono' },
];

export function EditorToolbar({
  selectedFont,
  onFontChange,
  viewMode,
  onViewModeChange,
  onFormat,
  isMobile = false,
  children,
}: EditorToolbarProps) {
  const handleFormat = (format: string) => {
    document.execCommand(format, false);
    onFormat(format);
  };
  
  return (
    <div className={cn(
      'flex items-center gap-2 p-2 border-b',
      isMobile ? 'flex-wrap justify-center' : 'justify-between'
    )}>
      <div className="flex items-center gap-2">
        <Select value={selectedFont} onValueChange={onFontChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Heading1 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleFormat('h1')}>
              <Heading1 className="mr-2 h-4 w-4" />
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFormat('h2')}>
              <Heading2 className="mr-2 h-4 w-4" />
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFormat('h3')}>
              <Heading3 className="mr-2 h-4 w-4" />
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('strikethrough')}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('insertUnorderedList')}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('insertOrderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('code')}
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('justifyLeft')}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('justifyCenter')}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('justifyRight')}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleFormat('justifyFull')}
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange(viewMode === 'focus' ? 'normal' : 'focus')}
        >
          {viewMode === 'focus' ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange(viewMode === 'page' ? 'normal' : 'page')}
        >
          <FileText className="h-4 w-4" />
        </Button>
        
        {children}
      </div>
    </div>
  );
} 