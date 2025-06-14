
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Save, Undo, Redo, Type
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

  if (isFocusMode) {
    return (
      <div className="flex items-center justify-center p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 w-full">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Focus Mode - Distraction-free writing
        </div>
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
            <PopoverContent className="w-80 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 z-50" align="start">
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
      </div>
    );
  }

  // Professional desktop toolbar - restored all functionality
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
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-9 w-9 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Font and Theme Selectors - Fixed spacing */}
          <div className="flex items-center gap-3">
            <ToolbarSelectors
              selectedFont={selectedFont}
              onFontChange={onFontChange}
              selectedTheme={selectedTheme}
              onThemeChange={onThemeChange}
              activeFormats={activeFormats}
              onFormatClick={onFormatClick}
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Formatting Buttons */}
          <ToolbarFormattingButtons
            activeFormats={activeFormats}
            onFormatClick={onFormatClick}
            isMobile={false}
          />

          {/* Extra actions if provided */}
          {extraActions && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex-shrink-0">
                {extraActions}
              </div>
            </>
          )}
        </div>

        {/* Right side: Save button */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
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
      </div>
    </div>
  );
};
