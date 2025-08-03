import { CommonModule } from '@angular/common';
import { Component, forwardRef, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { BaseInputDirective } from '../base-input/base-input.component';

@Component({
  selector: 'jhi-string-input',
  templateUrl: './string-input.component.html',
  styleUrls: ['./string-input.component.scss'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StringInputComponent),
      multi: true,
    },
  ],
  imports: [CommonModule, FormsModule, FontAwesomeModule, InputTextModule, ReactiveFormsModule, TooltipModule],
})
export class StringInputComponent extends BaseInputDirective<string> implements ControlValueAccessor {
  tooltipText = input<string | undefined>(undefined);
  type = input<string>('text');

  onInputChange(value: string): void {
    this.modelChange.emit(value);
    this.onChange(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }

  writeValue(value: string): void {
    this.modelChange.emit(value);
  }

  registerOnChange(fn: () => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    const ctrl = this.formControl();
    if (isDisabled) {
      ctrl.disable({ emitEvent: false });
    } else {
      ctrl.enable({ emitEvent: false });
    }
  }

  private onChange: (value: string) => void = () => {};

  private onTouched: () => void = () => {};
}
