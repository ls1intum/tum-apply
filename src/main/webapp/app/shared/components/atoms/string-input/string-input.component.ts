import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AbstractControl, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'jhi-string-input',
  templateUrl: './string-input.component.html',
  styleUrl: './string-input.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, InputTextModule, ReactiveFormsModule],
})
export class StringInputComponent {
  control = input<AbstractControl | undefined>(undefined);
  disabled = input<boolean>(false);
  icon = input<string | undefined>(undefined);
  label = input<string | undefined>(undefined);
  placeholder = input<string | undefined>(undefined);
  required = input<boolean>(false);
  error = input<boolean>(false);
  model = input<string>('');
  modelChange = output<string>();
  labelPosition = input<'top' | 'left'>('top');
  width = input<string>('100%');
  id = input<string | undefined>(undefined);

  // State tracking
  isTouched = false;
  isFocused = false;

  // Safe FormControl accessor
  get formControl(): FormControl | undefined {
    const ctrl = this.control();
    return ctrl ? (ctrl as FormControl) : undefined;
  }

  onInputChange(value: string): void {
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
}
