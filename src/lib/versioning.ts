import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Version interface with extended metadata
export interface DocumentVersion {
  id: string;
  draftId: string;
  content: string;
  timestamp: Date;
  wordCount: number;
  metadata: {
    author?: string;
    comment?: string;
    tags?: string[];
    isAutoSave?: boolean;
    font?: string;
    viewMode?: string;
    isValid?: boolean;
    validationErrors?: string[];
    validationWarnings?: string[];
  };
}

// Version history interface
export interface VersionHistory {
  id: string;
  draftId: string;
  versions: DocumentVersion[];
  currentVersionId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extend the existing database
class VersioningDB extends Dexie {
  versions!: Table<DocumentVersion, string>;
  versionHistory!: Table<VersionHistory, string>;

  constructor() {
    super('WriterDB');
    
    this.version(3).stores({
      versions: 'id, draftId, timestamp',
      versionHistory: 'id, draftId, currentVersionId, updatedAt'
    });
  }
}

// Initialize the database
const versioningDb = new VersioningDB();

/**
 * Creates a new document version with content and metadata
 * @param draftId - ID of the draft this version belongs to
 * @param content - Content of the version
 * @param wordCount - Word count for the version
 * @param metadata - Additional metadata for the version
 * @returns Promise resolving to the created version ID
 */
export const createVersion = async (
  draftId: string,
  content: string,
  wordCount: number,
  metadata: DocumentVersion['metadata'] = {}
): Promise<string> => {
  const id = uuidv4();
  const timestamp = new Date();
  
  const version: DocumentVersion = {
    id,
    draftId,
    content,
    timestamp,
    wordCount,
    metadata
  };
  
  await versioningDb.versions.add(version);
  
  // Update or create version history
  const history = await versioningDb.versionHistory.get({ draftId });
  if (history) {
    history.versions.push(version);
    history.currentVersionId = id;
    history.updatedAt = timestamp;
    await versioningDb.versionHistory.put(history);
  } else {
    const newHistory: VersionHistory = {
      id: uuidv4(),
      draftId,
      versions: [version],
      currentVersionId: id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await versioningDb.versionHistory.add(newHistory);
  }
  
  return id;
};

/**
 * Retrieves a specific version by ID
 * @param versionId - ID of the version to retrieve
 * @returns Promise resolving to the version or undefined if not found
 */
export const getVersion = async (versionId: string): Promise<DocumentVersion | undefined> => {
  return await versioningDb.versions.get(versionId);
};

/**
 * Retrieves version history for a draft
 * @param draftId - ID of the draft to get history for
 * @returns Promise resolving to version history or undefined if not found
 */
export const getVersionHistory = async (draftId: string): Promise<VersionHistory | undefined> => {
  return await versioningDb.versionHistory.get({ draftId });
};

/**
 * Gets the latest version for a draft
 * @param draftId - ID of the draft to get latest version for
 * @returns Promise resolving to the latest version or undefined
 */
export const getLatestVersion = async (draftId: string): Promise<DocumentVersion | undefined> => {
  const history = await getVersionHistory(draftId);
  if (!history) return undefined;
  
  return await getVersion(history.currentVersionId);
};

/**
 * Lists versions for a draft with pagination
 * @param draftId - ID of the draft to list versions for
 * @param limit - Maximum number of versions to return
 * @param offset - Number of versions to skip
 * @returns Promise resolving to array of versions
 */
export const listVersions = async (
  draftId: string,
  limit: number = 10,
  offset: number = 0
): Promise<DocumentVersion[]> => {
  return await versioningDb.versions
    .where('draftId')
    .equals(draftId)
    .reverse()
    .offset(offset)
    .limit(limit)
    .toArray();
};

/**
 * Deletes a version and updates version history
 * @param versionId - ID of the version to delete
 * @returns Promise that resolves when deletion is complete
 */
export const deleteVersion = async (versionId: string): Promise<void> => {
  const version = await getVersion(versionId);
  if (!version) return;
  
  const history = await getVersionHistory(version.draftId);
  if (!history) return;
  
  // Remove version from history
  history.versions = history.versions.filter(v => v.id !== versionId);
  
  // Update current version if needed
  if (history.currentVersionId === versionId) {
    history.currentVersionId = history.versions[history.versions.length - 1]?.id || '';
  }
  
  // Update history
  await versioningDb.versionHistory.put(history);
  
  // Delete version
  await versioningDb.versions.delete(versionId);
};

/**
 * Restores a version as the current version
 * @param versionId - ID of the version to restore
 * @returns Promise that resolves when restoration is complete
 */
export const restoreVersion = async (versionId: string): Promise<void> => {
  const version = await getVersion(versionId);
  if (!version) return;
  
  const history = await getVersionHistory(version.draftId);
  if (!history) return;
  
  // Set as current version
  history.currentVersionId = versionId;
  history.updatedAt = new Date();
  
  await versioningDb.versionHistory.put(history);
};

/**
 * Auto-save version (creates a version if content has changed)
 * @param draftId - ID of the draft to auto-save
 * @param content - Content to save
 * @param wordCount - Word count for the content
 * @returns Promise resolving to version ID or null if no change
 */
export const autoSaveVersion = async (
  draftId: string,
  content: string,
  wordCount: number
): Promise<string | null> => {
  const latestVersion = await getLatestVersion(draftId);
  
  // Only create new version if content has changed
  if (latestVersion && latestVersion.content === content) {
    return null;
  }
  
  return await createVersion(draftId, content, wordCount, {
    isAutoSave: true
  });
};
