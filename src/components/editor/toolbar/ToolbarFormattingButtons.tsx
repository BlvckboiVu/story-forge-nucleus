
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Underline, Strikethrough, Code,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote
} from 'lucide-react';

interface ToolbarFormattingButtonsProps {
  activeFormats: Record<string, boolean>;
  onFormatClick: (format: string, value?: any) => void;
  isMobile?: boolean;
}

export const ToolbarFormattingButtons = ({
  activeFormats,
  onFormatClick,
  isMobile = false
}: ToolbarFormattingButtonsProps) => {
  const buttonSize = isMobile ? "sm" : "sm";
  const iconSize = isMobile ? "h-3 w-3" : "h-4 w-4";
  const buttonClass = `h-8 w-8 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${isMobile ? 'lg:h-9 lg:w-9' : ''}`;

  // Essential buttons for mobile
  const essentialButtons = [
    { format: 'bold', icon: Bold, active: activeFormats.bold, title: 'Bold' },
    { format: 'italic', icon: Italic, active: activeFormats.italic, title: 'Italic' },
    { format: 'underline', icon: Underline, active: activeFormats.underline, title: 'Underline' },
  ];

  // Additional buttons for larger screens
  const additionalButtons = [
    { format: 'strike', icon: Strikethrough, active: activeFormats.strike, title: 'Strikethrough' },
    { format: 'code', icon: Code, active: activeFormats.code, title: 'Code' },
  ];

  // Alignment buttons
  const alignmentButtons = [
    { format: 'align', value: 'left', icon: AlignLeft, active: activeFormats['align-left'], title: 'Align Left' },
    { format: 'align', value: 'center', icon: AlignCenter, active: activeFormats['align-center'], title: 'Align Center' },
    { format: 'align', value: 'right', icon: AlignRight, active: activeFormats['align-right'], title: 'Align Right' },
    { format: 'align', value: 'justify', icon: AlignJustify, active: activeFormats['align-justify'], title: 'Justify' },
  ];

  // List buttons
  const listButtons = [
    { format: 'list', value: 'bullet', icon: List, active: activeFormats['list-bullet'], title: 'Bullet List' },
    { format: 'list', value: 'ordered', icon: ListOrdered, active: activeFormats['list-ordered'], title: 'Numbered List' },
    { format: 'blockquote', icon: Quote, active: activeFormats.blockquote, title: 'Quote' },
  ];

  if (isMobile) {
    return (
      <div className="flex items-center gap-1">
        {/* Essential formatting always visible */}
        {essentialButtons.map(({ format, icon: Icon, active, title }) => (
          <Button
            key={format}
            variant={active ? "default" : "ghost"}
            size={buttonSize}
            onClick={() => onFormatClick(format)}
            className={`${buttonClass} ${active ? 'bg-gray-200 text-gray-900' : ''}`}
            title={title}
          >
            <Icon className={iconSize} />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 lg:gap-2">
      {/* Text formatting */}
      <div className="flex items-center gap-1">
        {essentialButtons.map(({ format, icon: Icon, active, title }) => (
          <Button
            key={format}
            variant={active ? "default" : "ghost"}
            size={buttonSize}
            onClick={() => onFormatClick(format)}
            className={`${buttonClass} ${active ? 'bg-gray-200 text-gray-900' : ''}`}
            title={title}
          >
            <Icon className={iconSize} />
          </Button>
        ))}
        
        {/* Additional formatting on larger screens */}
        <div className="hidden lg:flex items-center gap-1">
          {additionalButtons.map(({ format, icon: Icon, active, title }) => (
            <Button
              key={format}
              variant={active ? "default" : "ghost"}
              size={buttonSize}
              onClick={() => onFormatClick(format)}
              className={`${buttonClass} ${active ? 'bg-gray-200 text-gray-900' : ''}`}
              title={title}
            >
              <Icon className={iconSize} />
            </Button>
          ))}
        </div>
      </div>

      {/* Alignment - hidden on smaller screens */}
      <div className="hidden xl:flex items-center gap-1 ml-2">
        {alignmentButtons.map(({ format, value, icon: Icon, active, title }) => (
          <Button
            key={`${format}-${value}`}
            variant={active ? "default" : "ghost"}
            size={buttonSize}
            onClick={() => onFormatClick(format, value)}
            className={`${buttonClass} ${active ? 'bg-gray-200 text-gray-900' : ''}`}
            title={title}
          >
            <Icon className={iconSize} />
          </Button>
        ))}
      </div>

      {/* Lists - shown on desktop */}
      <div className="hidden lg:flex items-center gap-1 ml-2">
        {listButtons.map(({ format, value, icon: Icon, active, title }) => (
          <Button
            key={`${format}-${value || 'default'}`}
            variant={active ? "default" : "ghost"}
            size={buttonSize}
            onClick={() => onFormatClick(format, value)}
            className={`${buttonClass} ${active ? 'bg-gray-200 text-gray-900' : ''}`}
            title={title}
          >
            <Icon className={iconSize} />
          </Button>
        ))}
      </div>
    </div>
  );
};
