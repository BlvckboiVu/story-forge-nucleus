
import { DocumentVersion, DEFAULT_VERSIONING_CONFIG } from './versioning/types';
import { saveVersion, getVersionsByDraft, deleteOldVersions } from './versioning/storage';
import { compressContent } from './versioning/compression';

export * from './versioning/types';

export async function createVersion(
  draftId: string,
  content: string,
  wordCount: number,
  metadata: Record<string, any> = {},
  isAutoSave: boolean = false
): Promise<DocumentVersion> {
  const version: DocumentVersion = {
    id: crypto.randomUUID(),
    draftId,
    content: DEFAULT_VERSIONING_CONFIG.compressionEnabled ? compressContent(content) : content,
    wordCount,
    metadata,
    createdAt: new Date(),
    isAutoSave,
  };

  await saveVersion(version);
  
  // Clean up old versions
  await deleteOldVersions(draftId, DEFAULT_VERSIONING_CONFIG.maxVersions);
  
  return version;
}

export async function getVersionHistory(draftId: string): Promise<DocumentVersion[]> {
  return getVersionsByDraft(draftId);
}

export async function restoreVersion(version: DocumentVersion): Promise<string> {
  return version.content;
}
