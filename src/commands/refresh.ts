import chalk from 'chalk';
import { isProjectInitialized, addToGitignore } from '../lib/fileUtils.js';
import { ClaudeCodePlatform } from '../lib/platforms/claudeCode.js';
import { loadConfig } from '../lib/config.js';

/**
 * Refresh AI commands by re-installing them with current config
 * Useful when ctx.config.yaml has been modified (e.g., global.directory changed)
 */
export async function refreshCommand() {
  try {
    // Check if project is initialized
    const initialized = await isProjectInitialized();
    if (!initialized) {
      console.error(chalk.red('✗ Error: Project not initialized.'));
      console.log(chalk.gray("  Run 'ctx init' first to initialize context management."));
      process.exit(1);
    }

    const projectRoot = process.cwd();
    const platform = new ClaudeCodePlatform(projectRoot);

    console.log(chalk.blue('Refreshing AI commands...'));

    // Update AI commands with current config
    const updated = await platform.update();

    if (updated === 0) {
      console.log(chalk.green('✓ AI commands are already up to date'));
    } else {
      console.log(chalk.green(`✓ Refreshed ${updated} AI command(s)`));
      console.log(chalk.gray('  AI commands now reflect current ctx.config.yaml settings'));
    }

    // Add work directory to .gitignore if not already present
    const config = await loadConfig(projectRoot);
    const workDir = config.work?.directory || '.worktrees';
    const workDirAdded = await addToGitignore(projectRoot, workDir);
    if (workDirAdded) {
      console.log(chalk.green(`✓ Added ${workDir} to .gitignore`));
    }

    // Add work plan path to .gitignore if not already present
    const planPath = config.work?.plan?.path || 'plan.md';
    const planAdded = await addToGitignore(projectRoot, planPath);
    if (planAdded) {
      console.log(chalk.green(`✓ Added ${planPath} to .gitignore`));
    }
  } catch (error) {
    console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
