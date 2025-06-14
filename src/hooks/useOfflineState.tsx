
import { useState, useEffect, useCallback } from 'react';
import { offlineStateManager } from '@/utils/offlineStateManager';

interface UseOfflineStateOptions {
  syncOnMount?: boolean;
  persistEditorState?: boolean;
}

export function useOfflineState(options: UseOfflineStateOptions = {}) {
  const { syncOnMount = true, persistEditorState = true } = options;

  const [connectivity, setConnectivity] = useState(offlineStateManager.getConnectivity());
  const [currentProject, setCurrentProject] = useState(offlineStateManager.getCurrentProject());
  const [currentDraft, setCurrentDraft] = useState(offlineStateManager.getCurrentDraft());
  const [editorState, setEditorState] = useState(offlineStateManager.getEditorState());

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribeConnectivity = offlineStateManager.subscribe('connectivity_changed', 
      (data: { status: string }) => setConnectivity(data.status as any)
    );

    const unsubscribeProject = offlineStateManager.subscribe('project_selected',
      (data: { projectId: string | null }) => setCurrentProject(data.projectId)
    );

    const unsubscribeDraft = offlineStateManager.subscribe('draft_updated',
      (data: { draftId: string | null }) => setCurrentDraft(data.draftId)
    );

    const unsubscribeState = offlineStateManager.subscribe('state_updated',
      () => {
        setConnectivity(offlineStateManager.getConnectivity());
        setCurrentProject(offlineStateManager.getCurrentProject());
        setCurrentDraft(offlineStateManager.getCurrentDraft());
        setEditorState(offlineStateManager.getEditorState());
      }
    );

    return () => {
      unsubscribeConnectivity();
      unsubscribeProject();
      unsubscribeDraft();
      unsubscribeState();
    };
  }, []);

  // Sync URL state with offline state on mount
  useEffect(() => {
    if (syncOnMount) {
      const urlState = offlineStateManager.getUrlState();
      if (urlState.projectId && urlState.projectId !== currentProject) {
        offlineStateManager.setCurrentProject(urlState.projectId);
      }
      if (urlState.draftId && urlState.draftId !== currentDraft) {
        offlineStateManager.setCurrentDraft(urlState.draftId);
      }
    }
  }, [syncOnMount, currentProject, currentDraft]);

  const updateProject = useCallback((projectId: string | null) => {
    offlineStateManager.setCurrentProject(projectId);
    offlineStateManager.updateUrlState({ projectId: projectId || undefined });
  }, []);

  const updateDraft = useCallback((draftId: string | null) => {
    offlineStateManager.setCurrentDraft(draftId);
    const projectId = offlineStateManager.getCurrentProject();
    offlineStateManager.updateUrlState({ 
      projectId: projectId || undefined,
      draftId: draftId || undefined 
    });
  }, []);

  const updateEditor = useCallback((updates: {
    cursorPosition?: number;
    scrollPosition?: number;
    unsavedContent?: string;
    lastSaved?: number;
  }) => {
    if (persistEditorState) {
      offlineStateManager.updateEditorState({
        ...updates,
        lastSaved: updates.lastSaved || Date.now(),
      });
    }
  }, [persistEditorState]);

  const addToSyncQueue = useCallback((
    action: 'create' | 'update' | 'delete',
    type: 'draft' | 'project',
    data: any
  ) => {
    offlineStateManager.addToSyncQueue(action, type, data);
  }, []);

  return {
    // State
    connectivity,
    currentProject,
    currentDraft,
    editorState,
    isOnline: connectivity === 'online',
    isOffline: connectivity === 'offline',
    isSyncing: connectivity === 'syncing',

    // Actions
    updateProject,
    updateDraft,
    updateEditor,
    addToSyncQueue,

    // Utilities
    getUrlState: () => offlineStateManager.getUrlState(),
    updateUrlState: (state: { projectId?: string; draftId?: string }) => 
      offlineStateManager.updateUrlState(state),
  };
}

export default useOfflineState;
