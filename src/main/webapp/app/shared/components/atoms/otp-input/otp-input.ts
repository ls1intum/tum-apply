import { Component, Signal, computed, inject, input, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { InputOtpChangeEvent, InputOtpModule } from 'primeng/inputotp';
import { ButtonModule } from 'primeng/button';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';

import { BaseInputDirective } from '../base-input/base-input.component';
import { ButtonComponent } from '../button/button.component';
import TranslateDirective from '../../../language/translate.directive';

@Component({
  selector: 'jhi-otp-input',
  standalone: true,
  imports: [InputOtpModule, ButtonModule, ButtonComponent, TranslateDirective, ReactiveFormsModule],
  templateUrl: './otp-input.html',
  styleUrl: './otp-input.scss',
})
export class OtpInput extends BaseInputDirective<string | undefined> {
  readonly config = inject(ApplicationConfigService);
  readonly authFacade = inject(AuthFacadeService);
  readonly authOrchestratorService = inject(AuthOrchestratorService);
  readonly translateService = inject(TranslateService);
  readonly breakpointObserver = inject(BreakpointObserver);
  readonly dynamicDialogConfig = inject(DynamicDialogConfig);

  // if the otp is for registration (true) or login (false)
  registration = input<boolean>(false);
  // Number of characters the OTP should have
  length = this.config.otp.length;
  ttlSeconds = this.config.otp.ttlSeconds;
  // Time-to-live for the OTP in minutes
  readonly ttlMinutes: number = Math.max(1, Math.ceil(this.ttlSeconds / 60));
  // Cooldown in seconds for the resend button
  cooldownSeconds = computed(() => this.authOrchestratorService.cooldownSeconds());
  onCooldown = computed(() => this.cooldownSeconds() > 0);
  isBusy: Signal<boolean> = computed(() => this.authOrchestratorService.isBusy());
  showError: Signal<boolean> = computed(() => this.authOrchestratorService.error() !== null);
  // local state of the current OTP value
  readonly otpValue = signal<string>('');
  // disable resend if busy or in cooldown
  readonly disableResend: Signal<boolean> = computed(() => this.isBusy() || this.onCooldown());
  // derived states
  readonly disabledSubmit = computed(() => this.showError() || this.isBusy() || this.otpValue().length !== this.length);
  // determine size of the OTP input based on screen size
  readonly otpSize = toSignal<'small' | 'large' | null>(
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.XLarge])
      .pipe(map(r => (r.breakpoints[Breakpoints.XLarge] ? 'large' : r.breakpoints[Breakpoints.XSmall] ? 'small' : null))),
    { initialValue: null },
  );

  // TODO: show error messages from server
  private readonly registrationOverride = signal<boolean | null>(null);
  private readonly isRegistration = computed(() => {
    const registrationOverride = this.registrationOverride();
    return registrationOverride ?? this.registration();
  });

  constructor() {
    super();
    const registration = this.dynamicDialogConfig.data?.registration;
    if (typeof registration === 'boolean') {
      this.registrationOverride.set(registration);
    }
  }

  // Localized instruction including TTL
  get resendLabel(): string {
    return this.onCooldown()
      ? this.translateService.instant('auth.common.otp.resendCooldown', { seconds: this.cooldownSeconds() })
      : this.translateService.instant('auth.common.otp.resend');
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
      return;
    }

    // Block any non-alphanumeric character keys (allows navigation keys, backspace, etc.)
    if (event.key.length === 1 && !/[a-zA-Z0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  onChange(event: InputOtpChangeEvent): void {
    this.authOrchestratorService.clearError();
    const raw = (event.value ?? '').toString();
    // Normalize to uppercase and strip any non-alphanumerics
    const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.setValue(normalized);
  }

  onSubmit(): void {
    this.authOrchestratorService.clearError();
    if (!this.disabledSubmit()) {
      const otp = this.otpValue();
      void this.authFacade.verifyOtp(otp, this.isRegistration());
    }
  }

  onResend(): void {
    if (!this.disableResend()) {
      this.authOrchestratorService.clearError();
      this.setValue('');
      void this.authFacade.requestOtp(this.isRegistration());
    }
  }

  private setValue(value: string): void {
    this.otpValue.set(value);
    this.modelChange.emit(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    if (value === '') {
      ctrl.markAsPristine();
    } else {
      ctrl.markAsDirty();
    }
    ctrl.updateValueAndValidity();
  }
}
