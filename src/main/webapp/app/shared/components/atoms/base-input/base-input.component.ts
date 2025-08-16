import { AbstractControl, FormControl } from '@angular/forms';
import { Directive, Signal, computed, effect, inject, input, output, signal } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

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
  width = input<string>('100%');
  id = input<string | undefined>(undefined);
  shouldTranslate = input<boolean>(false); // Whether to translate the label and placeholder
  tooltipText = input<string | undefined>(undefined);
  autofocus = input<boolean>(false);
  errorEnabled = input<boolean>(true);

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
  translate = inject(TranslateService);
  langChange: Signal<LangChangeEvent | undefined> = toSignal(this.translate.onLangChange, { initialValue: undefined });
  errorMessage = computed<string | null>(() => {
    this.formValidityVersion();
    this.langChange();

    const ctrl = this.formControl();
    const errors = ctrl.errors;
    if (!errors) return null;
    const key = Object.keys(errors)[0];
    const val = errors[key];
    const defaults: Record<string, string> = {
      required: this.translate.instant('global.input.error.required'),
      minlength: this.translate.instant('global.input.error.minLength', { min: val?.requiredLength }),
      maxlength: this.translate.instant('global.input.error.maxLength', { max: val?.requiredLength }),
      pattern: this.translate.instant('global.input.error.pattern'),
      email: this.translate.instant('global.input.error.email'),
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

  // TODO: Add optional tooltip handling
}
