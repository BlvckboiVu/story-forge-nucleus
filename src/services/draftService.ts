import { Draft } from '@/lib/db';
import db from '@/lib/db';
import { sanitizeHtml, sanitizeText } from '@/utils/security';

/**
 * Unified draft service with validation, caching, and deduplication
 */
export class DraftService {
  private static cache = new Map<string, { data: Draft[]; timestamp: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Validates draft input data
   */
  private static validateDraft(data: Partial<Draft>): void {
    if (!data.projectId?.trim()) {
      throw new Error('Project ID is required');
    }
    
    if (data.title) {
      if (data.title.length > 200) {
        throw new Error('Title must be less than 200 characters');
      }
      if (!/^[a-zA-Z0-9\s\-_.,!?'"()[\]{}]+$/.test(data.title)) {
        throw new Error('Title contains invalid characters');
      }
    }

    if (data.content && data.content.length > 1000000) {
      throw new Error('Content exceeds maximum size limit (1MB)');
    }
  }

  /**
   * Gets cached drafts or fetches from database with proper deduplication
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

      // Sanitize and deduplicate drafts
      const sanitizedDrafts = drafts
        .map(draft => ({
          ...draft,
          content: sanitizeHtml(draft.content),
          title: sanitizeText(draft.title, 200),
        }))
        .filter((draft, index, arr) => 
          // Remove duplicates based on ID (keep most recent)
          arr.findIndex(d => d.id === draft.id) === index
        );

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

    // Check for existing draft with same title to prevent duplicates
    const existingDrafts = await this.getDraftsByProject(data.projectId);
    const duplicateTitle = existingDrafts.find(d => d.title === data.title);
    
    if (duplicateTitle) {
      throw new Error('A draft with this title already exists');
    }

    const sanitizedData = {
      ...data,
      title: sanitizeText(data.title, 200),
      content: sanitizeHtml(data.content),
    };

    try {
      const id = crypto.randomUUID();
      await db.drafts.add({
        ...sanitizedData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Draft);

      this.invalidateCache(data.projectId);
      return id;
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

    // Get existing draft to validate project ownership
    const existingDraft = await this.getDraft(id);
    if (!existingDraft) {
      throw new Error('Draft not found');
    }

    const sanitizedUpdates: Partial<Draft> = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.title) {
      sanitizedUpdates.title = sanitizeText(updates.title, 200);
    }

    if (updates.content !== undefined) {
      sanitizedUpdates.content = sanitizeHtml(updates.content);
      const plainText = sanitizedUpdates.content.replace(/<[^>]*>/g, ' ');
      sanitizedUpdates.wordCount = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
    }

    try {
      await db.drafts.update(id, sanitizedUpdates);
      this.invalidateCache(existingDraft.projectId);
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
      if (!draft) {
        throw new Error('Draft not found');
      }

      await db.drafts.delete(id);
      this.invalidateCache(draft.projectId);
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw new Error('Failed to delete draft');
    }
  }

  /**
   * Gets recent drafts with strict deduplication and proper sorting
   */
  static getRecentDrafts(drafts: Draft[], limit: number = 5): Draft[] {
    // Create a Map to ensure unique drafts by ID
    const uniqueDraftsMap = new Map<string, Draft>();
    
    drafts.forEach(draft => {
      const existing = uniqueDraftsMap.get(draft.id);
      // Keep the most recently updated version
      if (!existing || new Date(draft.updatedAt) > new Date(existing.updatedAt)) {
        uniqueDraftsMap.set(draft.id, draft);
      }
    });

    // Convert back to array and sort by update time
    return Array.from(uniqueDraftsMap.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Invalidates cache for a project and related caches
   */
  private static invalidateCache(projectId: string): void {
    this.cache.delete(`project:${projectId}`);
    // Also clear any cached recent drafts
    this.cache.delete(`recent:${projectId}`);
  }

  /**
   * Clears all cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets draft statistics for a project
   */
  static async getDraftStats(projectId: string): Promise<{
    totalDrafts: number;
    totalWords: number;
    lastUpdated: Date | null;
  }> {
    try {
      const drafts = await this.getDraftsByProject(projectId);
      
      return {
        totalDrafts: drafts.length,
        totalWords: drafts.reduce((sum, draft) => sum + (draft.wordCount || 0), 0),
        lastUpdated: drafts.length > 0 ? new Date(drafts[0].updatedAt) : null,
      };
    } catch (error) {
      console.error('Failed to get draft stats:', error);
      return { totalDrafts: 0, totalWords: 0, lastUpdated: null };
    }
  }
}
