
import { Button } from '@/components/ui/button';
import { Minimize2, Save, MoreHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FocusModeProps {
  onExitFocus: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  wordCount: number;
  children: React.ReactNode;
}

export const FocusMode = ({
  onExitFocus,
  onSave,
  hasUnsavedChanges,
  wordCount,
  children
}: FocusModeProps) => {
  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative">
      {/* Minimal floating controls */}
      <div className="absolute top-6 right-6 z-10 flex items-center space-x-2">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 px-3 py-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {wordCount.toLocaleString()} words
          </span>
        </div>
        
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-1 flex items-center space-x-1">
          {hasUnsavedChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              className="h-8 w-8 p-0 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Save (Ctrl+S)"
            >
              <Save className="h-3 w-3" />
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                title="Options"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onExitFocus}
                className="w-full justify-start text-sm"
              >
                <Minimize2 className="h-3 w-3 mr-2" />
                Exit Focus Mode
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Editor content with enhanced focus styling */}
      <div className="h-full w-full overflow-auto">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 min-h-[600px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
