import { useState, useEffect, useCallback } from 'react';
import { Draft } from '@/lib/db';
import { DraftService, EnhancedDraft } from '@/services/draftService';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useToast } from '@/hooks/use-toast';

interface DraftState {
  currentDraft: EnhancedDraft | null;
  drafts: EnhancedDraft[];
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
        currentDraft: prev.currentDraft ? {
          ...prev.currentDraft,
          content,
          updatedAt: new Date(),
        } : null,
      }));

      // Refresh drafts to update cache
      if (projectId) {
        const updatedDrafts = await DraftService.getDraftsByProject(projectId);
        setState(prev => ({ ...prev, drafts: updatedDrafts }));
      }

      return true;
    } catch (error) {
      console.error('Auto-save failed:', error);
      setState(prev => ({ ...prev, error: 'Auto-save failed' }));
      return false;
    }
  }, [state.currentDraft, projectId]);

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
        error: error instanceof Error ? error.message : 'Failed to load drafts',
        loading: false,
      }));
    }
  }, [projectId]);

  // Load specific draft
  const loadDraft = useCallback(async (draftId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const draft = await DraftService.getDraft(draftId);
      
      if (draft) {
        setState(prev => ({
          ...prev,
          currentDraft: draft,
          hasUnsavedChanges: false,
          loading: false,
        }));
      } else {
        throw new Error('Draft not found');
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load draft',
        loading: false,
      }));
    }
  }, []);

  // Create new draft with improved naming
  const createDraft = useCallback(async (title?: string, content: string = '') => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const draftId = await DraftService.createDraft({
        title: title || 'Untitled Draft', // Let the service handle unique naming
        content,
        projectId,
        wordCount: content.trim().split(/\s+/).filter(w => w.length > 0).length,
      });

      const newDraft = await DraftService.getDraft(draftId);
      if (newDraft) {
        // Reload all drafts to ensure consistency
        const updatedDrafts = await DraftService.getDraftsByProject(projectId);
        
        setState(prev => ({
          ...prev,
          currentDraft: newDraft,
          drafts: updatedDrafts,
          loading: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        }));
      }

      return draftId;
    } catch (error) {
      console.error('Failed to create draft:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create draft';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw new Error(errorMessage);
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
      
      // Reload drafts after deletion
      const updatedDrafts = await DraftService.getDraftsByProject(projectId);
      
      setState(prev => ({
        ...prev,
        drafts: updatedDrafts,
        currentDraft: prev.currentDraft?.id === draftId ? null : prev.currentDraft,
      }));
      
      toast({
        title: 'Draft deleted',
        description: 'The draft has been successfully deleted.',
        duration: 1200,
      });
    } catch (error) {
      console.error('Failed to delete draft:', error);
      toast({
        title: 'Delete failed',
        description: 'The draft could not be deleted. Please try again.',
        variant: 'destructive',
        duration: 2000,
      });
    }
  }, [projectId, toast]);

  // Get recent drafts (properly deduplicated)
  const getRecentDrafts = useCallback((limit: number = 5) => {
    return DraftService.getRecentDrafts(state.drafts, limit);
  }, [state.drafts]);

  // Load drafts on mount and when project changes
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
    refreshDrafts: loadDrafts,
    
    // Utilities
    isAutoSaveEnabled: enableAutoSave,
  };
}
