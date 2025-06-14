
import db from '@/lib/db';
import { EnhancedOutline } from '@/types/outline';
import { OutlineValidation } from './outline/outlineValidation';
import { OutlineCache } from './outline/outlineCache';

const outlineCache = new OutlineCache();

export class EnhancedOutlineService {
  static async getOutline(id: string): Promise<EnhancedOutline | null> {
    if (!id?.trim()) throw new Error('Outline ID is required');

    const cacheKey = `outline:${id}`;
    const cached = outlineCache.get<EnhancedOutline>(cacheKey);
    if (cached) return cached;

    try {
      const outline = await db.outlines.get(id);
      if (!outline) return null;

      const enhancedOutline: EnhancedOutline = {
        id: outline.id,
        projectId: outline.projectId,
        title: outline.title,
        parts: JSON.parse(outline.structure || '[]'),
        totalScenes: 0,
        maxScenes: OutlineValidation.getMaxScenes(),
        structure: 'custom',
        createdAt: outline.createdAt,
        updatedAt: outline.updatedAt,
      };

      enhancedOutline.totalScenes = OutlineValidation.countTotalScenes(enhancedOutline.parts);
      
      const sanitized = OutlineValidation.sanitizeOutline(enhancedOutline);
      outlineCache.set(cacheKey, sanitized);
      return sanitized;
    } catch (error) {
      console.error('Failed to get outline:', error);
      throw new Error('Failed to retrieve outline');
    }
  }

  static async createOutline(data: Omit<EnhancedOutline, 'id' | 'createdAt' | 'updatedAt' | 'totalScenes'>): Promise<string> {
    OutlineValidation.validateOutlineData(data);

    const totalScenes = OutlineValidation.countTotalScenes(data.parts);
    if (totalScenes > OutlineValidation.getMaxScenes()) {
      throw new Error(`Cannot create outline with ${totalScenes} scenes. Maximum is ${OutlineValidation.getMaxScenes()}.`);
    }

    const sanitizedData = OutlineValidation.sanitizeOutline({
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
    OutlineValidation.validateOutlineData(updates);

    const existingOutline = await this.getOutline(id);
    if (!existingOutline) throw new Error('Outline not found');

    const updatedParts = updates.parts || existingOutline.parts;
    const totalScenes = OutlineValidation.countTotalScenes(updatedParts);

    if (totalScenes > OutlineValidation.getMaxScenes()) {
      throw new Error(`Cannot update outline. Scene count would be ${totalScenes}, maximum is ${OutlineValidation.getMaxScenes()}.`);
    }

    const sanitizedUpdates = {
      title: updates.title ? OutlineValidation.sanitizeOutline({ ...existingOutline, title: updates.title }).title : undefined,
      structure: updates.parts ? JSON.stringify(OutlineValidation.sanitizeOutline({ ...existingOutline, parts: updates.parts }).parts) : undefined,
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
    return OutlineValidation.getMaxScenes();
  }

  static validateSceneCount(currentCount: number, additional: number = 1): boolean {
    return OutlineValidation.validateSceneCount(currentCount, additional);
  }
}
