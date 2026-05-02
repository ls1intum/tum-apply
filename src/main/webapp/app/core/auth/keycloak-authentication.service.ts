import { Injectable, inject } from '@angular/core';
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { environment } from 'app/environments/environment';
import { ToastService } from 'app/service/toast-service';
import { TranslateService } from '@ngx-translate/core';

import { PasskeyCredentialSummary } from './models/auth.model';

export enum IdpProvider {
  Google = 'google',
  Microsoft = 'microsoft',
  Apple = 'apple',
  TUM = 'tum',
}

interface PasskeyChallengeResponse {
  challenge?: string;
  credentialId?: string;
  error?: string;
}

interface AccountCredentialTypeResponse {
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

interface AccountCredentialResponse {
  id?: string;
  name?: string;
  userLabel?: string;
  createdDate?: number;
}

/**
 * Purpose
 * -------
 * Handles all communication from the client to Keycloak for Keycloak‑based authentication and access token lifecycle.
 *
 * Responsibilities
 * ----------------
 * - Initialize the Keycloak client and determine authentication state (SSO/redirect).
 * - Perform login and logout flows (including provider‑specific login and email login).
 * - Keep Keycloak access tokens fresh by scheduling automatic refreshes.
 * - Expose helpers to read the current token, basic user profile, and login state.
 * - Provide safe start/stop controls for the refresh timer.
 *
 * Notes
 * -----
 * - This service deals exclusively with Keycloak; it does not handle server‑issued tokens.
 * - No routing or UI logic; navigation and user loading are handled by the AuthFacade.
 */
@Injectable({ providedIn: 'root' })
export class KeycloakAuthenticationService {
  private static readonly PASSKEY_CREDENTIAL_TYPES = new Set(['webauthn-passwordless', 'webauthn']);

  readonly config = inject(ApplicationConfigService);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly translationKey = 'auth.common.toast';

  private keycloak: Keycloak | undefined;
  private refreshIntervalId: ReturnType<typeof setInterval> | undefined;
  private refreshInFlight: Promise<void> | undefined;
  private windowListenersActive = false;

  /**
   * Initializes the Keycloak client and determines login status.
   * Loads the user profile and starts the token refresh cycle if authenticated.
   *
   * @returns A promise that resolves to true if the user is authenticated, false otherwise.
   */
  async init(): Promise<boolean> {
    this.keycloak ??= new Keycloak({
      url: this.config.keycloak.url,
      realm: this.config.keycloak.realm,
      clientId: this.config.keycloak.clientId,
    });
    const options: KeycloakInitOptions = {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
      checkLoginIframe: true,
      pkceMethod: 'S256',
      enableLogging: environment.keycloak.enableLogging,
    };

    try {
      const authenticated = await this.keycloak.init(options);
      if (!authenticated) {
        console.warn('Keycloak not authenticated.');
        return authenticated;
      }
      this.startTokenRefreshScheduler();
      return authenticated;
    } catch (err) {
      this.toastService.showError({
        summary: this.translate.instant(`${this.translationKey}.error.summary`),
        detail: this.translate.instant(`${this.translationKey}.error.detail`),
      });
      console.error('🔁 Keycloak init failed:', err);
      return false;
    }
  }

  /**
   * Returns the current authentication token.
   *
   * @returns The current token string if available, otherwise undefined.
   */
  getToken(): string | undefined {
    return this.keycloak?.token;
  }

  /**
   * Checks if the user is currently authenticated.
   *
   * @returns True if the user is authenticated, false otherwise.
   */
  isLoggedIn(): boolean {
    return Boolean(this.keycloak?.authenticated);
  }

  // --------------------------- Login ----------------------------

  /**
   * Triggers the Keycloak login flow for a specific identity provider.
   * Optionally redirects to the specified URI after login.
   * Note: The `TUM` provider is for development the default keycloak login
   *
   * @param provider The identity provider to use for login.
   * @param redirectUri Optional URI to redirect to after login. Defaults to the app root.
   */
  async loginWithProvider(provider: IdpProvider, redirectUri?: string): Promise<void> {
    try {
      await this.keycloak?.login({
        redirectUri: this.buildRedirectUri(redirectUri),
        idpHint: provider !== IdpProvider.TUM ? provider : undefined,
      });
      this.startTokenRefreshScheduler();
    } catch (err) {
      this.toastService.showError({
        summary: this.translate.instant(`${this.translationKey}.providerLoginFailed.summary`),
        detail: this.translate.instant(`${this.translationKey}.providerLoginFailed.detail`),
      });
      console.error(`Login with provider ${provider} failed:`, err);
    }
  }

  // --------------------------- Logout ----------------------------

  /**
   * Triggers the Keycloak logout flow.
   * Optionally redirects to the specified URI after logout.
   *
   * @param redirectUri Optional URI to redirect to after logout. Defaults to the app root.
   */
  async logout(redirectUri?: string): Promise<void> {
    this.stopTokenRefreshScheduler();
    if (this.keycloak?.authenticated === true) {
      await this.keycloak.logout({ redirectUri: this.buildRedirectUri(redirectUri) });
    }
  }

  // --------------------------- Passkey ----------------------------

  /**
   * Performs a login flow using WebAuthn passkeys.
   * Optionally redirects to the specified URI after successful login.
   * @param redirectUri Optional URI to redirect to after login. Defaults to the app root.
   */
  async loginWithPasskey(redirectUri?: string): Promise<void> {
    this.assertPasskeySupport();

    const challenge = await this.getPasskeyChallenge();
    const allowCredentialId =
      typeof challenge.credentialId === 'string' && challenge.credentialId.trim() !== '' ? challenge.credentialId : undefined;
    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: this.fromBase64Url(challenge.challenge),
      userVerification: 'preferred',
    };

    if (allowCredentialId !== undefined) {
      publicKey.allowCredentials = [{ type: 'public-key', id: this.fromBase64Url(allowCredentialId) }];
    }

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

    const authenticateResponse = await fetch(this.getPasskeyEndpoint('authenticate'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credentialId: this.toBase64Url(assertion.rawId),
        rawId: this.toBase64Url(assertion.rawId),
        clientDataJSON: this.toBase64Url(response.clientDataJSON),
        authenticatorData: this.toBase64Url(response.authenticatorData),
        signature: this.toBase64Url(response.signature),
        challenge: challenge.challenge,
      }),
    });
    const authenticatePayload = (await authenticateResponse.json().catch(() => ({}))) as { error?: string };

    if (!authenticateResponse.ok) {
      throw new Error(this.getErrorMessage(authenticatePayload.error, `Passkey auth failed: ${authenticateResponse.status}`));
    }

    window.location.replace(this.buildRedirectUri(redirectUri));
  }

  /**
   * Performs a passkey registration flow to add a new passkey credential to the user's account.
   * Requires the user to be authenticated with Keycloak beforehand, as it uses the current session for authorization.
   */
  async registerPasskey(): Promise<void> {
    this.assertPasskeySupport();

    const token = await this.getAuthenticatedToken();
    const claims = (this.keycloak?.tokenParsed ?? {}) as Record<string, unknown>;
    const accountId = this.getFirstNonEmptyString([claims.sub, claims.preferred_username]) ?? '';
    const accountName = this.getFirstNonEmptyString([claims.preferred_username, claims.email]) ?? '';
    const displayName = this.getFirstNonEmptyString([claims.name, accountName]) ?? 'Keycloak User';

    if (accountId === '' || accountName === '') {
      throw new Error('Missing user identity claims for passkey registration');
    }

    const challenge = await this.getPasskeyChallenge();
    const userIdBytes = new Uint8Array(new TextEncoder().encode(accountId).slice(0, 64));
    const credential =
      (await navigator.credentials.create({
        publicKey: {
          challenge: this.fromBase64Url(challenge.challenge),
          rp: { name: 'TUM AET', id: window.location.hostname },
          user: { id: userIdBytes.buffer, name: accountName, displayName },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          authenticatorSelection: { residentKey: 'required', userVerification: 'preferred' },
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

    const saveResponse = await fetch(this.getPasskeyEndpoint('save'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        credentialId: this.toBase64Url(credential.rawId),
        rawId: this.toBase64Url(credential.rawId),
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
   * Fetches the list of registered passkey credentials for the authenticated user.
   *
   * @returns An array of passkey credential summaries.
   */
  async listPasskeys(): Promise<PasskeyCredentialSummary[]> {
    const token = await this.getAuthenticatedToken();
    const response = await fetch(this.getAccountCredentialsEndpoint(), {
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
      throw new Error(this.getErrorMessage(payloadError, `Failed to load passkeys: ${response.status}`));
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

  /**
   * Removes a registered passkey credential from the user's account.
   * @param id
   */
  async removePasskey(id: string): Promise<void> {
    const token = await this.getAuthenticatedToken();
    const response = await fetch(`${this.getAccountCredentialsEndpoint()}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      throw new Error(this.getErrorMessage(payload.error, `Failed to remove passkey: ${response.status}`));
    }
  }

  // --------------------------- Refresh ----------------------------

  /**
   * Ensures the access token is valid for at least x seconds. Otherwise, it attempts to refresh it.
   * If the refresh fails, the user is logged out.
   *
   * @throws An error if the token refresh fails.
   */
  async ensureFreshToken(): Promise<void> {
    if (this.keycloak?.authenticated !== true) {
      return;
    }
    if (this.refreshInFlight !== undefined) {
      return this.refreshInFlight;
    }

    const refreshPromise = Promise.resolve(this.keycloak.updateToken(20));
    this.refreshInFlight = refreshPromise
      .then(() => {})
      .catch(async (e: unknown) => {
        this.toastService.showError({
          summary: this.translate.instant(`${this.translationKey}.refreshTokenFailed.summary`),
          detail: this.translate.instant(`${this.translationKey}.refreshTokenFailed.detail`),
        });
        console.warn('Failed to refresh token, logging out...', e);
        await this.logout();
        throw e;
      })
      .finally(() => {
        this.refreshInFlight = undefined;
      });
    return this.refreshInFlight;
  }

  /**
   * Starts a timer to refresh the session tokens periodically.
   */
  private startTokenRefreshScheduler(): void {
    this.bindWindowListeners();
    if (this.refreshIntervalId !== undefined) {
      return;
    }
    this.refreshIntervalId = setInterval(() => {
      void this.ensureFreshToken();
    }, 15_000);
  }

  /**
   * Cancels any scheduled token refresh schedulers.
   */
  private stopTokenRefreshScheduler(): void {
    this.unbindWindowListeners();
    if (this.refreshIntervalId !== undefined) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = undefined;
    }
  }

  private onVisibilityChange?: () => void = () => {};
  private onFocus?: () => void = () => {};
  private onOnline?: () => void = () => {};

  /** Bind window listeners so a returning user gets a fresh token without being logged out. */
  private bindWindowListeners(): void {
    if (this.windowListenersActive) {
      return;
    }

    this.onVisibilityChange = () => {
      if (!document.hidden) {
        void this.ensureFreshToken();
      }
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.onFocus = () => {
      void this.ensureFreshToken();
    };
    this.onOnline = () => {
      void this.ensureFreshToken();
    };
    window.addEventListener('focus', this.onFocus);
    window.addEventListener('online', this.onOnline);

    this.windowListenersActive = true;
  }

  /** Unbind window listeners; call on logout to avoid leaks. */
  private unbindWindowListeners(): void {
    if (!this.windowListenersActive) {
      return;
    }
    if (this.onVisibilityChange) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    if (this.onFocus) {
      window.removeEventListener('focus', this.onFocus);
    }
    if (this.onOnline) {
      window.removeEventListener('online', this.onOnline);
    }
    this.windowListenersActive = false;
  }

  /** Throws an error if the current browser does not support WebAuthn passkeys. */
  private assertPasskeySupport(): void {
    if (typeof PublicKeyCredential === 'undefined') {
      throw new Error('Passkeys are not supported in this browser');
    }
  }
  /** Gets the current token if authenticated, otherwise throws an error. */
  private async getAuthenticatedToken(): Promise<string> {
    await this.ensureFreshToken();
    const token = this.keycloak?.token;
    if (token === undefined || token.trim() === '') {
      throw new Error('Keycloak user is not authenticated');
    }
    return token;
  }
  /** Requests a passkey challenge from the server, throwing an error if the request fails or the response is invalid. */
  private async getPasskeyChallenge(): Promise<Required<Pick<PasskeyChallengeResponse, 'challenge'>> & PasskeyChallengeResponse> {
    const response = await fetch(this.getPasskeyEndpoint('challenge'), {
      credentials: 'include',
    });
    const payload = (await response.json().catch(() => ({}))) as PasskeyChallengeResponse;

    if (!response.ok || typeof payload.challenge !== 'string' || payload.challenge.trim() === '') {
      throw new Error(this.getErrorMessage(payload.error, `Failed to create passkey challenge: ${response.status}`));
    }

    return {
      challenge: payload.challenge,
      credentialId: payload.credentialId,
      error: payload.error,
    };
  }

  /** Endpoint builders */
  private getPasskeyEndpoint(path: string): string {
    return this.getRealmEndpoint(`passkey/${encodeURIComponent(this.config.keycloak.clientId)}/${path}`);
  }

  private getAccountCredentialsEndpoint(): string {
    return this.getRealmEndpoint('account/credentials');
  }

  private getRealmEndpoint(path: string): string {
    const authServerUrl = this.config.keycloak.url.endsWith('/') ? this.config.keycloak.url : `${this.config.keycloak.url}/`;
    const normalizedPath = path.replace(/^\/+/, '');
    return new URL(`realms/${encodeURIComponent(this.config.keycloak.realm)}/${normalizedPath}`, authServerUrl).toString();
  }

  private getErrorMessage(errorMessage: string | undefined, fallback: string): string {
    return errorMessage !== undefined && errorMessage.trim() !== '' ? errorMessage : fallback;
  }

  private getFirstNonEmptyString(values: unknown[]): string | undefined {
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

  /** Extracts webauthn credentials from the given payload */
  private extractPasskeyCredentials(
    payload: AccountCredentialTypeResponse[] | { credentials?: AccountCredentialResponse[]; error?: string },
  ): AccountCredentialResponse[] {
    if (!Array.isArray(payload)) {
      return payload.credentials ?? [];
    }

    const credentials: AccountCredentialResponse[] = [];
    for (const credentialType of payload) {
      const type = (credentialType.type ?? '').toLowerCase();
      if (!KeycloakAuthenticationService.PASSKEY_CREDENTIAL_TYPES.has(type)) {
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

  /**
   * Builds a safe redirect URI. If the given URI starts with the application origin
   * followed by a path separator, it is returned as-is. Otherwise, only the path
   * portion (starting with `/`) is appended to the origin. External URLs are rejected
   * to prevent open redirect attacks.
   */
  private buildRedirectUri(redirectUri?: string): string {
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
}
