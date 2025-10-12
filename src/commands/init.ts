import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import YAML from 'yaml';
import { getPlatform, isPlatformSupported } from '../lib/platforms/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface InitConfig {
  editor: string;
  version: string;
}

export async function initCommand() {
  console.log(chalk.blue.bold('\n🚀 Initializing Context-Driven Development\n'));

  try {
    // Check if already initialized
    const configPath = path.join(process.cwd(), 'ctx.config.yaml');
    const ctxDirPath = path.join(process.cwd(), 'ctx');

    const configExists = await fileExists(configPath);
    const ctxDirExists = await fileExists(ctxDirPath);

    if (configExists || ctxDirExists) {
      console.log(chalk.yellow('⚠️  Context management is already initialized in this directory.'));

      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to reinitialize?',
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.gray('Initialization cancelled.'));
        return;
      }
    }

    // Ask which code editor
    const { editor } = await inquirer.prompt([
      {
        type: 'list',
        name: 'editor',
        message: 'Which code editor are you using?',
        choices: [
          { name: 'Claude Code', value: 'claude-code' },
          { name: 'Other (coming soon)', value: 'other', disabled: true },
        ],
        default: 'claude-code',
      },
    ]);

    // Create config object
    const config: InitConfig = {
      editor,
      version: '0.1.0',
    };

    // Write ctx.config.yaml
    const yamlContent = YAML.stringify(config);
    await fs.writeFile(configPath, yamlContent, 'utf-8');
    console.log(chalk.green('✓ Created ctx.config.yaml'));

    // Create ctx directory
    await fs.mkdir(ctxDirPath, { recursive: true });
    console.log(chalk.green('✓ Created ctx directory'));

    // Create templates directory and copy all template files
    const templatesDir = path.join(ctxDirPath, 'templates');
    const packageTemplatesDir = path.join(__dirname, '..', 'templates');

    try {
      // Copy entire templates directory (excluding ai-commands subdirectory)
      await copyTemplates(packageTemplatesDir, templatesDir);
      console.log(chalk.green(`✓ Copied template files to ctx/templates/`));
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Warning: Could not copy template files: ${error}`));
    }

    // Create registry files
    const localRegistry = {
      version: '1.0.0',
      last_synced: new Date().toISOString(),
      contexts: {},
    };

    const globalRegistry = {
      version: '1.0.0',
      last_synced: new Date().toISOString(),
      contexts: {},
    };

    await fs.writeFile(
      path.join(ctxDirPath, 'local-context-registry.yml'),
      YAML.stringify(localRegistry),
      'utf-8'
    );
    console.log(chalk.green('✓ Created local-context-registry.yml'));

    await fs.writeFile(
      path.join(ctxDirPath, 'global-context-registry.yml'),
      YAML.stringify(globalRegistry),
      'utf-8'
    );
    console.log(chalk.green('✓ Created global-context-registry.yml'));

    // Create README in ctx
    const readmeContent = `# Context Directory

This directory contains project-wide context documentation.

## Registries

- \`local-context-registry.yml\` - Index of all local context files (*.ctx.yml)
- \`global-context-registry.yml\` - Index of all global context files (ctx/**/*.md)

These registries are auto-generated. Do not edit manually.

## Templates

The \`templates/\` directory contains template files for creating contexts:

- \`local-context.yml\` - Template for local context files (*.ctx.yml)
- \`global-context.md\` - Template for global context documents

**Customization**: You can modify these templates to fit your project's needs. The \`ctx create\` command will use your customized templates automatically.

## Recommended Structure

You can organize your context files however you like. Here are some common patterns:

- \`architecture/\` - Architecture documentation
- \`rules/\` - Development rules and guidelines
- \`stories/\` - Feature stories and specifications

Feel free to create your own structure that fits your project needs.
`;

    await fs.writeFile(path.join(ctxDirPath, 'README.md'), readmeContent, 'utf-8');
    console.log(chalk.green('✓ Created ctx/README.md'));

    // Install AI commands for the selected platform
    if (isPlatformSupported(editor)) {
      const platform = getPlatform(editor);
      await platform.install();
    }

    console.log(chalk.blue.bold('\n✨ Initialization complete!\n'));
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray('  1. Create your first context file: ') + chalk.white('<filename>.ctx.yml'));
    console.log(chalk.gray('  2. Run: ') + chalk.white('ctx sync'));
    console.log(chalk.gray('  3. Learn more: ') + chalk.white('ctx --help\n'));

  } catch (error) {
    console.error(chalk.red('Error during initialization:'), error);
    process.exit(1);
  }
}

async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy template files from package to project ctx/templates/
 * Excludes ai-commands subdirectory
 */
async function copyTemplates(sourceDir: string, destDir: string): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    // Skip ai-commands directory
    if (entry.isDirectory() && entry.name === 'ai-commands') {
      continue;
    }

    if (entry.isFile()) {
      await fs.copyFile(sourcePath, destPath);
    }
  }
}
