
export interface OutlineScene {
  id: string;
  title: string;
  summary?: string;
  notes?: string;
  content?: string;
  order: number;
  wordCount?: number;
  status: 'planned' | 'draft' | 'complete';
  pov?: string;
  location?: string;
  aiMetadata?: {
    generatedBy?: 'user' | 'ai';
    confidenceScore?: number;
    suggestions?: string[];
    lastAIUpdate?: Date;
  };
}

export interface OutlineChapter {
  id: string;
  title: string;
  summary?: string;
  notes?: string;
  order: number;
  scenes: OutlineScene[];
  aiMetadata?: {
    generatedBy?: 'user' | 'ai';
    confidenceScore?: number;
    suggestions?: string[];
    lastAIUpdate?: Date;
  };
}

export interface OutlinePart {
  id: string;
  title: string;
  summary?: string;
  notes?: string;
  order: number;
  chapters: OutlineChapter[];
  aiMetadata?: {
    generatedBy?: 'user' | 'ai';
    confidenceScore?: number;
    suggestions?: string[];
    lastAIUpdate?: Date;
  };
}

export interface EnhancedOutline {
  id: string;
  projectId: string;
  title: string;
  parts: OutlinePart[];
  totalScenes: number;
  maxScenes: number;
  structure: 'three-act' | 'hero-journey' | 'custom';
  createdAt: Date;
  updatedAt: Date;
  aiMetadata?: {
    lastAnalysis?: Date;
    structureScore?: number;
    suggestions?: string[];
  };
}

export interface OutlineNode {
  id: string;
  type: 'part' | 'chapter' | 'scene';
  title: string;
  summary?: string;
  notes?: string;
  order: number;
  parentId?: string;
  children?: OutlineNode[];
}
