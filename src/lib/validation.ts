import fs from 'fs/promises';
import path from 'path';
import { fileExists } from './fileUtils.js';
import {
  LocalContextEntry,
  GlobalContextEntry,
  ValidationCheck,
  ValidationIssue,
} from './types.js';
import { parseContextFile, validateContextFile } from './parser.js';
import { computeFileChecksum } from './checksum.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a target path is provided and not empty
 */
export function validateTarget(target: string | undefined): ValidationResult {
  if (!target || target.trim() === '') {
    return {
      valid: false,
      error: 'Target path is required. Usage: ctx create <target>',
    };
  }

  return { valid: true };
}

/**
 * Check if a context file already exists at the given path
 */
export async function checkContextFileExists(contextPath: string): Promise<boolean> {
  return fileExists(contextPath);
}

/**
 * Validate a single local context entry
 * Returns ValidationIssue if problems found, null if valid
 */
export async function validateLocalContextEntry(
  projectRoot: string,
  targetPath: string,
  entry: LocalContextEntry
): Promise<ValidationIssue | null> {
  const checks: ValidationCheck[] = [];
  const contextAbsPath = path.join(projectRoot, entry.source);
  const targetAbsPath = path.join(projectRoot, targetPath.replace(/^\//, ''));

  // Check 1: Context file existence
  const contextExists = await fileExists(contextAbsPath);
  if (!contextExists) {
    checks.push({
      type: 'existence',
      passed: false,
      code: 'E102',
      message: `Context file not found: ${entry.source}`,
      suggestion: 'Remove entry from registry or restore file',
    });
    return {
      contextPath: entry.source,
      targetPath,
      status: 'error',
      checks,
    };
  }

  // Check 2: Schema validation
  try {
    const content = await fs.readFile(contextAbsPath, 'utf-8');
    const parsed = parseContextFile(entry.source, content);
    const schemaValidation = validateContextFile(parsed);

    if (!schemaValidation.valid) {
      checks.push({
        type: 'schema',
        passed: false,
        code: 'E001',
        message: `Schema validation failed: ${schemaValidation.errors.join(', ')}`,
        suggestion: 'Fix required fields in context file',
      });
      return {
        contextPath: entry.source,
        targetPath,
        status: 'error',
        checks,
      };
    }

    checks.push({ type: 'schema', passed: true });
  } catch (error) {
    checks.push({
      type: 'schema',
      passed: false,
      code: 'E003',
      message: `Failed to parse context file: ${error}`,
      suggestion: 'Check YAML/Markdown syntax',
    });
    return {
      contextPath: entry.source,
      targetPath,
      status: 'error',
      checks,
    };
  }

  // Check 3: Target file existence (warning only)
  const targetExists = await fileExists(targetAbsPath);
  if (!targetExists) {
    checks.push({
      type: 'existence',
      passed: false,
      code: 'W101',
      message: `Target file not found: ${targetPath}`,
      suggestion: 'Target file may have been moved or deleted',
    });
    return {
      contextPath: entry.source,
      targetPath,
      status: 'warning',
      checks,
    };
  }

  checks.push({ type: 'existence', passed: true });

  // Check 4: Context file checksum
  const currentContextChecksum = await computeFileChecksum(contextAbsPath);
  if (currentContextChecksum !== entry.checksum) {
    checks.push({
      type: 'checksum',
      passed: false,
      code: 'W201',
      message: 'Context file has changed since last sync',
      suggestion: 'Run `ctx sync` to update registry',
    });
    return {
      contextPath: entry.source,
      targetPath,
      status: 'warning',
      checks,
    };
  }

  // Check 5: Target file checksum
  const currentTargetChecksum = await computeFileChecksum(targetAbsPath);
  if (currentTargetChecksum !== entry.target_checksum) {
    checks.push({
      type: 'checksum',
      passed: false,
      code: 'W202',
      message: 'Target file has changed since last sync',
      suggestion: 'Review changes and update context if needed, then run `ctx sync`',
    });
    return {
      contextPath: entry.source,
      targetPath,
      status: 'warning',
      checks,
    };
  }

  checks.push({ type: 'checksum', passed: true });

  // All checks passed
  return null;
}

/**
 * Validate a single global context entry
 * Returns ValidationIssue if problems found, null if valid
 */
export async function validateGlobalContextEntry(
  projectRoot: string,
  documentPath: string,
  entry: GlobalContextEntry
): Promise<ValidationIssue | null> {
  const checks: ValidationCheck[] = [];
  const contextAbsPath = path.join(projectRoot, entry.source);

  // Check 1: Context file existence
  const contextExists = await fileExists(contextAbsPath);
  if (!contextExists) {
    checks.push({
      type: 'existence',
      passed: false,
      code: 'E102',
      message: `Document file not found: ${entry.source}`,
      suggestion: 'Remove entry from registry or restore file',
    });
    return {
      contextPath: entry.source,
      status: 'error',
      checks,
    };
  }

  // Check 2: Schema validation (frontmatter)
  try {
    const content = await fs.readFile(contextAbsPath, 'utf-8');
    const parsed = parseContextFile(entry.source, content);
    const schemaValidation = validateContextFile(parsed);

    if (!schemaValidation.valid) {
      checks.push({
        type: 'schema',
        passed: false,
        code: 'E001',
        message: `Schema validation failed: ${schemaValidation.errors.join(', ')}`,
        suggestion: 'Fix frontmatter fields in document',
      });
      return {
        contextPath: entry.source,
        status: 'error',
        checks,
      };
    }

    checks.push({ type: 'schema', passed: true });
  } catch (error) {
    checks.push({
      type: 'schema',
      passed: false,
      code: 'E003',
      message: `Failed to parse document file: ${error}`,
      suggestion: 'Check Markdown frontmatter syntax',
    });
    return {
      contextPath: entry.source,
      status: 'error',
      checks,
    };
  }

  checks.push({ type: 'existence', passed: true });

  // Check 3: Checksum
  const currentChecksum = await computeFileChecksum(contextAbsPath);
  if (currentChecksum !== entry.checksum) {
    checks.push({
      type: 'checksum',
      passed: false,
      code: 'W201',
      message: 'Document has changed since last sync',
      suggestion: 'Run `ctx sync` to update registry',
    });
    return {
      contextPath: entry.source,
      status: 'warning',
      checks,
    };
  }

  checks.push({ type: 'checksum', passed: true });

  // All checks passed
  return null;
}
