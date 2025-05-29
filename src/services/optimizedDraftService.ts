
import { OptimizedDraftService } from '@/utils/optimizedDb';
import { sanitizeHtml, sanitizeText, validateInput, VALIDATION_PATTERNS } from '@/utils/security';

/**
 * Enhanced draft service with security and performance optimizations
 */

export interface CreateDraftRequest {
  title: string;
  projectId: string;
}

export interface UpdateDraftRequest {
  content?: string;
  title?: string;
  wordCount?: number;
}

class EnhancedDraftService {
  private validateTitle(title: string): void {
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }
    
    if (!validateInput(title.trim(), VALIDATION_PATTERNS.SAFE_TEXT, 200)) {
      throw new Error('Title contains invalid characters or is too long');
    }
  }

  private validateContent(content: string): void {
    if (content && typeof content !== 'string') {
      throw new Error('Content must be a string');
    }
    
    if (content && content.length > 1000000) {
      throw new Error('Content exceeds maximum size limit (1MB)');
    }
  }

  private validateProjectId(projectId: string): void {
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('Project ID is required');
    }
    
    const trimmedId = projectId.trim();
    if (!trimmedId) {
      throw new Error('Project ID cannot be empty');
    }
    
    if (trimmedId !== 'demo-project-id' && !VALIDATION_PATTERNS.UUID.test(trimmedId)) {
      throw new Error('Invalid project ID format');
    }
  }

  async createDraft(request: CreateDraftRequest): Promise<string> {
    try {
      this.validateTitle(request.title);
      this.validateProjectId(request.projectId);

      const sanitizedTitle = sanitizeText(request.title, 200);
      
      return await OptimizedDraftService.createDraft({
        projectId: request.projectId,
        title: sanitizedTitle,
        content: '',
        wordCount: 0,
      });
    } catch (error) {
      console.error('Failed to create draft:', error);
      throw error instanceof Error ? error : new Error('Failed to create draft');
    }
  }

  async updateDraft(id: string, updates: UpdateDraftRequest): Promise<void> {
    try {
      if (!id?.trim()) {
        throw new Error('Draft ID is required');
      }

      const processedUpdates: any = {};

      if (updates.title !== undefined) {
        this.validateTitle(updates.title);
        processedUpdates.title = sanitizeText(updates.title, 200);
      }

      if (updates.content !== undefined) {
        this.validateContent(updates.content);
        processedUpdates.content = sanitizeHtml(updates.content);
      }

      if (updates.wordCount !== undefined) {
        if (typeof updates.wordCount !== 'number' || updates.wordCount < 0) {
          throw new Error('Word count must be a non-negative number');
        }
        processedUpdates.wordCount = Math.min(updates.wordCount, 50000);
      }

      await OptimizedDraftService.updateDraft(id, processedUpdates);
    } catch (error) {
      console.error('Failed to update draft:', error);
      throw error instanceof Error ? error : new Error('Failed to update draft');
    }
  }

  async getDraft(id: string) {
    try {
      if (!id?.trim()) {
        throw new Error('Draft ID is required');
      }
      
      return await OptimizedDraftService.getDraft(id);
    } catch (error) {
      console.error('Failed to get draft:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve draft');
    }
  }

  async getDraftsByProject(projectId: string) {
    try {
      this.validateProjectId(projectId);
      return await OptimizedDraftService.getDraftsByProject(projectId);
    } catch (error) {
      console.error('Failed to get drafts:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve drafts');
    }
  }

  async deleteDraft(id: string): Promise<void> {
    try {
      if (!id?.trim()) {
        throw new Error('Draft ID is required');
      }
      
      await OptimizedDraftService.deleteDraft(id);
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw error instanceof Error ? error : new Error('Failed to delete draft');
    }
  }
}

export const enhancedDraftService = new EnhancedDraftService();
