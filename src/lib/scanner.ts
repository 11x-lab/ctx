import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { ScannedContext, Config } from './types.js';

/**
 * Scan for local context files based on config patterns
 */
export async function scanLocalContexts(
  projectRoot: string,
  config: Config
): Promise<ScannedContext[]> {
  const contexts: ScannedContext[] = [];

  // Support both string and array patterns
  const patterns = Array.isArray(config.local.patterns)
    ? config.local.patterns
    : [config.local.patterns];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: projectRoot,
      ignore: [
        ...config.local.ignore,
        `${config.global.directory}/**`,
      ],
      absolute: false,
    });

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
  }
 
  return contexts;
}

/**
 * Scan for global context files based on config patterns
 */
export async function scanGlobalContexts(
  projectRoot: string,
  config: Config
): Promise<ScannedContext[]> {
  const globalDir = path.join(projectRoot, config.global.directory);

  // Check if global directory exists
  try {
    await fs.access(globalDir);
  } catch {
    return []; // global directory doesn't exist
  }

  // Build pattern with config directory
  const pattern = `${config.global.directory}/${config.global.patterns}`;

  const files = await glob(pattern, {
    cwd: projectRoot,
    ignore: [
      ...config.global.ignore.map(p => `${config.global.directory}/${p}`),
    ],
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
 * Extract folder from global context path
 * Example: ctx/rules/input-handling.md -> 'rules'
 * Example: ctx/overview.md -> null
 */
export function extractFolder(relativePath: string, globalDir: string): string | null {
  // Remove global directory prefix (e.g., 'ctx/' or 'docs/')
  const pattern = new RegExp(`^${globalDir.replace(/[/\\]/g, '[/\\\\]')}[/\\\\]`);
  const withoutDir = relativePath.replace(pattern, '');

  // Get first directory
  const parts = withoutDir.split(/[/\\]/);

  // If only one part, it's a root file
  if (parts.length === 1) {
    return null;
  }

  // Otherwise, return the folder name
  return parts[0];
}
