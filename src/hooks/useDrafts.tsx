
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Draft } from '@/types';
import { 
  getDrafts, 
  createDraft as createDraftDb, 
  updateDraft as updateDraftDb,
  deleteDraft as deleteDraftDb 
} from '@/lib/db';

interface CreateDraftData {
  title: string;
  content: string;
  projectId: string;
}

interface UpdateDraftData {
  title?: string;
  content?: string;
}

export function useDrafts(projectId?: string) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadDrafts = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedDrafts = await getDrafts(projectId);
      setDrafts(fetchedDrafts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drafts';
      setError(errorMessage);
      toast({
        title: 'Error loading drafts',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const createDraft = useCallback(async (data: CreateDraftData): Promise<Draft> => {
    setLoading(true);
    setError(null);
    
    try {
      const newDraft = await createDraftDb(data);
      setDrafts(prev => [newDraft, ...prev]);
      toast({
        title: 'Draft created',
        description: 'Your new draft has been created successfully.',
      });
      return newDraft;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create draft';
      setError(errorMessage);
      toast({
        title: 'Error creating draft',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateDraft = useCallback(async (id: string, data: UpdateDraftData): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await updateDraftDb(id, data);
      setDrafts(prev => prev.map(draft => 
        draft.id === id ? { ...draft, ...data, updatedAt: new Date() } : draft
      ));
      toast({
        title: 'Draft updated',
        description: 'Your draft has been updated successfully.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update draft';
      setError(errorMessage);
      toast({
        title: 'Error updating draft',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteDraft = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteDraftDb(id);
      setDrafts(prev => prev.filter(draft => draft.id !== id));
      toast({
        title: 'Draft deleted',
        description: 'Your draft has been deleted successfully.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete draft';
      setError(errorMessage);
      toast({
        title: 'Error deleting draft',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    drafts,
    loading,
    error,
    createDraft,
    updateDraft,
    deleteDraft,
    refetch: loadDrafts,
  };
}
