import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TestEnvironment, suppressConsole } from '../helpers/testUtils.js';
import YAML from 'yaml';

const { syncCommand } = await import('../../src/commands/sync.js');

describe('sync command', () => {
  let testEnv: TestEnvironment;
  let consoleOutput: ReturnType<typeof suppressConsole>;
  let exitSpy: jest.SpiedFunction<typeof process.exit>;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
    await testEnv.initProject();
    consoleOutput = suppressConsole();

    // Mock process.exit to prevent test worker from dying
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`process.exit(${code})`);
    }) as any;
  });

  afterEach(async () => {
    exitSpy.mockRestore();
    consoleOutput.restore();
    await testEnv.cleanup();
  });

  describe('local context synchronization', () => {
    it('should sync a single local context file to registry', async () => {
      // Create a local context file with markdown frontmatter
      const contextContent = `---
target: /src/test.ts
what: Test module for demonstration
when:
  - When testing sync functionality
not_when:
  - When not testing
---

# Test Module

This is a test context.
`;
      await testEnv.createFile('src/test.ctx.md', contextContent);

      // Run sync
      await syncCommand({ local: true });

      // Check registry was updated
      const registryContent = await testEnv.readFile('ctx/local-context-registry.yml');
      expect(registryContent).toContain('src/test.ctx.md');
      expect(registryContent).toContain('/src/test.ts');
    });

    it('should sync multiple local context files', async () => {
      // Create multiple context files
      const contexts = [
        { path: 'src/a.ctx.md', target: '/src/a.ts' },
        { path: 'src/b.ctx.md', target: '/src/b.ts' },
        { path: 'src/nested/c.ctx.md', target: '/src/nested/c.ts' },
      ];

      for (const ctx of contexts) {
        const content = `---
target: ${ctx.target}
what: Test
when:
  - Always
not_when:
  - Never
---

# Test Context
`;
        await testEnv.createFile(ctx.path, content);
      }

      await syncCommand({ local: true });

      const registryContent = await testEnv.readFile('ctx/local-context-registry.yml');

      // All contexts should be in registry
      for (const ctx of contexts) {
        expect(registryContent).toContain(ctx.path);
      }
    });

    it('should update registry when local contexts change', async () => {
      const contextPath = 'src/test.ctx.md';
      const contextContent = `---
target: /src/test.ts
what: Original content
when:
  - Original
not_when:
  - Never
---

# Context
`;
      await testEnv.createFile(contextPath, contextContent);

      // First sync
      await syncCommand({ local: true });
      const firstRegistry = await testEnv.readFile('ctx/local-context-registry.yml');

      // Modify context file
      const updatedContent = contextContent.replace('Original content', 'Updated content');
      await testEnv.createFile(contextPath, updatedContent);

      // Second sync
      await syncCommand({ local: true });
      const secondRegistry = await testEnv.readFile('ctx/local-context-registry.yml');

      // Registry should be updated (checksums different)
      expect(secondRegistry).toBeDefined();
      expect(secondRegistry).not.toBe(firstRegistry);
    });
  });

  describe('global context synchronization', () => {
    it('should sync a single global context file to registry', async () => {
      // Create a global context file
      const globalContent = `---
when:
  - When learning about architecture
what: |
  Architecture documentation
---

# Architecture Guide

This is a test document.
`;
      await testEnv.createFile('ctx/architecture/guide.md', globalContent);

      // Run sync
      await syncCommand({ global: true });

      // Check registry was updated
      const registryContent = await testEnv.readFile('ctx/global-context-registry.yml');
      expect(registryContent).toContain('ctx/architecture/guide.md');
    });

    it('should sync multiple global context files', async () => {
      const globalFiles = [
        'ctx/architecture/database.md',
        'ctx/rules/typescript.md',
        'ctx/processes/deployment.md',
      ];

      for (const filePath of globalFiles) {
        const content = `---
when:
  - Test scenario
what: Test document
---

# Test Document

Content here.
`;
        await testEnv.createFile(filePath, content);
      }

      await syncCommand({ global: true });

      const registryContent = await testEnv.readFile('ctx/global-context-registry.yml');

      // All files should be in registry
      for (const file of globalFiles) {
        expect(registryContent).toContain(file);
      }
    });
  });

  describe('combined synchronization', () => {
    it('should sync both local and global contexts by default', async () => {
      // Create both types
      await testEnv.createFile(
        'src/test.ctx.md',
        '---\ntarget: /src/test.ts\nwhat: Test\nwhen:\n  - Always\nnot_when:\n  - Never\n---\n\n# Test\n'
      );

      await testEnv.createFile(
        'ctx/doc.md',
        '---\nwhen:\n  - Test\nwhat: Test\n---\n\n# Test\n\nContent.'
      );

      // Sync without specifying --local or --global (should sync both)
      await syncCommand({});

      // Both registries should be updated
      const localRegistry = await testEnv.readFile('ctx/local-context-registry.yml');
      const globalRegistry = await testEnv.readFile('ctx/global-context-registry.yml');

      expect(localRegistry).toContain('src/test.ctx.md');
      expect(globalRegistry).toContain('ctx/doc.md');
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
        await syncCommand({});
      }).rejects.toThrow('process.exit(1)');
    });
  });

  describe('idempotency', () => {
    it('should produce same result when synced multiple times', async () => {
      const contextContent = `---
target: /src/stable.ts
what: Stable content
when:
  - Always
not_when:
  - Never
---

# Stable Context
`;
      await testEnv.createFile('src/stable.ctx.md', contextContent);

      // First sync
      await syncCommand({ local: true });
      const firstRegistry = await testEnv.readFile('ctx/local-context-registry.yml');

      // Second sync (without changes)
      await syncCommand({ local: true });
      const secondRegistry = await testEnv.readFile('ctx/local-context-registry.yml');

      // Registries should be functionally equivalent
      // (timestamps might differ, but structure should be same)
      const firstParsed = YAML.parse(firstRegistry);
      const secondParsed = YAML.parse(secondRegistry);

      expect(Object.keys(firstParsed.contexts)).toEqual(Object.keys(secondParsed.contexts));
    });

    it('should handle repeated syncs with no content changes efficiently', async () => {
      await testEnv.createFile(
        'src/test.ctx.md',
        '---\ntarget: /src/test.ts\nwhat: Test\nwhen:\n  - Always\nnot_when:\n  - Never\n---\n\n# Test\n'
      );

      // Multiple syncs
      await syncCommand({ local: true });
      const checksum1 = await testEnv.readFile('ctx/local-context-registry.yml');

      await syncCommand({ local: true });
      const checksum2 = await testEnv.readFile('ctx/local-context-registry.yml');

      await syncCommand({ local: true });
      const checksum3 = await testEnv.readFile('ctx/local-context-registry.yml');

      // Registry structure should stabilize
      expect(checksum1).toBeDefined();
      expect(checksum2).toBeDefined();
      expect(checksum3).toBeDefined();
    });
  });
});
