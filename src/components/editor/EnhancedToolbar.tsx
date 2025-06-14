
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
  selectedTheme: string;
  onThemeChange: (theme: string) => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  onFormatClick: (format: string, value?: any) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isMobile?: boolean;
  editorRef?: any;
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
  selectedTheme,
  onThemeChange,
  isFocusMode,
  onToggleFocus,
  onSave,
  hasUnsavedChanges,
  onFormatClick,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isMobile = false,
  editorRef,
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

  if (isFocusMode && !isMobile) {
    return (
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className={`h-8 text-sm ${hasUnsavedChanges ? 'text-blue-600' : ''}`}
            title={t('save')}
          >
            <Save className="h-4 w-4 mr-1" />
            {t('save')}
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFocus}
          className="h-8 w-8 p-0"
          title={t('exitFocusMode')}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-1 flex-1">
          {/* Essential formatting for mobile */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('bold')}
            className={`h-8 w-8 p-0 ${activeFormats.bold ? 'bg-blue-100 text-blue-700' : ''}`}
            title={t('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('italic')}
            className={`h-8 w-8 p-0 ${activeFormats.italic ? 'bg-blue-100 text-blue-700' : ''}`}
            title={t('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('list-bullet')}
            className={`h-8 w-8 p-0 ${activeFormats['list-bullet'] ? 'bg-blue-100 text-blue-700' : ''}`}
            title={t('bulletList')}
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={t('moreOptions')}>
                <Type className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">{t('font')}</label>
                  <Select value={selectedFont} onValueChange={onFontChange}>
                    <SelectTrigger className="w-full h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fonts.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('theme')}</label>
                  <Select value={selectedTheme} onValueChange={onThemeChange}>
                    <SelectTrigger className="w-full h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
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
            className="h-8 w-8 p-0"
            title={t('focusMode')}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Desktop toolbar
  return (
    <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Main toolbar row */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-8 w-8 p-0"
              title={t('undo')}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="h-8 w-8 p-0"
              title={t('redo')}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Font and Theme */}
          <div className="flex items-center gap-2">
            <Select value={selectedFont} onValueChange={onFontChange}>
              <SelectTrigger className="w-40 h-8">
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

            <Select value={selectedTheme} onValueChange={onThemeChange}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {themes.map((theme) => (
                  <SelectItem key={theme.value} value={theme.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border" 
                        style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.text }}
                      />
                      {theme.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Heading */}
          <Select 
            value={activeFormats.header || 'paragraph'} 
            onValueChange={(value) => onFormatClick('header', value === 'paragraph' ? false : value)}
          >
            <SelectTrigger className="w-32 h-8">
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

          <Separator orientation="vertical" className="h-6" />

          {/* Text formatting */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('bold')}
              className={`h-8 w-8 p-0 ${activeFormats.bold ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('bold')}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('italic')}
              className={`h-8 w-8 p-0 ${activeFormats.italic ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('italic')}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('underline')}
              className={`h-8 w-8 p-0 ${activeFormats.underline ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('underline')}
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('strike')}
              className={`h-8 w-8 p-0 ${activeFormats.strike ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('strikethrough')}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('code')}
              className={`h-8 w-8 p-0 ${activeFormats.code ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('code')}
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('align', 'left')}
              className={`h-8 w-8 p-0 ${activeFormats['align-left'] ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('alignLeft')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('align', 'center')}
              className={`h-8 w-8 p-0 ${activeFormats['align-center'] ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('alignCenter')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('align', 'right')}
              className={`h-8 w-8 p-0 ${activeFormats['align-right'] ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('alignRight')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('align', 'justify')}
              className={`h-8 w-8 p-0 ${activeFormats['align-justify'] ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('alignJustify')}
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists and blocks */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('list', 'bullet')}
              className={`h-8 w-8 p-0 ${activeFormats['list-bullet'] ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('bulletList')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('list', 'ordered')}
              className={`h-8 w-8 p-0 ${activeFormats['list-ordered'] ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('numberedList')}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('blockquote')}
              className={`h-8 w-8 p-0 ${activeFormats.blockquote ? 'bg-blue-100 text-blue-700' : ''}`}
              title={t('quote')}
            >
              <Quote className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick('divider')}
              className="h-8 w-8 p-0"
              title={t('divider')}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          {/* More options toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="h-8 px-2"
            title={t('moreOptions')}
          >
            {t('more')}
          </Button>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFocus}
            className="h-8"
            title={t('focusMode')}
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            {t('focus')}
          </Button>
        </div>
      </div>

      {/* Extended options row */}
      {showMoreOptions && (
        <div className="flex items-center gap-2 px-3 pb-3 border-t border-gray-100 dark:border-gray-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('link')}
            className="h-8 w-8 p-0"
            title={t('insertLink')}
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('image')}
            className="h-8 w-8 p-0"
            title={t('insertImage')}
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFormatClick('table')}
            className="h-8 w-8 p-0"
            title={t('insertTable')}
          >
            <Table className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
