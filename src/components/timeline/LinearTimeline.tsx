
import { Badge } from '@/components/ui/badge';
import { OutlineScene } from '@/types/outline';

interface TimelineEntry {
  scene: OutlineScene;
  chapterTitle: string;
  partTitle: string;
  partIndex: number;
  chapterIndex: number;
  sceneIndex: number;
  globalIndex: number;
}

interface LinearTimelineProps {
  entries: TimelineEntry[];
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  getSceneIcon: (status: OutlineScene['status']) => React.ReactNode;
  getSceneColor: (status: OutlineScene['status']) => string;
}

export default function LinearTimeline({ entries, onSceneSelect, getSceneIcon, getSceneColor }: LinearTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
      
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={`${entry.partIndex}-${entry.chapterIndex}-${entry.sceneIndex}`} className="relative flex items-start gap-3">
            <div className="relative z-10 flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full ${getSceneColor(entry.scene.status)}`}></div>
            </div>
            
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
