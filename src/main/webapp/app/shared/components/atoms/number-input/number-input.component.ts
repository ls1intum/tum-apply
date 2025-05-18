import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AbstractControl, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'jhi-number-input',
  templateUrl: './number-input.component.html',
  styleUrl: './number-input.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, InputNumberModule, ReactiveFormsModule, InputNumberModule],
})
export class NumberInputComponent {
  control = input<AbstractControl | undefined>(undefined);
  disabled = input<boolean>(false);
  icon = input<string | undefined>(undefined);
  label = input<string | undefined>(undefined);
  placeholder = input<string | undefined>(undefined);
  required = input<boolean>(false);
  error = input<boolean>(false);
  model = input<number | undefined>(undefined);
  modelChange = output<number>();
  labelPosition = input<'top' | 'left'>('top');
  width = input<string>('100%');
  inputId = input<string | undefined>(undefined);

  // Optional min and max values
  min = input<number | undefined>(undefined);
  max = input<number | undefined>(undefined);

  // Optional min and max fraction digits
  minFractionDigits = input<number | undefined>(undefined);
  maxFractionDigits = input<number | undefined>(undefined);

  // State tracking
  isTouched = false;
  isFocused = false;

  get formControl(): FormControl | undefined {
    const ctrl = this.control();
    return ctrl ? (ctrl as FormControl) : undefined;
  }

  onInputChange(value: number): void {
    this.modelChange.emit(value);

    if (this.formControl) {
      this.formControl.setValue(value);
      this.formControl.markAsDirty();
      this.formControl.updateValueAndValidity();
    }
  }

  onBlur(): void {
    this.isTouched = true;
    this.isFocused = false;
  }

  onFocus(): void {
    this.isFocused = true;
  }

  getInputState(): string {
    if (!this.isTouched) return 'untouched';
    if (this.formControl?.invalid) return 'invalid';
    return 'valid';
  }

  getErrorMessage(): string | null {
    const control = this.formControl;
    if (!control?.errors) return null;

    const firstErrorKey = Object.keys(control.errors)[0];
    const errorValue = control.errors[firstErrorKey];

    const defaultMessages: Record<string, string> = {
      required: 'This field is required',
      min: `Minimum value is ${errorValue?.min}`,
      max: `Maximum value is ${errorValue?.max}`,
      pattern: 'Invalid format',
    };

    return defaultMessages[firstErrorKey] ?? `Invalid: ${firstErrorKey}`;
  }
}
