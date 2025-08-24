import { Component, Signal, computed, inject, input, signal } from '@angular/core';
import { InputOtpChangeEvent, InputOtpModule } from 'primeng/inputotp';
import { ButtonModule } from 'primeng/button';

import { environment } from '../../../../environments/environment';
import { BaseInputDirective } from '../base-input/base-input.component';
import { AuthService } from '../../../auth/data-access/auth.service';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'jhi-otp-input',
  standalone: true,
  imports: [InputOtpModule, ButtonModule, ButtonComponent],
  templateUrl: './otp-input.html',
  styleUrl: './otp-input.scss',
})
export class OtpInput extends BaseInputDirective<string | undefined> {
  authService = inject(AuthService);
  authOrchestratorService = inject(AuthOrchestratorService);

  registration = input<boolean>(false);

  busy: Signal<boolean> = computed(() => (this.authService as any)['S']?.isBusy?.() ?? false);

  // Number of characters the OTP should have
  length = environment.otp.length;
  // Cooldown in seconds for the resend button
  cooldownSeconds = computed(() => this.authOrchestratorService.cooldownSeconds());

  // disable resend if busy or in cooldown
  readonly disableResend: Signal<boolean> = computed(() => this.busy() || this.cooldownSeconds() > 0);
  // local state of the current OTP value
  readonly valueSig = signal<string>('');
  // derived states
  readonly disabledSubmit = computed(() => this.busy() || this.valueSig().length === this.length);

  onKeyDown(e: KeyboardEvent): void {
    // Block any non-alphanumeric character keys (allows navigation keys, backspace, etc.)
    if (e.key && e.key.length === 1 && !/[a-zA-Z0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }

  onChange(event: InputOtpChangeEvent): void {
    const raw = (event.value ?? '').toString();
    // Normalize to uppercase and strip any non-alphanumerics
    const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.valueSig.set(normalized);
    this.modelChange.emit(normalized);
    const ctrl = this.formControl();
    ctrl.setValue(normalized);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }

  onSubmit(): void {
    if (!this.disabledSubmit()) {
      const otp = this.valueSig();
      void this.authService.verifyOtp(otp, this.registration());
    }
  }

  onResend(): void {
    if (!this.disableResend()) {
      void this.authService.sendOtp(this.registration());
    }
  }
}
