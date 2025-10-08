import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, model, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { NumberInputComponent } from 'app/shared/components/atoms/number-input/number-input.component';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import TranslateDirective from 'app/shared/language/translate.directive';

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

type FormatValidator = (value: string) => boolean;

function isNumeric(val: string): boolean {
  return /^[0-9]+([.,][0-9]+)?$/.test(val.trim());
}

function isLetter(val: string): boolean {
  return /^[A-Za-z][+-]?$/.test(val.trim());
}

function isPercentage(val: string): boolean {
  return /^[0-9]+([.,][0-9]+)?%$/.test(val.trim());
}

function cleanLetter(val: string): string {
  return val.replace(/[+-]/g, '').toUpperCase().trim();
}

function parseNumeric(val: string): number {
  return parseFloat(val.replace('%', '').replace(',', '.'));
}

function setError(ctrl: AbstractControl | null | undefined, key: string): void {
  if (!ctrl) return;
  const errors: ValidationErrors = { ...(ctrl.errors ?? {}) };
  errors[key] = true;
  ctrl.setErrors(errors);
}

function clearError(ctrl: AbstractControl | null | undefined, key: string): void {
  if (!ctrl?.errors || !(key in ctrl.errors)) return;

  const rest = Object.fromEntries(Object.entries(ctrl.errors).filter(([k]) => k !== key));

  ctrl.setErrors(Object.keys(rest).length ? rest : null);
}

function validateFormat(ctrls: (AbstractControl | null)[], formats: FormatValidator[]): string | null {
  for (const ctrl of ctrls) {
    const val = ctrl?.value;
    if (!val) continue;
    const isValid = formats.some(fn => fn(val));
    if (!isValid) {
      setError(ctrl, 'invalidGrade');
      return 'invalidGrade';
    } else {
      clearError(ctrl, 'invalidGrade');
    }
  }
  return null;
}

function validateSameFormat(values: string[]): 'numeric' | 'letter' | 'percentage' | null {
  const [u, l, g] = values;
  const allNumeric = isNumeric(u) && isNumeric(l) && isNumeric(g);
  const allLetters = isLetter(u) && isLetter(l) && isLetter(g);
  const allPercentages = isPercentage(u) && isPercentage(l) && isPercentage(g);

  if (allNumeric) return 'numeric';
  if (allLetters) return 'letter';
  if (allPercentages) return 'percentage';
  return null;
}

function validateBoundaryMismatch(format: string, upper: string, lower: string): boolean {
  if (format === 'numeric' || format === 'percentage') {
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
  if (format === 'numeric' || format === 'percentage') {
    const u = parseNumeric(upper);
    const l = parseNumeric(lower);
    const g = parseNumeric(grade);
    return g < l || g > u;
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

    // Step 1: individual format check
    const formatErr = validateFormat([upper, lower, grade], [isNumeric, isLetter, isPercentage]);
    if (formatErr) return { invalidGrade: true };

    // Step 2: same format check
    const format = validateSameFormat(values);
    if (!format) {
      [upper, lower, grade].forEach(ctrl => setError(ctrl, 'formatMismatch'));
      return { formatMismatch: true };
    } else {
      [upper, lower, grade].forEach(ctrl => clearError(ctrl, 'formatMismatch'));
    }

    // Step 3: boundary check
    if (validateBoundaryMismatch(format, upper!.value, lower!.value)) {
      setError(upper, 'boundaryMismatch');
      setError(lower, 'boundaryMismatch');
      return { boundaryMismatch: true };
    } else {
      clearError(upper, 'boundaryMismatch');
      clearError(lower, 'boundaryMismatch');
    }

    // Step 4: grade range check
    if (validateGradeRange(format, upper!.value, lower!.value, grade!.value)) {
      setError(grade, 'outOfRange');
      return { outOfRange: true };
    } else {
      clearError(grade, 'outOfRange');
    }

    return null;
  };
}

@Component({
  selector: 'jhi-application-creation-page2',
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
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
  standalone: true,
})
export default class ApplicationCreationPage2Component {
  data = model.required<ApplicationCreationPage2Data>();

  applicationIdForDocuments = input<string | undefined>(undefined);
  documentIdsBachelorTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);
  documentIdsMasterTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);

  valid = output<boolean>();
  changed = output<boolean>();

  formbuilder = inject(FormBuilder);
  page2Form = computed(() => {
    const currentData = this.data();
    const form = this.formbuilder.group(
      {
        bachelorDegreeName: [currentData.bachelorDegreeName, Validators.required],
        bachelorGradeUpperLimit: [currentData.bachelorGradeUpperLimit, Validators.required],
        bachelorGradeLowerLimit: [currentData.bachelorGradeLowerLimit, Validators.required],
        bachelorDegreeUniversity: [currentData.bachelorDegreeUniversity, Validators.required],
        bachelorGrade: [currentData.bachelorGrade, Validators.required],
        masterDegreeName: [currentData.masterDegreeName, Validators.required],
        masterDegreeUniversity: [currentData.masterDegreeUniversity, Validators.required],
        masterGradeUpperLimit: [currentData.masterGradeUpperLimit, Validators.required],
        masterGradeLowerLimit: [currentData.masterGradeLowerLimit, Validators.required],
        masterGrade: [currentData.masterGrade, Validators.required],
      },
      {
        validators: [
          gradeFormatValidator('bachelorGradeUpperLimit', 'bachelorGradeLowerLimit', 'bachelorGrade'),
          gradeFormatValidator('masterGradeUpperLimit', 'masterGradeLowerLimit', 'masterGrade'),
        ],
      },
    );

    return form;
  });

  constructor() {
    effect(onCleanup => {
      const form = this.page2Form();
      const valueSubscription = form.valueChanges.subscribe(value => {
        const normalizedValue = Object.fromEntries(Object.entries(value).map(([key, val]) => [key, val ?? '']));
        this.data.set({
          ...this.data(),
          ...normalizedValue,
        });

        this.valid.emit(form.valid);
        this.changed.emit(true);
      });

      const statusSubscription = form.statusChanges.subscribe(() => {
        this.valid.emit(form.valid);
      });

      this.valid.emit(form.valid);

      onCleanup(() => {
        valueSubscription.unsubscribe();
        statusSubscription.unsubscribe();
      });
    });
  }
}
