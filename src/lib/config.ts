import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import { Config } from './types.js';

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Config = {
  version: '0.1.0',
  editor: 'claude-code',
  local: {
    patterns: ['**/*.ctx.md', '**/ctx.md'],
    ignore: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
    ],
  },
  global: {
    directory: 'ctx',
    patterns: '**/*.md',
    ignore: [
      'templates/**',
      'README.md',
      '*-context-registry.yml',  // System-generated registry files
    ],
  },
};

/**
 * Load configuration from ctx.config.yaml
 * Merges user config with defaults
 */
export async function loadConfig(projectRoot: string): Promise<Config> {
  const configPath = path.join(projectRoot, 'ctx.config.yaml');

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const userConfig = YAML.parse(content) as Partial<Config>;

    // Merge with defaults
    return {
      version: userConfig.version || DEFAULT_CONFIG.version,
      editor: userConfig.editor || DEFAULT_CONFIG.editor,
      local: {
        patterns: userConfig.local?.patterns || DEFAULT_CONFIG.local.patterns,
        ignore: [
          ...DEFAULT_CONFIG.local.ignore,
          ...(userConfig.local?.ignore || []),
        ],
      },
      global: {
        directory: userConfig.global?.directory || DEFAULT_CONFIG.global.directory,
        patterns: userConfig.global?.patterns || DEFAULT_CONFIG.global.patterns,
        ignore: [
          ...DEFAULT_CONFIG.global.ignore,
          ...(userConfig.global?.ignore || []),
        ],
      },
    };
  } catch (error) {
    // Return default config if file doesn't exist
    return DEFAULT_CONFIG;
  }
}

/**
 * Create initial config file
 */
export async function createConfigFile(
  projectRoot: string,
  options: { editor: string }
): Promise<void> {
  const configPath = path.join(projectRoot, 'ctx.config.yaml');

  const config: Config = {
    ...DEFAULT_CONFIG,
    editor: options.editor,
  };

  const yamlContent = YAML.stringify(config);
  await fs.writeFile(configPath, yamlContent, 'utf-8');
}
