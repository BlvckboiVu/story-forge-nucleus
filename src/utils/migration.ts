import { Draft } from '@/lib/db';
import { DocumentVersion, createVersion } from '@/lib/versioning';
import { sanitizeHtml } from './security';

/**
 * Migrates content from Quill format to the new editor format
 * @param quillContent - The content in Quill's Delta format
 * @returns Clean HTML content
 */
export const migrateQuillContent = (quillContent: string): string => {
  try {
    // Remove Quill-specific classes and attributes
    const cleanContent = quillContent
      .replace(/class="ql-[^"]*"/g, '') // Remove Quill classes
      .replace(/data-[^=]*="[^"]*"/g, '') // Remove data attributes
      .replace(/<p><br><\/p>/g, '<br>') // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '') // Remove empty paragraphs
      .replace(/<p>(.*?)<\/p>/g, '<div>$1</div>') // Convert paragraphs to divs
      .replace(/<h1>(.*?)<\/h1>/g, '<div class="heading-1">$1</div>') // Convert headings
      .replace(/<h2>(.*?)<\/h2>/g, '<div class="heading-2">$1</div>')
      .replace(/<h3>(.*?)<\/h3>/g, '<div class="heading-3">$1</div>')
      .replace(/<blockquote>(.*?)<\/blockquote>/g, '<div class="quote">$1</div>') // Convert blockquotes
      .replace(/<pre>(.*?)<\/pre>/g, '<div class="code">$1</div>') // Convert code blocks
      .replace(/<ul>(.*?)<\/ul>/g, '<div class="list">$1</div>') // Convert lists
      .replace(/<ol>(.*?)<\/ol>/g, '<div class="list ordered">$1</div>')
      .replace(/<li>(.*?)<\/li>/g, '<div class="list-item">$1</div>');
    
    return sanitizeHtml(cleanContent);
  } catch (error) {
    console.error('Failed to migrate Quill content:', error);
    return quillContent; // Return original content if migration fails
  }
};

/**
 * Migrates a draft from Quill to the new editor
 * @param draft - The draft to migrate
 * @returns Promise that resolves when migration is complete
 */
export const migrateDraft = async (draft: Draft): Promise<void> => {
  try {
    // Create initial version with migrated content
    await createVersion(
      draft.id,
      migrateQuillContent(draft.content),
      draft.wordCount,
      {
        comment: 'Migrated from Quill editor',
        tags: ['migration', 'quill']
      }
    );
  } catch (error) {
    console.error('Failed to migrate draft:', error);
    throw error;
  }
};

/**
 * Migrates all drafts in a project
 * @param projectId - The project ID
 * @param drafts - Array of drafts to migrate
 * @returns Promise that resolves when all migrations are complete
 */
export const migrateProjectDrafts = async (
  projectId: string,
  drafts: Draft[]
): Promise<void> => {
  const projectDrafts = drafts.filter(d => d.projectId === projectId);
  
  for (const draft of projectDrafts) {
    try {
      await migrateDraft(draft);
      console.log(`Migrated draft: ${draft.title}`);
    } catch (error) {
      console.error(`Failed to migrate draft ${draft.title}:`, error);
    }
  }
};

/**
 * Validates migrated content
 * @param originalContent - The original Quill content
 * @param migratedContent - The migrated content
 * @returns Object containing validation results
 */
export const validateMigration = (
  originalContent: string,
  migratedContent: string
): {
  success: boolean;
  wordCountDiff: number;
  issues: string[];
} => {
  const issues: string[] = [];
  
  // Check if content is empty
  if (!migratedContent.trim()) {
    issues.push('Migrated content is empty');
  }
  
  // Check for basic structure
  if (!migratedContent.includes('<div')) {
    issues.push('Migrated content missing basic structure');
  }
  
  // Calculate word count difference
  const originalWords = originalContent.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
  const migratedWords = migratedContent.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
  const wordCountDiff = migratedWords - originalWords;
  
  if (Math.abs(wordCountDiff) > 10) {
    issues.push(`Significant word count difference: ${wordCountDiff} words`);
  }
  
  return {
    success: issues.length === 0,
    wordCountDiff,
    issues
  };
}; 