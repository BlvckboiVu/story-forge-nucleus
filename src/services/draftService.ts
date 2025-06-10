
import { Draft, createDraft, updateDraft, getDrafts, deleteDraft, getDraft } from '@/lib/db';
import { sanitizeHtml, sanitizeText, validateInput, VALIDATION_PATTERNS } from '@/utils/security';

export interface CreateDraftRequest {
  title: string;
  projectId: string;
}

export interface UpdateDraftRequest {
  content?: string;
  title?: string;
  wordCount?: number;
}

// Validation constants
const VALIDATION_RULES = {
  TITLE_MAX_LENGTH: 200,
  TITLE_MIN_LENGTH: 1,
  CONTENT_MAX_SIZE: 1000000, // 1MB
  WORD_COUNT_MAX: 50000,
} as const;

class DraftService {
  private validateTitle(title: string): void {
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }
    
    if (!validateInput(title.trim(), VALIDATION_PATTERNS.SAFE_TEXT, VALIDATION_RULES.TITLE_MAX_LENGTH)) {
      throw new Error('Title contains invalid characters or is too long');
    }
  }

  private validateContent(content: string): void {
    if (content && typeof content !== 'string') {
      throw new Error('Content must be a string');
    }
    
    if (content && content.length > VALIDATION_RULES.CONTENT_MAX_SIZE) {
      throw new Error(`Content exceeds maximum size limit (${VALIDATION_RULES.CONTENT_MAX_SIZE / 1000000}MB)`);
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

  private validateWordCount(wordCount: number): void {
    if (typeof wordCount !== 'number' || isNaN(wordCount)) {
      throw new Error('Word count must be a valid number');
    }
    
    if (wordCount < 0) {
      throw new Error('Word count cannot be negative');
    }
    
    if (wordCount > VALIDATION_RULES.WORD_COUNT_MAX) {
      throw new Error(`Word count exceeds maximum limit of ${VALIDATION_RULES.WORD_COUNT_MAX.toLocaleString()} words`);
    }
  }

  private calculateWordCount(content: string): number {
    if (!content) return 0;
    
    // Remove HTML tags and count words more accurately
    const plainText = content.replace(/<[^>]*>/g, ' ');
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  async createDraft(request: CreateDraftRequest): Promise<string> {
    try {
      this.validateTitle(request.title);
      this.validateProjectId(request.projectId);

      const sanitizedTitle = sanitizeText(request.title, VALIDATION_RULES.TITLE_MAX_LENGTH);
      
      const newDraft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'> = {
        projectId: request.projectId,
        title: sanitizedTitle,
        content: '',
        wordCount: 0,
      };
      
      const draftId = await createDraft(newDraft);
      console.log(`Draft created successfully: ${draftId}`);
      return draftId;
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

      const processedUpdates: Partial<Draft> = {};

      if (updates.title !== undefined) {
        this.validateTitle(updates.title);
        processedUpdates.title = sanitizeText(updates.title, VALIDATION_RULES.TITLE_MAX_LENGTH);
      }

      if (updates.content !== undefined) {
        this.validateContent(updates.content);
        processedUpdates.content = sanitizeHtml(updates.content);
        
        // Auto-calculate word count if not provided
        if (updates.wordCount === undefined) {
          processedUpdates.wordCount = this.calculateWordCount(updates.content);
        }
      }

      if (updates.wordCount !== undefined) {
        this.validateWordCount(updates.wordCount);
        processedUpdates.wordCount = updates.wordCount;
      }

      await updateDraft(id, processedUpdates);
      console.log(`Draft updated successfully: ${id}`);
    } catch (error) {
      console.error('Failed to update draft:', error);
      throw error instanceof Error ? error : new Error('Failed to update draft');
    }
  }

  async getDraft(id: string): Promise<Draft | null> {
    try {
      if (!id?.trim()) {
        throw new Error('Draft ID is required');
      }
      
      const draft = await getDraft(id);
      if (draft) {
        console.log(`Draft retrieved successfully: ${id}`);
      }
      return draft;
    } catch (error) {
      console.error('Failed to get draft:', error);
      throw error instanceof Error ? error : new Error('Failed to retrieve draft');
    }
  }

  async getDraftsByProject(projectId: string): Promise<Draft[]> {
    try {
      this.validateProjectId(projectId);
      return await getDrafts(projectId);
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
      
      await deleteDraft(id);
      console.log(`Draft deleted successfully: ${id}`);
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw error instanceof Error ? error : new Error('Failed to delete draft');
    }
  }
}

export const draftService = new DraftService();
