import fs from 'fs/promises';
import path from 'path';

/**
 * Check if a file or directory exists
 */
export async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the project is initialized (ctx.config.yaml exists)
 */
export async function isProjectInitialized(): Promise<boolean> {
  const configPath = path.join(process.cwd(), 'ctx.config.yaml');
  return fileExists(configPath);
}

/**
 * Find the project root by looking for ctx.config.yaml
 * Returns the current working directory for now
 */
export function getProjectRoot(): string {
  return process.cwd();
}

/**
 * Convert a target file path to its context file path
 * Examples:
 *   src/services/payment.ts -> src/services/payment.ctx.yml
 *   src/services/ -> src/services/ctx.yml
 */
export function resolveContextPath(targetPath: string): string {
  // Remove trailing slash if directory
  const normalized = targetPath.replace(/\/$/, '');

  // If it's a directory (no extension), create ctx.yml
  const ext = path.extname(normalized);
  if (!ext) {
    return path.join(normalized, 'ctx.yml');
  }

  // If it's a file, replace extension with .ctx.yml
  const dir = path.dirname(normalized);
  const basename = path.basename(normalized, ext);
  return path.join(dir, `${basename}.ctx.yml`);
}

/**
 * Convert a relative path to absolute path from project root
 * Returns path with leading slash for registry
 */
export function resolveAbsoluteTargetPath(targetPath: string): string {
  // Normalize path separators
  const normalized = targetPath.replace(/\\/g, '/');

  // Remove trailing slash
  const cleaned = normalized.replace(/\/$/, '');

  // Ensure leading slash
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

/**
 * Get the directory path for a file path
 */
export function getDirectory(filepath: string): string {
  return path.dirname(filepath);
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Resolve global context document path
 * Ensures path is in ctx/ directory and has .md extension
 * Examples:
 *   architecture/caching -> ctx/architecture/caching.md
 *   ctx/rules/api-design.md -> ctx/rules/api-design.md
 *   caching -> ctx/caching.md
 */
export function resolveGlobalContextPath(targetPath: string): string {
  // Normalize path separators
  let normalized = targetPath.replace(/\\/g, '/');

  // Remove leading slash if present
  normalized = normalized.replace(/^\//, '');

  // Add ctx/ prefix if not present
  if (!normalized.startsWith('ctx/')) {
    normalized = `ctx/${normalized}`;
  }

  // Add .md extension if not present
  if (!normalized.endsWith('.md')) {
    normalized = `${normalized}.md`;
  }

  return normalized;
}

/**
 * Extract document title from path for global context
 * Examples:
 *   ctx/architecture/caching.md -> Caching
 *   ctx/rules/api-design.md -> Api Design
 */
export function extractDocumentTitle(globalPath: string): string {
  const basename = path.basename(globalPath, '.md');
  // Convert kebab-case or snake_case to Title Case
  return basename
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
