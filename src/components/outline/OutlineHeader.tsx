
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { EnhancedOutlineService } from '@/utils/outlineDb';

interface OutlineHeaderProps {
  totalScenes: number;
  aiLoading: boolean;
  onGenerateAI: () => void;
}

export default function OutlineHeader({ totalScenes, aiLoading, onGenerateAI }: OutlineHeaderProps) {
  const sceneWarningThreshold = EnhancedOutlineService.getMaxScenes() * 0.8;
  const showSceneWarning = totalScenes >= sceneWarningThreshold;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Story Outline</h3>
          <Badge variant={showSceneWarning ? "destructive" : "secondary"}>
            {totalScenes}/{EnhancedOutlineService.getMaxScenes()} scenes
          </Badge>
        </div>
        <div className="flex gap-2">
          {aiLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
          <Button variant="ghost" size="sm" onClick={onGenerateAI}>
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showSceneWarning && (
        <div className="flex items-center gap-2 p-2 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Approaching scene limit ({totalScenes}/{EnhancedOutlineService.getMaxScenes()})
          </span>
        </div>
      )}
    </>
  );
}
