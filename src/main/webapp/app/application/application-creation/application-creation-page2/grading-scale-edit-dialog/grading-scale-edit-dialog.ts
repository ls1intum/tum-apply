import { Component, computed, effect, inject, model } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { GradingScaleLimitsData } from 'app/shared/util/grading-scale.utils';

import { gradingScaleRangeValidator, gradingScaleTypeValidator } from './grading-scale-validators';

@Component({
  selector: 'jhi-grading-scale-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, ButtonComponent, StringInputComponent, FontAwesomeModule],
  templateUrl: './grading-scale-edit-dialog.html',
})
export class GradingScaleEditDialogComponent {
  dialogConfig = inject(DynamicDialogConfig);
  dialogRef = inject(DynamicDialogRef);
  formBuilder = inject(FormBuilder);

  currentGrade = this.dialogConfig.data?.currentGrade ?? '';

  data = model<GradingScaleLimitsData>({
    upperLimit: this.dialogConfig.data?.currentUpperLimit ?? '',
    lowerLimit: this.dialogConfig.data?.currentLowerLimit ?? '',
  });

  limitsForm = computed(() => {
    const currentData = this.data();

    return this.formBuilder.group(
      {
        upperLimit: [currentData.upperLimit, gradingScaleTypeValidator(() => this.currentGrade)],
        lowerLimit: [currentData.lowerLimit, gradingScaleTypeValidator(() => this.currentGrade)],
      },
      {
        validators: gradingScaleRangeValidator(() => this.currentGrade),
      },
    );
  });

  isValid = computed(() => {
    const upper = this.data().upperLimit.trim();
    const lower = this.data().lowerLimit.trim();

    // At least one field must be filled
    if (upper === '' || lower === '') {
      return false;
    }

    return this.limitsForm().valid;
  });

  syncFormToData = effect(onCleanup => {
    const form = this.limitsForm();

    const sub = form.valueChanges.subscribe(value => {
      const normalizedValue = Object.fromEntries(Object.entries(value).map(([key, val]) => [key, val ?? ''])) as GradingScaleLimitsData;

      this.data.set({
        ...this.data(),
        ...normalizedValue,
      });
    });

    onCleanup(() => sub.unsubscribe());
  });

  onSwap(): void {
    const upper = this.data().upperLimit;
    const lower = this.data().lowerLimit;

    this.data.set({
      upperLimit: lower,
      lowerLimit: upper,
    });
  }

  onSave(): void {
    if (this.isValid()) {
      this.dialogRef.close({
        upperLimit: this.data().upperLimit,
        lowerLimit: this.data().lowerLimit,
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
