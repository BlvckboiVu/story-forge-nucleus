
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface DocumentVersion {
  id: string;
  content: string;
  timestamp: Date;
  wordCount: number;
  title?: string;
  metadata?: {
    font?: string;
    theme?: string;
    viewMode?: string;
  };
}

interface UseVersionHistoryOptions {
  draftId?: string;
  maxVersions?: number;
  autoSaveVersions?: boolean;
  onVersionRestore?: (version: DocumentVersion) => void;
}

export const useVersionHistory = ({
  draftId,
  maxVersions = 50,
  autoSaveVersions = true,
  onVersionRestore
}: UseVersionHistoryOptions = {}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Load versions from localStorage
  useEffect(() => {
    if (!draftId) return;
    
    const savedVersions = localStorage.getItem(`versions_${draftId}`);
    if (savedVersions) {
      try {
        const parsed = JSON.parse(savedVersions).map((v: any) => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
        setVersions(parsed);
        setCurrentVersionIndex(parsed.length - 1);
      } catch (error) {
        console.error('Failed to load version history:', error);
      }
    }
  }, [draftId]);

  // Save versions to localStorage
  const saveVersions = useCallback((versionsToSave: DocumentVersion[]) => {
    if (!draftId) return;
    
    try {
      localStorage.setItem(`versions_${draftId}`, JSON.stringify(versionsToSave));
    } catch (error) {
      console.error('Failed to save version history:', error);
    }
  }, [draftId]);

  // Create a new version
  const createVersion = useCallback((
    content: string,
    metadata?: DocumentVersion['metadata'],
    title?: string
  ) => {
    if (!draftId || !content.trim()) return;

    const newVersion: DocumentVersion = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date(),
      wordCount: content.trim().split(/\s+/).length,
      title,
      metadata,
    };

    setVersions(prev => {
      const updated = [...prev, newVersion];
      
      // Limit the number of versions
      if (updated.length > maxVersions) {
        updated.splice(0, updated.length - maxVersions);
      }
      
      setCurrentVersionIndex(updated.length - 1);
      saveVersions(updated);
      return updated;
    });

    return newVersion;
  }, [draftId, maxVersions, saveVersions]);

  // Restore a specific version
  const restoreVersion = useCallback(async (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) {
      toast({
        title: t('versionNotFound'),
        description: t('versionNotFoundDescription'),
        variant: "destructive",
      });
      return;
    }

    setIsRestoring(true);
    
    try {
      onVersionRestore?.(version);
      const versionIndex = versions.findIndex(v => v.id === versionId);
      setCurrentVersionIndex(versionIndex);
      
      toast({
        title: t('versionRestored'),
        description: t('versionRestoredDescription', { 
          time: version.timestamp.toLocaleString() 
        }),
      });
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast({
        title: t('restoreFailedTitle'),
        description: t('restoreFailedDescription'),
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  }, [versions, onVersionRestore, toast, t]);

  // Undo to previous version
  const undo = useCallback(() => {
    if (currentVersionIndex <= 0) return;
    
    const previousVersion = versions[currentVersionIndex - 1];
    if (previousVersion) {
      restoreVersion(previousVersion.id);
    }
  }, [currentVersionIndex, versions, restoreVersion]);

  // Redo to next version
  const redo = useCallback(() => {
    if (currentVersionIndex >= versions.length - 1) return;
    
    const nextVersion = versions[currentVersionIndex + 1];
    if (nextVersion) {
      restoreVersion(nextVersion.id);
    }
  }, [currentVersionIndex, versions, restoreVersion]);

  // Delete a version
  const deleteVersion = useCallback((versionId: string) => {
    setVersions(prev => {
      const updated = prev.filter(v => v.id !== versionId);
      saveVersions(updated);
      
      // Adjust current index if necessary
      if (currentVersionIndex >= updated.length) {
        setCurrentVersionIndex(updated.length - 1);
      }
      
      return updated;
    });

    toast({
      title: t('versionDeleted'),
      description: t('versionDeletedDescription'),
    });
  }, [currentVersionIndex, saveVersions, toast, t]);

  // Clear all versions
  const clearHistory = useCallback(() => {
    setVersions([]);
    setCurrentVersionIndex(-1);
    if (draftId) {
      localStorage.removeItem(`versions_${draftId}`);
    }
    
    toast({
      title: t('historyCleared'),
      description: t('historyClearedDescription'),
    });
  }, [draftId, toast, t]);

  // Auto-save version when content changes significantly
  const autoSaveVersion = useCallback((
    content: string,
    metadata?: DocumentVersion['metadata']
  ) => {
    if (!autoSaveVersions || !content.trim()) return;

    const lastVersion = versions[versions.length - 1];
    if (!lastVersion) {
      createVersion(content, metadata, t('initialVersion'));
      return;
    }

    // Check if enough has changed to warrant a new version
    const wordCountDiff = Math.abs(
      content.trim().split(/\s+/).length - lastVersion.wordCount
    );
    const timeDiff = Date.now() - lastVersion.timestamp.getTime();
    
    // Create version if significant changes or enough time has passed
    if (wordCountDiff >= 10 || timeDiff >= 300000) { // 10 words or 5 minutes
      createVersion(content, metadata, t('autoSavedVersion'));
    }
  }, [autoSaveVersions, versions, createVersion, t]);

  // Get version comparison data
  const compareVersions = useCallback((versionId1: string, versionId2: string) => {
    const v1 = versions.find(v => v.id === versionId1);
    const v2 = versions.find(v => v.id === versionId2);
    
    if (!v1 || !v2) return null;

    return {
      wordCountDiff: v2.wordCount - v1.wordCount,
      timeDiff: v2.timestamp.getTime() - v1.timestamp.getTime(),
      contentLengthDiff: v2.content.length - v1.content.length,
    };
  }, [versions]);

  return {
    versions,
    currentVersionIndex,
    isRestoring,
    createVersion,
    restoreVersion,
    undo,
    redo,
    deleteVersion,
    clearHistory,
    autoSaveVersion,
    compareVersions,
    canUndo: currentVersionIndex > 0,
    canRedo: currentVersionIndex < versions.length - 1,
  };
};
