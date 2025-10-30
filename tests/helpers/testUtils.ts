import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test environment that provides isolated file system for each test
 * Ensures idempotent and independent test execution
 */
export class TestEnvironment {
  public tempDir: string = '';
  private originalCwd: string = '';
  private cwdChanged: boolean = false;

  /**
   * Set up isolated test environment
   * - Creates temporary directory
   * - Changes process.cwd() to temp directory
   */
  async setup(): Promise<void> {
    // Store original cwd
    this.originalCwd = process.cwd();

    // Create unique temp directory for this test
    const tmpRoot = os.tmpdir();
    const prefix = 'ctx-test-';
    this.tempDir = await fs.mkdtemp(path.join(tmpRoot, prefix));

    // Change to temp directory
    process.chdir(this.tempDir);
    this.cwdChanged = true;
  }

  /**
   * Clean up test environment
   * - Restores original cwd
   * - Removes temporary directory
   */
  async cleanup(): Promise<void> {
    // Restore original cwd first
    if (this.cwdChanged && this.originalCwd) {
      process.chdir(this.originalCwd);
      this.cwdChanged = false;
    }

    // Remove temp directory
    if (this.tempDir) {
      try {
        await fs.rm(this.tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors in tests
        console.warn(`Failed to cleanup test directory: ${this.tempDir}`, error);
      }
    }
  }

  /**
   * Initialize a ctx project in the test environment
   * Creates ctx.config.yaml and ctx/ directories (matching real init command)
   */
  async initProject(globalDir: string = 'ctx'): Promise<void> {
    // Create ctx.config.yaml with new structure
    const configContent = `version: "0.1.0"
editor: claude-code
local:
  patterns:
    - "**/*.ctx.md"
    - "**/ctx.md"
  ignore:
    - node_modules/**
    - dist/**
    - build/**
    - .git/**
global:
  directory: ${globalDir}
  patterns: "**/*.md"
  ignore: []
`;
    await fs.writeFile(
      path.join(this.tempDir, 'ctx.config.yaml'),
      configContent,
      'utf-8'
    );

    // Create global directory (matches real init command)
    await fs.mkdir(path.join(this.tempDir, globalDir), { recursive: true });
    await fs.mkdir(path.join(this.tempDir, globalDir, 'templates'), { recursive: true });

    // Create registry files (matching registry.ts structure with meta field)
    const timestamp = new Date().toISOString();

    // Write YAML formatted registries with proper structure
    await fs.writeFile(
      path.join(this.tempDir, globalDir, 'local-context-registry.yml'),
      `meta:
  version: '1.0.0'
  last_synced: '${timestamp}'
contexts: {}
`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(this.tempDir, globalDir, 'global-context-registry.yml'),
      `meta:
  version: '1.0.0'
  last_synced: '${timestamp}'
contexts: {}
folders: {}
`,
      'utf-8'
    );
  }

  /**
   * Create a source file in the test environment
   */
  async createFile(relativePath: string, content: string = ''): Promise<void> {
    const fullPath = path.join(this.tempDir, relativePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  /**
   * Read a file from the test environment
   */
  async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.tempDir, relativePath);
    return fs.readFile(fullPath, 'utf-8');
  }

  /**
   * Check if a file exists in the test environment
   */
  async fileExists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.tempDir, relativePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a directory exists in the test environment
   */
  async dirExists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.tempDir, relativePath);
      const stat = await fs.stat(fullPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(relativePath: string = '.'): Promise<string[]> {
    const fullPath = path.join(this.tempDir, relativePath);
    try {
      return await fs.readdir(fullPath);
    } catch {
      return [];
    }
  }

  /**
   * Get absolute path for a relative path in test environment
   */
  getPath(relativePath: string): string {
    return path.join(this.tempDir, relativePath);
  }

  /**
   * Parse YAML file (useful for checking registry files)
   */
  async readYaml(relativePath: string): Promise<any> {
    const content = await this.readFile(relativePath);
    // Simple YAML parser for test purposes
    // For production, use a proper YAML library
    return content;
  }
}

/**
 * Helper to suppress console output during tests
 */
export function suppressConsole(): {
  restore: () => void;
  getOutput: () => { log: string[]; error: string[]; };
} {
  const originalLog = console.log;
  const originalError = console.error;
  const logs: string[] = [];
  const errors: string[] = [];

  console.log = (...args: any[]) => {
    logs.push(args.map(String).join(' '));
  };

  console.error = (...args: any[]) => {
    errors.push(args.map(String).join(' '));
  };

  return {
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
    },
    getOutput: () => ({ log: logs, error: errors }),
  };
}

/**
 * Mock inquirer prompts for testing
 */
export function mockInquirer(answers: Record<string, any>): void {
  // This would be implemented with jest.mock if needed
  // For now, tests will use --force flag to bypass prompts
}
