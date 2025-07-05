import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeHtml, sanitizeText, validateInput, VALIDATION_PATTERNS } from '@/utils/security';

// Story Bible entry interface
export interface StoryBibleEntry {
  id: string;
  type: 'Character' | 'Location' | 'Lore' | 'Item' | 'Custom';
  name: string;
  description: string;
  tags: string[];
  rules: string[];
  relations: string[]; // Array of entry IDs
  project_id: string;
  created_at: Date;
  updated_at: Date;
}

// Extend the existing database
class StoryBibleDB extends Dexie {
  story_bible!: Table<StoryBibleEntry, string>;

  constructor() {
    super('WriterDB');
    
    this.version(2).stores({
      story_bible: 'id, project_id, type, name, updated_at, created_at',
    });
  }
}

const storyBibleDb = new StoryBibleDB();

// Input validation
const validateStoryBibleEntry = (entry: Partial<StoryBibleEntry>): void => {
  if (entry.name !== undefined) {
    if (!entry.name.trim()) {
      throw new Error('Entry name is required');
    }
    if (entry.name.length > 200) {
      throw new Error('Entry name must be less than 200 characters');
    }
    if (!validateInput(entry.name, VALIDATION_PATTERNS.SAFE_TEXT, 200)) {
      throw new Error('Entry name contains invalid characters');
    }
  }

  if (entry.description !== undefined && entry.description.length > 100000) {
    throw new Error('Description exceeds maximum length');
  }

  if (entry.tags !== undefined) {
    if (entry.tags.length > 50) {
      throw new Error('Too many tags (maximum 50)');
    }
    entry.tags.forEach(tag => {
      if (tag.length > 50) {
        throw new Error('Tag too long (maximum 50 characters)');
      }
    });
  }

  if (entry.type && !['Character', 'Location', 'Lore', 'Item', 'Custom'].includes(entry.type)) {
    throw new Error('Invalid entry type');
  }
};

// CRUD Operations
export const createStoryBibleEntry = async (entry: Omit<StoryBibleEntry, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  validateStoryBibleEntry(entry);

  const sanitizedEntry: StoryBibleEntry = {
    id: uuidv4(),
    type: entry.type,
    name: sanitizeText(entry.name, 200),
    description: sanitizeHtml(entry.description),
    tags: entry.tags.map(tag => sanitizeText(tag, 50)),
    rules: entry.rules.map(rule => sanitizeText(rule, 500)),
    relations: entry.relations.filter(id => validateInput(id, VALIDATION_PATTERNS.UUID)),
    project_id: entry.project_id,
    created_at: new Date(),
    updated_at: new Date(),
  };

  try {
    const id = await storyBibleDb.story_bible.add(sanitizedEntry);
    return typeof id === 'string' ? id : sanitizedEntry.id;
  } catch (error) {
    console.error('Failed to create story bible entry:', error);
    throw new Error('Failed to create entry');
  }
};

export const updateStoryBibleEntry = async (id: string, updates: Partial<StoryBibleEntry>): Promise<void> => {
  if (!validateInput(id, VALIDATION_PATTERNS.UUID)) {
    throw new Error('Invalid entry ID');
  }

  validateStoryBibleEntry(updates);

  const sanitizedUpdates: Partial<StoryBibleEntry> = {
    ...updates,
    updated_at: new Date(),
  };

  if (updates.name) {
    sanitizedUpdates.name = sanitizeText(updates.name, 200);
  }

  if (updates.description) {
    sanitizedUpdates.description = sanitizeHtml(updates.description);
  }

  if (updates.tags) {
    sanitizedUpdates.tags = updates.tags.map(tag => sanitizeText(tag, 50));
  }

  if (updates.rules) {
    sanitizedUpdates.rules = updates.rules.map(rule => sanitizeText(rule, 500));
  }

  if (updates.relations) {
    sanitizedUpdates.relations = updates.relations.filter(relId => validateInput(relId, VALIDATION_PATTERNS.UUID));
  }

  try {
    await storyBibleDb.story_bible.update(id, sanitizedUpdates);
  } catch (error) {
    console.error('Failed to update story bible entry:', error);
    throw new Error('Failed to update entry');
  }
};

export const deleteStoryBibleEntry = async (id: string): Promise<void> => {
  if (!validateInput(id, VALIDATION_PATTERNS.UUID)) {
    throw new Error('Invalid entry ID');
  }

  try {
    await storyBibleDb.story_bible.delete(id);
  } catch (error) {
    console.error('Failed to delete story bible entry:', error);
    throw new Error('Failed to delete entry');
  }
};

export const getStoryBibleEntriesByProject = async (
  projectId: string,
  offset: number = 0,
  limit: number = 10,
  searchTerm?: string,
  typeFilter?: StoryBibleEntry['type']
): Promise<StoryBibleEntry[]> => {
  if (!validateInput(projectId, VALIDATION_PATTERNS.UUID)) {
    throw new Error('Invalid project ID');
  }

  try {
    let query = storyBibleDb.story_bible.where('project_id').equals(projectId);

    if (typeFilter) {
      query = query.and(entry => entry.type === typeFilter);
    }

    if (searchTerm) {
      const sanitizedSearch = sanitizeText(searchTerm, 100).toLowerCase();
      query = query.and(entry => 
        entry.name.toLowerCase().includes(sanitizedSearch) ||
        entry.tags.some(tag => tag.toLowerCase().includes(sanitizedSearch))
      );
    }

    const entries = await query
      .reverse()
      .sortBy('updated_at');

    return entries.slice(offset, offset + limit);
  } catch (error) {
    console.error('Failed to get story bible entries:', error);
    throw new Error('Failed to retrieve entries');
  }
};

export const getStoryBibleEntryById = async (id: string): Promise<StoryBibleEntry | undefined> => {
  if (!validateInput(id, VALIDATION_PATTERNS.UUID)) {
    throw new Error('Invalid entry ID');
  }

  try {
    return await storyBibleDb.story_bible.get(id);
  } catch (error) {
    console.error('Failed to get story bible entry:', error);
    throw new Error('Failed to retrieve entry');
  }
};

export default storyBibleDb;
