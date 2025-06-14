
import { AlertTriangle } from 'lucide-react';

interface EditorStatusBarProps {
  stats: {
    words: number;
    pages: number;
    readingTime: string;
  };
  highlightMatches: any[];
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  saveError: any;
  isValid: boolean;
  getPerformanceData: () => { trends: { performanceScore: number } };
  getWarningLevel: () => 'danger' | 'warning' | 'safe';
}

export function EditorStatusBar({
  stats,
  highlightMatches,
  hasUnsavedChanges,
  isSaving,
  saveError,
  isValid,
  getPerformanceData,
  getWarningLevel,
}: EditorStatusBarProps) {
  return (
    <div className="flex-shrink-0">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 overflow-hidden">
          <span className={`flex-shrink-0 font-medium ${
            getWarningLevel() === 'danger' ? 'text-red-600' : 
            getWarningLevel() === 'warning' ? 'text-yellow-600' : 
            'text-gray-700 dark:text-gray-300'
          }`}>
            {stats.words.toLocaleString()} words
          </span>
          <span className="flex-shrink-0 text-gray-600 dark:text-gray-400">Page {stats.pages}</span>
          <span className="flex-shrink-0 text-gray-600 dark:text-gray-400">{stats.readingTime} min read</span>
          
          {highlightMatches.length > 0 && (
            <span className="text-blue-600 dark:text-blue-400 flex-shrink-0 hidden sm:inline">
              {highlightMatches.length} Story Bible {highlightMatches.length === 1 ? 'reference' : 'references'}
            </span>
          )}
          
          {hasUnsavedChanges && (
            <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline font-medium">Unsaved changes</span>
              <span className="sm:hidden font-medium">Unsaved</span>
            </span>
          )}
          
          {isSaving && (
            <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline font-medium">Saving...</span>
              <span className="sm:hidden font-medium">Saving</span>
            </span>
          )}

          {saveError && (
            <span className="flex items-center gap-2 text-red-600 dark:text-red-400 flex-shrink-0">
              <AlertTriangle className="h-3 w-3" />
              <span className="hidden sm:inline font-medium">Save failed</span>
              <span className="sm:hidden font-medium">Error</span>
            </span>
          )}

          {!isValid && (
            <span className="flex items-center gap-2 text-red-600 dark:text-red-400 flex-shrink-0">
              <AlertTriangle className="h-3 w-3" />
              <span className="hidden sm:inline font-medium">Invalid content</span>
              <span className="sm:hidden font-medium">Invalid</span>
            </span>
          )}

          <span className="text-blue-600 dark:text-blue-400 flex-shrink-0 hidden lg:inline">
            Perf: {getPerformanceData().trends.performanceScore}%
          </span>
        </div>
      </div>
    </div>
  );
}
