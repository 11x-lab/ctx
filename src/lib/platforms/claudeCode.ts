import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { Platform } from './types.js';
import { getAICommandTemplates, loadAICommandTemplate } from '../templates.js';

/**
 * Claude Code platform implementation
 * Manages AI commands in .claude/commands/ directory
 */
export class ClaudeCodePlatform implements Platform {
  readonly name = 'Claude Code';
  readonly id = 'claude-code';
  private readonly projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  getCommandsDir(): string {
    return path.join(this.projectRoot, '.claude', 'commands');
  }

  async isInstalled(): Promise<boolean> {
    try {
      const commandsDir = this.getCommandsDir();
      await fs.access(commandsDir);
      return true;
    } catch {
      return false;
    }
  }

  async install(): Promise<void> {
    const commandsDir = this.getCommandsDir();

    // Create .claude/commands directory
    await fs.mkdir(commandsDir, { recursive: true });

    // Get all AI command templates
    const templates = await getAICommandTemplates();

    if (templates.length === 0) {
      console.log(chalk.yellow('⚠️  No AI command templates found'));
      return;
    }

    // Copy each template with ctx. prefix
    for (const templateName of templates) {
      const content = await loadAICommandTemplate(templateName);
      const targetPath = path.join(commandsDir, `ctx.${templateName}`);
      await fs.writeFile(targetPath, content, 'utf-8');
    }

    console.log(chalk.green(`✓ Installed ${templates.length} AI commands to .claude/commands/`));
  }

  async update(): Promise<number> {
    const commandsDir = this.getCommandsDir();

    // Check if commands directory exists
    const installed = await this.isInstalled();
    if (!installed) {
      throw new Error('AI commands not installed. Run `ctx init` first.');
    }

    const templates = await getAICommandTemplates();
    let updated = 0;

    for (const templateName of templates) {
      const targetPath = path.join(commandsDir, `ctx.${templateName}`);
      const templateContent = await loadAICommandTemplate(templateName);

      // Check if file exists and content is different
      try {
        const existingContent = await fs.readFile(targetPath, 'utf-8');
        if (existingContent !== templateContent) {
          await fs.writeFile(targetPath, templateContent, 'utf-8');
          updated++;
        }
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(targetPath, templateContent, 'utf-8');
        updated++;
      }
    }

    return updated;
  }
}
