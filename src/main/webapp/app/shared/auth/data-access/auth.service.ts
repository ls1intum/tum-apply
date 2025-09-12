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
  // TODO: add services for registration

  // -------- Shared ----------

  async sendOtp(registration = false): Promise<void> {
    this.authOrchestration.isSendingCode.set(true);
    try {
      await this.authGateway.sendOtp(this.authOrchestration.email());
      this.authOrchestration.startCooldown();
      if (registration) {
        this.authOrchestration.registerStep.set('verify');
      } else {
        this.authOrchestration.loginSub.set('otp');
      }
    } finally {
      this.authOrchestration.isSendingCode.set(false);
    }
  }

  async verifyOtp(otp: string, registration = false): Promise<void> {
    this.authOrchestration.isSendingCode.set(true);
    if (this.authOrchestration.isBusy()) return;
    this.authOrchestration.isBusy.set(true);
    try {
      await this.authGateway.verifyOtp(this.authOrchestration.email(), otp, registration);

      if (registration) {
        this.authOrchestration.registerStep.set('profile');
      } else {
        // TODO: set token
      }

      this.authOrchestration.authSuccess();
    } catch {
      this.authOrchestration.setError('Code invalid or expired.');
    } finally {
      this.authOrchestration.isBusy.set(false);
      this.authOrchestration.isSendingCode.set(false);
    }
  }

  private finishLogin(): void {
    this.authOrchestration.authSuccess();
  }
}
