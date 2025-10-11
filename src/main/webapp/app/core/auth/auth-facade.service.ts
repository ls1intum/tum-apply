import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { OtpCompleteDTO } from '../../generated/model/otpCompleteDTO';
import { UserProfileDTO } from '../../generated/model/userProfileDTO';
import { AuthSessionInfoDTO } from '../../generated/model/authSessionInfoDTO';

import { ServerAuthenticationService } from './server-authentication.service';
import { IdpProvider, KeycloakAuthenticationService } from './keycloak-authentication.service';
import { AccountService } from './account.service';
import { AuthOrchestratorService } from './auth-orchestrator.service';

type AuthMethod = 'none' | 'server' | 'keycloak';

@Injectable({ providedIn: 'root' })
/**
 * Purpose
 * -------
 * Single entry point that orchestrates *both* authentication domains:
 *  - Server-issued session (email/password/OTP, cookie-based)
 *  - Keycloak SSO (IdP providers, header-based)
 *
 * Responsibilities
 * ----------------
 *  - Tries to establish/refresh an authenticated session on app start (`initAuth`).
 *  - Delegates login flows to the respective domain services (server or Keycloak).
 *  - Performs coordinated logout that clears server session and/or Keycloak SSO.
 *  - Loads the current user profile after successful authentication.
 *  - Centralises redirect handling after auth actions.
 *
 * Notes
 * -----
 *  - This facade does not attach Authorization headers and performs no low-level HTTP; it delegates to
 *    `ServerAuthenticationService` and `KeycloakAuthenticationService`.
 *  - It tracks which auth method is active (`authMethod`) to execute the correct logout path and avoid mixing flows.
 *  - UI routing beyond post-auth redirects is not handled here; components/pages remain responsible for navigation.
 */
export class AuthFacadeService {
  private readonly serverAuthenticationService = inject(ServerAuthenticationService);
  private readonly keycloakAuthenticationService = inject(KeycloakAuthenticationService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly authOrchestrator = inject(AuthOrchestratorService);

  private authMethod: AuthMethod = 'none';

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
      const refreshed = await this.serverAuthenticationService.refreshTokens();
      if (refreshed) {
        await this.accountService.loadUser();
        this.authMethod = 'server';
        return true;
      }

      // 2) Keycloak-Flow
      const keycloakInitialized = await this.keycloakAuthenticationService.init();
      if (keycloakInitialized) {
        await this.accountService.loadUser();
        this.authMethod = 'keycloak';
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
  async loginWithEmail(email: string, password: string): Promise<boolean> {
    return this.runAuthAction(
      async () => {
        await this.serverAuthenticationService.login(email, password);
        await this.accountService.loadUser();
        this.authOrchestrator.nextStep();
        this.authMethod = 'server';
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
  async verifyOtp(code: string, registration = false): Promise<boolean> {
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
        const response: AuthSessionInfoDTO = await this.serverAuthenticationService.verifyOtp(email, code, purpose, profile);
        await this.accountService.loadUser();
        if (response.profileRequired === false) {
          this.authOrchestrator.authSuccess();
        } else if (registration) {
          this.authOrchestrator.nextStep();
        }
        this.authMethod = 'server';
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
      this.authMethod = 'keycloak';
    }, 'Provider sign-in failed. Please try again.');
  }

  // --------------- Logout ---------------
  /**
   * Logs the user out from the currently active authentication domain.
   *
   * - If the active method is `server`, calls server logout (cookie-based) and then redirects.
   * - If the active method is `keycloak`, triggers RP-initiated logout at Keycloak (front-channel).
   * - In both cases, local user state is cleared and `authMethod` is reset to `none`.
   *
   * The branching prevents mixed flows (e.g., trying Keycloak logout when only a server session exists)
   * and avoids unnecessary calls when no auth method is active.
   */
  async logout(): Promise<void> {
    if (this.authMethod === 'none') {
      this.navigateAfterLogin();
      return;
    }
    return this.runAuthAction(async () => {
      if (this.authMethod === 'server') {
        this.authMethod = 'none';
        await this.serverAuthenticationService.logout();
        this.navigateAfterLogin();
      } else if (this.authMethod === 'keycloak') {
        this.authMethod = 'none';
        await this.keycloakAuthenticationService.logout(window.location.href);
      }
      // Reset states
      this.accountService.user.set(undefined);
      this.accountService.loaded.set(true);
    }, 'Logout failed.');
  }

  // --------------- Helpers ---------------

  /**
   * Runs an auth action while toggling the orchestrator's busy flag and capturing errors.
   * Any thrown error will be surfaced via the orchestrator and rethrown for callers that care.
   */
  private async runAuthAction<T>(
    action: () => Promise<T>,
    errorMessage = 'Authentication failed. Please try again.',
    lastAction = false,
  ): Promise<T> {
    if (this.authOrchestrator.isBusy()) {
      throw new Error('AuthOrchestrator is busy');
    }
    this.authOrchestrator.clearError();
    this.authOrchestrator.isBusy.set(true);
    try {
      const response = await action();
      if (lastAction) {
        this.authOrchestrator.authSuccess();
      }
      return response;
    } catch (e) {
      this.authOrchestrator.setError(errorMessage);
      throw e;
    } finally {
      this.authOrchestrator.isBusy.set(false);
    }
  }

  /**
   * Navigate to the stored redirect URL or home after logout.
   */
  private navigateAfterLogin(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const data = route.data;
    if (data.authorities?.length > 0) {
      void this.router.navigate(['/']);
    }
  }
}
