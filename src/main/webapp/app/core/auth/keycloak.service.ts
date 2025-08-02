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
  token: string;
}

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  profile: UserProfile | undefined;
  private refreshIntervalId: any;

  private readonly keycloak = new Keycloak({
    url: environment.keycloak.url,
    realm: environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  });

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
      if (!authenticated) {
        console.warn('Keycloak not authenticated.');
        return authenticated;
      }
      this.profile = (await this.keycloak.loadUserInfo()) as unknown as UserProfile;
      this.profile.token = this.keycloak.token ?? '';
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
        redirectUri: redirectUri?.startsWith('http') ? redirectUri : window.location.origin + (redirectUri ?? '/'),
      });
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
        redirectUri: redirectUri?.startsWith('http') ? redirectUri : window.location.origin + (redirectUri ?? '/'),
        idpHint: provider,
      });
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
      if (this.refreshIntervalId) {
        clearInterval(this.refreshIntervalId);
        this.refreshIntervalId = undefined;
      }
      await this.keycloak.logout({
        redirectUri: redirectUri ?? window.location.origin + '/',
      });
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
   * Checks if the user is currently authenticated.
   *
   * @returns True if the user is authenticated, false otherwise.
   */
  isLoggedIn(): boolean {
    return Boolean(this.keycloak.authenticated);
  }

  /**
   * Starts a periodic token refresh to keep the session active.
   * Refreshes the token every specified interval in milliseconds.
   *
   * @param intervalMs Interval in milliseconds between token refresh attempts. Default is 30000 ms.
   */
  private startTokenRefresh(intervalMs = 30000): void {
    this.refreshIntervalId = setInterval(() => {
      this.keycloak
        .updateToken(60)
        .then(refreshed => {
          if (refreshed) {
            if (this.keycloak.token) {
              if (this.profile) {
                this.profile.token = this.keycloak.token;
              }
            }
          }
        })
        .catch(() => {
          console.warn('Failed to refresh token');
        });
    }, intervalMs);
  }
}
