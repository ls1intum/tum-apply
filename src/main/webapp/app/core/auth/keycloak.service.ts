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
  _keycloak: Keycloak | undefined;
  profile: UserProfile | undefined;

  get keycloak(): Keycloak {
    this._keycloak ??= new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });
    return this._keycloak;
  }

  /**
   * Initializes the Keycloak client and determines login status.
   */
  async init(): Promise<boolean> {
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
  async login(): Promise<void> {
    try {
      await this.keycloak.login({
        redirectUri: window.location.origin + '/',
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
   * Returns the current username.
   */
  getUsername(): string {
    return this.keycloak.tokenParsed?.preferred_username ?? '';
  }

  /**
   * Returns the current user's first name.
   */
  getFirstName(): string {
    return this.keycloak.tokenParsed?.given_name ?? '';
  }

  /**
   * Checks if the user has a specific role.
   */
  hasRole(role: string): boolean {
    return this.keycloak.tokenParsed?.realm_access?.roles.includes(role) ?? false;
  }

  /**
   * Returns all realm roles assigned to the user.
   */
  getUserRoles(): string[] {
    return this.keycloak.tokenParsed?.realm_access?.roles ?? [];
  }

  /**
   * Returns true if the user is currently logged in.
   */
  isLoggedIn(): boolean {
    return Boolean(this.keycloak.authenticated);
  }
}
