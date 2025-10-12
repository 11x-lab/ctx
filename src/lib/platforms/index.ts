import { Platform } from './types.js';
import { ClaudeCodePlatform } from './claudeCode.js';

/**
 * Platform registry
 * Maps platform IDs to their implementations
 */
const platforms: Record<string, () => Platform> = {
  'claude-code': () => new ClaudeCodePlatform(),
  // Future platforms:
  // 'cursor': () => new CursorPlatform(),
  // 'windsurf': () => new WindsurfPlatform(),
};

/**
 * Get a platform instance by ID
 * @param platformId - Platform identifier (e.g., 'claude-code')
 * @returns Platform instance
 * @throws Error if platform is not supported
 */
export function getPlatform(platformId: string): Platform {
  const factory = platforms[platformId];

  if (!factory) {
    const available = Object.keys(platforms).join(', ');
    throw new Error(
      `Unsupported platform: ${platformId}. Available platforms: ${available}`
    );
  }

  return factory();
}

/**
 * Get list of supported platform IDs
 */
export function getSupportedPlatforms(): string[] {
  return Object.keys(platforms);
}

/**
 * Check if a platform is supported
 */
export function isPlatformSupported(platformId: string): boolean {
  return platformId in platforms;
}

// Re-export types
export type { Platform } from './types.js';
