
import { useState, useEffect, useCallback } from 'react';
import { Draft } from '@/lib/db';
import { DraftService } from '@/services/draftService';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useToast } from '@/hooks/use-toast';

interface DraftState {
  currentDraft: Draft | null;
  drafts: Draft[];
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
}

interface UseUnifiedDraftManagerOptions {
  projectId: string;
  autoSaveInterval?: number;
  enableAutoSave?: boolean;
}

export function useUnifiedDraftManager({
  projectId,
  autoSaveInterval = 3000,
  enableAutoSave = true
}: UseUnifiedDraftManagerOptions) {
  const { toast } = useToast();
  const [state, setState] = useState<DraftState>({
    currentDraft: null,
    drafts: [],
    loading: false,
    error: null,
    hasUnsavedChanges: false,
    lastSaved: null,
  });

  // Auto-save functionality
  const handleAutoSave = useCallback(async (content: string): Promise<boolean> => {
    if (!state.currentDraft) return false;

    try {
      await DraftService.updateDraft(state.currentDraft.id, { content });
      
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      }));

      return true;
    } catch (error) {
      console.error('Auto-save failed:', error);
      return false;
    }
  }, [state.currentDraft]);

  const { scheduleAutoSave, saveNow, isSaving } = useAutoSave({
    onSave: handleAutoSave,
    interval: autoSaveInterval,
    enabled: enableAutoSave,
  });

  // Load drafts for project
  const loadDrafts = useCallback(async () => {
    if (!projectId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const projectDrafts = await DraftService.getDraftsByProject(projectId);
      setState(prev => ({
        ...prev,
        drafts: projectDrafts,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to load drafts:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load drafts',
        loading: false,
      }));
    }
  }, [projectId]);

  // Load specific draft
  const loadDraft = useCallback(async (draftId: string) => {
    try {
      const draft = await DraftService.getDraft(draftId);
      if (draft) {
        setState(prev => ({
          ...prev,
          currentDraft: draft,
          hasUnsavedChanges: false,
        }));
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      setState(prev => ({ ...prev, error: 'Failed to load draft' }));
    }
  }, []);

  // Create new draft
  const createDraft = useCallback(async (title: string, content: string = '') => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const draftId = await DraftService.createDraft({
        title,
        content,
        projectId,
        wordCount: content.trim().split(/\s+/).filter(w => w.length > 0).length,
      });

      const newDraft = await DraftService.getDraft(draftId);
      if (newDraft) {
        setState(prev => ({
          ...prev,
          currentDraft: newDraft,
          drafts: [newDraft, ...prev.drafts],
          loading: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        }));
      }

      return draftId;
    } catch (error) {
      console.error('Failed to create draft:', error);
      setState(prev => ({ ...prev, loading: false, error: 'Failed to create draft' }));
      throw error;
    }
  }, [projectId]);

  // Update content with auto-save
  const updateContent = useCallback((content: string) => {
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));
    scheduleAutoSave(content);
  }, [scheduleAutoSave]);

  // Manual save
  const saveContent = useCallback(async (content?: string) => {
    return await saveNow(content);
  }, [saveNow]);

  // Delete draft
  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      await DraftService.deleteDraft(draftId);
      setState(prev => ({
        ...prev,
        drafts: prev.drafts.filter(d => d.id !== draftId),
        currentDraft: prev.currentDraft?.id === draftId ? null : prev.currentDraft,
      }));
      
      toast({
        title: 'Draft deleted',
        description: 'The draft has been successfully deleted.',
      });
    } catch (error) {
      console.error('Failed to delete draft:', error);
      toast({
        title: 'Delete failed',
        description: 'The draft could not be deleted. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Get recent drafts (deduped and sorted)
  const getRecentDrafts = useCallback((limit: number = 5) => {
    return DraftService.getRecentDrafts(state.drafts, limit);
  }, [state.drafts]);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  return {
    // State
    currentDraft: state.currentDraft,
    drafts: state.drafts,
    loading: state.loading,
    saving: isSaving,
    error: state.error,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSaved: state.lastSaved,

    // Actions
    loadDraft,
    createDraft,
    updateContent,
    saveContent,
    deleteDraft,
    getRecentDrafts,
    
    // Utilities
    isAutoSaveEnabled: enableAutoSave,
  };
}
