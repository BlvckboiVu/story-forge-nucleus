
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EnhancedOutline, OutlineScene } from '@/types/outline';
import { Clock, BarChart3, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface OutlineTimelineProps {
  outline: EnhancedOutline;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  className?: string;
}

interface TimelineEntry {
  scene: OutlineScene;
  chapterTitle: string;
  partTitle: string;
  partIndex: number;
  chapterIndex: number;
  sceneIndex: number;
  globalIndex: number;
}

export default function OutlineTimeline({ outline, onSceneSelect, className }: OutlineTimelineProps) {
  const [viewMode, setViewMode] = useState<'linear' | 'grouped'>('linear');

  const timelineEntries = useMemo((): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];
    let globalIndex = 0;

    outline.parts.forEach((part, partIndex) => {
      part.chapters.forEach((chapter, chapterIndex) => {
        chapter.scenes.forEach((scene, sceneIndex) => {
          entries.push({
            scene,
            chapterTitle: chapter.title,
            partTitle: part.title,
            partIndex,
            chapterIndex,
            sceneIndex,
            globalIndex,
          });
          globalIndex++;
        });
      });
    });

    return entries;
  }, [outline]);

  const progressStats = useMemo(() => {
    const total = timelineEntries.length;
    const completed = timelineEntries.filter(entry => entry.scene.status === 'complete').length;
    const inProgress = timelineEntries.filter(entry => entry.scene.status === 'draft').length;
    const planned = timelineEntries.filter(entry => entry.scene.status === 'planned').length;

    return {
      total,
      completed,
      inProgress,
      planned,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [timelineEntries]);

  const getSceneIcon = (status: OutlineScene['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'planned':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSceneColor = (status: OutlineScene['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'planned':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  if (timelineEntries.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center py-8">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No scenes in outline</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <h3 className="font-medium">Story Timeline</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'linear' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('linear')}
          >
            Linear
          </Button>
          <Button
            variant={viewMode === 'grouped' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grouped')}
          >
            Grouped
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
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

      {/* Timeline View */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {viewMode === 'linear' ? (
          <LinearTimeline 
            entries={timelineEntries}
            onSceneSelect={onSceneSelect}
            getSceneIcon={getSceneIcon}
            getSceneColor={getSceneColor}
          />
        ) : (
          <GroupedTimeline 
            outline={outline}
            onSceneSelect={onSceneSelect}
            getSceneIcon={getSceneIcon}
          />
        )}
      </div>
    </Card>
  );
}

interface LinearTimelineProps {
  entries: TimelineEntry[];
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  getSceneIcon: (status: OutlineScene['status']) => React.ReactNode;
  getSceneColor: (status: OutlineScene['status']) => string;
}

function LinearTimeline({ entries, onSceneSelect, getSceneIcon, getSceneColor }: LinearTimelineProps) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
      
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={`${entry.partIndex}-${entry.chapterIndex}-${entry.sceneIndex}`} className="relative flex items-start gap-3">
            {/* Timeline dot */}
            <div className="relative z-10 flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full ${getSceneColor(entry.scene.status)}`}></div>
            </div>
            
            {/* Scene card */}
            <div 
              className="flex-1 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSceneSelect?.(entry.scene, entry.chapterTitle, entry.partTitle)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getSceneIcon(entry.scene.status)}
                    <h4 className="text-sm font-medium">{entry.scene.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.partTitle} → {entry.chapterTitle}
                  </p>
                  {entry.scene.summary && (
                    <p className="text-xs text-muted-foreground mt-1">{entry.scene.summary}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs ml-2">
                  {entry.globalIndex + 1}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface GroupedTimelineProps {
  outline: EnhancedOutline;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  getSceneIcon: (status: OutlineScene['status']) => React.ReactNode;
}

function GroupedTimeline({ outline, onSceneSelect, getSceneIcon }: GroupedTimelineProps) {
  return (
    <div className="space-y-4">
      {outline.parts.map((part, partIndex) => (
        <div key={part.id} className="border rounded-lg p-3">
          <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-3">{part.title}</h3>
          
          <div className="space-y-3">
            {part.chapters.map((chapter, chapterIndex) => (
              <div key={chapter.id} className="ml-4">
                <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">{chapter.title}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
                  {chapter.scenes.map((scene, sceneIndex) => (
                    <div
                      key={scene.id}
                      className="p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onSceneSelect?.(scene, chapter.title, part.title)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getSceneIcon(scene.status)}
                        <span className="text-sm font-medium truncate">{scene.title}</span>
                      </div>
                      {scene.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{scene.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
