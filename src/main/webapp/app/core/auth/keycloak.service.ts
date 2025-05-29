// client/src/app/keycloak/keycloak.service.ts
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';

import { environment } from '../../environments/environment';

class KeycloakService {
  private keycloak: Keycloak | undefined;

  /**
   * Initializes the Keycloak client and determines login status.
   */
  async init(): Promise<boolean> {
    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });

    const options: KeycloakInitOptions = {
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
      checkLoginIframe: false,
      pkceMethod: 'S256',
      enableLogging: environment.keycloak.enableLogging,
    };

    const currentPath = window.location.pathname;
    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.some(path => currentPath === path);

    try {
      const authenticated = await this.keycloak.init(options);

      if (!authenticated && !isPublicPath) {
        console.warn('🔐 Protected route without login – redirecting to Keycloak');
        await this.keycloak.login();
      }

      return authenticated;
    } catch (err) {
      if (!isPublicPath && (err as { error?: string }).error !== 'access_denied') {
        console.warn('🔐 Protected route without login – redirecting to Keycloak');
        await this.keycloak.login();
      }

      console.warn('🔁 Keycloak init failed:', err);
      return false;
    }
  }

  /**
   * Triggers the Keycloak login flow.
   */
  login(): void {
    if (!this.keycloak) {
      console.error('Keycloak client is not initialized yet.');
      return;
    }
    this.keycloak.login({
      redirectUri: window.location.origin + '/',
    });
  }

  /**
   * Triggers the Keycloak logout and redirect.
   */
  logout(): void {
    if (!this.keycloak) {
      console.error('Keycloak client is not initialized yet.');
      return;
    }
    this.keycloak.logout({
      redirectUri: window.location.origin + '/',
    });
  }

  /**
   * Returns the current token.
   */
  getToken(): string | undefined {
    if (!this.keycloak) {
      console.error('Keycloak client is not initialized yet.');
      return;
    }
    return this.keycloak.token;
  }

  /**
   * Returns the current username.
   */
  getUsername(): string {
    if (!this.keycloak) {
      console.error('Keycloak client is not initialized yet.');
      return '';
    }
    return this.keycloak.tokenParsed?.preferred_username ?? '';
  }

  /**
   * Checks if the user has a specific role.
   */
  hasRole(role: string): boolean {
    if (!this.keycloak) {
      console.error('Keycloak client is not initialized yet.');
      return false;
    }
    return this.keycloak.tokenParsed?.realm_access?.roles.includes(role) ?? false;
  }

  /**
   * Returns all realm roles assigned to the user.
   */
  getUserRoles(): string[] {
    if (!this.keycloak) {
      console.error('Keycloak client is not initialized yet.');
      return [];
    }
    return this.keycloak.tokenParsed?.realm_access?.roles ?? [];
  }

  /**
   * Returns true if the user is currently logged in.
   */
  isLoggedIn(): boolean {
    if (!this.keycloak) {
      console.error('Keycloak client is not initialized yet.');
      return false;
    }
    return Boolean(this.keycloak.authenticated);
  }
}

export const keycloakService = new KeycloakService();
