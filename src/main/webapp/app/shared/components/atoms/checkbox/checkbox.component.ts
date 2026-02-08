import { Component, computed, forwardRef, inject } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  imports: [FormsModule, ReactiveFormsModule, CheckboxModule, TranslateModule, TranslateDirective, FontAwesomeModule, TooltipModule],
})
export class CheckboxComponent extends BaseInputDirective<boolean> {
  // Computed
  tooltipValue = computed(() => {
    const text = this.tooltipText();
    if (!text) return '';
    return this.shouldTranslate() ? this.translateService.instant(text) : text;
  });

  // Services
  private readonly translateService = inject(TranslateService);

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
