
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { DraftModal } from '@/components/editor/DraftModal';
import { AIPanel } from '@/components/AIPanel';
import { Draft } from '@/lib/db';
import { draftService } from '@/services/draftService';
import { useProjects } from '@/contexts/ProjectContext';
import { useAIStore } from '@/stores/aiStore';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FolderOpen, FilePlus, Save, MoreVertical } from 'lucide-react';
import RichTextEditor from '@/components/editor/RichTextEditor';

export default function Editor() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [editorRef, setEditorRef] = useState<any>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  const { currentProject, projects, setCurrentProject } = useProjects();
  const { user, loading: authLoading } = useAuth();
  
  const isAuthenticated = !authLoading && !!user;
  const { createConversation, setActiveConversation } = useAIStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
  }, [authLoading, user, navigate]);

  // Load draft if documentId is provided
  useEffect(() => {
    if (documentId && isAuthenticated) {
      loadDraft(documentId);
    }
  }, [documentId, isAuthenticated]);

  // On mount, if no currentProject, try to set from localStorage
  useEffect(() => {
    if (isAuthenticated && !currentProject && projects.length > 0) {
      const lastProjectId = localStorage.getItem('storyforge_last_project');
      if (lastProjectId) {
        const lastProject = projects.find(p => p.id === lastProjectId);
        if (lastProject) {
          setCurrentProject(lastProject);
        }
      } else {
        setCurrentProject(projects[0]);
      }
    }
  }, [currentProject, projects, setCurrentProject, isAuthenticated]);

  // Initialize AI conversation when draft loads
  useEffect(() => {
    if (currentDraft && isAuthenticated) {
      try {
        const conversationId = createConversation(`${currentDraft.title} - Writing Session`);
        setActiveConversation(conversationId);
      } catch (error) {
        console.error('Failed to create AI conversation:', error);
      }
    }
  }, [currentDraft, createConversation, setActiveConversation, isAuthenticated]);

  const loadDraft = async (id: string) => {
    if (!id?.trim()) {
      toast({
        title: "Invalid document ID",
        description: "The document ID is empty or invalid",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    setSaveError(null);
    
    try {
      const draft = await draftService.getDraft(id);
      if (draft) {
        setCurrentDraft(draft);
        toast({
          title: "Draft loaded",
          description: `"${draft.title}" has been opened`,
          duration: 2000,
        });
      } else {
        toast({
          title: "Draft not found",
          description: "The requested document could not be found",
          variant: "destructive",
          duration: 3000,
        });
        navigate('/app/editor', { replace: true });
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load the document";
      setSaveError(errorMessage);
      toast({
        title: "Error loading draft",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateDraft = async (title: string) => {
    if (!title?.trim()) {
      throw new Error("Title cannot be empty");
    }
    if (!currentProject) {
      toast({
        title: "No project selected",
        description: "Please select or create a project first.",
        variant: "destructive",
        duration: 3000,
      });
      throw new Error("No project selected");
    }
    
    try {
      const projectId = currentProject.id;
      const draftId = await draftService.createDraft({
        title: title.trim(),
        projectId,
      });
      
      if (typeof draftId === 'string') {
        await loadDraft(draftId);
        navigate(`/app/editor/${draftId}`, { replace: true });
      }
      
      toast({
        title: "Draft created",
        description: `"${title}" has been created`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error creating draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create new draft";
      toast({
        title: "Error creating draft",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      throw error;
    }
  };
  
  const handleSaveDraft = async (content: string) => {
    if (!content && !currentDraft) {
      setDraftModalOpen(true);
      return;
    }

    if (!currentDraft) {
      setDraftModalOpen(true);
      return;
    }
    
    setSaveError(null);
    
    try {
      const plainText = content.replace(/<[^>]*>/g, ' ');
      const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
      
      await draftService.updateDraft(currentDraft.id, {
        content,
        wordCount,
      });
      
      setCurrentDraft({
        ...currentDraft,
        content,
        wordCount,
        updatedAt: new Date()
      });
      
      setLastSaved(new Date());
      
    } catch (error) {
      console.error("Error saving draft:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save draft";
      setSaveError(errorMessage);
      toast({
        title: "Error saving draft",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      throw error;
    }
  };

  const handleOpenDraft = (draft: Draft) => {
    if (!draft?.id) {
      toast({
        title: "Invalid draft",
        description: "Cannot open invalid draft",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setCurrentDraft(draft);
    setSaveError(null);
    navigate(`/app/editor/${draft.id}`, { replace: true });
    toast({
      title: "Draft opened",
      description: `"${draft.title}" has been opened`,
      duration: 2000,
    });
  };

  const handleNewDraft = () => {
    setCurrentDraft(null);
    setSaveError(null);
    navigate('/app/editor', { replace: true });
    toast({
      title: "New draft",
      description: "Starting a new draft",
      duration: 2000,
    });
  };

  const handleInsertLLMResponse = (text: string) => {
    if (!text?.trim()) {
      toast({
        title: "No text to insert",
        description: "The response is empty",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!editorRef || !editorRef.getEditor) {
      toast({
        title: "Editor not ready",
        description: "Please wait for the editor to load before inserting text",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      const quill = editorRef.getEditor();
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      
      quill.insertText(index, text, 'user');
      quill.setSelection(index + text.length);
      
      const updatedContent = quill.root.innerHTML;
      handleSaveDraft(updatedContent);
      
      toast({
        title: "Text inserted",
        description: "AI response has been inserted into your document",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error inserting LLM response:", error);
      toast({
        title: "Insert failed",
        description: "Failed to insert text into the editor",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access the editor.</p>
          <Button onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {!currentProject ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
            <p className="text-muted-foreground mb-4">Please select or create a project from the dashboard to start writing.</p>
            <Button onClick={() => navigate('/app/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Unified Header - Under 100px */}
          <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraftModalOpen(true)}
                  className="h-8"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewDraft}
                  className="h-8"
                >
                  <FilePlus className="mr-2 h-4 w-4" />
                  New
                </Button>
              </div>
              
              {currentDraft && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{currentDraft.title}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{currentDraft.wordCount.toLocaleString()} words</span>
                  {lastSaved && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">Saved {lastSaved.toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {saveError && (
                <span className="text-sm text-destructive">Save Error</span>
              )}
              <Button variant="ghost" size="sm" className="h-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <RichTextEditor 
                initialContent={currentDraft?.content || ''} 
                onSave={handleSaveDraft}
                draft={currentDraft}
                loading={loading}
                onEditorReady={setEditorRef}
                isFocusMode={false}
                onToggleFocus={() => {}}
              />
            </div>
            
            {/* AI Panel */}
            <AIPanel onInsertResponse={handleInsertLLMResponse} />
          </div>
          
          <DraftModal 
            isOpen={draftModalOpen}
            onClose={() => setDraftModalOpen(false)}
            onCreateDraft={handleCreateDraft}
            onOpenDraft={handleOpenDraft}
            projectId={currentProject.id}
          />
        </>
      )}
    </div>
  );
}
