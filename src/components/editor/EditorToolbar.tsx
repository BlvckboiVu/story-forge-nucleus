
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditorToolbarProps {
  selectedFont: string;
  onFontChange: (font: string) => void;
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

export const EditorToolbar = ({ selectedFont, onFontChange }: EditorToolbarProps) => {
  return (
    <div className="mb-4 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="font-select" className="text-sm font-medium">Font:</label>
        <Select value={selectedFont} onValueChange={onFontChange}>
          <SelectTrigger className="w-[180px]" id="font-select">
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
    </div>
  );
};
