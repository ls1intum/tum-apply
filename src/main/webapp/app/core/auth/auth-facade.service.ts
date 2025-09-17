import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { OtpCompleteDTO, UserProfileDTO } from '../../generated';

import { ServerAuthenticationService } from './server-authentication.service';
import { IdpProvider, KeycloakAuthenticationService } from './keycloak-authentication.service';
import { AccountService } from './account.service';
import { AuthOrchestratorService } from './auth-orchestrator.service';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private readonly serverAuthenticationService = inject(ServerAuthenticationService);
  private readonly keycloakAuthenticationService = inject(KeycloakAuthenticationService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly authOrchestrator = inject(AuthOrchestratorService);

  /**
   * Try to refresh the authentication session.
   * First attempts the email session refresh,
   * otherwise falls back to Keycloak SSO initialization.
   *
   * @return true if the user is authenticated, false otherwise.
   */
  async initAuth(): Promise<boolean> {
    return this.runAuthAction(async () => {
      // 1) Email-Authentication-Flow (server session)
      try {
        await this.serverAuthenticationService.refreshTokens();
        await this.loadUser();
        return true;
      } catch {
        // no valid email session, continue with Keycloak
      }

      // 2) Keycloak-Flow
      const keycloakInitialized = await this.keycloakAuthenticationService.init();
      if (keycloakInitialized) {
        await this.loadUser();
        return true;
      }

      // 3) not authenticated
      return false;
    }, 'Automatic sign-in failed.');
  }

  // --------------- Email/Password ---------------
  /**
   * Logs in via email/password on the server.
   * @returns true on success, throws on failure
   */
  async loginWithEmail(email: string, password: string, redirectUri?: string): Promise<boolean> {
    return this.runAuthAction(
      async () => {
        await this.serverAuthenticationService.login(email, password);
        await this.loadUser();
        this.redirectToPage(redirectUri);
        return true;
      },
      'Email sign-in failed. Please check your credentials and try again.',
      true,
    );
  }

  // --------------- Email/OTP ---------------
  /** Request an OTP to be sent to the user's email. */
  async requestOtp(registration = false): Promise<void> {
    const email = this.authOrchestrator.email();
    return this.runAuthAction(async () => {
      await this.serverAuthenticationService.sendOtp(email, registration);
      this.authOrchestrator.nextStep(!registration ? 'otp' : undefined);
    }, 'Could not send OTP. Please try again.');
  }

  /** Verify an OTP code and start a server session, then redirect. */
  async verifyOtp(code: string, registration = false, redirectUri?: string): Promise<boolean> {
    const email = this.authOrchestrator.email();
    const purpose = registration ? OtpCompleteDTO.PurposeEnum.Register : OtpCompleteDTO.PurposeEnum.Login;
    const profile: UserProfileDTO | undefined = registration
      ? {
          firstName: this.authOrchestrator.firstName(),
          lastName: this.authOrchestrator.lastName(),
        }
      : undefined;
    return this.runAuthAction(
      async () => {
        await this.serverAuthenticationService.verifyOtp(email, code, purpose, profile);
        await this.loadUser();
        this.redirectToPage(redirectUri);
        if (registration) {
          this.authOrchestrator.nextStep();
        }
        return true;
      },
      'The code is invalid or expired. Please request a new one.',
      !registration,
    );
  }

  // --------------- IdPs ---------------
  /**
   * Logs in via a Keycloak identity provider.
   * @param provider Google, Apple, Microsoft, etc.
   * @param redirectUri optional post-login redirect
   */
  async loginWithProvider(provider: IdpProvider, redirectUri?: string): Promise<void> {
    return this.runAuthAction(async () => {
      await this.keycloakAuthenticationService.loginWithProvider(provider, redirectUri);
    }, 'Provider sign-in failed. Please try again.');
  }

  // --------------- Logout ---------------
  // Logout the user from both email and Keycloak sessions.
  async logout(redirectUri?: string): Promise<void> {
    return this.runAuthAction(async () => {
      // Email-Logout (server session)
      try {
        await this.serverAuthenticationService.logout();
      } catch {}

      // Keycloak-Logout (SSO session)
      try {
        await this.keycloakAuthenticationService.logout(redirectUri);
      } catch {}

      // Reset local account state
      this.accountService.user.set(undefined);
      this.accountService.loaded.set(true);

      // Single redirect at the end
      if (redirectUri !== undefined) {
        this.redirectToPage(redirectUri);
      } else {
        await this.router.navigate(['/']);
      }
    }, 'Logout failed.');
  }

  // --------------- Helpers ---------------
  /**
   * Loads the current user profile via AccountService.
   */
  private async loadUser(): Promise<void> {
    await this.accountService.loadUser();
  }

  /**
   * Navigates to an absolute or app-relative URL.
   * If the URL does not start with http, it is resolved against window.location.origin.
   */
  private redirectToPage(redirectUri?: string): void {
    if (redirectUri === undefined) return;
    window.location.href = redirectUri.startsWith('http') ? redirectUri : window.location.origin + redirectUri;
  }

  /**
   * Runs an auth action while toggling the orchestrator's busy flag and capturing errors.
   * Any thrown error will be surfaced via the orchestrator and rethrown for callers that care.
   */
  private async runAuthAction<T>(
    action: () => Promise<T>,
    errorMessage = 'Authentication failed.' + ' Please try again.',
    lastAction = false,
  ): Promise<T> {
    if (this.authOrchestrator.isBusy()) {
      throw new Error('AuthOrchestrator is busy');
    }
    this.authOrchestrator.clearError();
    this.authOrchestrator.isBusy.set(true);
    try {
      return await action();
    } catch (e) {
      this.authOrchestrator.setError(errorMessage);
      throw e;
    } finally {
      this.authOrchestrator.isBusy.set(false);
      if (lastAction) {
        this.authOrchestrator.authSuccess();
      }
    }
  }
}
