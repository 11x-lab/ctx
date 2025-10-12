import YAML from 'yaml';
import matter from 'gray-matter';
import { ContextFile, ContextPreview } from './types.js';

/**
 * Parse YAML content into ContextFile
 */
export function parseContextFile(content: string): ContextFile {
  try {
    const parsed = YAML.parse(content);
    return parsed as ContextFile;
  } catch (error) {
    throw new Error(`Failed to parse context YAML: ${error}`);
  }
}

/**
 * Validate that a context file has required fields
 */
export function validateContextFile(context: ContextFile): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check meta
  if (!context.meta) {
    errors.push('Missing required field: meta');
  } else {
    if (!context.meta.version) {
      errors.push('Missing required field: meta.version');
    }
    if (!context.meta.target) {
      errors.push('Missing required field: meta.target');
    }
  }

  // Check what
  if (!context.what || context.what.trim() === '') {
    errors.push('Missing required field: what');
  }

  // Check when
  if (!context.when || !Array.isArray(context.when) || context.when.length === 0) {
    errors.push('Missing or empty required field: when');
  }

  // Check not_when
  if (
    !context.not_when ||
    !Array.isArray(context.not_when) ||
    context.not_when.length === 0
  ) {
    errors.push('Missing or empty required field: not_when');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract preview from local context file (YAML)
 */
export function extractPreviewFromLocal(context: ContextFile): ContextPreview {
  return {
    what: context.what,
    when: context.when,
    not_when: context.not_when,
  };
}

/**
 * Parse frontmatter from markdown and extract preview
 */
export function extractPreviewFromGlobal(markdown: string): ContextPreview | null {
  try {
    const { data } = matter(markdown);

    // Validate required fields
    if (!data.when || !Array.isArray(data.when) || data.when.length === 0) {
      return null;
    }
    if (!data.what || typeof data.what !== 'string' || data.what.trim() === '') {
      return null;
    }

    return {
      what: data.what,
      when: data.when,
      not_when: data.not_when || undefined,
    };
  } catch (error) {
    return null;
  }
}
