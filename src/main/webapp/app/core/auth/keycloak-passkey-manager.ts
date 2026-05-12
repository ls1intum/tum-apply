import {
  KeycloakRealmKind,
  getErrorMessage,
  getFirstNonEmptyString,
  getRealmEndpoint,
  persistPendingRealm,
} from './keycloak-authentication.utils';
import { PasskeyCredentialSummary } from './models/auth.model';

interface PasskeyDTO {
  id?: string;
  label?: string;
  createdDate?: number;
}

interface PasskeyChallengeResponse {
  challenge?: string;
  error?: string;
}

interface PasskeyActionTokenResponse {
  realm?: string;
  clientId?: string;
  accessToken?: string;
  expiresIn?: number;
}

/**
 * Runtime dependencies required by {@link KeycloakPasskeyManager}.
 *
 * The manager is intentionally framework-agnostic and receives all external
 * interactions (token/session/user context) through this contract.
 */
interface PasskeyManagerDependencies {
  pendingRealmStorageKey: string;
  keycloakUrl: string;
  tumRealmName: string;
  externalRealmName: string;
  clientId: string;
  relyingPartyId: string;
  externalRelyingPartyId: string;
  getTokenParsed: () => Record<string, unknown>;
  canManagePasskeys: () => boolean;
  getPasskeyUserIdentity: () => { id: string; username: string; displayName: string } | undefined;
  listPasskeys: () => Promise<PasskeyDTO[]>;
  removePasskey: (id: string) => Promise<void>;
  createPasskeyActionToken: () => Promise<PasskeyActionTokenResponse>;
}

/**
 * Drives the passkey lifecycle against Keycloak (login, registration, listing, removal) by orchestrating WebAuthn calls
 * with the credential challenge / verify endpoints. Framework-agnostic: collaborates with the surrounding service via
 * the injected {@link PasskeyManagerDependencies} contract instead of accessing Angular state directly.
 */
export class KeycloakPasskeyManager {
  constructor(private readonly deps: PasskeyManagerDependencies) {
    this.deps = deps;
  }

  /**
   * Performs passkey login against the provided realm.
   *
   * Flow:
   * 1) Request challenge from Keycloak custom passkey endpoint
   * 2) Use WebAuthn `navigator.credentials.get`
   * 3) Send assertion back to Keycloak
   * 4) Refresh Keycloak browser session/tokens
   *
   * @throws Error if WebAuthn is unsupported, assertion is incomplete,
   * or Keycloak challenge/authenticate endpoints fail.
   */
  async loginWithPasskey(realmKind: KeycloakRealmKind): Promise<void> {
    this.assertPasskeySupport();
    persistPendingRealm(this.deps.pendingRealmStorageKey, realmKind);
    const challenge = await this.getPasskeyChallenge(realmKind);
    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: this.fromBase64Url(challenge.challenge),
      rpId: this.getRelyingPartyIdForRealm(realmKind),
      userVerification: 'required',
    };

    const assertion =
      (await navigator.credentials.get({
        publicKey,
      })) ?? undefined;

    if (!(assertion instanceof PublicKeyCredential)) {
      throw new Error('Incomplete passkey authentication assertion');
    }

    const response = assertion.response;
    if (!(response instanceof AuthenticatorAssertionResponse)) {
      throw new Error('Incomplete passkey authentication assertion');
    }

    if (!response.userHandle) {
      throw new Error('Passkey did not return a user handle');
    }

    const authenticateResponse = await fetch(this.getPasskeyEndpoint('authenticate', realmKind), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        credentialId: this.toBase64Url(assertion.rawId),
        userHandle: this.toBase64Url(response.userHandle),
        clientDataJSON: this.toBase64Url(response.clientDataJSON),
        authenticatorData: this.toBase64Url(response.authenticatorData),
        signature: this.toBase64Url(response.signature),
        challenge: challenge.challenge,
      }),
    });

    if (authenticateResponse.status !== 204) {
      const authenticatePayload = (await authenticateResponse.json().catch(() => ({}))) as { error?: string };
      throw new Error(getErrorMessage(authenticatePayload.error, `Passkey auth failed: ${authenticateResponse.status}`));
    }
  }

  /**
   * Registers a new passkey for the currently authenticated Keycloak user.
   *
   * Requires a valid authenticated app session and user identity claims.
   *
   * @throws Error if identity claims are missing/invalid, WebAuthn fails,
   * or Keycloak save endpoint rejects the registration.
   */
  async registerPasskey(): Promise<void> {
    this.assertPasskeySupport();
    this.assertPasskeyManagementAvailable();

    const claims = this.deps.getTokenParsed();
    const fallbackIdentity = this.deps.getPasskeyUserIdentity();
    const userId = getFirstNonEmptyString([claims.sub, fallbackIdentity?.id]) ?? '';
    const username = getFirstNonEmptyString([claims.preferred_username, claims.email, fallbackIdentity?.username, userId]) ?? '';
    const displayName = getFirstNonEmptyString([claims.name, fallbackIdentity?.displayName, username]) ?? username;
    const relyingPartyName = this.getRelyingPartyName(claims);
    const relyingPartyId = this.getRelyingPartyIdForClaims(claims);

    if (userId === '' || username === '') {
      throw new Error('Missing user identity claims for passkey registration');
    }

    const userIdBytes = new TextEncoder().encode(userId);
    if (userIdBytes.length > 64) {
      throw new Error('User id is too long for WebAuthn user.id');
    }

    const actionToken = await this.getPasskeyActionToken();
    const challenge = await this.getDirectPasskeyChallenge(actionToken);
    const credential =
      (await navigator.credentials.create({
        publicKey: {
          challenge: this.fromBase64Url(challenge.challenge),
          rp: { name: relyingPartyName, id: relyingPartyId },
          user: { id: userIdBytes, name: username, displayName },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
          attestation: 'none',
        },
      })) ?? undefined;

    if (!(credential instanceof PublicKeyCredential)) {
      throw new Error('Incomplete passkey registration credential');
    }

    const response = credential.response;
    if (!(response instanceof AuthenticatorAttestationResponse)) {
      throw new Error('Incomplete passkey registration credential');
    }

    const saveResponse = await fetch(this.getPasskeyEndpointForRealmName(actionToken.realm, actionToken.clientId, 'save'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${actionToken.accessToken}`,
      },
      body: JSON.stringify({
        deviceName: this.getDeviceName(),
        credentialId: this.toBase64Url(credential.rawId),
        clientDataJSON: this.toBase64Url(response.clientDataJSON),
        attestationObject: this.toBase64Url(response.attestationObject),
        challenge: challenge.challenge,
      }),
    });

    if (!saveResponse.ok) {
      const responseText = await saveResponse.text();
      throw new Error(responseText.trim() !== '' ? responseText : `Passkey save failed: ${saveResponse.status}`);
    }
  }

  /**
   * Lists passkey credentials registered to the current account.
   */
  async listPasskeys(): Promise<PasskeyCredentialSummary[]> {
    this.assertPasskeyManagementAvailable();
    const credentials = await this.deps.listPasskeys();
    const summaries: PasskeyCredentialSummary[] = [];
    for (const credential of credentials) {
      const id = credential.id?.trim() ?? '';
      if (id !== '') {
        const summary: PasskeyCredentialSummary = { id };
        if (typeof credential.label === 'string') {
          summary.label = credential.label;
        }
        if (typeof credential.createdDate === 'number') {
          summary.createdDate = credential.createdDate;
        }
        summaries.push(summary);
      }
    }
    return summaries;
  }

  /**
   * Removes a passkey credential by id from the active Keycloak account.
   *
   * @param id credential identifier as returned by {@link listPasskeys}
   * @throws Error if deletion fails at Keycloak.
   */
  async removePasskey(id: string): Promise<void> {
    this.assertPasskeyManagementAvailable();
    await this.deps.removePasskey(id);
  }

  /**
   * Fetches a WebAuthn challenge from Keycloak passkey endpoint for the
   * specified realm and validates the returned payload shape.
   */
  private async getPasskeyChallenge(
    realmKind: KeycloakRealmKind,
  ): Promise<Required<Pick<PasskeyChallengeResponse, 'challenge'>> & PasskeyChallengeResponse> {
    const response = await fetch(this.getPasskeyEndpoint('challenge', realmKind), {
      credentials: 'include',
    });
    const payload = (await response.json().catch(() => ({}))) as PasskeyChallengeResponse;

    if (!response.ok || typeof payload.challenge !== 'string' || payload.challenge.trim() === '') {
      throw new Error(getErrorMessage(payload.error, `Failed to create passkey challenge: ${response.status}`));
    }

    return {
      challenge: payload.challenge,
      error: payload.error,
    };
  }

  private async getPasskeyActionToken(): Promise<Required<Pick<PasskeyActionTokenResponse, 'realm' | 'clientId' | 'accessToken'>>> {
    const payload = await this.deps.createPasskeyActionToken();

    if (
      typeof payload.realm !== 'string' ||
      payload.realm.trim() === '' ||
      typeof payload.clientId !== 'string' ||
      payload.clientId.trim() === '' ||
      typeof payload.accessToken !== 'string' ||
      payload.accessToken.trim() === ''
    ) {
      throw new Error(getErrorMessage(undefined, 'Failed to create passkey action token'));
    }

    return {
      realm: payload.realm,
      clientId: payload.clientId,
      accessToken: payload.accessToken,
    };
  }

  private async getDirectPasskeyChallenge(
    actionToken: Required<Pick<PasskeyActionTokenResponse, 'realm' | 'clientId' | 'accessToken'>>,
  ): Promise<Required<Pick<PasskeyChallengeResponse, 'challenge'>> & PasskeyChallengeResponse> {
    const response = await fetch(this.getPasskeyEndpointForRealmName(actionToken.realm, actionToken.clientId, 'challenge'), {
      credentials: 'include',
    });
    const payload = (await response.json().catch(() => ({}))) as PasskeyChallengeResponse;

    if (!response.ok || typeof payload.challenge !== 'string' || payload.challenge.trim() === '') {
      throw new Error(getErrorMessage(payload.error, `Failed to create passkey challenge: ${response.status}`));
    }

    return {
      challenge: payload.challenge,
      error: payload.error,
    };
  }

  /** Ensures the runtime environment supports WebAuthn APIs. */
  private assertPasskeySupport(): void {
    if (typeof PublicKeyCredential === 'undefined') {
      throw new Error('Passkeys are not supported in this browser');
    }
  }

  /** Ensures passkey management operations are allowed for the current session. */
  private assertPasskeyManagementAvailable(): void {
    if (!this.deps.canManagePasskeys()) {
      throw new Error('Passkeys can only be managed for authenticated Keycloak sessions');
    }
  }

  /** Converts binary data to base64url encoding (RFC 4648 URL-safe alphabet). */
  private toBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  /** Converts a base64url string into an ArrayBuffer. */
  private fromBase64Url(value: string): ArrayBuffer {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return Uint8Array.from(atob(padded), character => character.charCodeAt(0)).buffer;
  }

  /** Returns configured RP ID for the requested realm, falling back to current hostname. */
  private getRelyingPartyIdForRealm(realmKind: KeycloakRealmKind): string {
    const relyingPartyId = realmKind === KeycloakRealmKind.External ? this.deps.externalRelyingPartyId : this.deps.relyingPartyId;
    return relyingPartyId.trim() !== '' ? relyingPartyId : window.location.hostname;
  }

  private getRelyingPartyIdForClaims(claims: Record<string, unknown>): string {
    const issuer = typeof claims.iss === 'string' ? claims.iss : '';
    const tumRealmMarker = `/realms/${this.deps.tumRealmName}`;
    const realmKind = issuer.includes(tumRealmMarker) ? KeycloakRealmKind.Tum : KeycloakRealmKind.External;
    return this.getRelyingPartyIdForRealm(realmKind);
  }

  private getDeviceName(): string {
    const navigatorWithUaData = navigator as Navigator & {
      userAgentData?: { platform?: string; brands?: { brand?: string }[] };
    };
    // Prefer Client Hints platform, then legacy navigator.platform, then a stable fallback.
    const userAgentDataPlatform = navigatorWithUaData.userAgentData?.platform?.trim() ?? '';
    const navigatorPlatformRaw = (navigator as unknown as Record<string, unknown>).platform;
    const navigatorPlatform = typeof navigatorPlatformRaw === 'string' ? navigatorPlatformRaw.trim() : '';
    const rawPlatform =
      userAgentDataPlatform !== '' ? userAgentDataPlatform : navigatorPlatform !== '' ? navigatorPlatform : 'Unknown Platform';
    // Normalize noisy platform strings to concise labels used in the saved device name.
    const platform = rawPlatform.startsWith('Mac')
      ? 'Mac'
      : rawPlatform.startsWith('Win')
        ? 'Win'
        : rawPlatform.startsWith('Linux')
          ? 'Linux'
          : rawPlatform;

    const brands = navigatorWithUaData.userAgentData?.brands ?? [];
    // Use browser brand hints first; if unavailable, infer from user agent.
    const browserFromBrands =
      brands
        .find(
          entry =>
            entry.brand !== undefined && !(entry.brand.toLowerCase().startsWith('not') && entry.brand.toLowerCase().endsWith('brand')),
        )
        ?.brand?.trim() ?? '';
    const userAgentRaw = (navigator as unknown as Record<string, unknown>).userAgent;
    const userAgent = typeof userAgentRaw === 'string' ? userAgentRaw : '';
    let browser = browserFromBrands;
    if (browser === '') {
      if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('Edg')) {
        browser = 'Edge';
      } else if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
      } else if (userAgent.includes('Safari')) {
        browser = 'Safari';
      } else {
        browser = 'Unknown Browser';
      }
    }

    return `${platform} - ${browser}`;
  }

  /** Returns RP display name based on the authenticated realm. */
  private getRelyingPartyName(claims: Record<string, unknown>): string {
    const issuer = typeof claims.iss === 'string' ? claims.iss : '';
    const tumRealmMarker = `/realms/${this.deps.tumRealmName}`;
    return issuer.includes(tumRealmMarker) ? 'TUM AET' : 'TUM Apply';
  }

  /** Builds a passkey custom-endpoint URL for the given realm and operation path. */
  private getPasskeyEndpoint(path: string, realmKind: KeycloakRealmKind): string {
    return this.getPasskeyEndpointForRealmName(this.getRealmName(realmKind), this.deps.clientId, path);
  }

  private getPasskeyEndpointForRealmName(realmName: string, clientId: string, path: string): string {
    return getRealmEndpoint(this.deps.keycloakUrl, realmName, `passkey/${encodeURIComponent(clientId)}/${path}`);
  }

  /** Resolves realm name from realm kind. */
  private getRealmName(realmKind: KeycloakRealmKind): string {
    return realmKind === KeycloakRealmKind.Tum ? this.deps.tumRealmName : this.deps.externalRealmName;
  }
}
