
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
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
  const buttonClass = "h-9 w-9 p-0";

  return (
    <>
      {/* Text formatting */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size={buttonSize}
          onClick={() => onFormatClick('bold')}
          className={`${buttonClass} font-semibold ${activeFormats.bold ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size={buttonSize}
          onClick={() => onFormatClick('italic')}
          className={`${buttonClass} ${activeFormats.italic ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        {!isMobile && (
          <>
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={() => onFormatClick('underline')}
              className={`${buttonClass} ${activeFormats.underline ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Underline className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={() => onFormatClick('strike')}
              className={`${buttonClass} ${activeFormats.strike ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {!isMobile && (
        <>
          {/* Alignment */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={() => onFormatClick('align', 'left')}
              className={`${buttonClass} ${activeFormats['align-left'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={() => onFormatClick('align', 'center')}
              className={`${buttonClass} ${activeFormats['align-center'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={() => onFormatClick('align', 'right')}
              className={`${buttonClass} ${activeFormats['align-right'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists and blocks */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={() => onFormatClick('list', 'bullet')}
              className={`${buttonClass} ${activeFormats['list-bullet'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={() => onFormatClick('list', 'ordered')}
              className={`${buttonClass} ${activeFormats['list-ordered'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size={buttonSize}
              onClick={() => onFormatClick('blockquote')}
              className={`${buttonClass} ${activeFormats.blockquote ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* Mobile list button */}
      {isMobile && (
        <Button
          variant="ghost"
          size={buttonSize}
          onClick={() => onFormatClick('list', 'bullet')}
          className={`${buttonClass} ${activeFormats['list-bullet'] ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
        >
          <List className="h-4 w-4" />
        </Button>
      )}
    </>
  );
};
