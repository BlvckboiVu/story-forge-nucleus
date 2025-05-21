
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Draft, createDraft, getDrafts } from '@/lib/db';
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
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && projectId) {
      loadDrafts();
    }
  }, [isOpen, projectId]);

  const loadDrafts = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const draftsList = await getDrafts(projectId);
      setDrafts(draftsList);
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

  const handleCreateDraft = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your draft",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    onCreateDraft(title);
    setTitle('');
    onClose();
  };

  const handleOpenDraft = (draft: Draft) => {
    onOpenDraft(draft);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Drafts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Create New Draft</h3>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Draft Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1"
                maxLength={100}
                required
              />
              <Button onClick={handleCreateDraft}>Create</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recent Drafts</h3>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {loading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : drafts.length > 0 ? (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    onClick={() => handleOpenDraft(draft)}
                    className="flex justify-between items-center p-3 rounded-md border cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div>
                      <h4 className="font-medium">{draft.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}
                        {' · '}
                        {draft.wordCount} words
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">Open</Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No drafts found. Create your first draft to get started.
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
