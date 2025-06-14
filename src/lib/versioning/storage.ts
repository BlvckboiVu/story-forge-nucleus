
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { DocumentVersion } from './types';

interface VersioningDB extends DBSchema {
  versions: {
    key: string;
    value: DocumentVersion;
    indexes: { 'by-draft': string; 'by-date': Date };
  };
}

let db: IDBPDatabase<VersioningDB> | null = null;

export async function initVersioningDB(): Promise<IDBPDatabase<VersioningDB>> {
  if (db) return db;

  db = await openDB<VersioningDB>('versioning-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('versions', { keyPath: 'id' });
      store.createIndex('by-draft', 'draftId');
      store.createIndex('by-date', 'createdAt');
    },
  });

  return db;
}

export async function saveVersion(version: DocumentVersion): Promise<void> {
  const database = await initVersioningDB();
  await database.put('versions', version);
}

export async function getVersionsByDraft(draftId: string): Promise<DocumentVersion[]> {
  const database = await initVersioningDB();
  const versions = await database.getAllFromIndex('versions', 'by-draft', draftId);
  return versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function deleteOldVersions(draftId: string, keepCount: number): Promise<void> {
  const database = await initVersioningDB();
  const versions = await getVersionsByDraft(draftId);
  
  if (versions.length > keepCount) {
    const versionsToDelete = versions.slice(keepCount);
    const tx = database.transaction('versions', 'readwrite');
    
    await Promise.all([
      ...versionsToDelete.map(v => tx.store.delete(v.id)),
      tx.done,
    ]);
  }
}
