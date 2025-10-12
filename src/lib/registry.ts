import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import { LocalContextRegistry, GlobalContextRegistry } from './types.js';

const LOCAL_REGISTRY_FILE = 'local-context-registry.yml';
const GLOBAL_REGISTRY_FILE = 'global-context-registry.yml';

/**
 * Get path to local registry file
 */
export function getLocalRegistryPath(projectRoot: string): string {
  return path.join(projectRoot, 'ctx', LOCAL_REGISTRY_FILE);
}

/**
 * Get path to global registry file
 */
export function getGlobalRegistryPath(projectRoot: string): string {
  return path.join(projectRoot, 'ctx', GLOBAL_REGISTRY_FILE);
}

/**
 * Read local registry
 */
export async function readLocalRegistry(projectRoot: string): Promise<LocalContextRegistry> {
  const registryPath = getLocalRegistryPath(projectRoot);

  try {
    const content = await fs.readFile(registryPath, 'utf-8');
    return YAML.parse(content) as LocalContextRegistry;
  } catch (error) {
    // Return empty registry if file doesn't exist
    return {
      meta: {
        version: '1.0.0',
        last_synced: new Date().toISOString(),
      },
      contexts: {},
    };
  }
}

/**
 * Write local registry
 */
export async function writeLocalRegistry(
  projectRoot: string,
  registry: LocalContextRegistry
): Promise<void> {
  const registryPath = getLocalRegistryPath(projectRoot);

  // Update last_synced
  registry.meta.last_synced = new Date().toISOString();

  const yamlContent = YAML.stringify(registry);
  await fs.writeFile(registryPath, yamlContent, 'utf-8');
}

/**
 * Read global registry
 */
export async function readGlobalRegistry(projectRoot: string): Promise<GlobalContextRegistry> {
  const registryPath = getGlobalRegistryPath(projectRoot);

  try {
    const content = await fs.readFile(registryPath, 'utf-8');
    return YAML.parse(content) as GlobalContextRegistry;
  } catch (error) {
    // Return empty registry if file doesn't exist
    return {
      meta: {
        version: '1.0.0',
        last_synced: new Date().toISOString(),
      },
      contexts: {},
      folders: {},
    };
  }
}

/**
 * Write global registry
 */
export async function writeGlobalRegistry(
  projectRoot: string,
  registry: GlobalContextRegistry
): Promise<void> {
  const registryPath = getGlobalRegistryPath(projectRoot);

  // Update last_synced
  registry.meta.last_synced = new Date().toISOString();

  const yamlContent = YAML.stringify(registry);
  await fs.writeFile(registryPath, yamlContent, 'utf-8');
}
