import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ContextType = 'local' | 'global';

export interface TemplateData {
  targetPath?: string;
  documentTitle?: string;
  [key: string]: string | undefined;
}

/**
 * Load a template file by context type and template type
 * @param contextType - 'local' or 'global'
 * @param templateType - Template variant (currently only 'default' is supported)
 *
 * Template loading priority:
 * 1. Check project's global directory templates/ (user-customized)
 * 2. Fallback to package's dist/templates/ (default)
 */
export async function loadTemplate(
  contextType: ContextType = 'local',
  templateType: string = 'default'
): Promise<string> {
  const templateFileName = contextType === 'global'
    ? 'global-context.md'
    : 'local-context.md';

  // Load config to get global directory
  const projectRoot = process.cwd();
  const config = await loadConfig(projectRoot);

  // Try project-local template first (e.g., ctx/templates/ or docs/templates/)
  const projectTemplatePath = path.join(projectRoot, config.global.directory, 'templates', templateFileName);

  try {
    const content = await fs.readFile(projectTemplatePath, 'utf-8');
    return content;
  } catch (error) {
    // Fallback to package template (dist/templates/)
    const packageTemplatePath = path.join(__dirname, '..', 'templates', templateFileName);

    try {
      const content = await fs.readFile(packageTemplatePath, 'utf-8');
      return content;
    } catch (fallbackError) {
      throw new Error(`Failed to load ${contextType} template '${templateType}': ${fallbackError}`);
    }
  }
}

/**
 * Render a template by replacing placeholders with actual data
 * Simple placeholder replacement: {{PLACEHOLDER}} -> value
 */
export function renderTemplate(template: string, data: TemplateData): string {
  let rendered = template;

  // Replace {{TARGET_PATH}} with actual target path (for local contexts)
  if (data.targetPath) {
    rendered = rendered.replace(/\{\{TARGET_PATH\}\}/g, data.targetPath);
  }

  // Replace {{DOCUMENT_TITLE}} with document title (for global contexts)
  if (data.documentTitle) {
    rendered = rendered.replace(/\{\{DOCUMENT_TITLE\}\}/g, data.documentTitle);
  }

  // Replace any other placeholders
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'targetPath' && key !== 'documentTitle' && value !== undefined) {
      const placeholder = new RegExp(`\\{\\{${key.toUpperCase()}\\}\\}`, 'g');
      rendered = rendered.replace(placeholder, value);
    }
  }

  return rendered;
}

/**
 * Get the AI commands template directory path
 */
export function getAICommandsTemplateDir(): string {
  return path.join(__dirname, '..', 'templates', 'ai-commands');
}

/**
 * Get list of all AI command templates
 */
export async function getAICommandTemplates(): Promise<string[]> {
  const templatesDir = getAICommandsTemplateDir();

  try {
    const files = await fs.readdir(templatesDir);
    return files.filter(f => f.endsWith('.md'));
  } catch (error) {
    throw new Error(`Failed to read AI command templates: ${error}`);
  }
}

/**
 * Load a specific AI command template by name
 */
export async function loadAICommandTemplate(commandName: string): Promise<string> {
  const templatePath = path.join(getAICommandsTemplateDir(), commandName);

  try {
    const content = await fs.readFile(templatePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to load AI command template '${commandName}': ${error}`);
  }
}
