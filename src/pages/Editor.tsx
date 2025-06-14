
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { StoryBibleDrawer } from '@/components/StoryBibleDrawer';
import { useProjects } from '@/contexts/ProjectContext';
import { useOptimizedDrafts } from '@/utils/optimizedDb';
import { Draft } from '@/types';

export default function Editor() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, currentProject } = useProjects();
  const { drafts, loading, error } = useOptimizedDrafts(projectId || '');
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);

  // If no projectId in URL but we have a current project, redirect
  useEffect(() => {
    if (!projectId && currentProject) {
      navigate(`/app/editor/${currentProject.id}`, { replace: true });
    }
  }, [projectId, currentProject, navigate]);

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
  };

  if (!currentProject) {
    return (
      <Layout mode="contained">
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
      <Layout mode="contained">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const extraActions = (
    <StoryBibleDrawer projectId={currentProject.id} />
  );

  return (
    <Layout mode="contained">
      <RichTextEditor
        initialContent={currentDraft?.content || ''}
        onSave={handleSave}
        draft={currentDraft}
        loading={loading}
        onEditorReady={() => {}}
        extraActions={extraActions}
      />
    </Layout>
  );
}
