import YAML from 'yaml';
import matter from 'gray-matter';
import path from 'path';
import { ContextFile, ContextPreview } from './types.js';

/**
 * Parse context file content into ContextFile
 * Supports both YAML (.yml) and Markdown (.md) formats
 */
export function parseContextFile(filepath: string, content: string): ContextFile {
  const ext = path.extname(filepath).toLowerCase();

  // Markdown format with frontmatter
  if (ext === '.md' || ext === '.markdown') {
    return parseMarkdownContext(content);
  }

  // Legacy YAML format (for backwards compatibility)
  if (ext === '.yml' || ext === '.yaml') {
    return parseYAMLContext(content);
  }

  throw new Error(`Unsupported context file format: ${ext}`);
}

/**
 * Parse markdown file with frontmatter
 */
function parseMarkdownContext(content: string): ContextFile {
  try {
    const { data, content: body } = matter(content);

    return {
      meta: {
        version: data.version || '1.0.0',
        target: data.target, // Optional: explicitly specified target
      },
      frontmatter: {
        what: data.what || '',
        when: data.when || [],
        not_when: data.not_when,
        future: data.future,
      },
      content: body.trim(),
    };
  } catch (error) {
    throw new Error(`Failed to parse markdown context: ${error}`);
  }
}

/**
 * Parse legacy YAML format
 */
function parseYAMLContext(content: string): ContextFile {
  try {
    const parsed = YAML.parse(content);

    return {
      meta: {
        version: parsed.meta?.version || '1.0.0',
        target: parsed.meta?.target,
      },
      frontmatter: {
        what: parsed.what || '',
        when: parsed.when || [],
        not_when: parsed.not_when,
        future: parsed.future,
      },
      content: '', // YAML format has no body content
    };
  } catch (error) {
    throw new Error(`Failed to parse YAML context: ${error}`);
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
    // Note: meta.target is optional (can be inferred from filename)
  }

  // Check frontmatter.what
  if (!context.frontmatter?.what || context.frontmatter.what.trim() === '') {
    errors.push('Missing required field: what');
  }

  // Check frontmatter.when
  if (!context.frontmatter?.when || !Array.isArray(context.frontmatter.when) || context.frontmatter.when.length === 0) {
    errors.push('Missing or empty required field: when');
  }

  // not_when is optional

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract preview from context file (for registry)
 */
export function extractPreviewFromLocal(context: ContextFile): ContextPreview {
  return {
    what: context.frontmatter.what,
    when: context.frontmatter.when,
    not_when: context.frontmatter.not_when,
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
