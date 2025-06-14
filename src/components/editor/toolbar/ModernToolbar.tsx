
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, Italic, Underline, Strikethrough, Code,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Undo, Redo, Type,
  MoreHorizontal, ChevronDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ModernToolbarProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  activeFormats: Record<string, any>;
  onFormatClick: (format: string, value?: any) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isMobile?: boolean;
  isFocusMode?: boolean;
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

export const ModernToolbar = ({
  selectedFont,
  onFontChange,
  activeFormats,
  onFormatClick,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isMobile = false,
  isFocusMode = false
}: ModernToolbarProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (isFocusMode) {
    return (
      <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-center">
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Focus Mode
        </div>
      </div>
    );
  }

  // Mobile-optimized toolbar
  if (isMobile) {
    return (
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Essential formatting */}
          <div className="flex items-center space-x-1">
            <ToolbarButton
              icon={Undo}
              onClick={onUndo}
              disabled={!canUndo}
              tooltip="Undo"
              size="sm"
            />
            <ToolbarButton
              icon={Redo}
              onClick={onRedo}
              disabled={!canRedo}
              tooltip="Redo"
              size="sm"
            />
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
            <ToolbarButton
              icon={Bold}
              onClick={() => onFormatClick('bold')}
              active={Boolean(activeFormats.bold)}
              tooltip="Bold"
              size="sm"
            />
            <ToolbarButton
              icon={Italic}
              onClick={() => onFormatClick('italic')}
              active={Boolean(activeFormats.italic)}
              tooltip="Italic"
              size="sm"
            />
          </div>

          {/* More options */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <MobileToolbarContent
                selectedFont={selectedFont}
                onFontChange={onFontChange}
                activeFormats={activeFormats}
                onFormatClick={onFormatClick}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }

  // Get current header value as string for Select component
  const currentHeaderValue = activeFormats.header === false ? 'false' : String(activeFormats.header);

  // Desktop toolbar
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* History controls */}
          <div className="flex items-center space-x-1">
            <ToolbarButton
              icon={Undo}
              onClick={onUndo}
              disabled={!canUndo}
              tooltip="Undo (Ctrl+Z)"
            />
            <ToolbarButton
              icon={Redo}
              onClick={onRedo}
              disabled={!canRedo}
              tooltip="Redo (Ctrl+Y)"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Font and style */}
          <div className="flex items-center space-x-3">
            <Select value={selectedFont} onValueChange={onFontChange}>
              <SelectTrigger className="w-36 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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

            <Select 
              value={currentHeaderValue} 
              onValueChange={(value) => onFormatClick('header', value === 'false' ? false : value)}
            >
              <SelectTrigger className="w-32 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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

          <Separator orientation="vertical" className="h-6" />

          {/* Text formatting */}
          <div className="flex items-center space-x-1">
            <ToolbarButton
              icon={Bold}
              onClick={() => onFormatClick('bold')}
              active={Boolean(activeFormats.bold)}
              tooltip="Bold (Ctrl+B)"
            />
            <ToolbarButton
              icon={Italic}
              onClick={() => onFormatClick('italic')}
              active={Boolean(activeFormats.italic)}
              tooltip="Italic (Ctrl+I)"
            />
            <ToolbarButton
              icon={Underline}
              onClick={() => onFormatClick('underline')}
              active={Boolean(activeFormats.underline)}
              tooltip="Underline (Ctrl+U)"
            />
            <ToolbarButton
              icon={Strikethrough}
              onClick={() => onFormatClick('strike')}
              active={Boolean(activeFormats.strike)}
              tooltip="Strikethrough"
            />
            <ToolbarButton
              icon={Code}
              onClick={() => onFormatClick('code')}
              active={Boolean(activeFormats.code)}
              tooltip="Code"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment and lists */}
          <div className="flex items-center space-x-1">
            <ToolbarButton
              icon={AlignLeft}
              onClick={() => onFormatClick('align', 'left')}
              active={!activeFormats.align || activeFormats.align === 'left'}
              tooltip="Align Left"
            />
            <ToolbarButton
              icon={AlignCenter}
              onClick={() => onFormatClick('align', 'center')}
              active={activeFormats.align === 'center'}
              tooltip="Align Center"
            />
            <ToolbarButton
              icon={AlignRight}
              onClick={() => onFormatClick('align', 'right')}
              active={activeFormats.align === 'right'}
              tooltip="Align Right"
            />
          </div>

          <div className="flex items-center space-x-1">
            <ToolbarButton
              icon={List}
              onClick={() => onFormatClick('list', 'bullet')}
              active={activeFormats.list === 'bullet'}
              tooltip="Bullet List"
            />
            <ToolbarButton
              icon={ListOrdered}
              onClick={() => onFormatClick('list', 'ordered')}
              active={activeFormats.list === 'ordered'}
              tooltip="Numbered List"
            />
            <ToolbarButton
              icon={Quote}
              onClick={() => onFormatClick('blockquote')}
              active={Boolean(activeFormats.blockquote)}
              tooltip="Quote"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToolbarButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip: string;
  size?: 'sm' | 'default';
}

const ToolbarButton = ({ 
  icon: Icon, 
  onClick, 
  active = false, 
  disabled = false, 
  tooltip, 
  size = 'default' 
}: ToolbarButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const sizeClasses = size === 'sm' ? "h-8 w-8" : "h-9 w-9";
  const variantClasses = active 
    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800" 
    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100";
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses} ${variantClasses}`}
      title={tooltip}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

const MobileToolbarContent = ({
  selectedFont,
  onFontChange,
  activeFormats,
  onFormatClick
}: {
  selectedFont: string;
  onFontChange: (font: string) => void;
  activeFormats: Record<string, any>;
  onFormatClick: (format: string, value?: any) => void;
}) => {
  const currentHeaderValue = activeFormats.header === false ? 'false' : String(activeFormats.header);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Font</label>
        <Select value={selectedFont} onValueChange={onFontChange}>
          <SelectTrigger className="w-full">
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
          <SelectTrigger className="w-full">
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

      <div>
        <label className="text-sm font-medium mb-2 block">Formatting</label>
        <div className="grid grid-cols-4 gap-2">
          <ToolbarButton
            icon={Underline}
            onClick={() => onFormatClick('underline')}
            active={Boolean(activeFormats.underline)}
            tooltip="Underline"
            size="sm"
          />
          <ToolbarButton
            icon={Strikethrough}
            onClick={() => onFormatClick('strike')}
            active={Boolean(activeFormats.strike)}
            tooltip="Strikethrough"
            size="sm"
          />
          <ToolbarButton
            icon={Code}
            onClick={() => onFormatClick('code')}
            active={Boolean(activeFormats.code)}
            tooltip="Code"
            size="sm"
          />
          <ToolbarButton
            icon={Quote}
            onClick={() => onFormatClick('blockquote')}
            active={Boolean(activeFormats.blockquote)}
            tooltip="Quote"
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
