import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AbstractControl, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'jhi-string-input',
  templateUrl: './string-input.component.html',
  styleUrls: ['./string-input.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, InputTextModule, ReactiveFormsModule, TooltipModule],
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
  tooltipText = input<string | undefined>(undefined);

  readonly formValidityVersion = signal(0);
  // State tracking
  isTouched = signal(false);
  isFocused = signal(false);
  formControl = computed(() => {
    const ctrl = this.control();
    return ctrl instanceof FormControl ? ctrl : new FormControl('');
  });
  readonly inputState = computed(() => {
    this.formValidityVersion();
    if (!this.isTouched()) return 'untouched';
    if (this.formControl().invalid) return 'invalid';
    return 'valid';
  });
  errorMessage = computed<string | null>(() => {
    const ctrl = this.formControl();
    const errors = ctrl.errors;
    if (!errors) return null;
    const key = Object.keys(errors)[0];
    const val = errors[key];
    const defaults: Record<string, string> = {
      required: 'This field is required',
      minlength: `Minimum length is ${val.requiredLength}`,
      maxlength: `Maximum length is ${val.requiredLength}`,
      pattern: 'Invalid format',
    };
    return defaults[key] ?? `Invalid: ${key}`;
  });

  constructor() {
    effect(onCleanup => {
      const sub = this.formControl().statusChanges.subscribe(() => {
        this.formValidityVersion.update(v => v + 1);
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  onInputChange(value: string): void {
    this.modelChange.emit(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }

  onBlur(): void {
    this.isTouched.set(true);
    this.isFocused.set(false);
  }

  onFocus(): void {
    this.isFocused.set(true);
  }
}
