import { Injectable, computed, signal } from '@angular/core';

import { ApplyStep, AuthFlowMode, AuthOpenOptions, LoginSubState, RegisterStep } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthOrchestratorService {
  // high level dialog state
  readonly isOpen = signal(false);
  readonly mode = signal<AuthFlowMode>('login');

  // substates per flow
  readonly loginSub = signal<LoginSubState>('email');
  readonly registerStep = signal<RegisterStep>('email');
  readonly applyStep = signal<ApplyStep>('inline');

  // form state (shared across flows)
  readonly email = signal<string>('');
  readonly firstName = signal<string>('');
  readonly lastName = signal<string>('');

  // server context
  readonly registrationToken = signal<string | null>(null);

  // UX state
  readonly isBusy = signal(false);
  readonly isSendingCode = signal(false);
  readonly error = signal<string | null>(null);
  readonly cooldownSeconds = signal<number>(0);

  // progress for registration dialog
  readonly registerProgress = computed(() => {
    switch (this.registerStep()) {
      case 'email':
        return 0;
      case 'verify':
        return 0.33;
      case 'profile':
        return 0.66;
      case 'password':
        return 1;
    }
  });

  private onSuccessCb: (() => void) | undefined;

  // open the dialog in a specific mode; can be re-used from header or from job-apply forms.
  open(opts?: AuthOpenOptions): void {
    this.resetAll();
    if (opts?.mode) this.mode.set(opts.mode);

    if (opts?.prefill?.email != null && opts.prefill.email.trim() !== '') {
      this.email.set(opts.prefill.email.trim());
    }
    if (opts?.prefill?.firstName != null && opts.prefill.firstName.trim() !== '') {
      this.firstName.set(opts.prefill.firstName.trim());
    }
    if (opts?.prefill?.lastName != null && opts.prefill.lastName.trim() !== '') {
      this.lastName.set(opts.prefill.lastName.trim());
    }

    // choose sensible starting substates
    if (this.mode() === 'login') {
      this.loginSub.set('email');
    }
    if (this.mode() === 'register') {
      this.registerStep.set('email');
    }
    if (this.mode() === 'apply-register') {
      this.applyStep.set('inline');
    }

    this.onSuccessCb = opts?.onSuccess;
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  // call after successful authentication to close and notify
  authSuccess(): void {
    this.isOpen.set(false);
    try {
      this.onSuccessCb?.();
    } finally {
      this.onSuccessCb = undefined;
    }
  }

  switchToLogin(): void {
    this.mode.set('login');
    this.loginSub.set('email');
  }

  switchToRegister(): void {
    this.mode.set('register');
    this.registerStep.set('email');
  }

  switchToApplyRegister(): void {
    this.mode.set('apply-register');
    this.applyStep.set('inline');
  }

  // -------- Helpers ----------

  setError(msg: string | null): void {
    this.error.set(msg);
  }

  startCooldown(sec: number = environment.otp.cooldown): void {
    this.cooldownSeconds.set(sec);
    const iv = setInterval(() => {
      const v = this.cooldownSeconds();
      if (v <= 0) return clearInterval(iv);
      this.cooldownSeconds.set(v - 1);
    }, 1000);
  }

  private resetAll(): void {
    this.isBusy.set(false);
    this.isSendingCode.set(false);
    this.error.set(null);
    this.cooldownSeconds.set(0);
    this.registrationToken.set(null);
  }
}
