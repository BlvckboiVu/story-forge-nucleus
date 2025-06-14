import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { StoryBibleDrawer } from '@/components/StoryBibleDrawer';
import Outline from '@/components/Outline';
import OutlineTimeline from '@/components/OutlineTimeline';
import { useProjects } from '@/contexts/ProjectContext';
import { useOptimizedDrafts } from '@/utils/optimizedDb';
import { EnhancedOutlineService } from '@/utils/outlineDb';
import { Draft } from '@/types';
import { EnhancedOutline, OutlineScene } from '@/types/outline';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Timeline } from 'lucide-react';

export default function Editor() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, currentProject } = useProjects();
  const { drafts, loading, error } = useOptimizedDrafts(projectId || '');
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [outline, setOutline] = useState<EnhancedOutline | null>(null);
  const [showOutline, setShowOutline] = useState(false);
  const [selectedScene, setSelectedScene] = useState<{
    scene: OutlineScene;
    chapterTitle: string;
    partTitle: string;
  } | null>(null);

  // If no projectId in URL but we have a current project, redirect
  useEffect(() => {
    if (!projectId && currentProject) {
      navigate(`/app/editor/${currentProject.id}`, { replace: true });
    }
  }, [projectId, currentProject, navigate]);

  // Load outline for current project
  useEffect(() => {
    const loadOutline = async () => {
      if (!currentProject) return;
      
      try {
        const outlines = await EnhancedOutlineService.getProjectOutlines(currentProject.id);
        if (outlines.length > 0) {
          setOutline(outlines[0]);
        }
      } catch (error) {
        console.error('Failed to load outline:', error);
      }
    };

    loadOutline();
  }, [currentProject]);

  // Load or create draft for current project
  useEffect(() => {
    if (!currentProject) return;
    
    if (drafts.length > 0) {
      setCurrentDraft(drafts[0]);
    } else {
      // Auto-create first draft using optimized service
      import('@/utils/optimizedDb').then(({ OptimizedDraftService }) => {
        OptimizedDraftService.createDraft({
          title: `${currentProject.title} - Draft 1`,
          content: '',
          projectId: currentProject.id,
          wordCount: 0
        }).then(id => {
          // Fetch the newly created draft
          OptimizedDraftService.getDraft(id).then(draft => {
            if (draft) setCurrentDraft(draft);
          });
        });
      });
    }
  }, [drafts, currentProject]);

  const handleSave = async (content: string) => {
    if (!currentDraft || !currentProject) return;
    
    const { OptimizedDraftService } = await import('@/utils/optimizedDb');
    await OptimizedDraftService.updateDraft(currentDraft.id, {
      content,
    });

    // Update scene status if a scene is selected
    if (selectedScene && outline) {
      try {
        const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        const updatedStatus = wordCount > 100 ? 'draft' : 'planned';
        
        const updatedParts = outline.parts.map(part => ({
          ...part,
          chapters: part.chapters.map(chapter => ({
            ...chapter,
            scenes: chapter.scenes.map(scene => {
              if (scene.id === selectedScene.scene.id) {
                return {
                  ...scene,
                  content,
                  wordCount,
                  status: updatedStatus,
                };
              }
              return scene;
            }),
          })),
        }));

        await EnhancedOutlineService.updateOutline(outline.id, { parts: updatedParts });
        
        // Reload outline to reflect changes
        const updatedOutlines = await EnhancedOutlineService.getProjectOutlines(currentProject.id);
        if (updatedOutlines.length > 0) {
          setOutline(updatedOutlines[0]);
        }
      } catch (error) {
        console.error('Failed to update scene status:', error);
      }
    }
  };

  const handleSceneSelect = (scene: OutlineScene, chapterTitle: string, partTitle: string) => {
    setSelectedScene({ scene, chapterTitle, partTitle });
    
    // Load scene content into editor
    if (scene.content) {
      // Update current draft with scene content
      setCurrentDraft(prev => prev ? {
        ...prev,
        content: scene.content || '',
        title: `${partTitle} - ${chapterTitle} - ${scene.title}`,
      } : null);
    }
  };

  if (!currentProject) {
    return (
      <Layout mode="editor">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
            <p className="text-muted-foreground mb-4">Please select a project from the dashboard to start writing.</p>
            <button 
              onClick={() => navigate('/app/dashboard')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading && !currentDraft) {
    return (
      <Layout mode="editor">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const extraActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowOutline(!showOutline)}
        title="Toggle Outline"
      >
        <BookOpen className="h-4 w-4" />
      </Button>
      <StoryBibleDrawer projectId={currentProject.id} />
    </div>
  );

  return (
    <Layout mode="editor" showNavigation={true}>
      <div className="h-full w-full flex">
        {/* Main Editor Area */}
        <div className={`flex-1 ${showOutline ? 'pr-4' : ''}`}>
          <RichTextEditor
            initialContent={currentDraft?.content || ''}
            onSave={handleSave}
            draft={currentDraft}
            loading={loading}
            onEditorReady={() => {}}
            extraActions={extraActions}
          />
          
          {selectedScene && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Editing: {selectedScene.partTitle} → {selectedScene.chapterTitle} → {selectedScene.scene.title}
              </p>
            </div>
          )}
        </div>

        {/* Outline Sidebar */}
        {showOutline && (
          <div className="w-96 border-l bg-card">
            <Tabs defaultValue="outline" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 m-2">
                <TabsTrigger value="outline" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Outline
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Timeline className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="outline" className="flex-1 overflow-hidden m-2 mt-0">
                <Outline
                  projectId={currentProject.id}
                  onSceneSelect={handleSceneSelect}
                  className="h-full"
                />
              </TabsContent>
              
              <TabsContent value="timeline" className="flex-1 overflow-hidden m-2 mt-0">
                {outline && (
                  <OutlineTimeline
                    outline={outline}
                    onSceneSelect={handleSceneSelect}
                    className="h-full"
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Layout>
  );
}
