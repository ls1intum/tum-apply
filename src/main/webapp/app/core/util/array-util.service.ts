/**
 * Utility functions for working with arrays and optional values.
 */

/**
 * Returns undefined if the array is empty, otherwise returns the array itself.
 * Useful for normalizing optional array parameters before sending them to APIs.
 *
 * @param arr the array to check
 * @returns the same array if not empty, otherwise undefined
 */
export function emptyToUndef<T>(arr: T[]): T[] | undefined {
  return arr.length ? arr : undefined;
}
