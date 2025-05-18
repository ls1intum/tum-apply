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
      onLoad: 'login-required',
      checkLoginIframe: false,
    };

    return await this.keycloak.init(options);
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
