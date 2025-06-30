import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for database entities
export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  isPublic: boolean;
  genre?: string;
  tags?: string[];
  wordCountGoal?: number;
  deadline?: Date;
  status: 'planning' | 'writing' | 'editing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Draft {
  id: string;
  projectId: string;
  title: string;
  content: string;
  wordCount: number;
  lastEditPosition?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Outline {
  id: string;
  projectId: string;
  title: string;
  structure: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the database schema
class NovelWritingAppDB extends Dexie {
  projects!: Table<Project, string>;
  drafts!: Table<Draft, string>;
  outlines!: Table<Outline, string>;

  constructor() {
    super('NovelWritingAppDB');
    
    this.version(1).stores({
      projects: 'id, userId, title, status, createdAt, updatedAt',
      drafts: 'id, projectId, title, wordCount, createdAt, updatedAt',
      outlines: 'id, projectId, title, createdAt, updatedAt'
    });
  }
}

// Initialize the database
const db = new NovelWritingAppDB();

// Project CRUD operations
export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
  const id = uuidv4();
  const timestamp = new Date();
  
  const newProject: Project = {
    ...project,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  
  return await db.projects.add(newProject);
};

export const getProject = async (id: string) => {
  return await db.projects.get(id);
};

export const getProjects = async (userId: string) => {
  return await db.projects.where('userId').equals(userId).toArray();
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
  const updatedAt = new Date();
  
  return await db.projects.update(id, {
    ...updates,
    updatedAt,
  });
};

export const deleteProject = async (id: string) => {
  // First delete all associated drafts and outlines
  await db.drafts.where('projectId').equals(id).delete();
  await db.outlines.where('projectId').equals(id).delete();
  
  // Then delete the project
  return await db.projects.delete(id);
};

// Draft CRUD operations
export const createDraft = async (draft: Omit<Draft, 'id' | 'createdAt' | 'updatedAt'>) => {
  const id = uuidv4();
  const timestamp = new Date();
  
  const newDraft: Draft = {
    ...draft,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  
  return await db.drafts.add(newDraft);
};

export const getDraft = async (id: string) => {
  return await db.drafts.get(id);
};

export const getDrafts = async (projectId: string) => {
  return await db.drafts.where('projectId').equals(projectId).toArray();
};

export const updateDraft = async (id: string, updates: Partial<Draft>) => {
  const updatedAt = new Date();
  // Fetch existing draft to fill missing fields
  const existing = await db.drafts.get(id);
  if (!existing) throw new Error('Draft not found');
  let wordCount = updates.wordCount;
  let content = updates.content ?? existing.content;
  if (updates.content) {
    wordCount = updates.content.trim().split(/\s+/).length;
  } else {
    wordCount = existing.wordCount;
  }
  return await db.drafts.update(id, {
    ...existing,
    ...updates,
    content,
    wordCount,
    updatedAt,
  });
};

export const deleteDraft = async (id: string) => {
  return await db.drafts.delete(id);
};

// Outline CRUD operations
export const createOutline = async (outline: Omit<Outline, 'id' | 'createdAt' | 'updatedAt'>) => {
  const id = uuidv4();
  const timestamp = new Date();
  
  const newOutline: Outline = {
    ...outline,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  
  return await db.outlines.add(newOutline);
};

export const getOutline = async (id: string) => {
  return await db.outlines.get(id);
};

export const getOutlines = async (projectId: string) => {
  return await db.outlines.where('projectId').equals(projectId).toArray();
};

export const updateOutline = async (id: string, updates: Partial<Outline>) => {
  const updatedAt = new Date();
  
  return await db.outlines.update(id, {
    ...updates,
    updatedAt,
  });
};

export const deleteOutline = async (id: string) => {
  return await db.outlines.delete(id);
};

export default db;
