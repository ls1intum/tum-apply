import { Component, ViewEncapsulation, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';

import { ButtonComponent } from '../../atoms/button/button.component';
import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { PasswordInputComponent } from '../../atoms/password-input/password-input';
import { environment } from '../../../../environments/environment';
import { AuthOrchestratorService } from '../../../auth/data-access/auth-orchestrator.service';
import { AuthIdpButtons } from '../auth-idp-buttons/auth-idp-buttons';
import { TranslateDirective } from '../../../language';

type SubmitHandler = (email: string, password?: string) => Promise<boolean>;

@Component({
  selector: 'jhi-credentials-group',
  standalone: true,
  providers: [MessageService],
  imports: [
    AuthIdpButtons,
    ButtonComponent,
    CommonModule,
    DividerModule,
    PasswordInputComponent,
    ReactiveFormsModule,
    StringInputComponent,
    TranslateDirective,
    TranslateModule,
  ],
  templateUrl: './credentials-group.component.html',
  styleUrl: './credentials-group.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CredentialsGroupComponent {
  authOrchestrator = inject(AuthOrchestratorService);

  isLogin = input<boolean>(true);
  submitHandler = input.required<SubmitHandler>();
  showPassword = input<boolean>(true);

  submitLabel = computed(() => (this.isLogin() ? 'auth.login.buttons.continue' : 'auth.register.buttons.continue'));
  dividerLabel = computed(() => (this.isLogin() ? 'auth.login.texts.or' : 'auth.register.texts.or'));

  isSubmitting = false;
  otpLength = environment.otp.length;

  form = new FormGroup({
    email: new FormControl<string>(this.authOrchestrator.email(), {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.pattern(/.+\..{2,}$/)],
    }),
    password: new FormControl<string>(''),
    otp: new FormControl<string>('', [Validators.pattern(/^[A-Z0-9]*$/), Validators.maxLength(this.otpLength)]),
  });
  submitError = signal<boolean>(false);

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const credentials = this.form.value as { email: string; password: string };
    await this.submitHandler()(credentials.email, credentials.password).then(success => {
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
