import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { StoryBibleDrawer } from '@/components/StoryBibleDrawer';
import OutlineIntegration from '@/components/editor/OutlineIntegration';
import { useProjects } from '@/contexts/ProjectContext';
import { useUnifiedDraftManager } from '@/hooks/useUnifiedDraftManager';
import { EnhancedOutlineService } from '@/utils/outlineDb';
import { useFocusMode } from '@/hooks/use-focus-mode';
import { ConnectivityIndicator } from '@/components/ConnectivityIndicator';
import { EnhancedOutline, OutlineScene } from '@/types/outline';
import { useIsMobile } from '@/hooks/use-mobile';
import { EditorLayout } from '@/components/editor/EditorLayout';

export default function Editor() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const draftParam = searchParams.get('draft');
  
  const { projects, currentProject, setCurrentProject } = useProjects();
  const [outline, setOutline] = useState<EnhancedOutline | null>(null);
  const [showOutline, setShowOutline] = useState(false);
  const [selectedScene, setSelectedScene] = useState<{
    scene: OutlineScene;
    chapterTitle: string;
    partTitle: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('scroll');
  const [pageHeight, setPageHeight] = useState(800);
  const [wordCount, setWordCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();

  // Use unified draft manager
  const {
    currentDraft,
    loading,
    saving,
    error,
    hasUnsavedChanges,
    lastSaved,
    loadDraft,
    createDraft,
    updateContent,
    saveContent,
  } = useUnifiedDraftManager({
    projectId: projectId || '',
    enableAutoSave: true,
  });

  // Focus mode management
  const { 
    isFocusMode, 
    isPanelCollapsed, 
    toggleFocusMode, 
    togglePanel 
  } = useFocusMode();

  // Set current project if different from URL
  useEffect(() => {
    if (projectId && currentProject?.id !== projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projectId, currentProject, projects, setCurrentProject]);

  // Redirect to proper URL format if needed
  useEffect(() => {
    if (!projectId && currentProject) {
      navigate(`/app/editor/${currentProject.id}`, { replace: true });
    }
  }, [projectId, currentProject, navigate]);

  // Load specific draft if draftParam exists
  useEffect(() => {
    if (draftParam && draftParam !== currentDraft?.id) {
      loadDraft(draftParam);
    }
  }, [draftParam, currentDraft?.id, loadDraft]);

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

  // Auto-create draft if none exists and no specific draft requested
  useEffect(() => {
    const autoCreateDraft = async () => {
      if (!currentProject || currentDraft || draftParam || loading) return;

      try {
        await createDraft(`${currentProject.title} - Draft 1`, '');
      } catch (error) {
        console.error('Failed to create initial draft:', error);
      }
    };

    autoCreateDraft();
  }, [currentProject, currentDraft, draftParam, loading, createDraft]);

  const handleSave = async (content: string) => {
    if (!currentProject) return;
    
    try {
      updateContent(content);
      await saveContent(content);

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
    if (scene.content && currentDraft) {
      updateContent(scene.content);
    }
    
    // Close mobile outline panel
    if (isMobile) {
      setShowOutline(false);
    }
  };

  const handleOpenDraft = () => {
    console.log('Open draft modal');
  };

  const handleNewDraft = async () => {
    if (!currentProject) return;
    
    try {
      const newDraftId = await createDraft(`${currentProject.title} - Draft ${Date.now()}`, '');
      navigate(`/app/editor/${currentProject.id}?draft=${newDraftId}`);
    } catch (error) {
      console.error('Failed to create new draft:', error);
    }
  };

  if (!currentProject) {
    return (
      <Layout mode="editor" showNavigation={true}>
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
      <Layout mode="editor" showNavigation={true}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout mode="editor" showNavigation={true}>
      <EditorLayout
        currentDraft={currentDraft}
        loading={loading}
        onSaveDraft={handleSave}
        onOpenDraft={handleOpenDraft}
        onNewDraft={handleNewDraft}
        onInsertLLMResponse={(text) => {
          // Insert LLM response into the editor
          if (currentDraft) {
            const newContent = currentDraft.content + '\n\n' + text;
            updateContent(newContent);
            handleSave(newContent);
          }
        }}
        onEditorReady={() => {}}
      />
    </Layout>
  );
}
