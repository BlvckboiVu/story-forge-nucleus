
import db from '@/lib/db';
import { EnhancedOutline, OutlinePart, OutlineChapter, OutlineScene } from '@/types/outline';
import { sanitizeHtml, sanitizeText } from './security';

const MAX_SCENES_PER_PROJECT = 100;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class OutlineCache {
  private cache = new Map<string, { data: any; timestamp: number }>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || Date.now() - item.timestamp > CACHE_TTL) {
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
}

const outlineCache = new OutlineCache();

export class EnhancedOutlineService {
  private static validateOutlineData(data: Partial<EnhancedOutline>): void {
    if (data.title && data.title.length > 200) {
      throw new Error('Outline title must be less than 200 characters');
    }

    if (data.totalScenes && data.totalScenes > MAX_SCENES_PER_PROJECT) {
      throw new Error(`Maximum ${MAX_SCENES_PER_PROJECT} scenes allowed per project`);
    }
  }

  private static countTotalScenes(parts: OutlinePart[]): number {
    return parts.reduce((total, part) => 
      total + part.chapters.reduce((chapterTotal, chapter) => 
        chapterTotal + chapter.scenes.length, 0), 0);
  }

  private static sanitizeOutline(outline: EnhancedOutline): EnhancedOutline {
    return {
      ...outline,
      title: sanitizeText(outline.title, 200),
      parts: outline.parts.map(part => ({
        ...part,
        title: sanitizeText(part.title, 100),
        summary: part.summary ? sanitizeHtml(part.summary) : undefined,
        notes: part.notes ? sanitizeHtml(part.notes) : undefined,
        chapters: part.chapters.map(chapter => ({
          ...chapter,
          title: sanitizeText(chapter.title, 100),
          summary: chapter.summary ? sanitizeHtml(chapter.summary) : undefined,
          notes: chapter.notes ? sanitizeHtml(chapter.notes) : undefined,
          scenes: chapter.scenes.map(scene => ({
            ...scene,
            title: sanitizeText(scene.title, 100),
            summary: scene.summary ? sanitizeHtml(scene.summary) : undefined,
            notes: scene.notes ? sanitizeHtml(scene.notes) : undefined,
            content: scene.content ? sanitizeHtml(scene.content) : undefined,
          }))
        }))
      }))
    };
  }

  static async getOutline(id: string): Promise<EnhancedOutline | null> {
    if (!id?.trim()) throw new Error('Outline ID is required');

    const cacheKey = `outline:${id}`;
    const cached = outlineCache.get<EnhancedOutline>(cacheKey);
    if (cached) return cached;

    try {
      const outline = await db.outlines.get(id);
      if (!outline) return null;

      // Parse the structure from string to hierarchical format
      const enhancedOutline: EnhancedOutline = {
        id: outline.id,
        projectId: outline.projectId,
        title: outline.title,
        parts: JSON.parse(outline.structure || '[]'),
        totalScenes: 0,
        maxScenes: MAX_SCENES_PER_PROJECT,
        structure: 'custom',
        createdAt: outline.createdAt,
        updatedAt: outline.updatedAt,
      };

      enhancedOutline.totalScenes = this.countTotalScenes(enhancedOutline.parts);
      
      const sanitized = this.sanitizeOutline(enhancedOutline);
      outlineCache.set(cacheKey, sanitized);
      return sanitized;
    } catch (error) {
      console.error('Failed to get outline:', error);
      throw new Error('Failed to retrieve outline');
    }
  }

  static async createOutline(data: Omit<EnhancedOutline, 'id' | 'createdAt' | 'updatedAt' | 'totalScenes'>): Promise<string> {
    this.validateOutlineData(data);

    const totalScenes = this.countTotalScenes(data.parts);
    if (totalScenes > MAX_SCENES_PER_PROJECT) {
      throw new Error(`Cannot create outline with ${totalScenes} scenes. Maximum is ${MAX_SCENES_PER_PROJECT}.`);
    }

    const sanitizedData = this.sanitizeOutline({
      ...data,
      id: crypto.randomUUID(),
      totalScenes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      const id = await db.outlines.add({
        id: sanitizedData.id,
        projectId: sanitizedData.projectId,
        title: sanitizedData.title,
        structure: JSON.stringify(sanitizedData.parts),
        createdAt: sanitizedData.createdAt,
        updatedAt: sanitizedData.updatedAt,
      });

      outlineCache.invalidate('outlines:');
      return typeof id === 'string' ? id : String(id);
    } catch (error) {
      console.error('Failed to create outline:', error);
      throw new Error('Failed to create outline');
    }
  }

  static async updateOutline(id: string, updates: Partial<EnhancedOutline>): Promise<void> {
    if (!id?.trim()) throw new Error('Outline ID is required');
    this.validateOutlineData(updates);

    const existingOutline = await this.getOutline(id);
    if (!existingOutline) throw new Error('Outline not found');

    const updatedParts = updates.parts || existingOutline.parts;
    const totalScenes = this.countTotalScenes(updatedParts);

    if (totalScenes > MAX_SCENES_PER_PROJECT) {
      throw new Error(`Cannot update outline. Scene count would be ${totalScenes}, maximum is ${MAX_SCENES_PER_PROJECT}.`);
    }

    const sanitizedUpdates = {
      title: updates.title ? sanitizeText(updates.title, 200) : undefined,
      structure: updates.parts ? JSON.stringify(this.sanitizeOutline({ ...existingOutline, parts: updates.parts }).parts) : undefined,
      updatedAt: new Date(),
    };

    try {
      await db.outlines.update(id, sanitizedUpdates);
      outlineCache.invalidate(`outline:${id}`);
      outlineCache.invalidate('outlines:');
    } catch (error) {
      console.error('Failed to update outline:', error);
      throw new Error('Failed to update outline');
    }
  }

  static async getProjectOutlines(projectId: string): Promise<EnhancedOutline[]> {
    if (!projectId?.trim()) throw new Error('Project ID is required');

    const cacheKey = `outlines:${projectId}`;
    const cached = outlineCache.get<EnhancedOutline[]>(cacheKey);
    if (cached) return cached;

    try {
      const outlines = await db.outlines
        .where('projectId')
        .equals(projectId)
        .reverse()
        .sortBy('updatedAt');

      const enhancedOutlines = await Promise.all(
        outlines.map(async (outline) => {
          const enhanced = await this.getOutline(outline.id);
          return enhanced!;
        })
      );

      outlineCache.set(cacheKey, enhancedOutlines);
      return enhancedOutlines;
    } catch (error) {
      console.error('Failed to get project outlines:', error);
      throw new Error('Failed to retrieve project outlines');
    }
  }

  static async deleteOutline(id: string): Promise<void> {
    if (!id?.trim()) throw new Error('Outline ID is required');

    try {
      await db.outlines.delete(id);
      outlineCache.invalidate(`outline:${id}`);
      outlineCache.invalidate('outlines:');
    } catch (error) {
      console.error('Failed to delete outline:', error);
      throw new Error('Failed to delete outline');
    }
  }

  static getMaxScenes(): number {
    return MAX_SCENES_PER_PROJECT;
  }

  static validateSceneCount(currentCount: number, additional: number = 1): boolean {
    return (currentCount + additional) <= MAX_SCENES_PER_PROJECT;
  }
}
