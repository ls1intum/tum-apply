/**
 * Returns the first non-empty string value from an arbitrary candidate list.
 */
export function getFirstNonEmptyString(values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        return trimmed;
      }
    }
  }
  return undefined;
}

/**
 * Logical realm kinds used by the frontend auth flow.
 */
export const KeycloakRealmKind = {
  Tum: 'tum',
  External: 'external',
} as const;

export type KeycloakRealmKind = (typeof KeycloakRealmKind)[keyof typeof KeycloakRealmKind];

/** Ordered fallback realms used when no stronger realm hint exists. */
const REALM_VALUES: KeycloakRealmKind[] = [KeycloakRealmKind.Tum, KeycloakRealmKind.External];

/** Parses an unknown realm string into a supported realm kind. */
export function parseRealmKind(value: string | undefined): KeycloakRealmKind | undefined {
  if (value === KeycloakRealmKind.Tum || value === KeycloakRealmKind.External) {
    return value;
  }
  return undefined;
}

/**
 * Builds a safe redirect URI. If the given URI starts with the application origin
 * followed by a path separator, it is returned as-is. Otherwise, only the path
 * portion (starting with `/`) is appended to the origin. External URLs are rejected
 * to prevent open redirect attacks.
 */
export function buildRedirectUri(redirectUri?: string): string {
  const origin = window.location.origin;
  if (redirectUri?.startsWith(origin) === true) {
    const rest = redirectUri.slice(origin.length);
    // Only allow if what follows is a path, query, fragment, or nothing —
    // reject domains that share the origin as a prefix (e.g. origin.evil.com)
    if (rest === '' || rest.startsWith('/') || rest.startsWith('?') || rest.startsWith('#')) {
      return redirectUri;
    }
  }
  return origin + (redirectUri?.startsWith('/') === true ? redirectUri : '/');
}

export function getRealmEndpoint(baseUrl: string, realm: string, path: string): string {
  const authServerUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.replace(/^\/+/, '');
  return new URL(`realms/${encodeURIComponent(realm)}/${normalizedPath}`, authServerUrl).toString();
}

/**
 * Derives realm kind from an issuer URL query parameter by matching known issuer URLs.
 */
export function getRealmFromIssuerParam(
  issuer: string | undefined,
  tumIssuerUrl: string,
  externalIssuerUrl: string,
): KeycloakRealmKind | undefined {
  const normalizedIssuer = issuer?.trim();
  if (normalizedIssuer === undefined || normalizedIssuer === '') {
    return undefined;
  }
  if (normalizedIssuer === tumIssuerUrl) {
    return KeycloakRealmKind.Tum;
  }
  if (normalizedIssuer === externalIssuerUrl) {
    return KeycloakRealmKind.External;
  }
  return undefined;
}

/**
 * Builds realm initialization order using:
 * 1) pending realm from storage
 * 2) realm inferred from issuer parameter
 * 3) deterministic fallback realms
 */
export function getInitRealmCandidates(
  pendingRealm: KeycloakRealmKind | undefined,
  issuerRealm: KeycloakRealmKind | undefined,
): KeycloakRealmKind[] {
  const candidates: KeycloakRealmKind[] = [];
  if (pendingRealm !== undefined) {
    candidates.push(pendingRealm);
  }
  if (issuerRealm !== undefined && !candidates.includes(issuerRealm)) {
    candidates.push(issuerRealm);
  }
  for (const fallback of REALM_VALUES) {
    if (!candidates.includes(fallback)) {
      candidates.push(fallback);
    }
  }
  return candidates;
}

/** Returns a normalized error message, falling back when missing/blank. */
export function getErrorMessage(errorMessage: string | undefined, fallback: string): string {
  return errorMessage !== undefined && errorMessage.trim() !== '' ? errorMessage : fallback;
}

/** Stores the selected realm in sessionStorage for redirect round-trips. */
export function persistPendingRealm(storageKey: string, realmKind: KeycloakRealmKind): void {
  sessionStorage.setItem(storageKey, realmKind);
}

/** Clears any pending realm marker from sessionStorage. */
export function clearPendingRealm(storageKey: string): void {
  sessionStorage.removeItem(storageKey);
}

/** Reads and parses pending realm marker from sessionStorage. */
export function getPendingRealmKind(storageKey: string): KeycloakRealmKind | undefined {
  return parseRealmKind(sessionStorage.getItem(storageKey) ?? undefined);
}
