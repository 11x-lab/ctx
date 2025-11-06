import chalk from 'chalk';
import { isProjectInitialized } from '../lib/fileUtils.js';
import { ClaudeCodePlatform } from '../lib/platforms/claudeCode.js';

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
  } catch (error) {
    console.error(chalk.red(`✗ Error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  }
}
