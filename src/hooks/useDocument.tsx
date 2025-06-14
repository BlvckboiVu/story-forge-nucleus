
import { useState, useEffect } from 'react';
import { Draft } from '../lib/db';
import db from '../lib/db';

interface UseDocumentOptions {
  autoSave?: boolean;
  autoSaveInterval?: number; // in milliseconds
}

/**
 * Custom hook for managing document state with auto-save functionality
 * Provides CRUD operations for documents with automatic persistence
 * @param documentId - ID of the document to manage
 * @param options - Configuration options for auto-save behavior
 * @returns Object with document state and management functions
 */
export function useDocument(documentId: string | null, options: UseDocumentOptions = {}) {
  const [document, setDocument] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const { autoSave = true, autoSaveInterval = 5000 } = options;

  /**
   * Loads document from IndexedDB by ID
   * Sets loading and error states appropriately
   */
  useEffect(() => {
    const loadDocument = async () => {
      if (!documentId) {
        setDocument(null);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const doc = await db.drafts.get(documentId);
        if (doc) {
          setDocument(doc);
        } else {
          setError(`Document with ID ${documentId} not found`);
        }
      } catch (e) {
        console.error('Error loading document:', e);
        setError(e instanceof Error ? e.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    
    loadDocument();
  }, [documentId]);

  /**
   * Auto-save effect that periodically saves document changes
   * Only saves when document exists, has changes, and is not loading
   */
  useEffect(() => {
    if (!autoSave || !document || loading) return;
    
    let timeout: number;
    
    const saveChanges = async () => {
      try {
        await db.drafts.update(document.id, {
          ...document,
          updatedAt: new Date()
        });
        
        setLastSaved(new Date());
      } catch (e) {
        console.error('Error auto-saving document:', e);
        // We don't set the error state here to avoid disrupting the user
      }
    };
    
    timeout = window.setTimeout(saveChanges, autoSaveInterval);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [document, autoSave, autoSaveInterval, loading]);

  /**
   * Manually saves document with optional updates
   * @param updates - Partial document updates to apply before saving
   * @throws Error if save operation fails
   */
  const saveDocument = async (updates?: Partial<Draft>) => {
    if (!document) return;
    
    try {
      setError(null);
      
      const updatedDoc = {
        ...document,
        ...updates,
        updatedAt: new Date()
      };
      
      await db.drafts.update(document.id, updatedDoc);
      
      setDocument(updatedDoc);
      setLastSaved(new Date());
    } catch (e) {
      console.error('Error saving document:', e);
      setError(e instanceof Error ? e.message : 'Failed to save document');
      throw e;
    }
  };

  /**
   * Updates document content in local state
   * Automatically recalculates word count
   * @param newContent - New content to set for the document
   */
  const updateContent = (newContent: string) => {
    if (!document) return;
    
    setDocument(prev => prev ? {
      ...prev,
      content: newContent,
      // Update the wordCount when content changes
      wordCount: newContent.trim().split(/\s+/).length
    } : null);
  };

  return {
    document,
    loading,
    error,
    lastSaved,
    saveDocument,
    updateContent,
  };
}
