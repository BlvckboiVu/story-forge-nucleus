
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { StoryBibleDrawer } from '@/components/StoryBibleDrawer';
import OutlineIntegration from '@/components/editor/OutlineIntegration';
import { useProjects } from '@/contexts/ProjectContext';
import { useOptimizedDrafts } from '@/utils/optimizedDb';
import { EnhancedOutlineService } from '@/utils/outlineDb';
import { useOfflineState } from '@/hooks/useOfflineState';
import { ConnectivityIndicator } from '@/components/ConnectivityIndicator';
import { Draft } from '@/types';
import { EnhancedOutline, OutlineScene } from '@/types/outline';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  // Enhanced offline state management
  const {
    currentProject: offlineCurrentProject,
    currentDraft: offlineCurrentDraft,
    editorState,
    updateProject,
    updateDraft,
    updateEditor,
    addToSyncQueue,
    isOffline,
    updateUrlState,
  } = useOfflineState();

  // Sync URL params with offline state
  useEffect(() => {
    if (projectId && projectId !== offlineCurrentProject) {
      updateProject(projectId);
    }
  }, [projectId, offlineCurrentProject, updateProject]);

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
      const draftToLoad = drafts[0];
      setCurrentDraft(draftToLoad);
      updateDraft(draftToLoad.id);
      
      // Restore editor state if available
      if (editorState && editorState.unsavedContent && offlineCurrentDraft === draftToLoad.id) {
        // Will be handled by RichTextEditor when it receives the editorState
      }
    } else {
      // Auto-create first draft using optimized service
      import('@/utils/optimizedDb').then(({ OptimizedDraftService }) => {
        OptimizedDraftService.createDraft({
          title: `${currentProject.title} - Draft 1`,
          content: editorState?.unsavedContent || '',
          projectId: currentProject.id,
          wordCount: 0
        }).then(id => {
          OptimizedDraftService.getDraft(id).then(draft => {
            if (draft) {
              setCurrentDraft(draft);
              updateDraft(draft.id);
            }
          });
        });
      });
    }
  }, [drafts, currentProject, editorState, offlineCurrentDraft, updateDraft]);

  const handleSave = async (content: string) => {
    if (!currentDraft || !currentProject) return;
    
    try {
      const { OptimizedDraftService } = await import('@/utils/optimizedDb');
      await OptimizedDraftService.updateDraft(currentDraft.id, {
        content,
      });

      // Add to sync queue for online sync
      addToSyncQueue('update', 'draft', {
        id: currentDraft.id,
        content,
        updatedAt: new Date(),
      });

      // Clear unsaved content from editor state
      updateEditor({ unsavedContent: '' });

      // Update scene status if a scene is selected
      if (selectedScene && outline) {
        const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
        const updatedStatus: 'planned' | 'draft' | 'complete' = wordCount > 100 ? 'draft' : 'planned';
        
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
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleSceneSelect = (scene: OutlineScene, chapterTitle: string, partTitle: string) => {
    setSelectedScene({ scene, chapterTitle, partTitle });
    
    // Load scene content into editor
    if (scene.content) {
      setCurrentDraft(prev => prev ? {
        ...prev,
        content: scene.content || '',
        title: `${partTitle} - ${chapterTitle} - ${scene.title}`,
      } : null);
    }
    
    // Close mobile outline panel
    if (isMobile) {
      setShowOutline(false);
    }
  };

  // Handle editor content changes for offline persistence
  const handleContentChange = (content: string) => {
    updateEditor({ 
      unsavedContent: content,
      lastSaved: Date.now(),
    });
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
      <ConnectivityIndicator />
      <OutlineIntegration
        projectId={currentProject.id}
        outline={outline}
        onSceneSelect={handleSceneSelect}
        showOutline={showOutline}
        onToggleOutline={() => setShowOutline(!showOutline)}
      />
      <StoryBibleDrawer projectId={currentProject.id} />
    </div>
  );

  // Use initial content from offline state if available
  const initialContent = (editorState?.unsavedContent && offlineCurrentDraft === currentDraft?.id) 
    ? editorState.unsavedContent 
    : currentDraft?.content || '';

  return (
    <Layout mode="editor" showNavigation={true}>
      <div className="h-full w-full flex overflow-hidden">
        {/* Main Editor Area */}
        <div className={`flex-1 min-w-0 ${showOutline && !isMobile ? 'pr-4' : ''}`}>
          <div className="h-full flex flex-col">
            <RichTextEditor
              initialContent={initialContent}
              onSave={handleSave}
              draft={currentDraft}
              loading={loading}
              onEditorReady={() => {}}
              extraActions={extraActions}
              onContentChange={handleContentChange}
            />
            
            {selectedScene && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Editing: {selectedScene.partTitle} → {selectedScene.chapterTitle} → {selectedScene.scene.title}
                  {isOffline && <span className="ml-2 text-orange-600">(Offline)</span>}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Outline Sidebar */}
        {showOutline && !isMobile && (
          <div className="w-96 border-l bg-card min-w-0 flex-shrink-0">
            <OutlineIntegration
              projectId={currentProject.id}
              outline={outline}
              onSceneSelect={handleSceneSelect}
              showOutline={showOutline}
              onToggleOutline={() => setShowOutline(!showOutline)}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
