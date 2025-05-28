import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { EditorHeader } from '@/components/editor/EditorHeader';
import { EditorLayout } from '@/components/editor/EditorLayout';
import { DraftModal } from '@/components/editor/DraftModal';
import { Draft } from '@/lib/db';
import { draftService } from '@/services/draftService';

export default function Editor() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [editorRef, setEditorRef] = useState<any>(null);
  const { toast } = useToast();
  
  // Load draft if documentId is provided
  useEffect(() => {
    if (documentId) {
      loadDraft(documentId);
    }
  }, [documentId]);

  const loadDraft = async (id: string) => {
    setLoading(true);
    try {
      const draft = await draftService.getDraft(id);
      if (draft) {
        setCurrentDraft(draft);
        toast({
          title: "Draft loaded",
          description: `"${draft.title}" has been opened`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Draft not found",
          description: "The requested document could not be found",
          variant: "destructive",
          duration: 3000,
        });
        // Navigate back to editor without document ID
        navigate('/app/editor', { replace: true });
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load the document",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateDraft = async (title: string) => {
    try {
      const projectId = "demo-project-id";
      
      const draftId = await draftService.createDraft({
        title,
        projectId,
      });
      
      // Load the newly created draft
      if (typeof draftId === 'string') {
        await loadDraft(draftId);
        // Update URL to include the new draft ID
        navigate(`/app/editor/${draftId}`, { replace: true });
      }
      
      toast({
        title: "Draft created",
        description: `"${title}" has been created`,
        duration: 3000,
      });
      
    } catch (error) {
      console.error("Error creating draft:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create new draft",
        variant: "destructive",
        duration: 3000,
      });
      throw error; // Re-throw so the modal can handle it
    }
  };
  
  const handleSaveDraft = async (content: string) => {
    if (!currentDraft) {
      // If no current draft, open the modal to create one
      setDraftModalOpen(true);
      return;
    }
    
    try {
      // Calculate word count
      const plainText = content.replace(/<[^>]*>/g, ' ');
      const wordCount = plainText.trim().split(/\s+/).filter(word => word !== '').length;
      
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
      
      toast({
        title: "Draft saved",
        description: `"${currentDraft.title}" has been saved`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save draft",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleOpenDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    // Update URL to include the draft ID
    navigate(`/app/editor/${draft.id}`, { replace: true });
    toast({
      title: "Draft opened",
      description: `"${draft.title}" has been opened`,
      duration: 3000,
    });
  };

  const handleNewDraft = () => {
    setCurrentDraft(null);
    // Navigate to editor without document ID
    navigate('/app/editor', { replace: true });
    toast({
      title: "New draft",
      description: "Starting a new draft",
      duration: 2000,
    });
  };

  const handleInsertLLMResponse = (text: string) => {
    if (editorRef && editorRef.getEditor) {
      const quill = editorRef.getEditor();
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();
      
      // Insert the text at cursor position
      quill.insertText(index, text, 'user');
      
      // Set cursor position after inserted text
      quill.setSelection(index + text.length);
      
      // Get updated content and save
      const updatedContent = quill.root.innerHTML;
      handleSaveDraft(updatedContent);
    }
  };
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <EditorHeader
        currentDraft={currentDraft}
        onOpenDraft={() => setDraftModalOpen(true)}
        onNewDraft={handleNewDraft}
      />
      
      <EditorLayout
        currentDraft={currentDraft}
        loading={loading}
        onSaveDraft={handleSaveDraft}
        onOpenDraft={() => setDraftModalOpen(true)}
        onNewDraft={handleNewDraft}
        onInsertLLMResponse={handleInsertLLMResponse}
        onEditorReady={setEditorRef}
      />

      {/* Draft modal */}
      <DraftModal 
        isOpen={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
        onCreateDraft={handleCreateDraft}
        onOpenDraft={handleOpenDraft}
        projectId="demo-project-id"
      />
    </div>
  );
}
