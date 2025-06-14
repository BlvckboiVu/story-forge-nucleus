
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ToolbarSelectorsProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  activeFormats: Record<string, boolean>;
  onFormatClick: (format: string, value?: any) => void;
}

const fonts = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
];

const headings = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
];

export const ToolbarSelectors = ({
  selectedFont,
  onFontChange,
  activeFormats,
  onFormatClick
}: ToolbarSelectorsProps) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
      {/* Font Selector */}
      <div className="w-full md:w-auto">
        <label className="text-xs text-gray-500 mb-1 block md:hidden">Font</label>
        <Select value={selectedFont} onValueChange={onFontChange}>
          <SelectTrigger className="w-full md:w-32 lg:w-36 h-8 md:h-9 text-xs md:text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
            {fonts.map((font) => (
              <SelectItem 
                key={font.value} 
                value={font.value} 
                style={{ fontFamily: font.value }}
                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-xs md:text-sm"
              >
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Heading Selector */}
      <div className="w-full md:w-auto">
        <label className="text-xs text-gray-500 mb-1 block md:hidden">Style</label>
        <Select 
          value={typeof activeFormats.header === 'string' ? activeFormats.header : 'paragraph'} 
          onValueChange={(value) => onFormatClick('header', value === 'paragraph' ? false : value)}
        >
          <SelectTrigger className="w-full md:w-28 lg:w-32 h-8 md:h-9 text-xs md:text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
            {headings.map((heading) => (
              <SelectItem 
                key={heading.value} 
                value={heading.value}
                className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-xs md:text-sm"
              >
                {heading.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
