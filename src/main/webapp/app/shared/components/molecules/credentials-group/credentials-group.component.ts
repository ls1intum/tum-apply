import { Component, inject, input, signal } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button/button.component';
import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { PasswordInputComponent } from '../../atoms/password-input/password-input';
import { environment } from '../../../../environments/environment';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';

@Component({
  selector: 'jhi-credentials-group',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    PasswordModule,
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
  authOrchestrator = inject(AuthOrchestratorService);

  submitHandler = input.required<(credentials: { email: string; password?: string; otp?: string }) => Promise<boolean>>();
  showPassword = input<boolean>(true);
  submitLabel = input<string>('auth.login.emailLogin.login');

  isSubmitting = false;
  otpLength = environment.otp.length;

  form = new FormGroup({
    email: new FormControl<string>(this.authOrchestrator.email(), {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
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
