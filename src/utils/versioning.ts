
import { Draft } from '@/lib/db';
import { createVersion, DocumentVersion } from '@/lib/versioning';
import { sanitizeHtml } from './sanitize';

interface VersionMetadata {
  font: string;
  viewMode: 'normal' | 'focus' | 'page';
  wordCount: number;
  timestamp: Date;
}

/**
 * Creates a new document version with sanitized content and metadata
 * @param draft - The draft document to create a version for
 * @param content - Raw content to be sanitized and stored
 * @param metadata - Version metadata including font, view mode, etc.
 * @returns Promise resolving to the created document version
 */
export async function createDocumentVersion(
  draft: Draft,
  content: string,
  metadata: VersionMetadata
): Promise<DocumentVersion> {
  const sanitizedContent = sanitizeHtml(content);
  
  return createVersion({
    draftId: draft.id,
    content: sanitizedContent,
    wordCount: metadata.wordCount,
    metadata: {
      font: metadata.font,
      viewMode: metadata.viewMode,
      timestamp: metadata.timestamp.toISOString(),
    },
  });
}

/**
 * Generates a human-readable label for a document version
 * @param version - Document version to create label for
 * @returns Formatted date and time string
 */
export function getVersionLabel(version: DocumentVersion): string {
  const date = new Date(version.timestamp);
  return date.toLocaleString();
}

/**
 * Extracts and parses metadata from a document version
 * @param version - Document version to extract metadata from
 * @returns Parsed version metadata object
 */
export function getVersionMetadata(version: DocumentVersion): VersionMetadata {
  return {
    font: version.metadata.font,
    viewMode: version.metadata.viewMode,
    wordCount: version.wordCount,
    timestamp: new Date(version.timestamp),
  };
}

/**
 * Compares two document versions by timestamp for sorting
 * @param a - First version to compare
 * @param b - Second version to compare
 * @returns Negative, zero, or positive number for sorting (newest first)
 */
export function compareVersions(a: DocumentVersion, b: DocumentVersion): number {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

/**
 * Calculates the difference between two document versions
 * Simple word-based diff showing additions and removals
 * @param oldVersion - Previous version to compare against
 * @param newVersion - Current version to compare
 * @returns Object with counts of added and removed words
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
