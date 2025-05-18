// client/src/app/keycloak/keycloak.service.ts
import Keycloak, { KeycloakInitOptions } from 'keycloak-js';
import { environment } from 'app/environments/environment';

class KeycloakService {
  private keycloak!: Keycloak;

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

    try {
      return await this.keycloak.init(options);
    } catch (err) {
      const currentPath = window.location.pathname;
      const protectedPaths = ['/admin', '/account', '/profile']; // z. B. definieren

      const isProtected = protectedPaths.some(path => currentPath.startsWith(path));

      console.warn('🔁 Keycloak init failed:', err);

      if (isProtected && (err as { error?: string }).error !== 'access_denied') {
        console.warn('🔐 Protected route without login – redirecting to Keycloak');
        this.keycloak.login();
      } else {
        console.warn('🌐 Public route – no login redirect');
      }

      return false;
    }
  }

  /**
   * Triggers the Keycloak login flow.
   */
  login(): void {
    this.keycloak.login();
  }

  /**
   * Triggers the Keycloak logout and redirect.
   */
  logout(): void {
    this.keycloak.logout({
      redirectUri: window.location.origin,
    });
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
    return !!this.keycloak.authenticated;
  }
}

export const keycloakService = new KeycloakService();
