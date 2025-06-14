import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Version interface
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

// Version CRUD operations
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

export const getVersion = async (versionId: string): Promise<DocumentVersion | undefined> => {
  return await versioningDb.versions.get(versionId);
};

export const getVersionHistory = async (draftId: string): Promise<VersionHistory | undefined> => {
  return await versioningDb.versionHistory.get({ draftId });
};

export const getLatestVersion = async (draftId: string): Promise<DocumentVersion | undefined> => {
  const history = await getVersionHistory(draftId);
  if (!history) return undefined;
  
  return await getVersion(history.currentVersionId);
};

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

// Auto-save version (creates a version if content has changed)
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