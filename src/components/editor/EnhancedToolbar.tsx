import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bold, Italic, Underline, Strikethrough, Code,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Minus,
  Type, Palette, Save, Maximize2, Minimize2,
  Undo, Redo, Link, Image, Table
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface EnhancedToolbarProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  selectedTheme?: string;
  onThemeChange?: (theme: string) => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  onFormatClick: (format: string, value?: any) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isMobile?: boolean;
  editorRef?: any;
  extraActions?: React.ReactElement;
}

const fonts = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New (Monospace)' },
  { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
];

const themes = [
  { value: 'default', label: 'Default', colors: { bg: '#ffffff', text: '#000000' } },
  { value: 'dark', label: 'Dark Mode', colors: { bg: '#1a1a1a', text: '#ffffff' } },
  { value: 'sepia', label: 'Sepia', colors: { bg: '#f4f3e8', text: '#5c4b37' } },
  { value: 'focus', label: 'Focus Blue', colors: { bg: '#f8fafc', text: '#1e293b' } },
  { value: 'warm', label: 'Warm', colors: { bg: '#fef7ed', text: '#9a3412' } },
  { value: 'forest', label: 'Forest', colors: { bg: '#f0fdf4', text: '#14532d' } },
];

const headings = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
];

export const EnhancedToolbar = ({
  selectedFont,
  onFontChange,
  selectedTheme = 'default',
  onThemeChange = () => {},
  isFocusMode,
  onToggleFocus,
  onSave,
  hasUnsavedChanges,
  onFormatClick,
  onUndo = () => {},
  onRedo = () => {},
  canUndo = false,
  canRedo = false,
  isMobile = false,
  editorRef,
  extraActions,
}: EnhancedToolbarProps) => {
  const { t } = useTranslation();
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [showMoreOptions, setShowMoreOptions] = useState(false);

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
          strike: !!format.strike,
          code: !!format.code,
          'align-center': format.align === 'center',
          'align-right': format.align === 'right',
          'align-justify': format.align === 'justify',
          'align-left': !format.align || format.align === 'left',
          'list-bullet': format.list === 'bullet',
          'list-ordered': format.list === 'ordered',
          blockquote: !!format.blockquote,
          header: format.header || 'paragraph',
        });
      } catch (error) {
        console.error('Error checking formats:', error);
      }
    };

    const quill = editorRef?.current?.getEditor();
    if (quill) {
      quill.on('selection-change', checkFormats);
      quill.on('text-change', checkFormats);
      checkFormats();
      
      return () => {
        quill.off('selection-change', checkFormats);
        quill.off('text-change', checkFormats);
      };
    }
  }, [editorRef]);

  // Get current theme label
  const currentTheme = themes.find(theme => theme.value === selectedTheme) || themes[0];

  if (isFocusMode && !isMobile) {
    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-full">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className={`h-9 px-4 text-sm font-medium ${hasUnsavedChanges ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-500'}`}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFocus}
          className="h-9 px-4 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          <Minimize2 className="h-4 w-4 mr-2" />
          Exit Focus
        </Button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-full">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Essential mobile formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('bold')}
            className={`h-9 w-9 p-0 ${activeFormats.bold ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('italic')}
            className={`h-9 w-9 p-0 ${activeFormats.italic ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('list', 'bullet')}
            className={`h-9 w-9 p-0 ${activeFormats['list-bullet'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                <Type className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Font</label>
                  <Select value={selectedFont} onValueChange={onFontChange}>
                    <SelectTrigger className="w-full h-9 text-gray-900 dark:text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {fonts.map((font) => (
                        <SelectItem 
                          key={font.value} 
                          value={font.value}
                          className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Theme</label>
                  <Select value={selectedTheme} onValueChange={onThemeChange}>
                    <SelectTrigger className="w-full h-9 text-gray-900 dark:text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      {themes.map((theme) => (
                        <SelectItem 
                          key={theme.value} 
                          value={theme.value}
                          className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            className="h-9 px-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Focus
          </Button>
        </div>
      </div>
    );
  }

  // Professional desktop toolbar
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-full">
      <div className="flex items-center justify-between p-4 min-w-0">
        <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden">
          {/* History controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-9 w-9 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-9 w-9 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Font and Theme selectors with proper contrast */}
          <div className="flex items-center gap-3 min-w-0">
            <Select value={selectedFont} onValueChange={onFontChange}>
              <SelectTrigger className="w-40 h-9 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                {fonts.map((font) => (
                  <SelectItem 
                    key={font.value} 
                    value={font.value} 
                    style={{ fontFamily: font.value }}
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTheme} onValueChange={onThemeChange}>
              <SelectTrigger className="w-32 h-9 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue>
                  {currentTheme.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
                {themes.map((theme) => (
                  <SelectItem 
                    key={theme.value} 
                    value={theme.value}
                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300" 
                        style={{ backgroundColor: theme.colors.bg }}
                      />
                      {theme.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Heading selector */}
          <Select 
            value={typeof activeFormats.header === 'string' ? activeFormats.header : 'paragraph'} 
            onValueChange={(value) => onFormatClick('header', value === 'paragraph' ? false : value)}
          >
            <SelectTrigger className="w-32 h-9 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
              {headings.map((heading) => (
                <SelectItem 
                  key={heading.value} 
                  value={heading.value}
                  className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  {heading.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Text formatting */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('bold')}
              className={`h-9 w-9 p-0 font-semibold ${activeFormats.bold ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('italic')}
              className={`h-9 w-9 p-0 ${activeFormats.italic ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('underline')}
              className={`h-9 w-9 p-0 ${activeFormats.underline ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('strike')}
              className={`h-9 w-9 p-0 ${activeFormats.strike ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('align', 'left')}
              className={`h-9 w-9 p-0 ${activeFormats['align-left'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('align', 'center')}
              className={`h-9 w-9 p-0 ${activeFormats['align-center'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('align', 'right')}
              className={`h-9 w-9 p-0 ${activeFormats['align-right'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists and blocks */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('list', 'bullet')}
              className={`h-9 w-9 p-0 ${activeFormats['list-bullet'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('list', 'ordered')}
              className={`h-9 w-9 p-0 ${activeFormats['list-ordered'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('blockquote')}
              className={`h-9 w-9 p-0 ${activeFormats.blockquote ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          {/* Extra actions */}
          {extraActions && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-shrink-0">
                {extraActions}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            className="h-9 px-4 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Focus Mode
          </Button>
        </div>
      </div>
    </div>
  );
};
