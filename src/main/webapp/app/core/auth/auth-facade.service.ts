import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from './authentication.service';
import { IdpProvider, KeycloakService } from './keycloak.service';
import { AccountService } from './account.service';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private readonly emailAuthenticationService = inject(AuthenticationService);
  private readonly keycloakService = inject(KeycloakService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  // True if either Email- or Keycloak-session is active
  get isAuthenticated(): boolean {
    return this.accountService.signedIn() || this.keycloakService.isLoggedIn();
  }

  /**
   * Try to refresh the authentication session.
   * First attempts the email session refresh,
   * otherwise falls back to Keycloak SSO initialization.
   *
   * @return true if the user is authenticated, false otherwise.
   */
  async initAuth(): Promise<boolean> {
    // 1) Email-Authentication-Flow
    try {
      await this.emailAuthenticationService.refresh();
      await this.loadUser();
      return true;
    } catch {
      // no valid email session, continue with Keycloak
    }

    // 2) Keycloak-Flow
    const keycloakInitialized = await this.keycloakService.init();
    if (keycloakInitialized) {
      await this.loadUser();
      return true;
    }

    // 3) not authenticated
    return false;
  }

  /**
   * Logs in via email/password on the server.
   * @returns true on success, throws on failure
   */
  async loginWithEmail(email: string, password: string, redirectUri?: string): Promise<boolean> {
    try {
      await this.emailAuthenticationService.login(email, password);

      // If a redirect URI is provided, navigate to it
      if (redirectUri !== undefined) {
        window.location.href = redirectUri.startsWith('http') ? redirectUri : window.location.origin + redirectUri;
      }
      return true;
    } catch (error: unknown) {
      console.warn(error);
      return false;
    }
  }

  /**
   * Logs in via a Keycloak identity provider.
   * @param provider Google, Apple, Microsoft, etc.
   * @param redirectUri optional post-login redirect
   */
  async loginWithProvider(provider: IdpProvider, redirectUri?: string): Promise<void> {
    await this.keycloakService.loginWithProvider(provider, redirectUri);
  }

  /**
   * Logs in via a Keycloak TUM login.
   * @param redirectUri optional post-login redirect
   */
  async loginWithTUM(redirectUri?: string): Promise<void> {
    await this.keycloakService.login(redirectUri);
  }

  // Logout the user from both email and Keycloak sessions.
  async logout(): Promise<void> {
    // Email-Logout
    try {
      await this.emailAuthenticationService.logout();
    } catch {}

    // Keycloak-Logout
    try {
      await this.keycloakService.logout();
    } catch {}

    // reset account state
    this.accountService.user.set(undefined);
    this.accountService.loaded.set(true);

    // redirect to start page after logout
    this.router.navigate(['/']);
  }

  /**
   * Loads the current user profile via AccountService.
   */
  private async loadUser(): Promise<void> {
    await this.accountService.loadUser();
  }
}
