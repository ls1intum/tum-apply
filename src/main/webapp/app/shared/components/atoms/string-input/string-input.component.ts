import { Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import SharedModule from 'app/shared/shared.module';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'jhi-string-input',
  imports: [SharedModule, InputTextModule, FontAwesomeModule],
  templateUrl: './string-input.component.html',
  styleUrl: './string-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StringInputComponent),
      multi: true,
    },
  ],
})
export class StringInputComponent implements ControlValueAccessor {
  label = input<string>('');
  value = model.required<string>();
  icon = input<string | undefined>(undefined);
  id = input<string>();
  disabled = input<boolean>(false);
  private _disabled = signal<boolean>(this.disabled());
  readonly disabledComputed = computed(() => this._disabled());
  required = input<boolean>(false);
  area = input<boolean>(false);

  private onChange: (_: any) => void = () => {};
  private onTouched: () => void = () => {};

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value.set(input.value);
  }

  writeValue(value: string): void {
    this.value.set(value);
  }

  registerOnChange(fn: (_: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }
}
