import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestEnvironment, suppressConsole } from '../helpers/testUtils.js';
import YAML from 'yaml';

// Create mock function with proper typing
const mockPrompt = jest.fn<any>();

// Mock inquirer before importing createCommand
jest.unstable_mockModule('inquirer', () => ({
  default: {
    prompt: mockPrompt,
  },
}));

// Import after mocking
await import('inquirer');
const { createCommand } = await import('../../src/commands/create.js');

describe('create command', () => {
  let testEnv: TestEnvironment;
  let consoleOutput: ReturnType<typeof suppressConsole>;
  let exitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
    await testEnv.initProject(); // Always init project for create tests
    consoleOutput = suppressConsole();

    // Mock process.exit to prevent test worker from dying
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit(${code})`);
    }) as any;

    // Reset mocks
    mockPrompt.mockClear();
    mockPrompt.mockResolvedValue({ overwrite: true });
  });

  afterEach(async () => {
    exitSpy.mockRestore();
    consoleOutput.restore();
    await testEnv.cleanup();
  });

  describe('local context creation', () => {
    it('should create context file for a source file', async () => {
      // Create target source file
      await testEnv.createFile('src/services/payment.ts', 'export class Payment {}');

      await createCommand('src/services/payment.ts', { force: true });

      // Check context file was created
      expect(await testEnv.fileExists('src/services/payment.ctx.yml')).toBe(true);
    });

    it('should create context file with correct template structure', async () => {
      await testEnv.createFile('src/utils/helpers.ts', 'export function help() {}');

      await createCommand('src/utils/helpers.ts', { force: true });

      const contextContent = await testEnv.readFile('src/utils/helpers.ctx.yml');
      const context = YAML.parse(contextContent);

      // Check required fields from template
      expect(context).toHaveProperty('meta');
      expect(context).toHaveProperty('what');
      expect(context).toHaveProperty('when');
      expect(context).toHaveProperty('not_when');
      expect(context.meta).toHaveProperty('version');
      expect(context.meta).toHaveProperty('target');
    });

    it('should render template with absolute target path', async () => {
      await testEnv.createFile('src/models/user.ts', 'export interface User {}');

      await createCommand('src/models/user.ts', { force: true });

      const contextContent = await testEnv.readFile('src/models/user.ctx.yml');
      const context = YAML.parse(contextContent);

      // Target path should be absolute (starts with /)
      expect(context.meta.target).toBe('/src/models/user.ts');
    });

    it('should create context file for directory', async () => {
      await testEnv.createFile('src/api/.gitkeep', '');

      await createCommand('src/api/', { force: true });

      // For directories, context file is ctx.yml inside the directory
      expect(await testEnv.fileExists('src/api/ctx.yml')).toBe(true);
    });

    it('should create nested directories if they do not exist', async () => {
      // Don't create the directory structure
      // create command should handle it

      await createCommand('src/deeply/nested/path/file.ts', { force: true });

      // Context file should be created along with directories
      expect(await testEnv.fileExists('src/deeply/nested/path/file.ctx.yml')).toBe(true);
    });

    it('should warn if target file does not exist but still create context', async () => {
      // Don't create target file

      await createCommand('src/nonexistent.ts', { force: true });

      // Context file should still be created
      expect(await testEnv.fileExists('src/nonexistent.ctx.yml')).toBe(true);

      // Check console output for warning
      const output = consoleOutput.getOutput();
      const warningFound = output.log.some(log =>
        log.includes('Warning') && log.includes('does not exist')
      );
      expect(warningFound).toBe(true);
    });
  });

  describe('global context creation', () => {
    it('should create global context in ctx/ directory', async () => {
      await createCommand('architecture/caching', { global: true, force: true });

      // Should create in ctx/ directory with .md extension
      expect(await testEnv.fileExists('ctx/architecture/caching.md')).toBe(true);
    });

    it('should normalize path to ctx/ directory', async () => {
      // Input path without ctx/ prefix
      await createCommand('rules/api-design', { global: true, force: true });

      expect(await testEnv.fileExists('ctx/rules/api-design.md')).toBe(true);
    });

    it('should handle explicit ctx/ prefix in path', async () => {
      await createCommand('ctx/processes/deployment', { global: true, force: true });

      // Should not duplicate ctx/ prefix
      expect(await testEnv.fileExists('ctx/processes/deployment.md')).toBe(true);
    });

    it('should add .md extension if not present', async () => {
      await createCommand('architecture/database', { global: true, force: true });

      expect(await testEnv.fileExists('ctx/architecture/database.md')).toBe(true);
    });

    it('should render template with document title', async () => {
      await createCommand('architecture/api-versioning', { global: true, force: true });

      const content = await testEnv.readFile('ctx/architecture/api-versioning.md');

      // Check for frontmatter structure
      expect(content).toContain('---');
      expect(content).toContain('when:');
      expect(content).toContain('what:');

      // Document title should be rendered (converted from kebab-case)
      expect(content).toContain('# Api Versioning');
    });

    it('should create nested directories for global contexts', async () => {
      await createCommand('deep/nested/structure/doc', { global: true, force: true });

      expect(await testEnv.fileExists('ctx/deep/nested/structure/doc.md')).toBe(true);
    });
  });

  describe('file overwrite handling', () => {
    beforeEach(async () => {
      // Create existing context file
      await testEnv.createFile(
        'src/existing.ctx.yml',
        'meta:\n  version: 0.0.1\n  target: /src/existing.ts\nwhat: old content'
      );
    });

    it('should prompt for confirmation when file exists without --force', async () => {
      // Mock user declining overwrite
      mockPrompt.mockResolvedValueOnce({ overwrite: false });

      await createCommand('src/existing.ts', {}); // No force flag

      // Should have prompted
      expect(mockPrompt).toHaveBeenCalled();

      // Original content should remain
      const content = await testEnv.readFile('src/existing.ctx.yml');
      expect(content).toContain('old content');
    });

    it('should overwrite with --force flag without prompting', async () => {
      await createCommand('src/existing.ts', { force: true });

      // Should not have prompted
      expect(mockPrompt).not.toHaveBeenCalled();

      // File should be overwritten (no longer contains old content)
      const content = await testEnv.readFile('src/existing.ctx.yml');
      expect(content).not.toContain('old content');
      expect(content).toContain('TODO');
    });

    it('should overwrite if user confirms prompt', async () => {
      // Mock user confirming overwrite
      mockPrompt.mockResolvedValueOnce({ overwrite: true });

      await createCommand('src/existing.ts', {});

      // Should have prompted
      expect(mockPrompt).toHaveBeenCalled();

      // File should be overwritten
      const content = await testEnv.readFile('src/existing.ctx.yml');
      expect(content).not.toContain('old content');
    });
  });

  describe('error handling', () => {
    it('should fail if project is not initialized', async () => {
      // Create new environment without init
      await testEnv.cleanup();
      testEnv = new TestEnvironment();
      await testEnv.setup();
      // Don't call initProject()

      await expect(async () => {
        await createCommand('src/test.ts', { force: true });
      }).rejects.toThrow('process.exit(1)');
    });

    it('should fail if target path is empty', async () => {
      await expect(async () => {
        await createCommand('', { force: true });
      }).rejects.toThrow('process.exit(1)');
    });
  });

  describe('idempotency', () => {
    it('should produce same result when run multiple times with --force', async () => {
      await testEnv.createFile('src/test.ts', 'export class Test {}');

      // First run
      await createCommand('src/test.ts', { force: true });
      const firstContent = await testEnv.readFile('src/test.ctx.yml');
      const firstParsed = YAML.parse(firstContent);

      // Second run
      await createCommand('src/test.ts', { force: true });
      const secondContent = await testEnv.readFile('src/test.ctx.yml');
      const secondParsed = YAML.parse(secondContent);

      // Structure should be identical
      expect(firstParsed.meta.target).toBe(secondParsed.meta.target);
      expect(firstParsed.meta.version).toBe(secondParsed.meta.version);
    });

    it('should produce consistent global context structure', async () => {
      // First run
      await createCommand('test-doc', { global: true, force: true });
      const firstContent = await testEnv.readFile('ctx/test-doc.md');

      // Second run
      await createCommand('test-doc', { global: true, force: true });
      const secondContent = await testEnv.readFile('ctx/test-doc.md');

      // Content structure should be identical
      expect(firstContent.split('\n').slice(0, 10)).toEqual(
        secondContent.split('\n').slice(0, 10)
      );
    });
  });
});
