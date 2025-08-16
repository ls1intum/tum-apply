import { Component, Input, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PasswordModule } from 'primeng/password';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ButtonComponent } from '../../atoms/button/button.component';
import { StringInputComponent } from '../../atoms/string-input/string-input.component';
import { PasswordInputComponent } from '../../atoms/password-input/password-input';

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
  @Input() submitHandler?: (credentials: { email: string; password: string }) => Promise<boolean>;

  isSubmitting = false;
  form = new FormGroup({
    email: new FormControl<string>(''),
    password: new FormControl<string>(''),
  });
  readonly _formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  submitError = signal<string | null>(null);
  readonly visibleError = computed(() => {
    this._formValue();
    return this.form.dirty ? null : this.submitError();
  });

  private translate = inject(TranslateService);

  onSubmit(): void {
    if (this.form.invalid || !this.submitHandler) return;

    this.isSubmitting = true;
    const credentials = this.form.value as { email: string; password: string };

    this.submitHandler(credentials)
      .then(success => {
        if (success) {
          this.submitError.set(null);
        } else {
          this.submitError.set(this.translate.instant('login.messages.error.invalidCredentials'));
        }
        this.afterSubmit(success);
      })
      .catch(() => {
        this.submitError.set(this.translate.instant('login.messages.error.unexpected'));
        this.afterSubmit(false);
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
