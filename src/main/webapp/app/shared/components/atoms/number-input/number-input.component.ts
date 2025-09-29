import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateDirective } from 'app/shared/language';

import { BaseInputDirective } from '../base-input/base-input.component';

@Component({
  selector: 'jhi-number-input',
  templateUrl: './number-input.component.html',
  styleUrl: './number-input.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    InputNumberModule,
    ReactiveFormsModule,
    InputNumberModule,
    TooltipModule,
    TranslateDirective,
  ],
})
export class NumberInputComponent extends BaseInputDirective<number | undefined> {
  // Min and max values
  min = input<number>(0);
  max = input<number>(100);

  // Min and max fraction digits
  minFractionDigits = input<number>(0);
  maxFractionDigits = input<number>(3);

  smallerThanMin = computed<boolean>(() => {
    const model = this.model();
    return model !== undefined && model < this.min();
  });
  largerThanMax = computed<boolean>(() => {
    const model = this.model();
    return model !== undefined && model > this.max();
  });

  onInputChange(value: number): void {
    this.modelChange.emit(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }
}
