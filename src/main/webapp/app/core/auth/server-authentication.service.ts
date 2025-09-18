import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthenticationResourceService } from 'app/generated/api/authenticationResource.service';
import { AuthSessionInfoDTO } from 'app/generated/model/authSessionInfoDTO';

import { EmailVerificationResourceService, OtpCompleteDTO, UserProfileDTO } from '../../generated';

import { AccountService } from './account.service';

import PurposeEnum = OtpCompleteDTO.PurposeEnum;

/**
 * Purpose
 * -------
 * Handles all communication from the client to the server for server‑issued tokens (email/password or email/OTP)
 * and their refresh lifecycle.
 *
 * Responsibilities
 * ----------------
 * - Call the server's authentication APIs (via OpenAPI) to login, verify OTP, refresh and logout.
 * - Start and cancel refresh timers for server‑issued tokens.
 * - Surface orchestration signals for the dialog flow without UI routing.
 *
 * Notes
 * -----
 * - No Keycloak/IdP logic and no Authorization header handling.
 * - No client‑side token storage; server manages session via cookies.
 * - Navigation and user profile loading are handled by the AuthFacade.
 */
@Injectable({ providedIn: 'root' })
export class ServerAuthenticationService {
  private refreshTimerId?: number;
  private refreshInFlight: Promise<boolean> | null = null;

  private readonly authenticationApi = inject(AuthenticationResourceService);
  private readonly emailVerificationApi = inject(EmailVerificationResourceService);

  private readonly accountService = inject(AccountService);
  private windowListenersActive = false;

  // --------------------------- Email/Password ----------------------------
  /**
   * Authenticates the user with email and password.
   *
   * @param email - The user's email address.
   * @param password - The user's password.
   * @returns Promise resolving to AuthSessionInfoDTO containing session information.
   * @throws Error if authentication fails.
   */
  async login(email: string, password: string): Promise<void> {
    const response: AuthSessionInfoDTO = await firstValueFrom(
      this.authenticationApi.login({
        email,
        password,
      }),
    );
    this.startTokenRefreshTimeout(response.expiresIn);
  }

  // --------------------------- Email/OTP ----------------------------
  /**
   * Sends a one-time password (OTP) to the user's email for login or registration.
   *
   * @param email - The user's email address.
   * @param registration - Set to true for registration OTP, false for login OTP. Defaults to false.
   * @returns Promise that resolves when the OTP has been sent.
   */
  async sendOtp(email: string, registration: boolean): Promise<void> {
    await firstValueFrom(this.emailVerificationApi.send({ email, registration }));
  }

  /**
   * Verifies the provided OTP code for login or registration and returns session info.
   *
   * @param email - The user's email address.
   * @param code - The OTP code to verify.
   * @param purpose - The purpose of the OTP (login or registration).
   * @param profile - Optional user profile information for registration.
   * @returns Promise resolving to AuthSessionInfoDTO containing session information.
   * @throws Error if verification fails or orchestrator is busy.
   */
  async verifyOtp(email: string, code: string, purpose: PurposeEnum, profile?: UserProfileDTO): Promise<void> {
    const response: AuthSessionInfoDTO = await firstValueFrom(
      this.authenticationApi.otpComplete({
        email,
        code,
        profile,
        purpose,
      }),
    );
    this.startTokenRefreshTimeout(response.expiresIn);
  }

  // --------------------------- Logout ----------------------------
  /**
   * Logs out the user, clears any scheduled refresh timers, and resets local account state.
   *
   * @returns Promise that resolves when logout is complete.
   */
  async logout(): Promise<void> {
    // Clear any scheduled refresh first
    this.stopTokenRefreshTimeout();
    await firstValueFrom(this.authenticationApi.logout());
  }

  // --------------------------- Token Refresh ----------------------------
  /**
   * Refreshes the access token and refresh token by calling the server's refresh endpoint.
   *
   * @returns Promise resolving to AuthSessionInfoDTO with new session expiry.
   */
  async refreshTokens(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    this.refreshInFlight = firstValueFrom(this.authenticationApi.refresh())
      .then((response: AuthSessionInfoDTO) => {
        this.startTokenRefreshTimeout(response.expiresIn);
        return true;
      })
      .catch((e: unknown) => {
        console.warn('Failed to refresh token, logging out...', e);
        return false;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });
    return this.refreshInFlight;
  }

  /**
   * Starts a timer to refresh the session tokens before they expire.
   *
   * @param expiresInSec - Number of seconds until the session expires.
   */
  private startTokenRefreshTimeout(expiresInSec: number | undefined): void {
    if (expiresInSec == null) {
      return;
    }
    // Clear any existing timer
    this.stopTokenRefreshTimeout();
    this.bindWindowListeners();
    const timerInMs = Math.max(0, (expiresInSec - 30) * 1000);
    this.refreshTimerId = window.setTimeout(() => {
      void this.refreshTokens();
    }, timerInMs);
  }

  /**
   * Cancels any scheduled token refreshes.
   */
  private stopTokenRefreshTimeout(): void {
    this.unbindWindowListeners();
    if (this.refreshTimerId != null) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = undefined;
    }
  }

  private onVisibilityChange?: () => void = () => {};
  private onFocus?: () => void = () => {};
  private onOnline?: () => void = () => {};

  /** Bind window listeners so a returning user gets a fresh token without being logged out. */
  private bindWindowListeners(): void {
    if (this.windowListenersActive) {
      return;
    }

    this.onVisibilityChange = () => {
      if (!document.hidden) {
        void this.refreshTokens();
      }
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.onFocus = () => {
      void this.refreshTokens();
    };
    this.onOnline = () => {
      void this.refreshTokens();
    };
    window.addEventListener('focus', this.onFocus);
    window.addEventListener('online', this.onOnline);

    this.windowListenersActive = true;
  }

  /** Unbind window listeners; call on logout to avoid leaks. */
  private unbindWindowListeners(): void {
    if (!this.windowListenersActive) {
      return;
    }
    if (this.onVisibilityChange) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    if (this.onFocus) {
      window.removeEventListener('focus', this.onFocus);
    }
    if (this.onOnline) {
      window.removeEventListener('online', this.onOnline);
    }
    this.windowListenersActive = false;
  }
}
