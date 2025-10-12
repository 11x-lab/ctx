import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { ScannedContext } from './types.js';

/**
 * Scan for local context files (*.ctx.yml)
 * Excludes ctx/ directory
 */
export async function scanLocalContexts(projectRoot: string): Promise<ScannedContext[]> {
  // Find all *.ctx.yml files, excluding ctx/ directory
  const pattern = '**/*.ctx.yml';
  const files = await glob(pattern, {
    cwd: projectRoot,
    ignore: ['ctx/**', 'node_modules/**', 'dist/**', 'build/**'],
    absolute: false,
  });

  const contexts: ScannedContext[] = [];

  for (const file of files) {
    const absolutePath = path.join(projectRoot, file);
    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      contexts.push({
        contextPath: absolutePath,
        relativePath: file,
        content,
      });
    } catch (error) {
      console.error(`Warning: Failed to read ${file}: ${error}`);
    }
  }

  return contexts;
}

/**
 * Scan for global context files in ctx directory (markdown files)
 */
export async function scanGlobalContexts(projectRoot: string): Promise<ScannedContext[]> {
  const ctxDir = path.join(projectRoot, 'ctx');

  // Check if ctx directory exists
  try {
    await fs.access(ctxDir);
  } catch {
    return []; // ctx directory doesn't exist
  }

  // Find all *.md files in ctx/, excluding hidden directories and registry files
  const pattern = '**/*.md';
  const files = await glob(pattern, {
    cwd: ctxDir,
    ignore: ['.*/**', 'node_modules/**', '.local-context-registry.yml', '.global-context-registry.yml'],
    absolute: false,
  });

  const contexts: ScannedContext[] = [];

  for (const file of files) {
    const absolutePath = path.join(ctxDir, file);
    const relativePath = path.join('ctx', file);

    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      contexts.push({
        contextPath: absolutePath,
        relativePath,
        content,
      });
    } catch (error) {
      console.error(`Warning: Failed to read ${file}: ${error}`);
    }
  }

  return contexts;
}

/**
 * Extract folder from global context path
 * Example: ctx/rules/input-handling.md -> 'rules'
 * Example: ctx/overview.md -> null
 */
export function extractFolder(relativePath: string): string | null {
  // Remove ctx/ prefix
  const withoutCtx = relativePath.replace(/^ctx[/\\]/, '');

  // Get first directory
  const parts = withoutCtx.split(/[/\\]/);

  // If only one part, it's a root file
  if (parts.length === 1) {
    return null;
  }

  // Otherwise, return the folder name
  return parts[0];
}
