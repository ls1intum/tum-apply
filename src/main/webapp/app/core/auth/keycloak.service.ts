import { Injectable } from '@angular/core';
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';

import { environment } from '../../environments/environment';

export enum IdpProvider {
  Google = 'google',
  Microsoft = 'microsoft',
  Apple = 'apple',
}

export interface UserProfile {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
}

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  profile: UserProfile | undefined;
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
      this.profile = (await this.keycloak.loadUserInfo()) as unknown as UserProfile;
      this.startTokenRefresh();
      return authenticated;
    } catch (err) {
      console.error('🔁 Keycloak init failed:', err);
      return false;
    }
  }

  /**
   * Triggers the Keycloak login flow.
   * Optionally redirects to the specified URI after login.
   *
   * @param redirectUri Optional URI to redirect to after login. Defaults to the app root.
   */
  async login(redirectUri?: string): Promise<void> {
    try {
      await this.keycloak.login({
        redirectUri: this.buildRedirectUri(redirectUri),
      });
      this.startTokenRefresh();
    } catch (err) {
      console.error('Login failed:', err);
    }
  }

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
        idpHint: provider,
      });
      this.startTokenRefresh();
    } catch (err) {
      console.error(`Login with provider ${provider} failed:`, err);
    }
  }

  /**
   * Triggers the Keycloak logout flow.
   * Optionally redirects to the specified URI after logout.
   *
   * @param redirectUri Optional URI to redirect to after logout. Defaults to the app root.
   */
  async logout(redirectUri?: string): Promise<void> {
    try {
      // Stop refresh timer regardless
      if (this.refreshIntervalId) {
        clearInterval(this.refreshIntervalId);
        this.refreshIntervalId = undefined;
      }
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

  /**
   * Returns the current authentication token.
   *
   * @returns The current token string if available, otherwise undefined.
   */
  getToken(): string | undefined {
    return this.keycloak.token;
  }

  /**
   * Ensures the access token is valid for at least x seconds. Otherwise, it attempts to refresh it.
   * If the refresh fails, the user is logged out.
   *
   * @param minValidity Minimum required validity of the token in seconds. Default is 20 seconds.
   * @throws An error if the token refresh fails.
   */
  public async ensureFreshToken(minValidity = 20): Promise<void> {
    if (!this.hasInitialized || !this.keycloak.authenticated) {
      return; // nothing to refresh yet
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

  /**
   * Checks if the user is currently authenticated.
   *
   * @returns True if the user is authenticated, false otherwise.
   */
  isLoggedIn(): boolean {
    return Boolean(this.keycloak.authenticated);
  }

  /**
   * Builds a valid redirect URI. If the given URI is absolute (starts with http),
   * it is returned unchanged; otherwise it is resolved against the application origin.
   */
  private buildRedirectUri(redirectUri?: string): string {
    return redirectUri?.startsWith('http') === true ? redirectUri : window.location.origin + (redirectUri ?? '/');
  }

  /**
   * Starts a periodic token refresh to keep the session active.
   * Refreshes the token every specified interval in milliseconds.
   *
   * @param intervalMs Interval in milliseconds between token refresh attempts. Default is 60000 ms.
   */
  private startTokenRefresh(intervalMs = 30000): void {
    const start = (): void => {
      if (this.refreshIntervalId) {
        return;
      }
      void this.ensureFreshToken();
      this.refreshIntervalId = setInterval(() => {
        void this.ensureFreshToken();
      }, intervalMs);
    };

    const stop = (): void => {
      if (this.refreshIntervalId) {
        clearInterval(this.refreshIntervalId);
        this.refreshIntervalId = undefined;
      }
    };

    const onVisibility = (): void => {
      if (document.visibilityState === 'visible') {
        start();
      } else {
        stop();
      }
    };

    onVisibility();

    document.removeEventListener('visibilitychange', onVisibility);
    document.addEventListener('visibilitychange', onVisibility, { passive: true });
  }
}
