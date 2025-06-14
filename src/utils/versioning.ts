import { Draft } from '@/lib/db';
import { createVersion, DocumentVersion } from '@/lib/versioning';
import { sanitizeHtml } from './sanitize';

interface VersionMetadata {
  font: string;
  viewMode: 'normal' | 'focus' | 'page';
  wordCount: number;
  timestamp: Date;
}

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

export function getVersionLabel(version: DocumentVersion): string {
  const date = new Date(version.timestamp);
  return date.toLocaleString();
}

export function getVersionMetadata(version: DocumentVersion): VersionMetadata {
  return {
    font: version.metadata.font,
    viewMode: version.metadata.viewMode,
    wordCount: version.wordCount,
    timestamp: new Date(version.timestamp),
  };
}

export function compareVersions(a: DocumentVersion, b: DocumentVersion): number {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

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