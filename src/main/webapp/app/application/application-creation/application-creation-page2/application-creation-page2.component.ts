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
import { DialogService } from 'primeng/dynamicdialog';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { ApplicationForApplicantDTO } from '../../../generated/model/applicationForApplicantDTO';
import { DocumentInformationHolderDTO } from '../../../generated/model/documentInformationHolderDTO';
import { detectGradingScale, normalizeLimitsForGrade } from '../../../shared/util/grading-scale.utils';

import { GradingScaleEditDialogComponent } from './grading-scale-edit-dialog/grading-scale-edit-dialog';

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
  dialogService = inject(DialogService);

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
  hasInitialLimitsSet = signal(false);

  bachelorGradeLimits = signal<GradingScaleLimits>(null);
  masterGradeLimits = signal<GradingScaleLimits>(null);

  bachelorLimitsManuallySet = signal(false);
  masterLimitsManuallySet = signal(false);

  lastBachelorGrade = signal<string>('');
  lastMasterGrade = signal<string>('');

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

  private bachelorGradeValue = toSignal(this.page2Form.get('bachelorGrade')!.valueChanges.pipe(debounceTime(500), distinctUntilChanged()));

  private masterGradeValue = toSignal(this.page2Form.get('masterGrade')!.valueChanges.pipe(debounceTime(500), distinctUntilChanged()));

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
      this.lastBachelorGrade.set(data.bachelorGrade);

      if (data.bachelorGradeUpperLimit && data.bachelorGradeLowerLimit) {
        const normalized = normalizeLimitsForGrade(data.bachelorGrade, {
          upperLimit: data.bachelorGradeUpperLimit,
          lowerLimit: data.bachelorGradeLowerLimit,
        });

        this.bachelorGradeLimits.set(normalized);
        this.bachelorLimitsManuallySet.set(true);
      } else {
        const bachelorLimits = detectGradingScale(data.bachelorGrade);
        this.bachelorGradeLimits.set(bachelorLimits);
      }
    }
    if (data.masterGrade) {
      this.lastMasterGrade.set(data.masterGrade);

      if (data.masterGradeUpperLimit && data.masterGradeLowerLimit) {
        const normalized = normalizeLimitsForGrade(data.masterGrade, {
          upperLimit: data.masterGradeUpperLimit,
          lowerLimit: data.masterGradeLowerLimit,
        });

        this.masterGradeLimits.set(normalized);
        this.masterLimitsManuallySet.set(true);
      } else {
        const masterLimits = detectGradingScale(data.masterGrade);
        this.masterGradeLimits.set(masterLimits);
      }
    }

    this.hasInitialLimitsSet.set(true);

    this.page2Form.updateValueAndValidity();
    queueMicrotask(() => {
      this.changed.emit(false);
    });
  });

  private bachelorGradeEffect = effect(() => {
    if (!this.hasInitialLimitsSet()) return;

    const grade = this.bachelorGradeValue();
    if (grade === undefined) return;

    const gradeChanged = grade !== this.lastBachelorGrade();

    if (gradeChanged) {
      this.lastBachelorGrade.set(grade ?? '');
      this.bachelorLimitsManuallySet.set(false);

      const limits = detectGradingScale(grade ?? '');
      this.bachelorGradeLimits.set(limits);

      if (limits) {
        this.page2Form.patchValue(
          {
            bachelorGradeUpperLimit: limits.upperLimit,
            bachelorGradeLowerLimit: limits.lowerLimit,
          },
          { emitEvent: false },
        );
      }
    }
  });

  private masterGradeEffect = effect(() => {
    if (!this.hasInitialLimitsSet()) return;

    const grade = this.masterGradeValue();
    if (grade === undefined) return;

    const gradeChanged = grade !== this.lastMasterGrade();

    if (gradeChanged) {
      this.lastMasterGrade.set(grade ?? '');
      this.masterLimitsManuallySet.set(false);

      const limits = detectGradingScale(grade ?? '');
      this.masterGradeLimits.set(limits);

      if (limits) {
        this.page2Form.patchValue(
          {
            masterGradeUpperLimit: limits.upperLimit,
            masterGradeLowerLimit: limits.lowerLimit,
          },
          { emitEvent: false },
        );
      }
    }
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

  onChangeGradingScale(gradeType: 'bachelor' | 'master'): void {
    const currentUpperLimit =
      gradeType === 'bachelor'
        ? (this.page2Form.get('bachelorGradeUpperLimit')?.value ?? '')
        : (this.page2Form.get('masterGradeUpperLimit')?.value ?? '');

    const currentLowerLimit =
      gradeType === 'bachelor'
        ? (this.page2Form.get('bachelorGradeLowerLimit')?.value ?? '')
        : (this.page2Form.get('masterGradeLowerLimit')?.value ?? '');

    const dialogRef = this.dialogService.open(GradingScaleEditDialogComponent, {
      header: this.translateService.instant('entity.applicationPage2.helperText.changeScale'),
      width: '40rem',
      style: { background: 'var(--color-background-default)' },
      closable: true,
      draggable: false,
      modal: true,
      data: {
        gradeType,
        currentGrade: gradeType === 'bachelor' ? this.data()?.bachelorGrade : this.data()?.masterGrade,
        currentUpperLimit,
        currentLowerLimit,
      },
    });
    dialogRef?.onClose.subscribe((result?: { upperLimit: string; lowerLimit: string }) => {
      if (result) {
        if (gradeType === 'bachelor') {
          this.page2Form.patchValue({
            bachelorGradeUpperLimit: result.upperLimit,
            bachelorGradeLowerLimit: result.lowerLimit,
          });
          this.bachelorGradeLimits.set({ upperLimit: result.upperLimit, lowerLimit: result.lowerLimit });
          this.bachelorLimitsManuallySet.set(true);
        } else {
          this.page2Form.patchValue({
            masterGradeUpperLimit: result.upperLimit,
            masterGradeLowerLimit: result.lowerLimit,
          });
          this.masterGradeLimits.set({ upperLimit: result.upperLimit, lowerLimit: result.lowerLimit });
          this.masterLimitsManuallySet.set(true);
        }
      }
    });
  }
}
