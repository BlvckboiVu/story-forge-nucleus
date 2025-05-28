
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Draft, getDrafts } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface DraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDraft: (title: string) => void;
  onOpenDraft: (draft: Draft) => void;
  projectId?: string;
}

export function DraftModal({ isOpen, onClose, onCreateDraft, onOpenDraft, projectId }: DraftModalProps) {
  const [title, setTitle] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && projectId) {
      loadDrafts();
    }
  }, [isOpen, projectId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setIsCreating(false);
    }
  }, [isOpen]);

  const loadDrafts = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const draftsList = await getDrafts(projectId);
      setDrafts(draftsList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast({
        title: "Error loading drafts",
        description: "Failed to load your drafts. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    const trimmedTitle = title.trim();
    
    if (!trimmedTitle) {
      toast({
        title: "Title required",
        description: "Please enter a title for your draft",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (trimmedTitle.length > 200) {
      toast({
        title: "Title too long",
        description: "Title must be less than 200 characters",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      await onCreateDraft(trimmedTitle);
      setTitle('');
      onClose();
    } catch (error) {
      console.error('Error creating draft:', error);
      toast({
        title: "Error",
        description: "Failed to create draft. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenDraft = (draft: Draft) => {
    try {
      onOpenDraft(draft);
      onClose();
    } catch (error) {
      console.error('Error opening draft:', error);
      toast({
        title: "Error",
        description: "Failed to open draft. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isCreating) {
        handleCreateDraft();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Drafts</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4 min-h-0">
          {/* Create New Draft Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Create New Draft</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter draft title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
                maxLength={200}
                disabled={isCreating}
                autoFocus
              />
              <Button 
                onClick={handleCreateDraft}
                disabled={!title.trim() || isCreating}
                className="shrink-0"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
            {title.length > 180 && (
              <p className="text-xs text-amber-600">
                {200 - title.length} characters remaining
              </p>
            )}
          </div>
          
          {/* Recent Drafts Section */}
          <div className="space-y-3 min-h-0 flex flex-col">
            <h3 className="text-sm font-medium">Recent Drafts</h3>
            <div className="space-y-2 overflow-y-auto max-h-[250px] pr-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))
              ) : drafts.length > 0 ? (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex justify-between items-center p-3 rounded-md border cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleOpenDraft(draft)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{draft.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                        {' · '}
                        {draft.wordCount?.toLocaleString() || 0} words
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDraft(draft);
                      }}
                    >
                      Open
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No drafts found. Create your first draft to get started.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
