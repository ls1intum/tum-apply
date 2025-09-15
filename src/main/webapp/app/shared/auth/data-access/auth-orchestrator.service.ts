import { Injectable, Injector, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, endWith, interval, startWith, switchMap, takeUntil, timer } from 'rxjs';

import { ApplyStep, AuthFlowMode, AuthOpenOptions, LoginStep, REGISTER_STEPS, RegisterStep } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthOrchestratorService {
  // high level dialog state
  readonly isOpen = signal(false);
  readonly mode = signal<AuthFlowMode>('login');
  // substates per flow
  loginStep = signal<LoginStep>('email');
  registerStep = signal<RegisterStep>('email');
  applyStep = signal<ApplyStep>('inline');
  // form state (shared across flows)
  readonly email = signal<string>('');
  readonly firstName = signal<string>('');
  readonly lastName = signal<string>('');
  // UX state
  readonly isBusy = signal(false);
  readonly isSendingCode = signal(false);
  readonly error = signal<string | null>(null);
  // progress for registration dialog
  readonly registerProgress = computed(() => {
    const idx = REGISTER_STEPS.indexOf(this.registerStep());
    return Math.max(idx + 1, 1);
  });
  readonly totalRegisterSteps = REGISTER_STEPS.length;
  // cooldown for OTP resend
  readonly cooldownUntil = signal<number | null>(null);
  readonly injector = inject(Injector);
  readonly _tick = toSignal(
    toObservable(this.cooldownUntil).pipe(
      switchMap(cooldownUntilTimestamp => {
        if (cooldownUntilTimestamp === null) {
          // No cooldown: no ticking, but keep initial value
          return EMPTY;
        }
        const remainingTimeInMs = Math.max(0, cooldownUntilTimestamp - Date.now());
        if (remainingTimeInMs === 0) {
          // Already expired: emit once to trigger recompute
          return timer(0);
        }
        // Tick every 250ms until cooldown end, then emit one final value
        return interval(250).pipe(takeUntil(timer(remainingTimeInMs)), endWith(0));
      }),
      startWith(0),
    ),
    { initialValue: 0, injector: this.injector },
  );
  readonly cooldownSeconds = computed(() => {
    // depend on _tick so this recomputes ~4x per second
    this._tick();
    const cooldownUntilTimestamp = this.cooldownUntil();
    if (cooldownUntilTimestamp === null) {
      return 0;
    }
    const remainingTimeInMs = cooldownUntilTimestamp - Date.now();
    return remainingTimeInMs <= 0 ? 0 : Math.ceil(remainingTimeInMs / 1000);
  });
  private onSuccessCb: (() => void) | undefined;

  // open the dialog in a specific mode
  open(opts?: AuthOpenOptions): void {
    this.resetAll();
    if (opts?.mode) this.mode.set(opts.mode);

    const prefill = opts?.prefill;
    if (prefill) {
      this.setIfPresent(prefill.email, value => this.email.set(value));
      this.setIfPresent(prefill.firstName, value => this.firstName.set(value));
      this.setIfPresent(prefill.lastName, value => this.lastName.set(value));
    }

    // choose sensible starting substates
    if (this.mode() === 'login') {
      this.loginStep.set('email');
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
    this.loginStep.set('email');
  }

  switchToRegister(): void {
    this.mode.set('register');
    this.registerStep.set('email');
  }

  clearError(): void {
    this.error.set(null);
  }

  setError(msg: string | null): void {
    this.error.set(msg);
  }

  nextRegisterStep(): void {
    const currentIndex = REGISTER_STEPS.indexOf(this.registerStep());
    if (currentIndex < REGISTER_STEPS.length - 1) {
      this.registerStep.set(REGISTER_STEPS[currentIndex + 1]);
    } else {
      this.close();
    }
  }

  previousRegisterStep(): void {
    const currentIndex = REGISTER_STEPS.indexOf(this.registerStep());
    if (currentIndex > 0) {
      this.registerStep.set(REGISTER_STEPS[currentIndex - 1]);
    }
  }

  startCooldown(): void {
    const cooldown = environment.otp.cooldown;
    const now = Date.now();
    this.cooldownUntil.set(now + Math.max(0, cooldown) * 1000);
  }

  // -------- Helpers ----------

  private setIfPresent(input: string | undefined, setter: (value: string) => void): void {
    const value = (input ?? '').replace(/\s+/g, ' ').trim();
    if (value) {
      setter(value);
    }
  }

  private resetAll(): void {
    this.isBusy.set(false);
    this.isSendingCode.set(false);
    this.error.set(null);
    this.cooldownUntil.set(null);
  }
}
