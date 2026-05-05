export interface AccountCredentialTypeResponse {
  type?: string;
  userCredentialMetadatas?: {
    credential?: {
      id?: string;
      name?: string;
      userLabel?: string;
      createdDate?: number;
    };
  }[];
}

export interface AccountCredentialResponse {
  id?: string;
  name?: string;
  userLabel?: string;
  createdDate?: number;
}

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

export enum KeycloakRealmKind {
  Tum = 'tum',
  External = 'external',
}

const REALM_VALUES: KeycloakRealmKind[] = [KeycloakRealmKind.Tum, KeycloakRealmKind.External];

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

export function getErrorMessage(errorMessage: string | undefined, fallback: string): string {
  return errorMessage !== undefined && errorMessage.trim() !== '' ? errorMessage : fallback;
}

export function persistPendingRealm(storageKey: string, realmKind: KeycloakRealmKind): void {
  sessionStorage.setItem(storageKey, realmKind);
}

export function clearPendingRealm(storageKey: string): void {
  sessionStorage.removeItem(storageKey);
}

export function getPendingRealmKind(storageKey: string): KeycloakRealmKind | undefined {
  return parseRealmKind(sessionStorage.getItem(storageKey) ?? undefined);
}
