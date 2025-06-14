
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { EnhancedOutline, OutlineScene } from '@/types/outline';
import { Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import TimelineHeader from './timeline/TimelineHeader';
import LinearTimeline from './timeline/LinearTimeline';
import GroupedTimeline from './timeline/GroupedTimeline';

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
      <TimelineHeader
        progressStats={progressStats}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

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
