/**
 * Extracts plain text from an HTML string.
 * Removes any tags and trims whitespace.
 *
 * @param htmlText - The HTML string to extract text from
 * @returns The plain text content, or an empty string if none found
 */
export function extractTextFromHtml(htmlText: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = htmlText;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return temp.textContent?.trim() ?? temp.innerText.trim() ?? '';
}

/**
 * Formats an enum constant into a human-readable string.
 * Converts underscore-separated uppercase words to title case.
 * For example, "APPLICANT_FOUND" becomes "Applicant Found".
 *
 * @param value - The enum value to format
 * @returns The formatted string, or an empty string if null/undefined
 */
export function formatEnumValue(value: string | undefined | null): string {
  if (!value) {
    return '';
  }
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
