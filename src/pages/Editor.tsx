
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Save, FilePlus, FolderOpen } from 'lucide-react';
import RichTextEditor from '@/components/editor/RichTextEditor';
import { DraftModal } from '@/components/editor/DraftModal';
import { Draft, createDraft, updateDraft, getDraft } from '@/lib/db';

export default function Editor() {
  const { documentId } = useParams();
  const [isOutlineVisible, setIsOutlineVisible] = useState(true);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
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
      const draft = await getDraft(id);
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
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      toast({
        title: "Error",
        description: "Failed to load the document",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateDraft = async (title: string) => {
    try {
      // For demo, using a fixed project ID
      const projectId = "demo-project-id";
      
      const newDraft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'> = {
        projectId,
        title,
        content: '',
        wordCount: 0,
      };
      
      await createDraft(newDraft);
      
      // Since we don't have the ID yet, we'll reload the draft list
      // In a real app with authentication, we would fetch all drafts for the current user/project
      
      toast({
        title: "Draft created",
        description: `"${title}" has been created`,
        duration: 3000,
      });
      
      // Would normally redirect to the new draft
    } catch (error) {
      console.error("Error creating draft:", error);
      toast({
        title: "Error",
        description: "Failed to create new draft",
        variant: "destructive",
        duration: 3000,
      });
    }
  };
  
  const handleSaveDraft = async (content: string) => {
    if (!currentDraft) {
      setDraftModalOpen(true);
      return;
    }
    
    try {
      // Calculate word count
      const plainText = content.replace(/<[^>]*>/g, ' ');
      const wordCount = plainText.trim().split(/\s+/).filter(word => word !== '').length;
      
      await updateDraft(currentDraft.id, {
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
        description: "Failed to save draft",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleOpenDraft = (draft: Draft) => {
    setCurrentDraft(draft);
    toast({
      title: "Draft opened",
      description: `"${draft.title}" has been opened`,
      duration: 3000,
    });
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">
            {currentDraft ? currentDraft.title : "New Draft"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentDraft ? `Last saved ${currentDraft.updatedAt.toLocaleTimeString()}` : "Not saved yet"}
          </p>
        </div>
        <div className="hidden sm:flex space-x-2">
          <Button variant="outline" onClick={() => setDraftModalOpen(true)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </Button>
          <Button variant="outline" onClick={() => setCurrentDraft(null)}>
            <FilePlus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>
      
      <Separator className="my-2" />
      
      <div className="flex-1 flex flex-col md:flex-row gap-4 h-full overflow-hidden">
        {/* Mobile outline toggle */}
        <div className="md:hidden">
          <Collapsible
            open={isOutlineVisible}
            onOpenChange={setIsOutlineVisible}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full mb-2 flex items-center justify-between">
                <span>Outline</span>
                {isOutlineVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mb-4">
              <Card className="p-4 space-y-2">
                <p className="font-medium">Chapter Structure</p>
                <ul className="space-y-1 text-sm">
                  <li className="pl-2 border-l-2 border-primary">Introduction of main character</li>
                  <li className="pl-2 border-l-2 border-muted">Setting the scene</li>
                  <li className="pl-2 border-l-2 border-muted">Initial conflict</li>
                  <li className="pl-2 border-l-2 border-muted">Character decision</li>
                </ul>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        {/* Desktop outline sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0 overflow-auto">
          <Card className="p-4 h-full">
            <h3 className="font-medium mb-4">Chapter Outline</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Structure</p>
                <ul className="space-y-2 text-sm">
                  <li className="pl-2 border-l-2 border-primary">Introduction of main character</li>
                  <li className="pl-2 border-l-2 border-muted">Setting the scene</li>
                  <li className="pl-2 border-l-2 border-muted">Initial conflict</li>
                  <li className="pl-2 border-l-2 border-muted">Character decision</li>
                </ul>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
                <div className="text-sm">
                  Remember to emphasize the character's internal struggle with their past.
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Editor area */}
        <div className="flex-1 min-h-0 overflow-auto">
          <Card className="p-6 h-full bg-paper dark:bg-paper-dark shadow-sm">
            <RichTextEditor 
              initialContent={currentDraft?.content || ''} 
              onSave={handleSaveDraft}
              draft={currentDraft}
              loading={loading}
            />
          </Card>
        </div>
      </div>
      
      {/* Mobile action buttons */}
      <div className="md:hidden mt-4 space-y-2">
        <Button 
          onClick={() => setDraftModalOpen(true)}
          className="w-full"
          variant="outline"
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          Open Draft
        </Button>
        <Button 
          onClick={() => setCurrentDraft(null)}
          className="w-full" 
          variant="outline"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          New Draft
        </Button>
      </div>

      {/* Draft modal */}
      <DraftModal 
        isOpen={draftModalOpen}
        onClose={() => setDraftModalOpen(false)}
        onCreateDraft={handleCreateDraft}
        onOpenDraft={handleOpenDraft}
        projectId="demo-project-id" // Normally would come from auth context or URL
      />
    </div>
  );
}
