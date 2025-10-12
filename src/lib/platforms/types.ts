/**
 * Platform abstraction for AI-assisted editors
 * Supports different editors with their own command systems
 */
export interface Platform {
  /** Platform name */
  readonly name: string;

  /** Platform identifier (e.g., 'claude-code', 'cursor') */
  readonly id: string;

  /**
   * Install AI commands for this platform
   * Creates necessary directories and copies command templates
   */
  install(): Promise<void>;

  /**
   * Check if AI commands are installed for this platform
   */
  isInstalled(): Promise<boolean>;

  /**
   * Get the directory where commands are installed
   */
  getCommandsDir(): string;

  /**
   * Update existing AI commands from templates
   * Returns number of updated commands
   */
  update(): Promise<number>;
}

/**
 * Platform configuration
 */
export interface PlatformConfig {
  id: string;
  name: string;
  commandsDir: string; // Relative to project root
}
