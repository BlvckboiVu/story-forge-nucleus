
import { Draft, createDraft, updateDraft, getDraft } from '@/lib/db';

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
  UNSAFE_HTML_PATTERN: /<script|javascript:|on\w+=/i,
  UUID_PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

class DraftService {
  // Enhanced input validation with detailed error messages
  private validateTitle(title: string): void {
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }
    
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < VALIDATION_RULES.TITLE_MIN_LENGTH) {
      throw new Error('Title cannot be empty');
    }
    
    if (trimmedTitle.length > VALIDATION_RULES.TITLE_MAX_LENGTH) {
      throw new Error(`Title must be less than ${VALIDATION_RULES.TITLE_MAX_LENGTH} characters`);
    }
    
    // Enhanced XSS protection
    if (VALIDATION_RULES.UNSAFE_HTML_PATTERN.test(title)) {
      throw new Error('Title contains invalid characters for security reasons');
    }
  }

  private validateContent(content: string): void {
    if (content && typeof content !== 'string') {
      throw new Error('Content must be a string');
    }
    
    if (content && content.length > VALIDATION_RULES.CONTENT_MAX_SIZE) {
      throw new Error(`Content is too large (max ${VALIDATION_RULES.CONTENT_MAX_SIZE / 1000000}MB)`);
    }

    // Basic HTML sanitization check
    if (content && VALIDATION_RULES.UNSAFE_HTML_PATTERN.test(content)) {
      console.warn('Content contains potentially unsafe HTML');
    }
  }

  private validateProjectId(projectId: string): void {
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('Project ID is required and must be a string');
    }
    
    const trimmedProjectId = projectId.trim();
    if (trimmedProjectId.length === 0) {
      throw new Error('Project ID cannot be empty');
    }
    
    // Allow demo project ID or valid UUID
    if (trimmedProjectId !== 'demo-project-id' && 
        !VALIDATION_RULES.UUID_PATTERN.test(trimmedProjectId)) {
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

  private validateDraftId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error('Draft ID is required and must be a string');
    }
    
    if (id.trim().length === 0) {
      throw new Error('Draft ID cannot be empty');
    }
  }

  private sanitizeTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' '); // Normalize whitespace
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

      const sanitizedTitle = this.sanitizeTitle(request.title);
      
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
      this.validateDraftId(id);

      const processedUpdates: Partial<Draft> = {};

      if (updates.title !== undefined) {
        this.validateTitle(updates.title);
        processedUpdates.title = this.sanitizeTitle(updates.title);
      }

      if (updates.content !== undefined) {
        this.validateContent(updates.content);
        processedUpdates.content = updates.content;
        
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
      this.validateDraftId(id);
      
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
}

export const draftService = new DraftService();
