import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { NumberInputComponent } from 'app/shared/components/atoms/number-input/number-input.component';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import TranslateDirective from 'app/shared/language/translate.directive';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { deepEqual } from 'app/core/util/deepequal-util';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { ApplicationForApplicantDTO } from '../../../generated/model/applicationForApplicantDTO';
import { DocumentInformationHolderDTO } from '../../../generated/model/documentInformationHolderDTO';

export type ApplicationCreationPage2Data = {
  bachelorDegreeName: string;
  bachelorDegreeUniversity: string;
  bachelorGradeUpperLimit: string;
  bachelorGradeLowerLimit: string;
  bachelorGrade: string;
  masterDegreeName: string;
  masterDegreeUniversity: string;
  masterGradeUpperLimit: string;
  masterGradeLowerLimit: string;
  masterGrade: string;
};

export const getPage2FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage2Data => {
  return {
    bachelorDegreeName: application.applicant?.bachelorDegreeName ?? '',
    bachelorDegreeUniversity: application.applicant?.bachelorUniversity ?? '',
    bachelorGradeUpperLimit: application.applicant?.bachelorGradeUpperLimit ?? '',
    bachelorGradeLowerLimit: application.applicant?.bachelorGradeLowerLimit ?? '',
    bachelorGrade: application.applicant?.bachelorGrade ?? '',
    masterDegreeName: application.applicant?.masterDegreeName ?? '',
    masterDegreeUniversity: application.applicant?.masterUniversity ?? '',
    masterGradeUpperLimit: application.applicant?.masterGradeUpperLimit ?? '',
    masterGradeLowerLimit: application.applicant?.masterGradeLowerLimit ?? '',
    masterGrade: application.applicant?.masterGrade ?? '',
  };
};

function isNumeric(val: string): boolean {
  const trimmed = val.trim();
  return /^\d+$/.test(trimmed) || /^\d+[.,]\d{1,2}$/.test(trimmed);
}

function isLetter(val: string): boolean {
  return /^[A-Za-z][+-]?$/.test(val.trim());
}

function isPercentage(val: string): boolean {
  const trimmed = val.trim();
  return /^\d+%$/.test(trimmed) || /^\d+[.,]\d{1,2}%$/.test(trimmed);
}

function cleanLetter(val: string): string {
  return val.replace(/[+-]/g, '').toUpperCase().trim();
}

function parseNumeric(val: string): number {
  return parseFloat(val.replace('%', '').replace(',', '.'));
}

function toggleError(ctrl: AbstractControl | null | undefined, key: string, shouldSet: boolean): void {
  if (!ctrl) return;

  if (shouldSet) {
    const errors: ValidationErrors = Object.create(null);
    Object.assign(errors, ctrl.errors ?? {});
    errors[key] = true;
    ctrl.setErrors(errors);
  } else {
    if (!ctrl.errors || !(key in ctrl.errors)) return;
    const rest = Object.fromEntries(Object.entries(ctrl.errors).filter(([k]) => k !== key));
    ctrl.setErrors(Object.keys(rest).length ? rest : null);
  }
}

function hasTooManyDecimals(val: string): boolean {
  const trimmed = val.trim();
  return /^\d+[.,]\d{3,}%?$/.test(trimmed);
}

function validateFormat(ctrls: (AbstractControl | null)[], formats: ((val: string) => boolean)[]): string | null {
  for (const ctrl of ctrls) {
    const val = ctrl?.value;
    if (!val) continue;

    if (hasTooManyDecimals(val)) {
      toggleError(ctrl, 'tooManyDecimals', true);
      return 'tooManyDecimals';
    }

    const isValid = formats.some(fn => fn(val));
    toggleError(ctrl, 'invalidGrade', !isValid);
    toggleError(ctrl, 'tooManyDecimals', false);

    if (!isValid) return 'invalidGrade';
  }
  return null;
}

function validateSameFormat(values: string[]): 'numeric' | 'letter' | 'percentage' | null {
  if (values.every(isNumeric)) return 'numeric';
  if (values.every(isLetter)) return 'letter';
  if (values.every(isPercentage)) return 'percentage';
  return null;
}

function validateBoundaryMismatch(format: string, upper: string, lower: string): boolean {
  if (format === 'percentage') {
    return parseNumeric(upper) < parseNumeric(lower);
  }

  const upperClean = cleanLetter(upper);
  const lowerClean = cleanLetter(lower);
  if (upperClean > lowerClean) return true;

  if (upperClean === lowerClean) {
    const upperSign = upper.slice(-1);
    const lowerSign = lower.slice(-1);

    return (!/[+-]/.test(upperSign) && lowerSign === '+') || (upperSign === '-' && (lowerSign === '+' || !/[+-]/.test(lowerSign)));
  }

  return false;
}

function validateGradeRange(format: string, upper: string, lower: string, grade: string): boolean {
  if (format === 'percentage') {
    const u = parseNumeric(upper);
    const l = parseNumeric(lower);
    const g = parseNumeric(grade);
    return g < l || g > u;
  }

  if (format === 'numeric') {
    const u = parseNumeric(upper);
    const l = parseNumeric(lower);
    const g = parseNumeric(grade);
    return (l > u && (g < u || g > l)) || (u >= l && (g > u || g < l));
  }

  const upperClean = cleanLetter(upper);
  const lowerClean = cleanLetter(lower);
  const gradeClean = cleanLetter(grade);
  const outside = gradeClean < upperClean || gradeClean > lowerClean;

  const sameAsUpper = gradeClean === upperClean;
  const sameAsLower = gradeClean === lowerClean;

  let forbidden = false;

  if (sameAsUpper) {
    if (upper.endsWith('-') && (!/[+-]$/.test(grade) || grade.endsWith('+'))) forbidden = true;
    else if (!/[+-]$/.test(upper) && grade.endsWith('+')) forbidden = true;
  }

  if (sameAsLower) {
    if (lower.endsWith('+') && (!/[+-]$/.test(grade) || grade.endsWith('-'))) forbidden = true;
    else if (!/[+-]$/.test(lower) && grade.endsWith('-')) forbidden = true;
  }

  return outside || forbidden;
}

export function gradeFormatValidator(upperLimitKey: string, lowerLimitKey: string, gradeKey: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const upper = control.get(upperLimitKey);
    const lower = control.get(lowerLimitKey);
    const grade = control.get(gradeKey);

    const values = [upper?.value, lower?.value, grade?.value];
    if (values.some(v => !v)) return null;

    // Check individual format validity
    const formatErr = validateFormat([upper, lower, grade], [isNumeric, isLetter, isPercentage]);
    if (formatErr) return { [formatErr]: true };

    // Check if all three values have the same format
    const format = validateSameFormat(values);
    if (!format) {
      [upper, lower, grade].forEach(ctrl => {
        toggleError(ctrl, 'formatMismatch', true);
      });
      return { formatMismatch: true };
    } else {
      [upper, lower, grade].forEach(ctrl => {
        toggleError(ctrl, 'formatMismatch', false);
      });
    }

    // Check if upper limit is greater than lower limit (not necessary for numeric to allow 1.0 to 4.0 (1.0<4.0) and 100 to 40 (100>40))
    if (format !== 'numeric') {
      if (validateBoundaryMismatch(format, upper!.value, lower!.value)) {
        toggleError(upper, 'boundaryMismatch', true);
        toggleError(lower, 'boundaryMismatch', true);
        return { boundaryMismatch: true };
      } else {
        toggleError(upper, 'boundaryMismatch', false);
        toggleError(lower, 'boundaryMismatch', false);
      }
    }

    // Check if grade is within the limits
    if (validateGradeRange(format, upper!.value, lower!.value, grade!.value)) {
      toggleError(grade, 'outOfRange', true);
      return { outOfRange: true };
    } else {
      toggleError(grade, 'outOfRange', false);
    }

    return null;
  };
}

@Component({
  selector: 'jhi-application-creation-page2',
  standalone: true,
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
  imports: [
    CommonModule,
    DividerModule,
    UploadButtonComponent,
    ReactiveFormsModule,
    StringInputComponent,
    TranslateModule,
    TooltipModule,
    FontAwesomeModule,
    TranslateDirective,
    NumberInputComponent,
  ],
})
export default class ApplicationCreationPage2Component {
  data = model<ApplicationCreationPage2Data>();

  applicationIdForDocuments = input<string | undefined>(undefined);
  documentIdsBachelorTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);
  documentIdsMasterTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);

  valid = output<boolean>();
  changed = output<boolean>();

  formbuilder = inject(FormBuilder);

  page2Form = this.formbuilder.group(
    {
      bachelorDegreeName: ['', Validators.required],
      bachelorDegreeUniversity: ['', Validators.required],
      bachelorGradeUpperLimit: ['', Validators.required],
      bachelorGradeLowerLimit: ['', Validators.required],
      bachelorGrade: ['', Validators.required],
      masterDegreeName: ['', Validators.required],
      masterDegreeUniversity: ['', Validators.required],
      masterGradeUpperLimit: ['', Validators.required],
      masterGradeLowerLimit: ['', Validators.required],
      masterGrade: ['', Validators.required],
    },
    {
      validators: [
        gradeFormatValidator('bachelorGradeUpperLimit', 'bachelorGradeLowerLimit', 'bachelorGrade'),
        gradeFormatValidator('masterGradeUpperLimit', 'masterGradeLowerLimit', 'masterGrade'),
      ],
    },
  );

  private hasInitialized = signal(false);

  private formValue = toSignal(this.page2Form.valueChanges.pipe(debounceTime(100), distinctUntilChanged(deepEqual)), {
    initialValue: this.page2Form.value,
  });

  private formStatus = toSignal(this.page2Form.statusChanges, {
    initialValue: this.page2Form.status,
  });

  private initializeFormEffect = effect(() => {
    if (this.hasInitialized()) return;
    const data = this.data();
    if (!data) return;

    this.page2Form.patchValue({
      bachelorDegreeName: data.bachelorDegreeName,
      bachelorDegreeUniversity: data.bachelorDegreeUniversity,
      bachelorGradeUpperLimit: data.bachelorGradeUpperLimit,
      bachelorGradeLowerLimit: data.bachelorGradeLowerLimit,
      bachelorGrade: data.bachelorGrade,
      masterDegreeName: data.masterDegreeName,
      masterDegreeUniversity: data.masterDegreeUniversity,
      masterGradeUpperLimit: data.masterGradeUpperLimit,
      masterGradeLowerLimit: data.masterGradeLowerLimit,
      masterGrade: data.masterGrade,
    });

    this.hasInitialized.set(true);

    // mark prefilled grade fields as touched to show validation errors right away
    const gradeFields = [
      'bachelorGradeUpperLimit',
      'bachelorGradeLowerLimit',
      'bachelorGrade',
      'masterGradeUpperLimit',
      'masterGradeLowerLimit',
      'masterGrade',
    ];

    gradeFields.forEach(fieldName => {
      const control = this.page2Form.get(fieldName);
      if (control?.value) {
        control.markAsTouched();
      }
    });

    this.page2Form.updateValueAndValidity();
  });

  private updateEffect = effect(() => {
    if (!this.hasInitialized()) return;

    const formData = this.formValue() as Partial<ApplicationCreationPage2Data>;
    const normalized = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, v])) as ApplicationCreationPage2Data;

    const updatedData = {
      ...this.data(),
      ...normalized,
    };

    if (!deepEqual(updatedData, this.data())) {
      this.data.set(updatedData);
      this.changed.emit(true);
    }

    this.valid.emit(this.page2Form.valid);
  });
}
