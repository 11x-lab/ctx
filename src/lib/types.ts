/**
 * Type definitions for context management system
 */

// ===== Config Types =====

export interface Config {
  version: string;
  editor: string;
  local: {
    patterns: string | string[];
    ignore: string[];
  };
  global: {
    directory: string;
    patterns: string | string[];
    ignore: string[];
  };
}

// ===== Context File Types =====

export interface ContextMeta {
  version: string;
  target?: string; // Absolute path from project root (e.g., /src/utils/url.ts)
}

export interface ContextFrontmatter {
  what: string;
  when: string[];
  not_when?: string[];
  future?: string[];
}

export interface ContextFile {
  meta: ContextMeta;
  frontmatter: ContextFrontmatter;
  content: string; // Markdown body content
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

// ===== Validation Types =====

export type ValidationStatus = 'valid' | 'warning' | 'error';

export type ValidationCheckType =
  | 'schema'      // YAML/frontmatter structure validation
  | 'existence'   // File existence check
  | 'checksum';   // Checksum consistency check

export interface ValidationCheck {
  type: ValidationCheckType;
  passed: boolean;
  code?: string;           // Error/warning code (e.g., 'E001', 'W201')
  message?: string;
  suggestion?: string;
}

export interface ValidationIssue {
  contextPath: string;
  targetPath?: string;      // Only for local contexts
  status: 'warning' | 'error';
  checks: ValidationCheck[];
}

export interface ValidationResult {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
  issues: ValidationIssue[];
}

export interface ValidateOptions {
  local?: boolean;
  global?: boolean;
}
