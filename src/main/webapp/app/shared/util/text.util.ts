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
