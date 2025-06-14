import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Save, Maximize2, Minimize2,
  Undo, Redo, Type
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolbarFormattingButtons } from './toolbar/ToolbarFormattingButtons';
import { ToolbarSelectors } from './toolbar/ToolbarSelectors';

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
          <ToolbarFormattingButtons
            activeFormats={activeFormats}
            onFormatClick={onFormatClick}
            isMobile={true}
          />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                <Type className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-4">
                <ToolbarSelectors
                  selectedFont={selectedFont}
                  onFontChange={onFontChange}
                  selectedTheme={selectedTheme}
                  onThemeChange={onThemeChange}
                  activeFormats={activeFormats}
                  onFormatClick={onFormatClick}
                />
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

          <ToolbarSelectors
            selectedFont={selectedFont}
            onFontChange={onFontChange}
            selectedTheme={selectedTheme}
            onThemeChange={onThemeChange}
            activeFormats={activeFormats}
            onFormatClick={onFormatClick}
          />

          <Separator orientation="vertical" className="h-6" />

          <ToolbarFormattingButtons
            activeFormats={activeFormats}
            onFormatClick={onFormatClick}
            isMobile={false}
          />

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
