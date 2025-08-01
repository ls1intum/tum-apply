import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { Password } from 'primeng/password';

import { BaseInputDirective } from '../base-input/base-input.component';

@Component({
  selector: 'jhi-password-input',
  imports: [CommonModule, FormsModule, FontAwesomeModule, InputTextModule, ReactiveFormsModule, TooltipModule, Password],
  templateUrl: './password-input.html',
  styleUrl: './password-input.scss',
  standalone: true,
})
export class PasswordInputComponent extends BaseInputDirective<string> {
  tooltipText = input<string | undefined>(undefined);

  onInputChange(value: string): void {
    this.modelChange.emit(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }
}
