import { Component, input, signal } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { InputOtpChangeEvent, InputOtpModule } from 'primeng/inputotp';

import { ButtonComponent } from '../../atoms/button/button.component';
import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { PasswordInputComponent } from '../../atoms/password-input/password-input';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'jhi-credentials-group',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    PasswordModule,
    InputOtpModule,
    InputTextModule,
    StringInputComponent,
    PasswordModule,
    MessageModule,
    FormsModule,
    PasswordInputComponent,
    TranslateModule,
  ],
  templateUrl: './credentials-group.component.html',
  styleUrl: './credentials-group.component.scss',
})
export class CredentialsGroupComponent {
  submitHandler = input.required<(credentials: { email: string; password?: string; otp?: string }) => Promise<boolean>>();
  showEmail = input<boolean>(true);
  showPassword = input<boolean>(true);
  showOtp = input<boolean>(false);
  submitLabel = input<string>();

  isSubmitting = false;
  otpLength = environment.otp.length;

  form = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>(''),
    otp: new FormControl<string>('', [Validators.pattern(/^[A-Z0-9]*$/), Validators.maxLength(this.otpLength)]),
  });
  submitError = signal<boolean>(false);

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const credentials = this.form.value as { email: string; password: string };
    await this.submitHandler()(credentials).then(success => {
      this.submitError.set(!success);
      this.afterSubmit(success);
    });
  }

  onOtpKeyDown(e: KeyboardEvent): void {
    // Block any non-alphanumeric character keys (allows navigation keys, backspace, etc.)
    if (e.key && e.key.length === 1 && !/[a-zA-Z0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }

  onOtpChange(event: InputOtpChangeEvent): void {
    const raw = (event.value ?? '').toString();
    // Normalize to uppercase and strip any non-alphanumerics
    const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.form.controls.otp.setValue(normalized, { emitEvent: false });
  }

  private afterSubmit(success: boolean): void {
    this.isSubmitting = false;

    if (success) {
      this.form.reset({}, { emitEvent: false });
      return;
    }

    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.form.updateValueAndValidity({ emitEvent: true });
  }
}
