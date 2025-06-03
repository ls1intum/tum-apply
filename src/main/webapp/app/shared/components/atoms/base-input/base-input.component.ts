import { AbstractControl, FormControl } from '@angular/forms';
import { Directive, computed, effect, input, output, signal } from '@angular/core';

@Directive()
export abstract class BaseInputDirective<T> {
  model = input<T>();
  modelChange = output<T>();

  control = input<AbstractControl | undefined>(undefined);
  disabled = input<boolean>(false);
  icon = input<string | undefined>(undefined);
  label = input<string | undefined>(undefined);
  placeholder = input<string | undefined>(undefined);
  required = input<boolean>(false);
  labelPosition = input<'top' | 'left'>('top');
  width = input<string>('100%');
  id = input<string | undefined>(undefined);

  readonly formValidityVersion = signal(0);
  isTouched = signal(false);
  isFocused = signal(false);

  formControl = computed(() => {
    const ctrl = this.control();
    return ctrl instanceof FormControl ? ctrl : new FormControl('');
  });

  inputState = computed(() => {
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
      minlength: `Minimum length is ${val?.requiredLength}`,
      maxlength: `Maximum length is ${val?.requiredLength}`,
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

  onBlur(): void {
    this.isTouched.set(true);
    this.isFocused.set(false);
  }

  onFocus(): void {
    this.isFocused.set(true);
  }
}
