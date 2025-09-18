import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { OtpCompleteDTO } from '../../generated/model/otpCompleteDTO';
import { UserProfileDTO } from '../../generated/model/userProfileDTO';

import { ServerAuthenticationService } from './server-authentication.service';
import { IdpProvider, KeycloakAuthenticationService } from './keycloak-authentication.service';
import { AccountService } from './account.service';
import { AuthOrchestratorService } from './auth-orchestrator.service';

type AuthMethod = 'none' | 'server' | 'keycloak';

@Injectable({ providedIn: 'root' })
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
  async loginWithEmail(email: string, password: string, redirectUri?: string): Promise<boolean> {
    return this.runAuthAction(
      async () => {
        await this.serverAuthenticationService.login(email, password);
        await this.accountService.loadUser();
        this.redirectToPage(redirectUri);
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
        await this.accountService.loadUser();
        this.redirectToPage(redirectUri);
        if (registration) {
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
  // Logout the user from both email and Keycloak sessions.
  async logout(redirectUri?: string): Promise<void> {
    if (this.authMethod === 'none') {
      this.redirectToPage();
      return;
    }
    return this.runAuthAction(async () => {
      if (this.authMethod === 'server') {
        this.authMethod = 'none';
        await this.serverAuthenticationService.logout();
        this.redirectToPage(redirectUri);
      } else if (this.authMethod === 'keycloak') {
        this.authMethod = 'none';
        await this.keycloakAuthenticationService.logout(redirectUri);
      }
      // Reset states
      this.accountService.user.set(undefined);
      this.accountService.loaded.set(true);
    }, 'Logout failed.');
  }

  // --------------- Helpers ---------------

  /**
   * Navigates to an absolute or app-relative URL.
   * If the URL does not start with http, it is resolved against window.location.origin.
   */
  private redirectToPage(redirectUri = '/'): void {
    if (!redirectUri) return;
    if (/^http?:\/\//.test(redirectUri)) {
      if (window.location.href !== redirectUri) {
        window.location.href = redirectUri;
      }
    } else if (this.router.url !== redirectUri) {
      void this.router.navigateByUrl(redirectUri);
    }
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
