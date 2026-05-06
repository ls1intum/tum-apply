import {
  AccountCredentialResponse,
  AccountCredentialTypeResponse,
  KeycloakRealmKind,
  getErrorMessage,
  getFirstNonEmptyString,
  getRealmEndpoint,
  persistPendingRealm,
} from './keycloak-authentication.utils';
import { PasskeyCredentialSummary } from './models/auth.model';

const PASSKEY_CREDENTIAL_TYPES = new Set(['webauthn-passwordless', 'webauthn']);

interface PasskeyChallengeResponse {
  challenge?: string;
  error?: string;
}

interface PasskeyManagerDependencies {
  pendingRealmStorageKey: string;
  keycloakUrl: string;
  getRealmName: (_realmKind: KeycloakRealmKind) => string;
  clientId: string;
  relyingPartyId: string;
  ensureFreshToken: () => Promise<void>;
  getToken: () => string | undefined;
  getTokenParsed: () => Record<string, unknown>;
  canManagePasskeys: () => boolean;
  requireActiveRealmKind: () => KeycloakRealmKind;
  refreshKeycloakSessionFromBrowser: () => Promise<void>;
}

export class KeycloakPasskeyManager {
  constructor(private readonly deps: PasskeyManagerDependencies) {
    this.deps = deps;
  }

  async loginWithPasskey(): Promise<void> {
    this.assertPasskeySupport();
    persistPendingRealm(this.deps.pendingRealmStorageKey, KeycloakRealmKind.Tum);
    const challenge = await this.getPasskeyChallenge(KeycloakRealmKind.Tum);
    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: this.fromBase64Url(challenge.challenge),
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

    const authenticateResponse = await fetch(this.getPasskeyEndpoint('authenticate', KeycloakRealmKind.Tum), {
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

    await this.deps.refreshKeycloakSessionFromBrowser();
  }

  async registerPasskey(): Promise<void> {
    this.assertPasskeySupport();
    this.assertPasskeyManagementAvailable();

    const token = await this.getAuthenticatedToken();
    const claims = this.deps.getTokenParsed();
    const userId = getFirstNonEmptyString([claims.sub]) ?? '';
    const username = getFirstNonEmptyString([claims.preferred_username, claims.email, userId]) ?? '';
    const displayName = getFirstNonEmptyString([claims.name, username]) ?? username;

    if (userId === '' || username === '') {
      throw new Error('Missing user identity claims for passkey registration');
    }

    const userIdBytes = new TextEncoder().encode(userId);
    if (userIdBytes.length > 64) {
      throw new Error('User id is too long for WebAuthn user.id');
    }

    const realmKind = this.deps.requireActiveRealmKind();
    const challenge = await this.getPasskeyChallenge(realmKind);
    const credential =
      (await navigator.credentials.create({
        publicKey: {
          challenge: this.fromBase64Url(challenge.challenge),
          rp: { name: 'TUM AET', id: this.getRelyingPartyId() },
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

    const saveResponse = await fetch(this.getPasskeyEndpoint('save', realmKind), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
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

  async listPasskeys(): Promise<PasskeyCredentialSummary[]> {
    this.assertPasskeyManagementAvailable();
    const token = await this.getAuthenticatedToken();
    const realmKind = this.deps.requireActiveRealmKind();
    const response = await fetch(this.getAccountCredentialsEndpoint(realmKind), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as
      | AccountCredentialTypeResponse[]
      | { credentials?: AccountCredentialResponse[]; error?: string };

    if (!response.ok) {
      const payloadError = !Array.isArray(payload) ? payload.error : undefined;
      throw new Error(getErrorMessage(payloadError, `Failed to load passkeys: ${response.status}`));
    }

    const credentials = this.extractPasskeyCredentials(payload);
    const summaries: PasskeyCredentialSummary[] = [];
    for (const credential of credentials) {
      const id = credential.id?.trim() ?? '';
      if (id !== '') {
        const summary: PasskeyCredentialSummary = { id };
        const label = credential.name ?? credential.userLabel;
        if (typeof label === 'string') {
          summary.label = label;
        }
        if (typeof credential.createdDate === 'number') {
          summary.createdDate = credential.createdDate;
        }
        summaries.push(summary);
      }
    }
    return summaries;
  }

  async removePasskey(id: string): Promise<void> {
    this.assertPasskeyManagementAvailable();
    const token = await this.getAuthenticatedToken();
    const realmKind = this.deps.requireActiveRealmKind();
    const response = await fetch(`${this.getAccountCredentialsEndpoint(realmKind)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      throw new Error(getErrorMessage(payload.error, `Failed to remove passkey: ${response.status}`));
    }
  }

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

  private async getAuthenticatedToken(): Promise<string> {
    await this.deps.ensureFreshToken();
    const token = this.deps.getToken();
    if (token === undefined || token.trim() === '') {
      throw new Error('Keycloak user is not authenticated');
    }
    return token;
  }

  private assertPasskeySupport(): void {
    if (typeof PublicKeyCredential === 'undefined') {
      throw new Error('Passkeys are not supported in this browser');
    }
  }

  private assertPasskeyManagementAvailable(): void {
    if (!this.deps.canManagePasskeys()) {
      throw new Error('Passkeys can only be managed for TUM Keycloak sessions');
    }
  }

  private extractPasskeyCredentials(
    payload: AccountCredentialTypeResponse[] | { credentials?: AccountCredentialResponse[]; error?: string },
  ): AccountCredentialResponse[] {
    if (!Array.isArray(payload)) {
      return payload.credentials ?? [];
    }

    const credentials: AccountCredentialResponse[] = [];
    for (const credentialType of payload) {
      const type = (credentialType.type ?? '').toLowerCase();
      if (!PASSKEY_CREDENTIAL_TYPES.has(type)) {
        continue;
      }
      for (const metadata of credentialType.userCredentialMetadatas ?? []) {
        if (metadata.credential instanceof Object) {
          credentials.push(metadata.credential);
        }
      }
    }
    return credentials;
  }

  private toBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private fromBase64Url(value: string): ArrayBuffer {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return Uint8Array.from(atob(padded), character => character.charCodeAt(0)).buffer;
  }

  private getAccountCredentialsEndpoint(realmKind: KeycloakRealmKind): string {
    return getRealmEndpoint(this.deps.keycloakUrl, this.deps.getRealmName(realmKind), 'account/credentials');
  }

  private getRelyingPartyId(): string {
    const relyingPartyId = this.deps.relyingPartyId;
    return relyingPartyId.trim() !== '' ? relyingPartyId : window.location.hostname;
  }

  private getPasskeyEndpoint(path: string, realmKind: KeycloakRealmKind): string {
    return getRealmEndpoint(
      this.deps.keycloakUrl,
      this.deps.getRealmName(realmKind),
      `passkey/${encodeURIComponent(this.deps.clientId)}/${path}`,
    );
  }
}
