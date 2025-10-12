/**
 * Type definitions for context management system
 */

// ===== Context File Types =====

export interface ContextMeta {
  version: string;
  target: string; // Absolute path from project root (e.g., /src/utils/url.ts)
}

export interface ContextFile {
  meta: ContextMeta;
  what: string;
  when: string[];
  not_when: string[];
  future?: string[];
}

// ===== Context Content Types =====

export interface ContextPreview {
  what: string;
  when: string[];
  not_when?: string[];
}

// ===== Registry Types =====

export interface LocalContextEntry {
  type: 'file';
  source: string; // Relative path to context file (e.g., src/utils/url.ctx.yml)
  checksum: string; // MD5 checksum of context file
  target_checksum: string; // MD5 checksum of target file
  last_modified: string; // ISO timestamp
  preview: ContextPreview; // Mechanical extract from context file
}

export interface GlobalContextEntry {
  type: 'document';
  source: string; // Relative path (e.g., ctx/rules/typescript.md)
  folder: string | null; // Folder name (e.g., 'rules') or null for root files
  checksum: string; // MD5 checksum of file
  last_modified: string; // ISO timestamp
  preview: ContextPreview; // Mechanical extract from frontmatter
}

export interface GlobalFolderMeta {
  checksum: string; // Combined checksum of all files in folder
  last_modified: string; // Most recent file modification
}

export interface LocalContextRegistry {
  meta: {
    version: string;
    last_synced: string; // ISO timestamp
  };
  contexts: Record<string, LocalContextEntry>; // Key: absolute target path
}

export interface GlobalContextRegistry {
  meta: {
    version: string;
    last_synced: string; // ISO timestamp
  };
  contexts: Record<string, GlobalContextEntry>; // Key: absolute document path (e.g., /rules/typescript.md)
  folders: Record<string, GlobalFolderMeta>; // Key: folder name (e.g., 'rules', 'architecture')
}

// ===== Sync Types =====

export interface SyncOptions {
  local?: boolean;
  global?: boolean;
}

export interface SyncResult {
  localSynced: number;
  globalSynced: number;
  errors: string[];
}

// ===== Scanner Types =====

export interface ScannedContext {
  contextPath: string; // Absolute path to context file
  relativePath: string; // Relative path from project root
  content: string; // File content
}
