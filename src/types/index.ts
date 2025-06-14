// Base type with common fields
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User type (for Supabase authentication)
export interface User extends BaseEntity {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'admin' | 'user' | 'guest';
  isOnline: boolean;
}

// Project type (a novel, short story, or other writing project)
export interface Project extends BaseEntity {
  title: string;
  description?: string;
  coverImage?: string;
  userId: string;
  isPublic: boolean;
  genre?: string;
  tags?: string[];
  wordCountGoal?: number;
  deadline?: Date;
  status: 'planning' | 'writing' | 'editing' | 'completed';
}

// Draft type (for writing drafts)
export interface Draft extends BaseEntity {
  projectId: string;
  title: string;
  content: string;
  wordCount: number;
}

// Document type (generic document in a project)
export interface Document extends BaseEntity {
  projectId: string;
  title: string;
  content: string;
  type: 'chapter' | 'note' | 'outline' | 'research';
  tags?: string[];
  wordCount?: number;
  order?: number;
}

// Chapter type (extends Document with specific chapter fields)
export interface Chapter extends BaseEntity {
  projectId: string;
  title: string;
  content: string;
  order: number;
  synopsis?: string;
  pov?: string; // Point of view character
  location?: string;
  timeframe?: string;
  status: 'draft' | 'revised' | 'final';
  wordCount?: number;
}

// Character type
export interface Character extends BaseEntity {
  projectId: string;
  name: string;
  description?: string;
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  age?: number;
  gender?: string;
  appearance?: string;
  background?: string;
  motivation?: string;
  notes?: string;
  imageUrl?: string;
}

// Setting type (locations in the story) - renamed from Setting to Location for clarity
export interface Location extends BaseEntity {
  projectId: string;
  name: string;
  description?: string;
  type?: 'city' | 'building' | 'country' | 'planet' | 'other';
  climate?: string;
  culture?: string;
  map?: string; // URL to map image
  notes?: string;
}

// Lore type (for world-building information)
export interface Lore extends BaseEntity {
  projectId: string;
  title: string;
  content: string;
  category?: 'history' | 'culture' | 'technology' | 'magic' | 'politics' | 'other';
  tags?: string[];
}

// Note type (for research, ideas, etc.)
export interface Note extends BaseEntity {
  projectId: string;
  title: string;
  content: string;
  category?: 'research' | 'idea' | 'todo' | 'general';
  color?: string;
}

// Statistics type for tracking writing progress
export interface Statistics {
  projectId: string;
  date: Date;
  wordCount: number;
  sessionDuration: number; // in minutes
  chaptersCompleted: number;
}

// Authentication context type with proper result handling
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
    warning?: string;
    requiresEmailConfirmation?: boolean;
    message?: string;
  }>;
  signIn: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
  }>;
  signOut: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  guestLogin: () => Promise<{
    success: boolean;
    error?: string;
    user?: User;
    warning?: string;
    isOffline?: boolean;
  }>;
}

// Project context type
export interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
}
