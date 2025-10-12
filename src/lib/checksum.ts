import crypto from 'crypto';
import fs from 'fs/promises';

/**
 * Compute MD5 checksum of a string
 */
export function computeChecksum(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Compute MD5 checksum of a file
 */
export async function computeFileChecksum(filepath: string): Promise<string> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return computeChecksum(content);
  } catch (error) {
    throw new Error(`Failed to compute checksum for ${filepath}: ${error}`);
  }
}
