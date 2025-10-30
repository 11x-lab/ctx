/**
 * String concatenation utilities
 */

/**
 * Concatenates multiple strings with a separator
 */
export function concat(...strings: string[]): string {
  return strings.join('');
}

/**
 * Joins strings with a specified separator
 */
export function join(separator: string, ...strings: string[]): string {
  return strings.join(separator);
}

/**
 * Concatenates strings with spaces
 */
export function concatWithSpace(...strings: string[]): string {
  return strings.join(' ');
}

/**
 * Concatenates strings with a newline
 */
export function concatWithNewline(...strings: string[]): string {
  return strings.join('\n');
}

/**
 * Formats a template string with values
 */
export function template(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
    template
  );
}
