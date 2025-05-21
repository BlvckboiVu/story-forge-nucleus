
import Dexie, { Table } from 'dexie';
import { Project, Document, Chapter, Character, Setting, Note } from '../types';

class StoryForgeDatabase extends Dexie {
  projects!: Table<Project, string>;
  documents!: Table<Document, string>;
  chapters!: Table<Chapter, string>;
  characters!: Table<Character, string>;
  settings!: Table<Setting, string>;
  notes!: Table<Note, string>;

  constructor() {
    super('StoryForgeDB');
    
    this.version(1).stores({
      projects: 'id, title, createdAt, updatedAt, userId',
      documents: 'id, projectId, title, content, type, createdAt, updatedAt, *tags',
      chapters: 'id, projectId, title, content, order, createdAt, updatedAt',
      characters: 'id, projectId, name, description, createdAt, updatedAt',
      settings: 'id, projectId, name, description, createdAt, updatedAt',
      notes: 'id, projectId, title, content, createdAt, updatedAt',
    });
  }
}

// Create a singleton instance
const db = new StoryForgeDatabase();

export default db;

// Helper functions for common database operations
export const createProject = async (project: Omit<Project, 'id'>) => {
  const id = await db.projects.add({
    ...project,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return id;
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
  await db.projects.update(id, { 
    ...updates, 
    updatedAt: new Date() 
  });
};

export const deleteProject = async (id: string) => {
  // Delete related documents first
  await db.documents.where('projectId').equals(id).delete();
  await db.chapters.where('projectId').equals(id).delete();
  await db.characters.where('projectId').equals(id).delete();
  await db.settings.where('projectId').equals(id).delete();
  await db.notes.where('projectId').equals(id).delete();
  
  // Then delete the project
  await db.projects.delete(id);
};

// Similar functions for documents, chapters, etc.
export const createDocument = async (document: Omit<Document, 'id'>) => {
  const id = await db.documents.add({
    ...document,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return id;
};

export const updateDocument = async (id: string, updates: Partial<Document>) => {
  await db.documents.update(id, { 
    ...updates, 
    updatedAt: new Date() 
  });
};

export const deleteDocument = async (id: string) => {
  await db.documents.delete(id);
};
