import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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

type GradingScaleLimits = {
  upperLimit: string;
  lowerLimit: string;
} | null;

@Component({
  selector: 'jhi-application-creation-page2',
  standalone: true,
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
  imports: [
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
  translateService = inject(TranslateService);

  currentLang = toSignal(this.translateService.onLangChange);

  page2Form = this.formbuilder.group({
    bachelorDegreeName: ['', Validators.required],
    bachelorDegreeUniversity: ['', Validators.required],
    bachelorGradeUpperLimit: [''],
    bachelorGradeLowerLimit: [''],
    bachelorGrade: ['', Validators.required],
    masterDegreeName: ['', Validators.required],
    masterDegreeUniversity: ['', Validators.required],
    masterGradeUpperLimit: [''],
    masterGradeLowerLimit: [''],
    masterGrade: ['', Validators.required],
  });

  hasInitialized = signal(false);

  bachelorGradeLimits = signal<GradingScaleLimits>(null);
  masterGradeLimits = signal<GradingScaleLimits>(null);

  helperTextBachelorGrade = computed(() => {
    this.currentLang();
    const limits = this.bachelorGradeLimits();
    if (!limits) return '';

    return this.translateService.instant('entity.applicationPage2.helperText.gradingScale', {
      upperLimit: limits.upperLimit,
      lowerLimit: limits.lowerLimit,
    });
  });

  helperTextMasterGrade = computed(() => {
    this.currentLang();
    const limits = this.masterGradeLimits();
    if (!limits) return '';

    return this.translateService.instant('entity.applicationPage2.helperText.gradingScale', {
      upperLimit: limits.upperLimit,
      lowerLimit: limits.lowerLimit,
    });
  });

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

    if (data.bachelorGrade) {
      const bachelorLimits = this.detectGradingScale(data.bachelorGrade);
      this.bachelorGradeLimits.set(bachelorLimits);
    }
    if (data.masterGrade) {
      const masterLimits = this.detectGradingScale(data.masterGrade);
      this.masterGradeLimits.set(masterLimits);
    }

    this.page2Form.updateValueAndValidity();
    queueMicrotask(() => {
      this.changed.emit(false);
    });
  });

  private updateEffect = effect(() => {
    if (!this.hasInitialized()) return;

    const formData = this.formValue() as Partial<ApplicationCreationPage2Data>;

    const baGrade = formData.bachelorGrade ?? '';
    const bachelorLimits = this.detectGradingScale(baGrade);

    const maGrade = formData.masterGrade ?? '';
    const masterLimits = this.detectGradingScale(maGrade);

    this.bachelorGradeLimits.set(bachelorLimits);
    this.masterGradeLimits.set(masterLimits);

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

  detectGradingScale(grade: string): GradingScaleLimits {
    if (!grade || grade.trim() === '') {
      return null;
    }

    const trimmedGrade = grade.trim().toUpperCase();

    // Ignore multiple letters without modifiers
    if (/^[A-Z]{2,}$/.test(trimmedGrade)) {
      return null;
    }

    // Check for letter grades
    const letterResult = this.detectLetterGrade(trimmedGrade);
    if (letterResult) {
      return letterResult;
    }

    // Check for numeric grades
    return this.detectNumericGrade(trimmedGrade);
  }

  private detectLetterGrade(grade: string): GradingScaleLimits {
    const letterMatch = grade.match(/^([A-Z])([+\-*])?$/);
    if (!letterMatch) {
      return null;
    }

    const letter = letterMatch[1];
    const modifier = letterMatch[2];

    // If letter contains a modifier, add + to the upper bound
    const hasModifier = modifier === '+' || modifier === '-' || modifier === '*';
    const upperBound = hasModifier ? 'A+' : 'A';

    // If letter is between A and E, propose common range A to E
    if (letter >= 'A' && letter <= 'E') {
      return { upperLimit: upperBound, lowerLimit: 'E' };
    }

    // All other letters are uncommon, propose range A to the letter itself
    return { upperLimit: upperBound, lowerLimit: letter };
  }

  private detectNumericGrade(grade: string): GradingScaleLimits {
    const normalizedValue = grade.replace(',', '.');
    const numericValue = parseFloat(normalizedValue);

    // Ignore values below 1
    if (isNaN(numericValue) || numericValue < 1) {
      return null;
    }

    // Define grading scale ranges (order matters!)
    const gradingScales: {
      maxValue: number;
      upperLimit: string;
      lowerLimit: string;
      comment?: string;
    }[] = [
      { maxValue: 4.0, upperLimit: '1.0', lowerLimit: '4.0' }, // Cover range from 1.0 to 4.0 (f.e. German system)
      { maxValue: 6.0, upperLimit: '6.0', lowerLimit: '4.0' }, // Cover range from 4.0 to 6.0 (f.e. Swiss system)
      { maxValue: 10.0, upperLimit: '10', lowerLimit: '5' }, // Cover range from 6.0 to 10.0 (f.e. Spanish system)
      { maxValue: 20.0, upperLimit: '20', lowerLimit: '10' }, // Cover range from 10.0 to 20.0 (f.e. French system)
      { maxValue: 39.0, upperLimit: '40', lowerLimit: '20' }, // Cover range from 20.0 to 40.0 (no known systems, propose 40 - 20 for this range. Exclude 40 from this range as it's more likely to be the percentage range 100 - 40)
      { maxValue: 49.0, upperLimit: '100', lowerLimit: '40' }, // Cover range from 40.0 to 50.0 (f.e. percentage based systems => percentage 100 to 50 is more likely which is why this range is limited to 50)
      { maxValue: 100.0, upperLimit: '100', lowerLimit: '50' }, // Cover range from 50.0 to 100.0 (f.e. percentage based systems)
      { maxValue: 110.0, upperLimit: '110', lowerLimit: '66' }, // Cover range from 100.0 to 110.0 (f.e. Italian system)
    ];

    // Find the first matching scale
    for (const scale of gradingScales) {
      if (numericValue <= scale.maxValue) {
        return { upperLimit: scale.upperLimit, lowerLimit: scale.lowerLimit };
      }
    }

    // Values above 110: Propose range from value to value/2
    const lowerLimit = Math.round(numericValue / 2);
    return { upperLimit: numericValue.toString(), lowerLimit: lowerLimit.toString() };
  }
}
