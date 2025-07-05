import { EnhancedOutline, OutlinePart } from '@/types/outline';
import { sanitizeHtml, sanitizeText } from '../security';

const MAX_SCENES_PER_PROJECT = 100;

export class OutlineValidation {
  static validateOutlineData(data: Partial<EnhancedOutline>): void {
    if (data.title && data.title.length > 200) {
      throw new Error('Outline title must be less than 200 characters');
    }

    if (data.totalScenes && data.totalScenes > MAX_SCENES_PER_PROJECT) {
      throw new Error(`Maximum ${MAX_SCENES_PER_PROJECT} scenes allowed per project`);
    }
  }

  static countTotalScenes(parts: OutlinePart[]): number {
    return parts.reduce((total, part) => 
      total + part.chapters.reduce((chapterTotal, chapter) => 
        chapterTotal + chapter.scenes.length, 0), 0);
  }

  static sanitizeOutline(outline: EnhancedOutline): EnhancedOutline {
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

  static getMaxScenes(): number {
    return MAX_SCENES_PER_PROJECT;
  }

  static validateSceneCount(currentCount: number, additional: number = 1): boolean {
    return (currentCount + additional) <= MAX_SCENES_PER_PROJECT;
  }
}
