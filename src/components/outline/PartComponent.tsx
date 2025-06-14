
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { OutlinePart, OutlineChapter, OutlineScene } from '@/types/outline';
import ChapterComponent from './ChapterComponent';

interface PartComponentProps {
  part: OutlinePart;
  expanded: boolean;
  onToggle: () => void;
  expandedChapters: Set<string>;
  onToggleChapter: (chapterId: string) => void;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  onAddScene: (chapterId: string) => void;
}

export default function PartComponent({
  part,
  expanded,
  onToggle,
  expandedChapters,
  onToggleChapter,
  onSceneSelect,
  onAddScene,
}: PartComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: part.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-3 bg-card">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Button variant="ghost" size="sm" onClick={onToggle} className="h-6 w-6 p-0">
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
        <div className="flex-1">
          <h4 className="font-medium text-blue-600 dark:text-blue-400">{part.title}</h4>
          {part.summary && (
            <p className="text-xs text-muted-foreground mt-1">{part.summary}</p>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {part.chapters.reduce((total, ch) => total + ch.scenes.length, 0)} scenes
        </Badge>
      </div>

      {expanded && (
        <div className="mt-3 ml-6 space-y-2">
          {part.chapters.map((chapter) => (
            <ChapterComponent
              key={chapter.id}
              chapter={chapter}
              partTitle={part.title}
              expanded={expandedChapters.has(chapter.id)}
              onToggle={() => onToggleChapter(chapter.id)}
              onSceneSelect={onSceneSelect}
              onAddScene={onAddScene}
            />
          ))}
        </div>
      )}
    </div>
  );
}
