
import { EnhancedOutline, OutlineScene } from '@/types/outline';

interface GroupedTimelineProps {
  outline: EnhancedOutline;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  getSceneIcon: (status: OutlineScene['status']) => React.ReactNode;
}

export default function GroupedTimeline({ outline, onSceneSelect, getSceneIcon }: GroupedTimelineProps) {
  return (
    <div className="space-y-4">
      {outline.parts.map((part) => (
        <div key={part.id} className="border rounded-lg p-3">
          <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-3">{part.title}</h3>
          
          <div className="space-y-3">
            {part.chapters.map((chapter) => (
              <div key={chapter.id} className="ml-4">
                <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">{chapter.title}</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
                  {chapter.scenes.map((scene) => (
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
