
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

class DraftService {
  // Input validation
  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (title.length > 200) {
      throw new Error('Title must be less than 200 characters');
    }
    // Prevent XSS in titles
    if (/<script|javascript:|on\w+=/i.test(title)) {
      throw new Error('Invalid characters in title');
    }
  }

  private validateContent(content: string): void {
    if (content && content.length > 1000000) { // 1MB limit
      throw new Error('Content is too large');
    }
  }

  private validateProjectId(projectId: string): void {
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId) && projectId !== 'demo-project-id') {
      throw new Error('Invalid project ID format');
    }
  }

  async createDraft(request: CreateDraftRequest): Promise<string> {
    this.validateTitle(request.title);
    this.validateProjectId(request.projectId);

    const sanitizedTitle = request.title.trim();
    
    const newDraft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'> = {
      projectId: request.projectId,
      title: sanitizedTitle,
      content: '',
      wordCount: 0,
    };
    
    return await createDraft(newDraft);
  }

  async updateDraft(id: string, updates: UpdateDraftRequest): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('Draft ID is required');
    }

    if (updates.title !== undefined) {
      this.validateTitle(updates.title);
      updates.title = updates.title.trim();
    }

    if (updates.content !== undefined) {
      this.validateContent(updates.content);
    }

    if (updates.wordCount !== undefined && updates.wordCount < 0) {
      throw new Error('Word count cannot be negative');
    }

    await updateDraft(id, updates);
  }

  async getDraft(id: string): Promise<Draft | null> {
    if (!id || id.trim().length === 0) {
      throw new Error('Draft ID is required');
    }

    return await getDraft(id);
  }
}

export const draftService = new DraftService();
