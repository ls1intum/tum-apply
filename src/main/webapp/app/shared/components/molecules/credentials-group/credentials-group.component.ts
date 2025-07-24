import { Component, Input, inject } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';

import { ButtonComponent } from '../../atoms/button/button.component';

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
    PasswordModule,
    MessageModule,
    FormsModule,
  ],
  templateUrl: './credentials-group.component.html',
  styleUrl: './credentials-group.component.scss',
})
export class CredentialsGroupComponent {
  @Input() submitHandler?: (credentials: { email: string; password: string }) => void;

  form: FormGroup;
  formSubmitted = false;

  private fb = inject(FormBuilder);

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    this.formSubmitted = true;
    if (this.form.valid && this.submitHandler) {
      this.submitHandler(this.form.value);
      this.form.reset();
      this.formSubmitted = false;
    }
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return control?.invalid === true && (control.touched || this.formSubmitted);
  }
}
