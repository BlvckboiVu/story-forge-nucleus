
import { Check, Clock, AlertTriangle, Wifi, WifiOff, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ModernStatusBarProps {
  stats: {
    words: number;
    pages: number;
    readingTime: string;
  };
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  saveError?: string | null;
  isValid: boolean;
  isOnline?: boolean;
  performanceScore?: number;
}

export const ModernStatusBar = ({
  stats,
  hasUnsavedChanges,
  isSaving,
  saveError,
  isValid,
  isOnline = true,
  performanceScore = 100
}: ModernStatusBarProps) => {
  const getSaveStatus = () => {
    if (saveError) {
      return {
        icon: AlertTriangle,
        text: 'Save failed',
        color: 'text-red-600 dark:text-red-400'
      };
    }
    if (isSaving) {
      return {
        icon: Clock,
        text: 'Saving...',
        color: 'text-blue-600 dark:text-blue-400'
      };
    }
    if (hasUnsavedChanges) {
      return {
        icon: Clock,
        text: 'Unsaved',
        color: 'text-orange-600 dark:text-orange-400'
      };
    }
    return {
      icon: Check,
      text: 'Saved',
      color: 'text-green-600 dark:text-green-400'
    };
  };

  const saveStatus = getSaveStatus();
  const SaveIcon = saveStatus.icon;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between text-sm">
        {/* Left: Document stats */}
        <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span className="font-medium">{stats.words.toLocaleString()} words</span>
            <span>{stats.pages} pages</span>
            <span>{stats.readingTime}</span>
          </div>
        </div>

        {/* Right: Status indicators */}
        <div className="flex items-center space-x-4">
          {/* Validation status */}
          {!isValid && (
            <Badge variant="destructive" className="text-xs">
              Invalid content
            </Badge>
          )}

          {/* Performance indicator */}
          {performanceScore < 80 && (
            <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Performance: {performanceScore}%</span>
            </div>
          )}

          {/* Connection status */}
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <Wifi className="h-3 w-3 text-green-600 dark:text-green-400" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-600 dark:text-red-400" />
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Save status */}
          <div className={`flex items-center space-x-1 ${saveStatus.color}`}>
            <SaveIcon className="h-3 w-3" />
            <span className="text-xs font-medium">{saveStatus.text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
