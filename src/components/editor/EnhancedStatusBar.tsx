
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
  Save, Clock, AlertTriangle, CheckCircle, Loader2,
  BarChart3, FileText, Eye, Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WordCountStats } from '@/hooks/useEnhancedWordCount';

interface EnhancedStatusBarProps {
  stats: WordCountStats;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  hasError: boolean;
  lastSaveTime?: Date | null;
  onSave: () => void;
  onToggleStats?: () => void;
  warningThreshold?: number;
  limitThreshold?: number;
  isMobile?: boolean;
  className?: string;
}

export const EnhancedStatusBar = ({
  stats,
  hasUnsavedChanges,
  isSaving,
  hasError,
  lastSaveTime,
  onSave,
  onToggleStats,
  warningThreshold = 45000,
  limitThreshold = 50000,
  isMobile = false,
  className = '',
}: EnhancedStatusBarProps) => {
  const { t, i18n } = useTranslation();

  const getProgressColor = () => {
    if (stats.words >= limitThreshold) return 'bg-red-500';
    if (stats.words >= warningThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (isSaving) return <Loader2 className="h-3 w-3 animate-spin" />;
    if (hasError) return <AlertTriangle className="h-3 w-3 text-red-500" />;
    if (hasUnsavedChanges) return <Clock className="h-3 w-3 text-orange-500" />;
    return <CheckCircle className="h-3 w-3 text-green-500" />;
  };

  const getStatusText = () => {
    if (isSaving) return t('saving');
    if (hasError) return t('error');
    if (hasUnsavedChanges) return t('unsavedChanges');
    return lastSaveTime ? `${t('lastSaved')} ${lastSaveTime.toLocaleTimeString()}` : t('saved');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (isMobile) {
    return (
      <div className={`flex flex-col gap-2 p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className={stats.words > limitThreshold ? 'text-red-600' : stats.words > warningThreshold ? 'text-yellow-600' : ''}>
              {stats.words.toLocaleString()} {t('words')}
            </span>
            <span>{stats.pages} {t('pages')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </div>
            
            <Button
              onClick={onSave}
              disabled={!hasUnsavedChanges || isSaving}
              size="sm"
              variant={hasUnsavedChanges ? "default" : "ghost"}
              className="h-8"
            >
              <Save className="h-3 w-3 mr-1" />
              {t('save')}
            </Button>
          </div>
        </div>
        
        {stats.words > warningThreshold && (
          <div className="flex items-center gap-2">
            <Progress 
              value={(stats.words / limitThreshold) * 100} 
              className="flex-1 h-1"
            />
            <span className="text-xs text-muted-foreground">
              {Math.round((stats.words / limitThreshold) * 100)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-6">
        {/* Word count and basic stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className={`font-medium ${
            stats.words > limitThreshold ? 'text-red-600' : 
            stats.words > warningThreshold ? 'text-yellow-600' : 
            'text-gray-900 dark:text-gray-100'
          }`}>
            {stats.words.toLocaleString()} {t('words')}
          </span>
          
          <Separator orientation="vertical" className="h-4" />
          
          <span>{stats.characters.toLocaleString()} {t('characters')}</span>
          
          <Separator orientation="vertical" className="h-4" />
          
          <span>{stats.pages} {t('pages')}</span>
          
          <Separator orientation="vertical" className="h-4" />
          
          <span>{stats.readingTime}</span>
        </div>

        {/* Detailed stats popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <BarChart3 className="h-4 w-4 mr-1" />
              Stats
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Document Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Words:</span>
                  <span className="ml-2 font-medium">{stats.words.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Characters:</span>
                  <span className="ml-2 font-medium">{stats.characters.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">No spaces:</span>
                  <span className="ml-2 font-medium">{stats.charactersNoSpaces.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sentences:</span>
                  <span className="ml-2 font-medium">{stats.sentences.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Paragraphs:</span>
                  <span className="ml-2 font-medium">{stats.paragraphs.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pages:</span>
                  <span className="ml-2 font-medium">{stats.pages.toLocaleString()}</span>
                </div>
              </div>
              
              {stats.words > warningThreshold && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress to limit</span>
                    <span>{Math.round((stats.words / limitThreshold) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(stats.words / limitThreshold) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Language selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Globe className="h-4 w-4 mr-1" />
              {i18n.language.toUpperCase()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => changeLanguage('en')}
              >
                English
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => changeLanguage('es')}
              >
                Español
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => changeLanguage('fr')}
              >
                Français
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-3">
        {/* Save status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        
        {/* Save button */}
        <Button
          onClick={onSave}
          disabled={!hasUnsavedChanges || isSaving}
          size="sm"
          variant={hasUnsavedChanges ? "default" : "ghost"}
          className={`transition-all duration-200 ${
            hasUnsavedChanges 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          <Save className="h-4 w-4 mr-2" />
          {t('save')}
        </Button>
      </div>
    </div>
  );
};
