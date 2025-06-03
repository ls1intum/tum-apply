import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AbstractControl, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { BaseInputDirective } from '../base-input/base-input.component';

@Component({
  selector: 'jhi-number-input',
  templateUrl: './number-input.component.html',
  styleUrl: './number-input.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, InputNumberModule, ReactiveFormsModule, InputNumberModule],
})
export class NumberInputComponent extends BaseInputDirective<number | undefined> {
  // Optional min and max values
  min = input<number | undefined>(undefined);
  max = input<number | undefined>(undefined);

  // Optional min and max fraction digits
  minFractionDigits = input<number | undefined>(undefined);
  maxFractionDigits = input<number | undefined>(undefined);

  errorMessage = computed<string | null>(() => {
    const ctrl = this.formControl();
    const errors = ctrl.errors;
    if (!errors) return null;
    const key = Object.keys(errors)[0];
    const val = errors[key];
    const defaults: Record<string, string> = {
      required: 'This field is required',
      min: `Minimum value is ${val.min}`,
      max: `Maximum value is ${val.max}`,
      pattern: 'Invalid format',
    };
    return defaults[key] ?? `Invalid: ${key}`;
  });

  onInputChange(value: number): void {
    this.modelChange.emit(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }
}
