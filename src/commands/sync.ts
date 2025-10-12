import path from 'path';
import chalk from 'chalk';
import { isProjectInitialized, fileExists } from '../lib/fileUtils.js';
import { scanLocalContexts, scanGlobalContexts, extractFolder } from '../lib/scanner.js';
import { parseContextFile, validateContextFile, extractPreviewFromLocal, extractPreviewFromGlobal } from '../lib/parser.js';
import { computeChecksum, computeFileChecksum } from '../lib/checksum.js';
import {
  readLocalRegistry,
  writeLocalRegistry,
  readGlobalRegistry,
  writeGlobalRegistry,
} from '../lib/registry.js';
import { SyncOptions, LocalContextEntry, GlobalContextEntry } from '../lib/types.js';

export async function syncCommand(options: SyncOptions = {}) {
  try {
    // Check if project is initialized
    const initialized = await isProjectInitialized();
    if (!initialized) {
      console.error(chalk.red('✗ Error: Project not initialized.'));
      console.log(chalk.gray("  Run 'ctx init' first to initialize context management."));
      process.exit(1);
    }

    const projectRoot = process.cwd();

    // Determine what to sync
    const syncLocal = options.local || (!options.local && !options.global); // Default: sync both
    const syncGlobal = options.global || (!options.local && !options.global);

    let localSynced = 0;
    let globalSynced = 0;
    const errors: string[] = [];

    // Sync local contexts
    if (syncLocal) {
      console.log(chalk.blue('Syncing local contexts...'));
      try {
        localSynced = await syncLocalContexts(projectRoot);
        console.log(chalk.green(`✓ Synced ${localSynced} local context(s)`));
      } catch (error) {
        const errorMsg = `Failed to sync local contexts: ${error}`;
        errors.push(errorMsg);
        console.error(chalk.red(`✗ ${errorMsg}`));
      }
    }

    // Sync global contexts
    if (syncGlobal) {
      console.log(chalk.blue('Syncing global contexts...'));
      try {
        globalSynced = await syncGlobalContexts(projectRoot);
        console.log(chalk.green(`✓ Synced ${globalSynced} global context(s)`));
      } catch (error) {
        const errorMsg = `Failed to sync global contexts: ${error}`;
        errors.push(errorMsg);
        console.error(chalk.red(`✗ ${errorMsg}`));
      }
    }

    // Summary
    console.log();
    console.log(chalk.blue.bold('Sync complete!'));
    console.log(chalk.gray(`  Local: ${localSynced}`));
    console.log(chalk.gray(`  Global: ${globalSynced}`));

    if (errors.length > 0) {
      console.log();
      console.log(chalk.yellow(`⚠️  ${errors.length} error(s) occurred during sync.`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('✗ Error during sync:'), error);
    process.exit(1);
  }
}

/**
 * Sync local contexts (*.ctx.yml files)
 */
async function syncLocalContexts(projectRoot: string): Promise<number> {
  // Scan for context files
  const scannedContexts = await scanLocalContexts(projectRoot);

  // Read existing registry
  const registry = await readLocalRegistry(projectRoot);

  // Process each context file
  for (const scanned of scannedContexts) {
    try {
      // Parse context file
      const contextFile = parseContextFile(scanned.content);

      // Validate context file
      const validation = validateContextFile(contextFile);
      if (!validation.valid) {
        console.warn(
          chalk.yellow(
            `⚠️  Warning: ${scanned.relativePath} has validation errors: ${validation.errors.join(', ')}`
          )
        );
        continue; // Skip invalid context files
      }

      // Get target path (absolute)
      const targetPath = contextFile.meta.target;

      // Compute context file checksum
      const contextChecksum = computeChecksum(scanned.content);

      // Get file stats
      const stats = await import('fs/promises').then((fs) => fs.stat(scanned.contextPath));
      const lastModified = stats.mtime.toISOString();

      // Check if target file exists and compute checksum
      const absoluteTargetPath = path.join(projectRoot, targetPath.replace(/^\//, ''));
      const targetExists = await fileExists(absoluteTargetPath);
      let targetChecksum = '';

      if (targetExists) {
        targetChecksum = await computeFileChecksum(absoluteTargetPath);
      } else {
        console.warn(chalk.yellow(`⚠️  Warning: Target file not found: ${targetPath}`));
      }

      // Extract preview
      const preview = extractPreviewFromLocal(contextFile);

      // Create registry entry
      const entry: LocalContextEntry = {
        type: 'file',
        source: scanned.relativePath,
        checksum: contextChecksum,
        target_checksum: targetChecksum,
        last_modified: lastModified,
        preview: preview,
      };

      // Update registry
      registry.contexts[targetPath] = entry;
    } catch (error) {
      console.error(chalk.red(`✗ Error processing ${scanned.relativePath}: ${error}`));
    }
  }

  // Write updated registry
  await writeLocalRegistry(projectRoot, registry);

  return scannedContexts.length;
}

/**
 * Sync global contexts (.ctx markdown files)
 */
async function syncGlobalContexts(projectRoot: string): Promise<number> {
  // Scan for context files
  const scannedContexts = await scanGlobalContexts(projectRoot);

  // Read existing registry
  const registry = await readGlobalRegistry(projectRoot);

  // Clear existing contexts (we'll rebuild)
  registry.contexts = {};

  // Process each context file
  for (const scanned of scannedContexts) {
    try {
      // Extract preview from frontmatter
      const preview = extractPreviewFromGlobal(scanned.content);

      if (!preview) {
        console.warn(
          chalk.yellow(
            `⚠️  Warning: ${scanned.relativePath} has no valid frontmatter (missing 'when' or 'what'). Skipping.`
          )
        );
        continue;
      }

      // Compute context file checksum
      const contextChecksum = computeChecksum(scanned.content);

      // Get file stats
      const stats = await import('fs/promises').then((fs) => fs.stat(scanned.contextPath));
      const lastModified = stats.mtime.toISOString();

      // Extract folder from path
      const folder = extractFolder(scanned.relativePath);

      // Create registry key: /folder/file.md or /file.md
      const filename = path.basename(scanned.relativePath);
      const registryKey = folder ? `/${folder}/${filename}` : `/${filename}`;

      // Create registry entry
      const entry: GlobalContextEntry = {
        type: 'document',
        source: scanned.relativePath,
        folder: folder,
        checksum: contextChecksum,
        last_modified: lastModified,
        preview: preview,
      };

      // Update registry
      registry.contexts[registryKey] = entry;
    } catch (error) {
      console.error(chalk.red(`✗ Error processing ${scanned.relativePath}: ${error}`));
    }
  }

  // Build folder metadata
  const folderMap = new Map<string, { checksum: string; lastModified: string; checksums: string[] }>();

  for (const entry of Object.values(registry.contexts)) {
    if (!entry.folder) continue;

    if (!folderMap.has(entry.folder)) {
      folderMap.set(entry.folder, {
        checksum: '',
        lastModified: entry.last_modified,
        checksums: [],
      });
    }

    const folderData = folderMap.get(entry.folder)!;
    folderData.checksums.push(entry.checksum);

    // Update to most recent last_modified
    if (entry.last_modified > folderData.lastModified) {
      folderData.lastModified = entry.last_modified;
    }
  }

  // Compute combined checksums for each folder
  registry.folders = {};
  for (const [folderName, data] of folderMap) {
    const combinedChecksum = computeChecksum(data.checksums.sort().join(''));
    registry.folders[folderName] = {
      checksum: combinedChecksum,
      last_modified: data.lastModified,
    };
  }

  // Write updated registry
  await writeGlobalRegistry(projectRoot, registry);

  return scannedContexts.length;
}
