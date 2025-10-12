import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import {
  fileExists,
  isProjectInitialized,
  resolveContextPath,
  resolveGlobalContextPath,
  resolveAbsoluteTargetPath,
  extractDocumentTitle,
  getDirectory,
  ensureDirectory,
} from '../lib/fileUtils.js';
import { validateTarget, checkContextFileExists } from '../lib/validation.js';
import { loadTemplate, renderTemplate, ContextType } from '../lib/templates.js';

export interface CreateOptions {
  template?: string;
  force?: boolean;
  global?: boolean;
}

export async function createCommand(target: string, options: CreateOptions = {}) {
  try {
    // 1. Validate target
    const validation = validateTarget(target);
    if (!validation.valid) {
      console.error(chalk.red(`✗ ${validation.error}`));
      process.exit(1);
    }

    // 2. Check if project is initialized
    const initialized = await isProjectInitialized();
    if (!initialized) {
      console.error(chalk.red('✗ Error: Project not initialized.'));
      console.log(chalk.gray("  Run 'ctx init' first to initialize context management."));
      process.exit(1);
    }

    // 3. Determine context type and resolve paths
    const isGlobal = options.global || false;
    const contextType: ContextType = isGlobal ? 'global' : 'local';

    let contextPath: string;
    let absoluteContextPath: string;
    let templateData: Record<string, string>;

    if (isGlobal) {
      // Global context: resolve to ctx/ directory
      contextPath = resolveGlobalContextPath(target);
      absoluteContextPath = path.resolve(process.cwd(), contextPath);

      // Extract document title from path
      const documentTitle = extractDocumentTitle(contextPath);
      templateData = { documentTitle };
    } else {
      // Local context: resolve based on target file
      contextPath = resolveContextPath(target);
      absoluteContextPath = path.resolve(process.cwd(), contextPath);

      const absoluteTargetPath = resolveAbsoluteTargetPath(target);
      templateData = { targetPath: absoluteTargetPath };
    }

    // 4. Check if context file already exists
    const exists = await checkContextFileExists(absoluteContextPath);
    if (exists && !options.force) {
      console.log(chalk.yellow(`⚠️  Context file already exists: ${contextPath}`));

      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to overwrite it?',
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.gray('Operation cancelled.'));
        console.log(chalk.gray(`  Use --force to overwrite without confirmation.`));
        return;
      }
    }

    // 5. Check if target file exists (warning only, local contexts only)
    if (!isGlobal) {
      const targetFilePath = path.resolve(process.cwd(), target);
      const targetExists = await fileExists(targetFilePath);
      if (!targetExists) {
        console.log(chalk.yellow(`⚠️  Warning: Target file does not exist: ${target}`));
        console.log(chalk.gray('  Context file will be created anyway.'));
      }
    }

    // 6. Load template
    const templateType = options.template || 'default';
    const template = await loadTemplate(contextType, templateType);

    // 7. Render template with data
    const rendered = renderTemplate(template, templateData);

    // 8. Ensure directory exists
    const contextDir = getDirectory(absoluteContextPath);
    await ensureDirectory(contextDir);

    // 9. Write context file
    await fs.writeFile(absoluteContextPath, rendered, 'utf-8');

    // 10. Display success message
    console.log(chalk.green(`✓ Created ${contextPath}`));
    if (!isGlobal && templateData.targetPath) {
      console.log(chalk.gray(`→ Target: ${templateData.targetPath}`));
    }
    console.log();
    console.log(chalk.blue('Next steps:'));
    console.log(chalk.gray('  1. Fill in the TODO fields with meaningful information'));

    if (isGlobal) {
      console.log(chalk.gray('  2. Run: ') + chalk.white('ctx sync --global'));
      console.log(chalk.gray('  3. Or use AI: ') + chalk.white(`/ctx.global ${target}`) + chalk.gray(' (in Claude Code)'));
    } else {
      console.log(chalk.gray('  2. Run: ') + chalk.white('ctx sync --local'));
      console.log(chalk.gray('  3. Or use AI: ') + chalk.white(`/ctx.local ${target}`) + chalk.gray(' (in Claude Code)'));
    }
    console.log();
  } catch (error) {
    console.error(chalk.red('✗ Error creating context file:'), error);
    process.exit(1);
  }
}
