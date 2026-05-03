import { Component, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CheckboxChangeEvent, CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import TranslateDirective from 'app/shared/language/translate.directive';

import { BaseInputDirective } from '../base-input/base-input.component';

@Component({
  selector: 'jhi-checkbox',
  templateUrl: './checkbox.component.html',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  imports: [FormsModule, ReactiveFormsModule, CheckboxModule, TranslateDirective, FontAwesomeModule, TooltipModule],
})
export class CheckboxComponent extends BaseInputDirective<boolean> {
  // Methods
  onCheckboxChange(event: CheckboxChangeEvent): void {
    const value = event.checked === true;
    this.modelChange.emit(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }
}
