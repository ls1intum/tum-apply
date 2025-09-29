import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';
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
  min = input<number>(0);
  max = input<number>(100);

  minFractionDigits = input<number>(0);
  maxFractionDigits = input<number>(3);

  smallerThanMin = computed(() => {
    const model = this.model();
    return model !== undefined && model < this.min();
  });

  largerThanMax = computed(() => {
    const model = this.model();
    return model !== undefined && model > this.max();
  });

  correctingEffect = effect(() => {
    if (this.smallerThanMin() || this.largerThanMax()) {
      if (!this.clampingScheduled()) {
        this.clampingScheduled.set(true);
        this.timeoutRef = setTimeout(() => {
          this.correctValue();
          this.clampingScheduled.set(false);
        }, 2000);
      }
    } else {
      if (this.timeoutRef) {
        clearTimeout(this.timeoutRef);
        this.timeoutRef = undefined;
      }
      this.clampingScheduled.set(false);
    }
  });

  private clampingScheduled = signal(false);
  private timeoutRef: ReturnType<typeof setTimeout> | undefined = undefined;

  onInputChange(value: number | undefined): void {
    this.modelChange.emit(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }

  private correctValue(): void {
    const value = this.model();
    let corrected = value;

    if (value !== undefined) {
      if (value < this.min()) {
        corrected = this.min();
      } else if (value > this.max()) {
        corrected = this.max();
      }

      if (corrected !== value) {
        this.onInputChange(corrected);
      }
    }
  }
}
