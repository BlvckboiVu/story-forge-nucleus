
import { Draft } from '@/lib/db';
import db from '@/lib/db';
import { sanitizeHtml, sanitizeText } from '@/utils/security';

/**
 * Centralized draft service with validation and caching
 */
export class DraftService {
  private static cache = new Map<string, { data: Draft[]; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Validates draft input data
   */
  private static validateDraft(data: Partial<Draft>): void {
    if (data.title && (data.title.length > 200 || !/^[a-zA-Z0-9\s\-_.,!?'"()[\]{}]+$/.test(data.title))) {
      throw new Error('Invalid title format or length');
    }
    if (data.content && data.content.length > 1000000) {
      throw new Error('Content exceeds maximum size limit');
    }
  }

  /**
   * Gets cached drafts or fetches from database
   */
  static async getDraftsByProject(projectId: string): Promise<Draft[]> {
    if (!projectId?.trim()) throw new Error('Project ID is required');

    const cacheKey = `project:${projectId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const drafts = await db.drafts
        .where('projectId')
        .equals(projectId)
        .reverse()
        .sortBy('updatedAt');

      const sanitizedDrafts = drafts.map(draft => ({
        ...draft,
        content: sanitizeHtml(draft.content),
        title: sanitizeText(draft.title, 200),
      }));

      this.cache.set(cacheKey, { data: sanitizedDrafts, timestamp: Date.now() });
      return sanitizedDrafts;
    } catch (error) {
      console.error('Failed to get drafts:', error);
      throw new Error('Failed to retrieve drafts');
    }
  }

  /**
   * Creates a new draft with validation
   */
  static async createDraft(data: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.validateDraft(data);

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

      this.invalidateCache(data.projectId);
      return typeof id === 'string' ? id : String(id);
    } catch (error) {
      console.error('Failed to create draft:', error);
      throw new Error('Failed to create draft');
    }
  }

  /**
   * Updates a draft with validation and auto word count
   */
  static async updateDraft(id: string, updates: Partial<Draft>): Promise<void> {
    if (!id?.trim()) throw new Error('Draft ID is required');
    this.validateDraft(updates);

    const sanitizedUpdates: Partial<Draft> = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.title) {
      sanitizedUpdates.title = sanitizeText(updates.title, 200);
    }

    if (updates.content) {
      sanitizedUpdates.content = sanitizeHtml(updates.content);
      const plainText = sanitizedUpdates.content.replace(/<[^>]*>/g, ' ');
      sanitizedUpdates.wordCount = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
    }

    try {
      await db.drafts.update(id, sanitizedUpdates);
      
      // Get draft to find projectId for cache invalidation
      const draft = await db.drafts.get(id);
      if (draft) {
        this.invalidateCache(draft.projectId);
      }
    } catch (error) {
      console.error('Failed to update draft:', error);
      throw new Error('Failed to update draft');
    }
  }

  /**
   * Gets a single draft by ID
   */
  static async getDraft(id: string): Promise<Draft | null> {
    if (!id?.trim()) throw new Error('Draft ID is required');

    try {
      const draft = await db.drafts.get(id);
      if (draft) {
        draft.content = sanitizeHtml(draft.content);
        draft.title = sanitizeText(draft.title, 200);
      }
      return draft || null;
    } catch (error) {
      console.error('Failed to get draft:', error);
      throw new Error('Failed to retrieve draft');
    }
  }

  /**
   * Deletes a draft
   */
  static async deleteDraft(id: string): Promise<void> {
    if (!id?.trim()) throw new Error('Draft ID is required');

    try {
      const draft = await db.drafts.get(id);
      await db.drafts.delete(id);
      
      if (draft) {
        this.invalidateCache(draft.projectId);
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw new Error('Failed to delete draft');
    }
  }

  /**
   * Gets recent drafts with deduplication
   */
  static getRecentDrafts(drafts: Draft[], limit: number = 5): Draft[] {
    const uniqueDrafts = drafts.reduce((acc, draft) => {
      if (!acc.find(d => d.id === draft.id)) {
        acc.push(draft);
      }
      return acc;
    }, [] as Draft[]);

    return uniqueDrafts
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Invalidates cache for a project
   */
  private static invalidateCache(projectId: string): void {
    this.cache.delete(`project:${projectId}`);
  }

  /**
   * Clears all cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}
