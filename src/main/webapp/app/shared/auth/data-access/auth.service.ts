import { Injectable, inject } from '@angular/core';

import { AuthOrchestratorService } from './auth-orchestrator.service';
import { AuthGateway } from './auth-gateway.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authOrchestration = inject(AuthOrchestratorService);
  private readonly authGateway = inject(AuthGateway);

  // -------- Login flow ----------
  async loginWithPassword(password: string): Promise<void> {
    if (this.authOrchestration.isBusy()) return;
    this.authOrchestration.isBusy.set(true);
    try {
      await this.authGateway.loginPassword(this.authOrchestration.email(), password);
      this.finishLogin();
    } catch {
      this.authOrchestration.setError('Invalid credentials.');
    } finally {
      this.authOrchestration.isBusy.set(false);
    }
  }

  // -------- Registration flow ----------

  async registerVerify(otp: string): Promise<void> {
    this.authOrchestration.isSendingCode.set(true);
    if (this.authOrchestration.isBusy()) return;
    this.authOrchestration.isBusy.set(true);
    try {
      const res = await this.authGateway.verifyOtp(this.authOrchestration.email(), otp);
      this.authOrchestration.registrationToken.set(res?.registrationToken ?? null);
      this.authOrchestration.registerStep.set('profile');
    } catch {
      this.authOrchestration.setError('Code invalid or expired.');
    } finally {
      this.authOrchestration.isBusy.set(false);
      this.authOrchestration.isSendingCode.set(false);
    }
  }

  // TODO: add services for registration
  /*
  async registerSaveProfile(consents: unknown): Promise<void> {
    if (!this.authOrchestration.registrationToken()) return;
    if (this.authOrchestration.isBusy()) return;
    this.authOrchestration.isBusy.set(true);
    try {
      await this.authGateway.registerProfile(
        this.authOrchestration.registrationToken()!,
        this.authOrchestration.firstName(),
        this.authOrchestration.lastName(),
        consents,
      );
      this.authOrchestration.registerStep.set('password');
    } catch {
      this.authOrchestration.setError('Could not save your profile.');
    } finally {
      this.authOrchestration.isBusy.set(false);
    }
  }

  async registerSetPasswordAndFinish(password?: string): Promise<void> {
    if (this.authOrchestration.isBusy()) return;
    this.authOrchestration.isBusy.set(true);
    try {
      if (password?.length) {
        await this.authGateway.registerSetPassword(this.authOrchestration.registrationToken()!, password);
      }
      this.finishLogin();
    } catch {
      this.authOrchestration.setError('Could not set password.');
    } finally {
      this.authOrchestration.isBusy.set(false);
    }
  }*/

  // --- "Apply" registration
  /**
   * Sends a code directly using email + firstName + lastName already present in the apply form.
   * After verification, we keep a registrationToken and the hosting form can continue.
   */
  /*
    this.authOrchestration.setError(null);
    this.authOrchestration.isSendingCode.set(true);
    try {
      const res = await this.authGateway.applyInlineSendCode(
        this.authOrchestration.email(),
        this.authOrchestration.firstName(),
        this.authOrchestration.lastName(),
      );
      const cooldown = (res as any)?.cooldownSeconds ?? 30;
      this.authOrchestration.startCooldown(cooldown);
      this.authOrchestration.applyStep.set('inline'); // still inline, now waiting for OTP entry
    } finally {
      this.authOrchestration.isSendingCode.set(false);
    }
  }

  async applyInlineVerify(): Promise<void> {
    if (this.authOrchestration.isBusy()) return;
    this.authOrchestration.isBusy.set(true);
    try {
      const res = await this.authGateway.applyInlineVerify(this.authOrchestration.email(), this.authOrchestration.otp());
      this.authOrchestration.registrationToken.set((res as any)?.registrationToken ?? null);
      this.authOrchestration.applyStep.set('verified'); // host form may now enable submit
    } catch {
      this.authOrchestration.setError('Code invalid or expired.');
    } finally {
      this.authOrchestration.isBusy.set(false);
    }
  }

  async finishAfterApply(optionalPassword?: string): Promise<void> {
    // called after the job application is submitted successfully
    if (optionalPassword?.length) {
      await this.authGateway.registerSetPassword(this.authOrchestration.registrationToken()!, optionalPassword);
    }
    this.finishLogin(); // if your backend wants to auto-login at this point
  }*/

  // -------- Shared ----------

  async sendOtp(registration = false): Promise<void> {
    this.authOrchestration.isSendingCode.set(true);
    try {
      const res = await this.authGateway.sendOtp(this.authOrchestration.email());
      const cooldown = res?.cooldownSeconds ?? 30;
      this.authOrchestration.startCooldown(cooldown);
      if (registration) {
        this.authOrchestration.registerStep.set('verify');
      } else {
        this.authOrchestration.loginSub.set('otp');
      }
    } finally {
      this.authOrchestration.isSendingCode.set(false);
    }
  }

  async verifyOtp(email: string, otp: string): Promise<void> {
    if (this.authOrchestration.isBusy()) return;
    this.authOrchestration.isBusy.set(true);
    try {
      await this.authGateway.verifyOtp(email, otp);
      this.finishLogin();
    } catch {
      this.authOrchestration.setError('Code invalid or expired.');
    } finally {
      this.authOrchestration.isBusy.set(false);
    }
  }

  private finishLogin(): void {
    this.authOrchestration.authSuccess();
  }
}
