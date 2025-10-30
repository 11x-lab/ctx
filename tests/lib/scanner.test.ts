import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestEnvironment } from '../helpers/testUtils.js';
import { scanLocalContexts, scanGlobalContexts, extractFolder } from '../../src/lib/scanner.js';
import { loadConfig } from '../../src/lib/config.js';

describe('scanner', () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  describe('scanLocalContexts', () => {
    beforeEach(async () => {
      await testEnv.initProject();
    });

    it('should find local context files with .ctx.md pattern', async () => {
      // Create local context files
      await testEnv.createFile('src/utils/helper.ctx.md', '# Helper context');
      await testEnv.createFile('src/services/api.ctx.md', '# API context');
      await testEnv.createFile('src/models/user.ts', '// Not a context file');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanLocalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(2);
      expect(contexts.map(c => c.relativePath).sort()).toEqual([
        'src/services/api.ctx.md',
        'src/utils/helper.ctx.md',
      ]);
    });

    it('should find local context files with ctx.md pattern', async () => {
      // Create directory-level context files
      await testEnv.createFile('src/components/ctx.md', '# Components context');
      await testEnv.createFile('src/api/ctx.md', '# API context');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanLocalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(2);
      expect(contexts.map(c => c.relativePath).sort()).toEqual([
        'src/api/ctx.md',
        'src/components/ctx.md',
      ]);
    });

    it('should load file content correctly', async () => {
      const testContent = '# Test Context\n\nThis is test content.';
      await testEnv.createFile('src/test.ctx.md', testContent);

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanLocalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(1);
      expect(contexts[0].content).toBe(testContent);
    });

    it('should provide both absolute and relative paths', async () => {
      await testEnv.createFile('src/utils/helper.ctx.md', '# Helper');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanLocalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(1);
      expect(contexts[0].relativePath).toBe('src/utils/helper.ctx.md');
      expect(contexts[0].contextPath).toContain('src/utils/helper.ctx.md');
      expect(contexts[0].contextPath).toContain(testEnv.tempDir);
    });

    it('should ignore node_modules directory', async () => {
      await testEnv.createFile('src/app.ctx.md', '# App');
      await testEnv.createFile('node_modules/lib/test.ctx.md', '# Should be ignored');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanLocalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(1);
      expect(contexts[0].relativePath).toBe('src/app.ctx.md');
    });

    it('should ignore global context directory', async () => {
      await testEnv.createFile('src/app.ctx.md', '# App');
      await testEnv.createFile('ctx/rules/test.md', '# Global context');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanLocalContexts(testEnv.tempDir, config);

      // Should only find local context, not global
      expect(contexts).toHaveLength(1);
      expect(contexts[0].relativePath).toBe('src/app.ctx.md');
    });

    it('should respect custom ignore patterns from config', async () => {
      // Create custom config with additional ignore
      await testEnv.createFile('ctx.config.yaml', `version: "0.1.0"
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
    - "test/**"
global:
  directory: ctx
  patterns: "**/*.md"
  ignore: []
`);

      await testEnv.createFile('src/app.ctx.md', '# App');
      await testEnv.createFile('test/utils.ctx.md', '# Should be ignored');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanLocalContexts(testEnv.tempDir, config);

      // Should ignore test/ directory
      expect(contexts).toHaveLength(1);
      expect(contexts[0].relativePath).toBe('src/app.ctx.md');
    });

    it('should return empty array if no local contexts exist', async () => {
      await testEnv.createFile('src/index.ts', '// Regular file');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanLocalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(0);
    });

    it('should handle nested directory structures', async () => {
      await testEnv.createFile('src/deep/nested/path/file.ctx.md', '# Deep');
      await testEnv.createFile('src/another/deep/path/ctx.md', '# Another');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanLocalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(2);
      expect(contexts.map(c => c.relativePath).sort()).toEqual([
        'src/another/deep/path/ctx.md',
        'src/deep/nested/path/file.ctx.md',
      ]);
    });
  });

  describe('scanGlobalContexts', () => {
    beforeEach(async () => {
      await testEnv.initProject();
    });

    it('should find markdown files in global directory', async () => {
      await testEnv.createFile('ctx/overview.md', '# Overview');
      await testEnv.createFile('ctx/architecture/design.md', '# Design');
      await testEnv.createFile('ctx/rules/naming.md', '# Naming');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(3);
      expect(contexts.map(c => c.relativePath).sort()).toEqual([
        'ctx/architecture/design.md',
        'ctx/overview.md',
        'ctx/rules/naming.md',
      ]);
    });

    it('should load file content correctly', async () => {
      const testContent = '# Global Context\n\nGlobal content here.';
      await testEnv.createFile('ctx/test.md', testContent);

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(1);
      expect(contexts[0].content).toBe(testContent);
    });

    it('should ignore templates directory', async () => {
      await testEnv.createFile('ctx/architecture.md', '# Architecture');
      await testEnv.createFile('ctx/templates/local-context.md', '# Template');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      // Should only find architecture.md, not template
      expect(contexts).toHaveLength(1);
      expect(contexts[0].relativePath).toBe('ctx/architecture.md');
    });

    it('should ignore README.md', async () => {
      await testEnv.createFile('ctx/overview.md', '# Overview');
      await testEnv.createFile('ctx/README.md', '# README');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(1);
      expect(contexts[0].relativePath).toBe('ctx/overview.md');
    });

    it('should ignore registry files', async () => {
      await testEnv.createFile('ctx/architecture.md', '# Architecture');
      // Registry files are created by initProject, but let's be explicit
      await testEnv.createFile('ctx/local-context-registry.yml', 'meta: {}');
      await testEnv.createFile('ctx/global-context-registry.yml', 'meta: {}');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      // Should only find .md files, not .yml registries
      expect(contexts).toHaveLength(1);
      expect(contexts[0].relativePath).toBe('ctx/architecture.md');
    });

    it('should ignore hidden directories', async () => {
      await testEnv.createFile('ctx/overview.md', '# Overview');
      await testEnv.createFile('ctx/.git/config.md', '# Should be ignored');
      await testEnv.createFile('ctx/.vscode/settings.md', '# Should be ignored');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(1);
      expect(contexts[0].relativePath).toBe('ctx/overview.md');
    });

    it('should respect custom ignore patterns from config', async () => {
      // Create custom config with global ignore patterns
      await testEnv.createFile('ctx.config.yaml', `version: "0.1.0"
editor: claude-code
local:
  patterns:
    - "**/*.ctx.md"
  ignore:
    - node_modules/**
global:
  directory: ctx
  patterns: "**/*.md"
  ignore:
    - templates/**
    - README.md
    - "*-context-registry.yml"
    - "drafts/**"
`);

      await testEnv.createFile('ctx/overview.md', '# Overview');
      await testEnv.createFile('ctx/drafts/wip.md', '# Should be ignored');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(1);
      expect(contexts[0].relativePath).toBe('ctx/overview.md');
    });

    it('should return empty array if global directory does not exist', async () => {
      // Create new environment without global directory
      await testEnv.cleanup();
      testEnv = new TestEnvironment();
      await testEnv.setup();
      // Don't call initProject()

      // Create just the config file
      await testEnv.createFile('ctx.config.yaml', `version: "0.1.0"
editor: claude-code
local:
  patterns:
    - "**/*.ctx.md"
  ignore:
    - node_modules/**
global:
  directory: ctx
  patterns: "**/*.md"
  ignore: []
`);

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(0);
    });

    it('should handle deeply nested structures', async () => {
      await testEnv.createFile('ctx/a/b/c/d/deep.md', '# Deep');
      await testEnv.createFile('ctx/x/y/z/another.md', '# Another');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(2);
      expect(contexts.map(c => c.relativePath).sort()).toEqual([
        'ctx/a/b/c/d/deep.md',
        'ctx/x/y/z/another.md',
      ]);
    });

    it('should work with custom global directory name', async () => {
      // Create environment with custom global directory
      await testEnv.cleanup();
      testEnv = new TestEnvironment();
      await testEnv.setup();
      await testEnv.initProject('docs'); // Use 'docs' instead of 'ctx'

      await testEnv.createFile('docs/guide.md', '# Guide');
      await testEnv.createFile('docs/api/reference.md', '# Reference');

      const config = await loadConfig(testEnv.tempDir);
      const contexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(contexts).toHaveLength(2);
      expect(contexts.map(c => c.relativePath).sort()).toEqual([
        'docs/api/reference.md',
        'docs/guide.md',
      ]);
    });
  });

  describe('extractFolder', () => {
    it('should extract folder from nested path', async () => {
      const result = extractFolder('ctx/rules/api-design.md', 'ctx');
      expect(result).toBe('rules');
    });

    it('should return null for root-level files', async () => {
      const result = extractFolder('ctx/overview.md', 'ctx');
      expect(result).toBe(null);
    });

    it('should handle deeply nested paths', async () => {
      const result = extractFolder('ctx/architecture/backend/database.md', 'ctx');
      expect(result).toBe('architecture');
    });

    it('should handle backslash path separators', async () => {
      const result = extractFolder('ctx\\rules\\naming.md', 'ctx');
      expect(result).toBe('rules');
    });

    it('should work with custom global directory', async () => {
      const result = extractFolder('docs/guides/intro.md', 'docs');
      expect(result).toBe('guides');
    });

    it('should return null for single-level path', async () => {
      const result = extractFolder('ctx/readme.md', 'ctx');
      expect(result).toBe(null);
    });
  });

  describe('integration scenarios', () => {
    beforeEach(async () => {
      await testEnv.initProject();
    });

    it('should separate local and global contexts correctly', async () => {
      // Create both local and global contexts
      await testEnv.createFile('src/app.ctx.md', '# App local');
      await testEnv.createFile('ctx/overview.md', '# Overview global');

      const config = await loadConfig(testEnv.tempDir);
      const localContexts = await scanLocalContexts(testEnv.tempDir, config);
      const globalContexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(localContexts).toHaveLength(1);
      expect(localContexts[0].relativePath).toBe('src/app.ctx.md');

      expect(globalContexts).toHaveLength(1);
      expect(globalContexts[0].relativePath).toBe('ctx/overview.md');
    });

    it('should handle mixed file structures', async () => {
      // Create complex file structure
      await testEnv.createFile('src/components/Button.ctx.md', '# Button');
      await testEnv.createFile('src/utils/ctx.md', '# Utils');
      await testEnv.createFile('ctx/architecture/frontend.md', '# Frontend');
      await testEnv.createFile('ctx/rules/testing.md', '# Testing');
      await testEnv.createFile('node_modules/pkg/test.ctx.md', '# Should be ignored');

      const config = await loadConfig(testEnv.tempDir);
      const localContexts = await scanLocalContexts(testEnv.tempDir, config);
      const globalContexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(localContexts).toHaveLength(2);
      expect(globalContexts).toHaveLength(2);
    });

    it('should handle empty project with just config', async () => {
      const config = await loadConfig(testEnv.tempDir);
      const localContexts = await scanLocalContexts(testEnv.tempDir, config);
      const globalContexts = await scanGlobalContexts(testEnv.tempDir, config);

      expect(localContexts).toHaveLength(0);
      expect(globalContexts).toHaveLength(0);
    });
  });
});
