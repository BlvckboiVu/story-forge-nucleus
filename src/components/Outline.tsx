
import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EnhancedOutlineService } from '@/utils/outlineDb';
import { EnhancedOutline, OutlinePart, OutlineChapter, OutlineScene } from '@/types/outline';
import { optimizedOpenRouterAPI } from '@/utils/optimizedOpenRouter';
import OutlineHeader from './outline/OutlineHeader';
import OutlineDragDrop from './outline/OutlineDragDrop';
import PartComponent from './outline/PartComponent';

interface OutlineProps {
  projectId: string;
  onSceneSelect?: (scene: OutlineScene, chapterTitle: string, partTitle: string) => void;
  className?: string;
}

export default function Outline({ projectId, onSceneSelect, className }: OutlineProps) {
  const [outline, setOutline] = useState<EnhancedOutline | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const loadOutline = useCallback(async () => {
    try {
      setLoading(true);
      const outlines = await EnhancedOutlineService.getProjectOutlines(projectId);
      if (outlines.length > 0) {
        setOutline(outlines[0]);
        if (outlines[0].parts.length > 0) {
          setExpandedParts(new Set([outlines[0].parts[0].id]));
          if (outlines[0].parts[0].chapters.length > 0) {
            setExpandedChapters(new Set([outlines[0].parts[0].chapters[0].id]));
          }
        }
      } else {
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

  const generateAISuggestions = async () => {
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
      const prompt = `Generate a part for a story outline. Context: General fiction. 
      Provide: title, summary (2-3 sentences), and brief notes. 
      Format as JSON: {"title": "...", "summary": "...", "notes": "..."}`;

      await optimizedOpenRouterAPI.sendPrompt(prompt);
      
      toast({
        title: 'AI Suggestion Generated',
        description: 'AI suggestions have been generated',
      });
    } catch (error) {
      console.error('AI suggestion failed:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to generate AI suggestion',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleReorder = async (updatedParts: OutlinePart[]) => {
    if (!outline) return;
    
    const updatedOutline = { ...outline, parts: updatedParts };
    
    await EnhancedOutlineService.updateOutline(outline.id, updatedOutline);
    setOutline(updatedOutline);
    
    toast({
      title: 'Success',
      description: 'Outline structure updated',
    });
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

  return (
    <Card className={`p-4 h-full overflow-hidden ${className}`}>
      <OutlineHeader
        totalScenes={outline.totalScenes}
        aiLoading={aiLoading}
        onGenerateAI={generateAISuggestions}
      />

      <div className="flex-1 overflow-auto">
        <OutlineDragDrop outline={outline} onReorder={handleReorder}>
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
        </OutlineDragDrop>
      </div>
    </Card>
  );
}
