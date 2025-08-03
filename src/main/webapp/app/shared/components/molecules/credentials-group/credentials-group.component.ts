import { Component, Input, computed } from '@angular/core';
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
  @Input() submitHandler?: (credentials: { email: string; password: string }) => void;

  form = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    password: new FormControl<string>('', Validators.required),
  });
  formSubmitted = false;

  emailInvalid = computed(() => {
    const control = this.form.controls['email'];
    return control.invalid && (control.touched || this.formSubmitted);
  });

  passwordInvalid = computed(() => {
    const control = this.form.controls['password'];
    return control.invalid && (control.touched || this.formSubmitted);
  });

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.form.valid && this.submitHandler) {
      this.submitHandler(this.form.value as { email: string; password: string });
      this.form.reset();
      this.formSubmitted = false;
    }
  }
}
