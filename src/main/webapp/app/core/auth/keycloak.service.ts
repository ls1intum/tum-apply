import { Injectable } from '@angular/core';
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';

import { environment } from '../../environments/environment';

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

  private readonly keycloak = new Keycloak({
    url: 'https://keycloak.aet.cit.tum.de/',
    realm: 'external_login',
    clientId: 'tumapply-client',
  });

  /**
   * Initializes the Keycloak client and determines login status.
   */
  async init(): Promise<boolean> {
    console.warn('🔁 Initializing Keycloak...');
    console.warn('🔁 Keycloak URL:', environment.keycloak.url);
    const options: KeycloakInitOptions = {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
      checkLoginIframe: false,
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

      return authenticated;
    } catch (err) {
      console.error('🔁 Keycloak init failed:', err);
      return false;
    }
  }

  /**
   * Triggers the Keycloak login flow.
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
   * Triggers the Keycloak logout and redirect.
   */
  async logout(): Promise<void> {
    try {
      await this.keycloak.logout({
        redirectUri: window.location.origin + '/',
      });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }

  /**
   * Returns the current token.
   */
  getToken(): string | undefined {
    return this.keycloak.token;
  }

  /**
   * Returns true if the user is currently logged in.
   */
  isLoggedIn(): boolean {
    return Boolean(this.keycloak.authenticated);
  }
}
