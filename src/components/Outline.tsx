
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { EnhancedOutlineService } from '@/utils/outlineDb';
import { EnhancedOutline, OutlinePart, OutlineChapter, OutlineScene } from '@/types/outline';
import { optimizedOpenRouterAPI } from '@/utils/optimizedOpenRouter';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface OutlineProps {
  projectId: string;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  className?: string;
}

interface DragItem {
  id: string;
  type: 'part' | 'chapter' | 'scene';
  title: string;
}

export default function Outline({ projectId, onSceneSelect, className }: OutlineProps) {
  const [outline, setOutline] = useState<EnhancedOutline | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadOutline = useCallback(async () => {
    try {
      setLoading(true);
      const outlines = await EnhancedOutlineService.getProjectOutlines(projectId);
      if (outlines.length > 0) {
        setOutline(outlines[0]);
        // Auto-expand first part and chapter
        if (outlines[0].parts.length > 0) {
          setExpandedParts(new Set([outlines[0].parts[0].id]));
          if (outlines[0].parts[0].chapters.length > 0) {
            setExpandedChapters(new Set([outlines[0].parts[0].chapters[0].id]));
          }
        }
      } else {
        // Create initial outline structure
        await createInitialOutline();
      }
    } catch (error) {
      console.error('Failed to load outline:', error);
      toast({
        title: 'Error',
        description: 'Failed to load outline',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  const createInitialOutline = async () => {
    try {
      const initialPart: OutlinePart = {
        id: crypto.randomUUID(),
        title: 'Part I',
        summary: 'Beginning of the story',
        order: 0,
        chapters: [
          {
            id: crypto.randomUUID(),
            title: 'Chapter 1',
            summary: 'Opening chapter',
            order: 0,
            scenes: [
              {
                id: crypto.randomUUID(),
                title: 'Opening Scene',
                summary: 'Introduce the protagonist and setting',
                order: 0,
                status: 'planned',
              },
            ],
          },
        ],
      };

      const newOutlineId = await EnhancedOutlineService.createOutline({
        projectId,
        title: 'Story Outline',
        parts: [initialPart],
        maxScenes: EnhancedOutlineService.getMaxScenes(),
        structure: 'custom',
      });

      const newOutline = await EnhancedOutlineService.getOutline(newOutlineId);
      setOutline(newOutline);
    } catch (error) {
      console.error('Failed to create initial outline:', error);
      toast({
        title: 'Error',
        description: 'Failed to create initial outline',
        variant: 'destructive',
      });
    }
  };

  const generateAISuggestions = async (type: 'part' | 'chapter' | 'scene', context?: string) => {
    if (!optimizedOpenRouterAPI.getApiKey()) {
      toast({
        title: 'API Key Required',
        description: 'Please set your OpenRouter API key in settings',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);
    try {
      const prompt = `Generate a ${type} for a story outline. Context: ${context || 'General fiction'}. 
      Provide: title, summary (2-3 sentences), and brief notes. 
      Format as JSON: {"title": "...", "summary": "...", "notes": "..."}`;

      const response = await optimizedOpenRouterAPI.sendPrompt(prompt);
      const suggestion = JSON.parse(response);
      
      return suggestion;
    } catch (error) {
      console.error('AI suggestion failed:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to generate AI suggestion',
        variant: 'destructive',
      });
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = findItemById(active.id as string);
    if (item) {
      setDraggedItem(item);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !outline) {
      setDraggedItem(null);
      return;
    }

    try {
      const updatedParts = reorderItems(outline.parts, active.id as string, over.id as string);
      const updatedOutline = { ...outline, parts: updatedParts };
      
      await EnhancedOutlineService.updateOutline(outline.id, updatedOutline);
      setOutline(updatedOutline);
      
      toast({
        title: 'Success',
        description: 'Outline structure updated',
      });
    } catch (error) {
      console.error('Failed to reorder items:', error);
      toast({
        title: 'Error',
        description: 'Failed to update outline structure',
        variant: 'destructive',
      });
    }
    
    setDraggedItem(null);
  };

  const findItemById = (id: string): DragItem | null => {
    if (!outline) return null;

    for (const part of outline.parts) {
      if (part.id === id) {
        return { id, type: 'part', title: part.title };
      }
      for (const chapter of part.chapters) {
        if (chapter.id === id) {
          return { id, type: 'chapter', title: chapter.title };
        }
        for (const scene of chapter.scenes) {
          if (scene.id === id) {
            return { id, type: 'scene', title: scene.title };
          }
        }
      }
    }
    return null;
  };

  const reorderItems = (parts: OutlinePart[], activeId: string, overId: string): OutlinePart[] => {
    // Simple reordering logic for parts
    const partIds = parts.map(p => p.id);
    const activeIndex = partIds.indexOf(activeId);
    const overIndex = partIds.indexOf(overId);
    
    if (activeIndex !== -1 && overIndex !== -1) {
      const reorderedParts = arrayMove(parts, activeIndex, overIndex);
      return reorderedParts.map((part, index) => ({ ...part, order: index }));
    }
    
    return parts;
  };

  const addScene = async (chapterId: string) => {
    if (!outline) return;
    
    if (!EnhancedOutlineService.validateSceneCount(outline.totalScenes)) {
      toast({
        title: 'Scene Limit Reached',
        description: `Maximum ${EnhancedOutlineService.getMaxScenes()} scenes allowed`,
        variant: 'destructive',
      });
      return;
    }

    const newScene: OutlineScene = {
      id: crypto.randomUUID(),
      title: 'New Scene',
      summary: '',
      order: 0,
      status: 'planned',
    };

    const updatedParts = outline.parts.map(part => ({
      ...part,
      chapters: part.chapters.map(chapter => {
        if (chapter.id === chapterId) {
          const scenes = [...chapter.scenes, { ...newScene, order: chapter.scenes.length }];
          return { ...chapter, scenes };
        }
        return chapter;
      }),
    }));

    const updatedOutline = { 
      ...outline, 
      parts: updatedParts,
      totalScenes: outline.totalScenes + 1 
    };

    try {
      await EnhancedOutlineService.updateOutline(outline.id, updatedOutline);
      setOutline(updatedOutline);
    } catch (error) {
      console.error('Failed to add scene:', error);
      toast({
        title: 'Error',
        description: 'Failed to add scene',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadOutline();
  }, [loadOutline]);

  if (loading) {
    return (
      <Card className={`p-4 h-full ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!outline) {
    return (
      <Card className={`p-4 h-full ${className}`}>
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">No outline found</p>
          <Button onClick={createInitialOutline}>Create Outline</Button>
        </div>
      </Card>
    );
  }

  const sceneWarningThreshold = EnhancedOutlineService.getMaxScenes() * 0.8;
  const showSceneWarning = outline.totalScenes >= sceneWarningThreshold;

  return (
    <Card className={`p-4 h-full overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Story Outline</h3>
          <Badge variant={showSceneWarning ? "destructive" : "secondary"}>
            {outline.totalScenes}/{EnhancedOutlineService.getMaxScenes()} scenes
          </Badge>
        </div>
        <div className="flex gap-2">
          {aiLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
          <Button variant="ghost" size="sm" onClick={() => generateAISuggestions('part')}>
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showSceneWarning && (
        <div className="flex items-center gap-2 p-2 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Approaching scene limit ({outline.totalScenes}/{EnhancedOutlineService.getMaxScenes()})
          </span>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={outline.parts.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {outline.parts.map((part) => (
                <PartComponent
                  key={part.id}
                  part={part}
                  expanded={expandedParts.has(part.id)}
                  onToggle={() => {
                    const newExpanded = new Set(expandedParts);
                    if (newExpanded.has(part.id)) {
                      newExpanded.delete(part.id);
                    } else {
                      newExpanded.add(part.id);
                    }
                    setExpandedParts(newExpanded);
                  }}
                  expandedChapters={expandedChapters}
                  onToggleChapter={(chapterId) => {
                    const newExpanded = new Set(expandedChapters);
                    if (newExpanded.has(chapterId)) {
                      newExpanded.delete(chapterId);
                    } else {
                      newExpanded.add(chapterId);
                    }
                    setExpandedChapters(newExpanded);
                  }}
                  onSceneSelect={onSceneSelect}
                  onAddScene={addScene}
                />
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {draggedItem && (
              <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border">
                <span className="text-sm font-medium">{draggedItem.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </Card>
  );
}

interface PartComponentProps {
  part: OutlinePart;
  expanded: boolean;
  onToggle: () => void;
  expandedChapters: Set<string>;
  onToggleChapter: (chapterId: string) => void;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  onAddScene: (chapterId: string) => void;
}

function PartComponent({
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

interface ChapterComponentProps {
  chapter: OutlineChapter;
  partTitle: string;
  expanded: boolean;
  onToggle: () => void;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  onAddScene: (chapterId: string) => void;
}

function ChapterComponent({
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
