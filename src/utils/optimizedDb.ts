
import * as React from 'react';
import { Draft, Project } from '@/lib/db';
import db from '@/lib/db';
import { sanitizeHtml, sanitizeText } from './security';

/**
 * Optimized database operations with caching and validation
 */

// Simple in-memory cache
class Cache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new Cache();

// Optimized draft operations
export class OptimizedDraftService {
  private static validateDraftData(data: Partial<Draft>): void {
    if (data.title) {
      if (data.title.length > 200) {
        throw new Error('Title must be less than 200 characters');
      }
      if (!/^[a-zA-Z0-9\s\-_.,!?'"()[\]{}]+$/.test(data.title)) {
        throw new Error('Title contains invalid characters');
      }
    }

    if (data.content) {
      if (data.content.length > 1000000) { // 1MB limit
        throw new Error('Content exceeds maximum size limit');
      }
    }
  }

  static async getDraft(id: string): Promise<Draft | null> {
    if (!id?.trim()) throw new Error('Draft ID is required');

    const cacheKey = `draft:${id}`;
    const cached = cache.get<Draft>(cacheKey);
    if (cached) return cached;

    try {
      const draft = await db.drafts.get(id);
      if (draft) {
        // Sanitize content when retrieving
        draft.content = sanitizeHtml(draft.content);
        cache.set(cacheKey, draft);
      }
      return draft || null;
    } catch (error) {
      console.error('Failed to get draft:', error);
      throw new Error('Failed to retrieve draft');
    }
  }

  static async createDraft(data: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.validateDraftData(data);

    const sanitizedData = {
      ...data,
      title: sanitizeText(data.title, 200),
      content: sanitizeHtml(data.content),
    };

    try {
      const id = await db.drafts.add({
        ...sanitizedData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Draft);
      
      cache.invalidate('drafts:');
      return typeof id === 'string' ? id : String(id);
    } catch (error) {
      console.error('Failed to create draft:', error);
      throw new Error('Failed to create draft');
    }
  }

  static async updateDraft(id: string, updates: Partial<Draft>): Promise<void> {
    if (!id?.trim()) throw new Error('Draft ID is required');
    this.validateDraftData(updates);

    const sanitizedUpdates: Partial<Draft> = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.title) {
      sanitizedUpdates.title = sanitizeText(updates.title, 200);
    }

    if (updates.content) {
      sanitizedUpdates.content = sanitizeHtml(updates.content);
      // Auto-calculate word count
      const plainText = sanitizedUpdates.content.replace(/<[^>]*>/g, ' ');
      sanitizedUpdates.wordCount = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
    }

    try {
      await db.drafts.update(id, sanitizedUpdates);
      cache.invalidate(`draft:${id}`);
      cache.invalidate('drafts:');
    } catch (error) {
      console.error('Failed to update draft:', error);
      throw new Error('Failed to update draft');
    }
  }

  static async getDraftsByProject(projectId: string): Promise<Draft[]> {
    if (!projectId?.trim()) throw new Error('Project ID is required');

    const cacheKey = `drafts:${projectId}`;
    const cached = cache.get<Draft[]>(cacheKey);
    if (cached) return cached;

    try {
      const drafts = await db.drafts
        .where('projectId')
        .equals(projectId)
        .orderBy('updatedAt')
        .reverse()
        .toArray();

      // Sanitize all content
      const sanitizedDrafts = drafts.map(draft => ({
        ...draft,
        content: sanitizeHtml(draft.content),
      }));

      cache.set(cacheKey, sanitizedDrafts);
      return sanitizedDrafts;
    } catch (error) {
      console.error('Failed to get drafts:', error);
      throw new Error('Failed to retrieve drafts');
    }
  }

  static async deleteDraft(id: string): Promise<void> {
    if (!id?.trim()) throw new Error('Draft ID is required');

    try {
      await db.drafts.delete(id);
      cache.invalidate(`draft:${id}`);
      cache.invalidate('drafts:');
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw new Error('Failed to delete draft');
    }
  }
}

// Hook for optimized draft operations
export const useOptimizedDrafts = (projectId: string) => {
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDrafts = React.useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const projectDrafts = await OptimizedDraftService.getDraftsByProject(projectId);
      setDrafts(projectDrafts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load drafts';
      setError(errorMessage);
      console.error('Error loading drafts:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  return {
    drafts,
    loading,
    error,
    refetch: loadDrafts,
  };
};
