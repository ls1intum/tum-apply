import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { BaseInputDirective } from '../base-input/base-input.component';

@Component({
  selector: 'jhi-string-input',
  templateUrl: './string-input.component.html',
  styleUrls: ['./string-input.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, InputTextModule, ReactiveFormsModule, TooltipModule],
})
export class StringInputComponent extends BaseInputDirective<string> {
  tooltipText = input<string | undefined>(undefined);

  onInputChange(value: string): void {
    this.modelChange.emit(value);
    const ctrl = this.formControl();
    ctrl.setValue(value);
    ctrl.markAsDirty();
    ctrl.updateValueAndValidity();
  }
}
