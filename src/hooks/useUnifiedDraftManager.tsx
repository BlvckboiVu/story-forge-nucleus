
import { useState, useEffect, useCallback, useRef } from 'react';
import { Draft } from '@/lib/db';
import { OptimizedDraftService } from '@/utils/optimizedDb';
import { useToast } from '@/hooks/use-toast';

interface DraftState {
  currentDraft: Draft | null;
  drafts: Draft[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
}

interface UseUnifiedDraftManagerOptions {
  projectId: string;
  autoSaveInterval?: number;
  enableAutoSave?: boolean;
}

/**
 * Unified draft management hook that consolidates all draft operations
 * Follows industry standards for state management and auto-save
 */
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
    saving: false,
    error: null,
    hasUnsavedChanges: false,
    lastSaved: null,
  });

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingContentRef = useRef<string>('');
  const lastSaveTimeRef = useRef<number>(0);

  // Load drafts for project
  const loadDrafts = useCallback(async () => {
    if (!projectId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const projectDrafts = await OptimizedDraftService.getDraftsByProject(projectId);
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
      const draft = await OptimizedDraftService.getDraft(draftId);
      if (draft) {
        setState(prev => ({
          ...prev,
          currentDraft: draft,
          hasUnsavedChanges: false,
        }));
        pendingContentRef.current = draft.content;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      setState(prev => ({ ...prev, error: 'Failed to load draft' }));
    }
  }, []);

  // Create new draft
  const createDraft = useCallback(async (title: string, content: string = '') => {
    try {
      setState(prev => ({ ...prev, saving: true }));
      
      const draftId = await OptimizedDraftService.createDraft({
        title,
        content,
        projectId,
        wordCount: content.trim().split(/\s+/).filter(w => w.length > 0).length,
      });

      const newDraft = await OptimizedDraftService.getDraft(draftId);
      if (newDraft) {
        setState(prev => ({
          ...prev,
          currentDraft: newDraft,
          drafts: [newDraft, ...prev.drafts],
          saving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        }));
        pendingContentRef.current = content;
      }

      return draftId;
    } catch (error) {
      console.error('Failed to create draft:', error);
      setState(prev => ({ ...prev, saving: false, error: 'Failed to create draft' }));
      throw error;
    }
  }, [projectId]);

  // Update content (triggers auto-save)
  const updateContent = useCallback((content: string) => {
    pendingContentRef.current = content;
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));

    // Clear existing auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new auto-save timeout
    if (enableAutoSave && state.currentDraft) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveContent(content);
      }, autoSaveInterval);
    }
  }, [enableAutoSave, autoSaveInterval, state.currentDraft]);

  // Manual save
  const saveContent = useCallback(async (content?: string) => {
    const contentToSave = content || pendingContentRef.current;
    
    if (!state.currentDraft || !contentToSave.trim()) return;

    // Prevent concurrent saves
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 1000) return;
    lastSaveTimeRef.current = now;

    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      await OptimizedDraftService.updateDraft(state.currentDraft.id, {
        content: contentToSave,
      });

      const updatedDraft = await OptimizedDraftService.getDraft(state.currentDraft.id);
      if (updatedDraft) {
        setState(prev => ({
          ...prev,
          currentDraft: updatedDraft,
          drafts: prev.drafts.map(d => d.id === updatedDraft.id ? updatedDraft : d),
          saving: false,
          hasUnsavedChanges: false,
          lastSaved: new Date(),
        }));
      }

      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      setState(prev => ({ ...prev, saving: false, error: 'Failed to save draft' }));
      toast({
        title: 'Save failed',
        description: 'Your changes could not be saved. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  }, [state.currentDraft, toast]);

  // Delete draft
  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      await OptimizedDraftService.deleteDraft(draftId);
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
    const uniqueDrafts = state.drafts.reduce((acc, draft) => {
      if (!acc.find(d => d.id === draft.id)) {
        acc.push(draft);
      }
      return acc;
    }, [] as Draft[]);

    return uniqueDrafts
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [state.drafts]);

  // Load drafts on mount
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    currentDraft: state.currentDraft,
    drafts: state.drafts,
    loading: state.loading,
    saving: state.saving,
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
    pendingContent: pendingContentRef.current,
  };
}
