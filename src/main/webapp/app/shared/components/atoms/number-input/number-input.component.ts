import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, input, output, signal } from '@angular/core';
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
export class NumberInputComponent implements OnInit {
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

  readonly formValidityVersion = signal(0);

  readonly inputState = computed(() => {
    this.formValidityVersion();

    if (!this.isTouched()) return 'untouched';
    if (this.formControl?.invalid === true) return 'invalid';
    return 'valid';
  });

  // State tracking
  isTouched = signal(false);
  isFocused = signal(false);

  get formControl(): FormControl | undefined {
    const ctrl = this.control();
    return ctrl ? (ctrl as FormControl) : undefined;
  }

  ngOnInit() {
    // Needed in order to trigger change of inputState
    const ctrl = this.formControl;
    if (ctrl) {
      ctrl.statusChanges.subscribe(() => {
        this.formValidityVersion.update(v => v + 1); // increment
      });
    }
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
    this.isTouched.set(true);
    this.isFocused.set(false);
  }

  onFocus(): void {
    this.isFocused.set(true);
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
