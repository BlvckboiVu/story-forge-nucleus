
import { useState, useEffect, useCallback, useRef } from 'react';
import { useOfflineState } from './useOfflineState';
import { useToast } from './use-toast';

interface EditorStateData {
  content: string;
  cursorPosition: number;
  scrollPosition: number;
  selectionRange?: { start: number; end: number };
  lastModified: number;
  wordCount: number;
  sessionStartTime: number;
  autoSaveEnabled: boolean;
  preferences: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    theme: string;
  };
}

interface UseEnhancedEditorStateOptions {
  draftId?: string;
  autoSaveInterval?: number;
  enableRecovery?: boolean;
}

export function useEnhancedEditorState(options: UseEnhancedEditorStateOptions = {}) {
  const { draftId, autoSaveInterval = 2000, enableRecovery = true } = options;
  const { 
    editorState, 
    updateEditor, 
    isOffline, 
    currentDraft,
    addToSyncQueue 
  } = useOfflineState();
  
  const { toast } = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [recoveryData, setRecoveryData] = useState<EditorStateData | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<number>(0);

  // Enhanced state data with defaults
  const [stateData, setStateData] = useState<EditorStateData>(() => ({
    content: '',
    cursorPosition: 0,
    scrollPosition: 0,
    lastModified: Date.now(),
    wordCount: 0,
    sessionStartTime: Date.now(),
    autoSaveEnabled: true,
    preferences: {
      fontSize: 16,
      fontFamily: 'Inter',
      lineHeight: 1.6,
      theme: 'default',
    },
  }));

  // Load state from offline storage
  useEffect(() => {
    if (editorState && currentDraft === draftId) {
      setStateData(prev => ({
        ...prev,
        content: editorState.unsavedContent || prev.content,
        cursorPosition: editorState.cursorPosition || prev.cursorPosition,
        scrollPosition: editorState.scrollPosition || prev.scrollPosition,
        lastModified: editorState.lastSaved || prev.lastModified,
      }));
    }
  }, [editorState, currentDraft, draftId]);

  // Auto-recovery check
  useEffect(() => {
    if (!enableRecovery || !draftId) return;

    const recoveryKey = `editor-recovery-${draftId}`;
    const stored = localStorage.getItem(recoveryKey);
    
    if (stored) {
      try {
        const recovered = JSON.parse(stored) as EditorStateData;
        const timeDiff = Date.now() - recovered.lastModified;
        
        // Show recovery option if data is recent (within 1 hour)
        if (timeDiff < 3600000 && recovered.content !== stateData.content) {
          setRecoveryData(recovered);
          toast({
            title: "Unsaved changes detected",
            description: "Would you like to recover your previous work?",
            duration: 10000,
          });
        }
      } catch (error) {
        console.error('Failed to parse recovery data:', error);
        localStorage.removeItem(recoveryKey);
      }
    }
  }, [draftId, enableRecovery, toast, stateData.content]);

  // Auto-save mechanism
  useEffect(() => {
    if (!hasUnsavedChanges || !stateData.autoSaveEnabled) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      await performAutoSave();
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, stateData, autoSaveInterval]);

  // Save to recovery storage
  useEffect(() => {
    if (!enableRecovery || !draftId || !hasUnsavedChanges) return;

    const recoveryKey = `editor-recovery-${draftId}`;
    try {
      localStorage.setItem(recoveryKey, JSON.stringify(stateData));
    } catch (error) {
      console.error('Failed to save recovery data:', error);
    }
  }, [stateData, hasUnsavedChanges, draftId, enableRecovery]);

  const performAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges || isAutoSaving) return;

    setIsAutoSaving(true);
    try {
      // Update offline state
      updateEditor({
        unsavedContent: stateData.content,
        cursorPosition: stateData.cursorPosition,
        scrollPosition: stateData.scrollPosition,
        lastSaved: Date.now(),
      });

      // Add to sync queue if we have a draft
      if (draftId) {
        addToSyncQueue('update', 'draft', {
          id: draftId,
          content: stateData.content,
          wordCount: stateData.wordCount,
          updatedAt: new Date(),
        });
      }

      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);
      lastSaveRef.current = Date.now();

      // Clear recovery data after successful save
      if (enableRecovery && draftId) {
        localStorage.removeItem(`editor-recovery-${draftId}`);
      }

    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save failed",
        description: isOffline ? "Changes saved locally" : "Please try saving manually",
        variant: isOffline ? "default" : "destructive",
      });
    } finally {
      setIsAutoSaving(false);
    }
  }, [hasUnsavedChanges, isAutoSaving, stateData, updateEditor, draftId, addToSyncQueue, lastSaveRef, enableRecovery, isOffline, toast]);

  const updateContent = useCallback((content: string) => {
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    setStateData(prev => ({
      ...prev,
      content,
      wordCount,
      lastModified: Date.now(),
    }));
    
    setHasUnsavedChanges(true);
  }, []);

  const updateCursorPosition = useCallback((position: number) => {
    setStateData(prev => ({
      ...prev,
      cursorPosition: position,
      lastModified: Date.now(),
    }));
  }, []);

  const updateScrollPosition = useCallback((position: number) => {
    setStateData(prev => ({
      ...prev,
      scrollPosition: position,
    }));
  }, []);

  const updatePreferences = useCallback((preferences: Partial<EditorStateData['preferences']>) => {
    setStateData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
      lastModified: Date.now(),
    }));
  }, []);

  const recoverFromBackup = useCallback(() => {
    if (recoveryData) {
      setStateData(recoveryData);
      setHasUnsavedChanges(true);
      setRecoveryData(null);
      toast({
        title: "Content recovered",
        description: "Your previous work has been restored",
      });
    }
  }, [recoveryData, toast]);

  const dismissRecovery = useCallback(() => {
    if (recoveryData && draftId) {
      localStorage.removeItem(`editor-recovery-${draftId}`);
      setRecoveryData(null);
    }
  }, [recoveryData, draftId]);

  const manualSave = useCallback(async () => {
    await performAutoSave();
    toast({
      title: "Draft saved",
      description: isOffline ? "Saved locally, will sync when online" : "Saved successfully",
    });
  }, [performAutoSave, isOffline, toast]);

  return {
    // State data
    content: stateData.content,
    cursorPosition: stateData.cursorPosition,
    scrollPosition: stateData.scrollPosition,
    wordCount: stateData.wordCount,
    preferences: stateData.preferences,
    
    // Status
    hasUnsavedChanges,
    isAutoSaving,
    lastSaveTime,
    recoveryData,
    
    // Actions
    updateContent,
    updateCursorPosition,
    updateScrollPosition,
    updatePreferences,
    recoverFromBackup,
    dismissRecovery,
    manualSave,
    
    // Utilities
    sessionDuration: Date.now() - stateData.sessionStartTime,
    lastModified: new Date(stateData.lastModified),
  };
}
