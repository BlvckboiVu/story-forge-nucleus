// IntegratedToolbar.tsx
// Custom toolbar for the rich text editor, providing formatting, font, alignment, and view options

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Save,
  Maximize2,
  Minimize2,
  Type
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState, useEffect } from 'react';

/**
 * Props for the IntegratedToolbar component
 * @property selectedFont - The currently selected font
 * @property onFontChange - Callback to change the font
 * @property isFocusMode - Whether the editor is in focus mode
 * @property onToggleFocus - Callback to toggle focus mode
 * @property onSave - Callback to save the document
 * @property hasUnsavedChanges - Whether there are unsaved changes
 * @property onFormatClick - Callback for formatting actions
 * @property isMobile - Whether the toolbar is in mobile mode
 * @property extraActions - Additional actions to render
 * @property editorRef - Ref to the editor instance
 */
interface IntegratedToolbarProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  onFormatClick: (format: string) => void;
  isMobile?: boolean;
  extraActions?: React.ReactNode;
  editorRef?: any;
}

const fonts = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Palatino', label: 'Palatino' },
];

/**
 * IntegratedToolbar - Custom toolbar for the rich text editor
 * Provides formatting, font, alignment, and view options for desktop and mobile
 */
export const IntegratedToolbar = ({
  selectedFont,
  onFontChange,
  isFocusMode,
  onToggleFocus,
  onSave,
  hasUnsavedChanges,
  onFormatClick,
  isMobile = false,
  extraActions,
  editorRef,
}: IntegratedToolbarProps) => {
  // State for font popover and active formats
  const [fontPopoverOpen, setFontPopoverOpen] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  // Check active formats from editor
  useEffect(() => {
    const checkFormats = () => {
      if (!editorRef?.current?.getEditor) return;
      
      try {
        const quill = editorRef.current.getEditor();
        const range = quill.getSelection();
        if (!range) return;

        const format = quill.getFormat(range);
        setActiveFormats({
          bold: !!format.bold,
          italic: !!format.italic,
          underline: !!format.underline,
          'align-center': format.align === 'center',
          'align-right': format.align === 'right',
          'align-left': !format.align || format.align === 'left',
          'list-bullet': format.list === 'bullet',
          'list-ordered': format.list === 'ordered',
          blockquote: !!format.blockquote,
        });
      } catch (error) {
        console.error('Error checking formats:', error);
      }
    };

    const quill = editorRef?.current?.getEditor();
    if (quill) {
      quill.on('selection-change', checkFormats);
      quill.on('text-change', checkFormats);
      checkFormats(); // Initial check
      
      return () => {
        quill.off('selection-change', checkFormats);
        quill.off('text-change', checkFormats);
      };
    }
  }, [editorRef]);

  // Formatting, alignment, and list button configs
  const formatButtons = [
    { format: 'bold', icon: Bold, label: 'Bold (Ctrl+B)' },
    { format: 'italic', icon: Italic, label: 'Italic (Ctrl+I)' },
    { format: 'underline', icon: Underline, label: 'Underline (Ctrl+U)' },
  ];

  const alignButtons = [
    { format: 'align-left', icon: AlignLeft, label: 'Align Left' },
    { format: 'align-center', icon: AlignCenter, label: 'Align Center' },
    { format: 'align-right', icon: AlignRight, label: 'Align Right' },
  ];

  const listButtons = [
    { format: 'list-bullet', icon: List, label: 'Bullet List' },
    { format: 'list-ordered', icon: ListOrdered, label: 'Numbered List' },
    { format: 'blockquote', icon: Quote, label: 'Quote' },
  ];

  if (isFocusMode) {
    return (
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[56px]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className={`h-9 text-sm ${hasUnsavedChanges ? 'text-blue-600' : ''}`}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFocus}
          className="h-9 w-9"
          title="Exit Focus Mode"
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[56px]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Font Selection for Mobile */}
          <Popover open={fontPopoverOpen} onOpenChange={setFontPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0" title="Font">
                <Type className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="start">
              <div className="space-y-2">
                <p className="text-sm font-medium">Font Family</p>
                <Select value={selectedFont} onValueChange={(value) => {
                  onFontChange(value);
                  setFontPopoverOpen(false);
                }}>
                  <SelectTrigger className="w-full h-8">
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
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Essential Format Buttons */}
          {formatButtons.map(({ format, icon: Icon, label }) => (
            <Button
              key={format}
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick(format)}
              title={label}
              className={`h-9 w-9 p-0 transition-colors ${
                activeFormats[format] 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* List Button for Mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('list-bullet')}
            title="Bullet List"
            className={`h-9 w-9 p-0 transition-colors ${
              activeFormats['list-bullet']
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-3">
          {extraActions}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            className="h-9 w-9 p-0"
            title="Focus Mode"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop toolbar
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 min-h-[64px]">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Font Selection */}
        <div className="flex items-center gap-3">
          <label htmlFor="font-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Font:
          </label>
          <Select value={selectedFont} onValueChange={onFontChange}>
            <SelectTrigger className="w-[160px] h-9 border-gray-300 dark:border-gray-600" id="font-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50">
              {fonts.map((font) => (
                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-7" />

        {/* Format Buttons */}
        <div className="flex items-center gap-1">
          {formatButtons.map(({ format, icon: Icon, label }) => (
            <Button
              key={format}
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick(format)}
              title={label}
              className={`h-9 w-9 p-0 transition-colors ${
                activeFormats[format]
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-7" />

        {/* Alignment Buttons */}
        <div className="flex items-center gap-1">
          {alignButtons.map(({ format, icon: Icon, label }) => (
            <Button
              key={format}
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick(format)}
              title={label}
              className={`h-9 w-9 p-0 transition-colors ${
                activeFormats[format]
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-7" />

        {/* List and Quote Buttons */}
        <div className="flex items-center gap-1">
          {listButtons.map(({ format, icon: Icon, label }) => (
            <Button
              key={format}
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick(format)}
              title={label}
              className={`h-9 w-9 p-0 transition-colors ${
                activeFormats[format]
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        {extraActions}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFocus}
          className="h-9 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Maximize2 className="h-4 w-4 mr-2" />
          Focus
        </Button>
      </div>
    </div>
  );
};
