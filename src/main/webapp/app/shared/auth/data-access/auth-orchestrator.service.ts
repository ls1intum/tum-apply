import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, endWith, interval, startWith, switchMap, takeUntil, timer } from 'rxjs';

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
  // cooldown for OTP resend
  readonly cooldownUntil = signal<number | null>(null);
  readonly injector = inject(Injector);
  readonly _tick = toSignal(
    toObservable(this.cooldownUntil).pipe(
      switchMap(until => {
        if (until == null) {
          // No cooldown: no ticking, but keep initial value
          return EMPTY;
        }
        const remaining = Math.max(0, until - Date.now());
        if (remaining === 0) {
          // Already expired: emit once to trigger recompute
          return timer(0);
        }
        // Tick every 250ms until cooldown end, then emit one final value
        return interval(250).pipe(takeUntil(timer(remaining)), endWith(0));
      }),
      startWith(0),
    ),
    { initialValue: 0, injector: this.injector },
  );
  readonly cooldownSeconds = computed(() => {
    // depend on _tick so this recomputes ~4x per second
    this._tick();
    const until = this.cooldownUntil();
    if (until == null) {
      return 0;
    }
    const ms = until - Date.now();
    return ms <= 0 ? 0 : Math.ceil(ms / 1000);
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

  startCooldown(): void {
    const cooldown = environment.otp.cooldown;
    const now = Date.now();
    this.cooldownUntil.set(now + Math.max(0, cooldown) * 1000);
  }

  private resetAll(): void {
    this.isBusy.set(false);
    this.isSendingCode.set(false);
    this.error.set(null);
    this.cooldownUntil.set(null);
    this.registrationToken.set(null);
  }
}
