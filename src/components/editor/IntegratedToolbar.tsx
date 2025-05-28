
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
  Minimize2
} from 'lucide-react';

interface IntegratedToolbarProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  onFormatClick: (format: string) => void;
}

const fonts = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Palatino', label: 'Palatino' },
];

export const IntegratedToolbar = ({
  selectedFont,
  onFontChange,
  isFocusMode,
  onToggleFocus,
  onSave,
  hasUnsavedChanges,
  onFormatClick,
}: IntegratedToolbarProps) => {
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
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSave}
            disabled={!hasUnsavedChanges}
            className={hasUnsavedChanges ? 'text-blue-600' : ''}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFocus}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        {/* Font Selection */}
        <div className="flex items-center gap-2">
          <label htmlFor="font-select" className="text-sm font-medium">Font:</label>
          <Select value={selectedFont} onValueChange={onFontChange}>
            <SelectTrigger className="w-[140px]" id="font-select">
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

        <Separator orientation="vertical" className="h-6" />

        {/* Format Buttons */}
        <div className="flex items-center gap-1">
          {formatButtons.map(({ format, icon: Icon, label }) => (
            <Button
              key={format}
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick(format)}
              title={label}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment Buttons */}
        <div className="flex items-center gap-1">
          {alignButtons.map(({ format, icon: Icon, label }) => (
            <Button
              key={format}
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick(format)}
              title={label}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* List Buttons */}
        <div className="flex items-center gap-1">
          {listButtons.map(({ format, icon: Icon, label }) => (
            <Button
              key={format}
              variant="ghost"
              size="sm"
              onClick={() => onFormatClick(format)}
              title={label}
              className="h-8 w-8 p-0"
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          className={hasUnsavedChanges ? 'text-blue-600' : ''}
        >
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFocus}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
