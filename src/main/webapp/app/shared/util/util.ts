/**
 * Trims a website URL to show only the domain name
 * @param url The full URL to trim
 * @returns The domain name (e.g., "tum.de" from "https://www.tum.de/...")
 */
export function trimWebsiteUrl(url: string): string {
  if (!url) return '';

  try {
    let trimmedUrl = url.replace(/^https?:\/\//, '');

    trimmedUrl = trimmedUrl.replace(/^www\./, '');

    trimmedUrl = trimmedUrl.split('/')[0].split('?')[0].split('#')[0];

    return trimmedUrl;
  } catch {
    return url;
  }
}
