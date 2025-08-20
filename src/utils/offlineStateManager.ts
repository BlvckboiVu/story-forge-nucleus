import { Draft, Project } from '@/lib/db';

interface StateChangeEvent {
  type: 'project_updated' | 'draft_updated' | 'project_selected' | 'draft_created' | 'draft_deleted' | 'connectivity_changed' | 'state_updated';
  data: any;
  timestamp: number;
}

interface OfflineState {
  currentProjectId: string | null;
  currentDraftId: string | null;
  editorState: {
    cursorPosition: number;
    scrollPosition: number;
    unsavedContent: string;
    lastSaved: number;
  } | null;
  connectivity: 'online' | 'offline' | 'syncing';
  pendingSync: Array<{
    id: string;
    action: 'create' | 'update' | 'delete';
    type: 'draft' | 'project';
    data: any;
    timestamp: number;
  }>;
}

class OfflineStateManager {
  private channel: BroadcastChannel;
  private state: OfflineState;
  private listeners: Map<string, Function[]> = new Map();
  private storageKey = 'storyforge-offline-state';

  constructor() {
    this.channel = new BroadcastChannel('storyforge-state-sync');
    this.state = this.loadState();
    this.setupChannelListener();
    this.setupConnectivityListener();
    this.setupStorageListener();
  }

  private loadState(): OfflineState {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return { ...this.getDefaultState(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load offline state:', error);
    }
    return this.getDefaultState();
  }

  private getDefaultState(): OfflineState {
    return {
      currentProjectId: null,
      currentDraftId: null,
      editorState: null,
      connectivity: navigator.onLine ? 'online' : 'offline',
      pendingSync: [],
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save offline state:', error);
    }
  }

  private setupChannelListener(): void {
    this.channel.onmessage = (event) => {
      const { type, data } = event.data as StateChangeEvent;
      this.notifyListeners(type, data);
    };
  }

  private setupConnectivityListener(): void {
    window.addEventListener('online', () => {
      this.updateConnectivity('online');
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.updateConnectivity('offline');
    });
  }

  private setupStorageListener(): void {
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          this.state = { ...this.state, ...newState };
          this.notifyListeners('state_updated', this.state);
        } catch (error) {
          console.error('Failed to parse storage update:', error);
        }
      }
    });
  }

  // Project state management
  setCurrentProject(projectId: string | null): void {
    this.state.currentProjectId = projectId;
    this.saveState();
    this.broadcastChange('project_selected', { projectId });
  }

  getCurrentProject(): string | null {
    return this.state.currentProjectId;
  }

  // Draft state management
  setCurrentDraft(draftId: string | null): void {
    this.state.currentDraftId = draftId;
    this.saveState();
    this.broadcastChange('draft_updated', { draftId });
  }

  getCurrentDraft(): string | null {
    return this.state.currentDraftId;
  }

  // Editor state management
  updateEditorState(editorState: Partial<OfflineState['editorState']>): void {
    this.state.editorState = {
      ...this.state.editorState,
      ...editorState,
    } as OfflineState['editorState'];
    this.saveState();
  }

  getEditorState(): OfflineState['editorState'] {
    return this.state.editorState;
  }

  // Connectivity management
  updateConnectivity(status: OfflineState['connectivity']): void {
    this.state.connectivity = status;
    this.saveState();
    this.broadcastChange('connectivity_changed', { status });
  }

  getConnectivity(): OfflineState['connectivity'] {
    return this.state.connectivity;
  }

  // Sync queue management
  addToSyncQueue(action: 'create' | 'update' | 'delete', type: 'draft' | 'project', data: any): void {
    const syncItem = {
      id: crypto.randomUUID(),
      action,
      type,
      data,
      timestamp: Date.now(),
    };

    this.state.pendingSync.push(syncItem);
    this.saveState();

    // Try to sync immediately if online
    if (this.state.connectivity === 'online') {
      this.triggerSync();
    }
  }

  private async triggerSync(): Promise<void> {
    if (this.state.connectivity !== 'online' || this.state.pendingSync.length === 0) {
      return;
    }

    this.updateConnectivity('syncing');

    try {
      // Process sync queue (implement actual sync logic based on your needs)
      const processed = [];
      
      for (const item of this.state.pendingSync) {
        try {
          await this.processSyncItem(item);
          processed.push(item.id);
        } catch (error) {
          console.error('Failed to sync item:', error);
          break; // Stop on first error to maintain order
        }
      }

      // Remove processed items
      this.state.pendingSync = this.state.pendingSync.filter(
        item => !processed.includes(item.id)
      );
      
      this.saveState();
      this.updateConnectivity('online');
    } catch (error) {
      console.error('Sync failed:', error);
      this.updateConnectivity('offline');
    }
  }

  private async processSyncItem(item: any): Promise<void> {
    // Placeholder for actual sync implementation
    // Placeholder for future remote sync logic (e.g., your own backend)
    console.log('Processing sync item:', item);
  }

  // URL state management
  updateUrlState(state: { projectId?: string; draftId?: string }): void {
    const url = new URL(window.location.href);
    
    if (state.projectId) {
      url.pathname = `/app/editor/${state.projectId}`;
      if (state.draftId) {
        url.searchParams.set('draft', state.draftId);
      }
    }

    window.history.replaceState({}, '', url.toString());
  }

  getUrlState(): { projectId?: string; draftId?: string } {
    const url = new URL(window.location.href);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[pathParts.length - 1];
    const draftId = url.searchParams.get('draft') || undefined;

    return { projectId, draftId };
  }

  // Event listeners
  subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Listener error:', error);
        }
      });
    }
  }

  private broadcastChange(type: StateChangeEvent['type'], data: any): void {
    const event: StateChangeEvent = {
      type,
      data,
      timestamp: Date.now(),
    };
    this.channel.postMessage(event);
  }

  // Cleanup
  destroy(): void {
    this.channel.close();
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
    window.removeEventListener('storage', () => {});
  }
}

export const offlineStateManager = new OfflineStateManager();
export default OfflineStateManager;
