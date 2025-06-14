
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { OutlineChapter, OutlineScene } from '@/types/outline';

interface ChapterComponentProps {
  chapter: OutlineChapter;
  partTitle: string;
  expanded: boolean;
  onToggle: () => void;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  onAddScene: (chapterId: string) => void;
}

export default function ChapterComponent({
  chapter,
  partTitle,
  expanded,
  onToggle,
  onSceneSelect,
  onAddScene,
}: ChapterComponentProps) {
  return (
    <div className="border-l-2 border-green-200 dark:border-green-800 pl-3">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onToggle} className="h-6 w-6 p-0">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
        <div className="flex-1">
          <h5 className="font-medium text-green-600 dark:text-green-400">{chapter.title}</h5>
          {chapter.summary && (
            <p className="text-xs text-muted-foreground mt-1">{chapter.summary}</p>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {chapter.scenes.length} scenes
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => onAddScene(chapter.id)}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {expanded && (
        <div className="mt-2 ml-6 space-y-1">
          {chapter.scenes.map((scene) => (
            <div
              key={scene.id}
              className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50"
              onClick={() => onSceneSelect?.(scene, chapter.title, partTitle)}
            >
              <div className="flex-1">
                <h6 className="text-sm font-medium">{scene.title}</h6>
                {scene.summary && (
                  <p className="text-xs text-muted-foreground">{scene.summary}</p>
                )}
              </div>
              <Badge 
                variant={scene.status === 'complete' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {scene.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
