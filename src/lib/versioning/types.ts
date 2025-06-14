
export interface DocumentVersion {
  id: string;
  draftId: string;
  content: string;
  wordCount: number;
  metadata: Record<string, any>;
  createdAt: Date;
  isAutoSave: boolean;
}

export interface VersioningConfig {
  maxVersions: number;
  autoSaveInterval: number;
  compressionEnabled: boolean;
}

export const DEFAULT_VERSIONING_CONFIG: VersioningConfig = {
  maxVersions: 50,
  autoSaveInterval: 30000,
  compressionEnabled: true,
};
