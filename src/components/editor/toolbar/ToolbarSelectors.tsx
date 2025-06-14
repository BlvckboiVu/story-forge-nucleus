
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ToolbarSelectorsProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
  selectedTheme: string;
  onThemeChange: (theme: string) => void;
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

export const ToolbarSelectors = ({
  selectedFont,
  onFontChange,
  selectedTheme,
  onThemeChange,
  activeFormats,
  onFormatClick
}: ToolbarSelectorsProps) => {
  const currentTheme = themes.find(theme => theme.value === selectedTheme) || themes[0];

  return (
    <>
      {/* Font and Theme selectors */}
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
    </>
  );
};
