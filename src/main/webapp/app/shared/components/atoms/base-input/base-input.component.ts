import { AbstractControl, FormControl } from '@angular/forms';
import { Directive, Signal, computed, effect, inject, input, output, signal } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

let nextId = 0;

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
  customErrorKey = input<string | undefined>(undefined);
  helperTextLeft = input<string | undefined>(undefined);
  helperTextRight = input<string | undefined>(undefined);
  helperTextRightClick = output();

  readonly formValidityVersion = signal(0);
  isFocused = signal(false);

  formControl = computed(() => {
    const ctrl = this.control();
    return ctrl instanceof FormControl ? ctrl : new FormControl('');
  });

  isTouched = computed(() => {
    this.formValidityVersion();
    const ctrl = this.formControl();

    if (this._isTouched()) return true;

    if (ctrl.touched && ctrl.errors) {
      const errorKeys = Object.keys(ctrl.errors);
      const hasNonRequiredErrors = errorKeys.some(key => key !== 'required');
      return hasNonRequiredErrors;
    }

    return false;
  });

  inputId = computed(() => this.id() ?? `jhi-input-${nextId++}`);

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
    const customKey = this.customErrorKey();
    if (customKey) {
      return this.translate.instant(customKey);
    }
    const key = Object.keys(errors)[0];
    const val = errors[key];
    const defaults: Record<string, string> = {
      required: this.translate.instant('global.input.error.required'),
      minlength: this.translate.instant('global.input.error.minLength', { min: val?.requiredLength }),
      maxlength: this.translate.instant('global.input.error.maxLength', { max: val?.requiredLength }),
      pattern: this.translate.instant('global.input.error.pattern'),
      email: this.translate.instant('global.input.error.email'),
      invalidPostalCode: this.translate.instant('entity.applicationPage1.validation.postalCode'),
      min: this.translate.instant('global.input.error.min', { min: val?.min }),
      max: this.translate.instant('global.input.error.max', { max: val?.max }),
      tooManyDecimals: this.translate.instant('global.input.error.tooManyDecimals'),
      invalidLimitType: this.translate.instant('global.input.error.invalidLimitType'),
      formatMismatch: this.translate.instant('global.input.error.formatMismatch'),
      boundaryMismatch: this.translate.instant('global.input.error.boundaryMismatch'),
      outOfRange: this.translate.instant('global.input.error.outOfRange'),
    };
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      return defaults[key];
    }
    return `Invalid: ${key}`;
  });

  private _isTouched = signal(false);

  constructor() {
    effect(onCleanup => {
      const sub = this.formControl().statusChanges.subscribe(() => {
        this.formValidityVersion.update(v => v + 1);
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  onBlur(): void {
    this._isTouched.set(true);
    this.isFocused.set(false);
  }

  onFocus(): void {
    this.isFocused.set(true);
  }

  protected markAsTouchedManually(): void {
    this._isTouched.set(true);
  }

  // TODO: Add optional tooltip handling
}
