
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

interface ProgressStats {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  completionPercentage: number;
}

interface TimelineHeaderProps {
  progressStats: ProgressStats;
  viewMode: 'linear' | 'grouped';
  onViewModeChange: (mode: 'linear' | 'grouped') => void;
}

export default function TimelineHeader({ progressStats, viewMode, onViewModeChange }: TimelineHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <h3 className="font-medium">Story Timeline</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'linear' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('linear')}
          >
            Linear
          </Button>
          <Button
            variant={viewMode === 'grouped' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grouped')}
          >
            Grouped
          </Button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">
            {progressStats.completed}/{progressStats.total} scenes
          </span>
        </div>
        <Progress value={progressStats.completionPercentage} className="mb-3" />
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Complete ({progressStats.completed})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Draft ({progressStats.inProgress})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span>Planned ({progressStats.planned})</span>
          </div>
        </div>
      </div>
    </>
  );
}
