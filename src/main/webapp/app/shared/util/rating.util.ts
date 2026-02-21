/**
 * Utility functions for rating conversions
 */

/**
 * Converts a Likert scale rating (-2 to +2) to a standard 1-5 rating scale.
 * This is used for displaying ratings to users in a more familiar format.
 *
 * Mapping:
 * -2 → 1 (Poor)
 * -1 → 2 (Fair)
 *  0 → 3 (Satisfactory)
 *  1 → 4 (Good)
 *  2 → 5 (Excellent)
 *
 * @param likertRating - The rating on the Likert scale (-2 to +2), can be null/undefined
 * @returns The converted rating on a 1-5 scale, or undefined if input is null/undefined
 */
export function convertLikertToStandardRating(likertRating: number | null | undefined): number | undefined {
  if (likertRating === null || likertRating === undefined) {
    return undefined;
  }

  // Convert -2 to +2 scale to 1-5 scale by adding 3
  return likertRating + 3;
}

/**
 * Formats a rating value for display, showing one decimal place.
 *
 * @param rating - The rating value to format
 * @returns Formatted rating string (e.g., "4.5") or undefined
 */
export function formatRating(rating: number | undefined): string | undefined {
  if (rating === undefined) {
    return undefined;
  }

  return rating.toFixed(1);
}
