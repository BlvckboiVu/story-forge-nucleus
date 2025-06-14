
import { Draft } from '@/lib/db';
import { createVersion, DocumentVersion } from '@/lib/versioning';
import { validateEditorContent } from './editorValidation';

interface VersionMetadata {
  font: string;
  viewMode: 'normal' | 'focus' | 'page';
  wordCount: number;
  timestamp: Date;
  isValid?: boolean;
  validationErrors?: string[];
}

/**
 * Creates a new document version with validated and sanitized content
 */
export async function createDocumentVersion(
  draft: Draft,
  content: string,
  metadata: VersionMetadata
): Promise<DocumentVersion> {
  // Validate and sanitize content before creating version
  const validation = validateEditorContent(content);
  
  if (!validation.isValid) {
    throw new Error(`Cannot create version with invalid content: ${validation.errors.join(', ')}`);
  }
  
  const sanitizedContent = validation.sanitizedContent || content;
  
  const version = await createVersion(
    draft.id,
    sanitizedContent,
    metadata.wordCount,
    {
      font: metadata.font,
      viewMode: metadata.viewMode,
      isValid: validation.isValid,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
    }
  );
  
  return version;
}

/**
 * Generates a human-readable label for a document version
 */
export function getVersionLabel(version: DocumentVersion): string {
  const date = new Date(version.createdAt);
  return date.toLocaleString();
}

/**
 * Extracts and parses metadata from a document version
 */
export function getVersionMetadata(version: DocumentVersion): VersionMetadata {
  return {
    font: version.metadata.font || 'Inter',
    viewMode: (version.metadata.viewMode as 'normal' | 'focus' | 'page') || 'normal',
    wordCount: version.wordCount,
    timestamp: new Date(version.createdAt),
  };
}

/**
 * Compares two document versions by timestamp for sorting
 */
export function compareVersions(a: DocumentVersion, b: DocumentVersion): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/**
 * Calculates the difference between two document versions
 */
export function getVersionDiff(
  oldVersion: DocumentVersion,
  newVersion: DocumentVersion
): { added: number; removed: number } {
  const oldWords = oldVersion.content.split(/\s+/);
  const newWords = newVersion.content.split(/\s+/);
  
  const added = newWords.filter((word) => !oldWords.includes(word)).length;
  const removed = oldWords.filter((word) => !newWords.includes(word)).length;
  
  return { added, removed };
}
