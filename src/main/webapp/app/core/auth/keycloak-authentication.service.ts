import { Injectable } from '@angular/core';
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';

import { environment } from '../../environments/environment';

export enum IdpProvider {
  Google = 'google',
  Microsoft = 'microsoft',
  Apple = 'apple',
  TUM = 'tum',
}

export interface UserProfile {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
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
  private readonly keycloak = new Keycloak({
    url: environment.keycloak.url,
    realm: environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  });
  private refreshIntervalId: ReturnType<typeof setInterval> | undefined;
  private refreshInFlight: Promise<void> | null = null;
  private hasInitialized = false;

  /**
   * Initializes the Keycloak client and determines login status.
   * Loads the user profile and starts the token refresh cycle if authenticated.
   *
   * @returns A promise that resolves to true if the user is authenticated, false otherwise.
   */
  async init(): Promise<boolean> {
    const options: KeycloakInitOptions = {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
      checkLoginIframe: true,
      pkceMethod: 'S256',
      enableLogging: environment.keycloak.enableLogging,
    };

    try {
      const authenticated = await this.keycloak.init(options);
      this.hasInitialized = true;
      if (!authenticated) {
        console.warn('Keycloak not authenticated.');
        return authenticated;
      }
      this.startTokenRefreshScheduler();
      return authenticated;
    } catch (err) {
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
    return this.keycloak.token;
  }

  /**
   * Checks if the user is currently authenticated.
   *
   * @returns True if the user is authenticated, false otherwise.
   */
  isLoggedIn(): boolean {
    return Boolean(this.keycloak.authenticated);
  }

  // --------------------------- Login ----------------------------

  /**
   * Triggers the Keycloak login flow for a specific identity provider.
   * Optionally redirects to the specified URI after login.
   *
   * @param provider The identity provider to use for login.
   * @param redirectUri Optional URI to redirect to after login. Defaults to the app root.
   */
  async loginWithProvider(provider: IdpProvider, redirectUri?: string): Promise<void> {
    try {
      await this.keycloak.login({
        redirectUri: this.buildRedirectUri(redirectUri),
        idpHint: provider !== IdpProvider.TUM ? provider : undefined,
      });
      this.startTokenRefreshScheduler();
    } catch (err) {
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
    try {
      this.stopTokenRefreshScheduler();
      // If Keycloak hasn't been initialized yet, we cannot call kc.logout safely.
      if (!this.hasInitialized) {
        console.warn('Logout called before Keycloak init; skipping Keycloak logout call.');
        return;
      }
      await this.keycloak.logout({ redirectUri: this.buildRedirectUri(redirectUri) });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  // --------------------------- Refresh ----------------------------

  /**
   * Ensures the access token is valid for at least x seconds. Otherwise, it attempts to refresh it.
   * If the refresh fails, the user is logged out.
   *
   * @param minValidity Minimum required validity of the token in seconds. Default is 20 seconds.
   * @throws An error if the token refresh fails.
   */
  async ensureFreshToken(minValidity = 20): Promise<void> {
    if (!this.hasInitialized || this.keycloak.authenticated === false) {
      return;
    }
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    this.refreshInFlight = this.keycloak
      .updateToken(minValidity)
      .then(() => {})
      .catch(async (e: unknown) => {
        console.warn('Failed to refresh token, logging out...', e);
        await this.logout();
        throw e;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });
    return this.refreshInFlight;
  }

  // --------------------------- Helpers ----------------------------

  /**
   * Starts a timer to refresh the session tokens before they expire.
   *
   * @param expiresInSec - Number of seconds until the session expires.
   */
  private startTokenRefreshScheduler(intervalMs = 30000): void {
    if (this.refreshIntervalId) {
      return;
    }
    this.refreshIntervalId = setInterval(() => {
      void this.ensureFreshToken();
    }, intervalMs);
  }

  /**
   * Cancels any scheduled token refresh schedulers.
   */
  private stopTokenRefreshScheduler(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = undefined;
    }
  }

  /**
   * Builds a valid redirect URI. If the given URI is absolute (starts with http),
   * it is returned unchanged; otherwise it is resolved against the application origin.
   */
  private buildRedirectUri(redirectUri?: string): string {
    return redirectUri?.startsWith('http') === true ? redirectUri : window.location.origin + (redirectUri ?? '/');
  }
}
