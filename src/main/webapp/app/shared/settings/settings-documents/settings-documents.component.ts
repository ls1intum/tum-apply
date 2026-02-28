import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { CommonModule } from '@angular/common';
import { ApplicantDTO } from 'app/generated/model/applicantDTO';
import { AccountService } from 'app/core/auth/account.service';
import { debounceTime, distinctUntilChanged, firstValueFrom, map } from 'rxjs';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { toSignal } from '@angular/core/rxjs-interop';
import { DialogService } from 'primeng/dynamicdialog';
import { deepEqual } from 'app/core/util/deepequal-util';
import {
  GradingScaleLimitsResult,
  detectGradingScale,
  normalizeLimitsForGrade,
  shouldShowGradeWarning,
} from 'app/shared/util/grading-scale.utils';
import { GradingScaleEditDialogComponent } from 'app/application/application-creation/application-creation-page2/grading-scale-edit-dialog/grading-scale-edit-dialog';

import { StringInputComponent } from '../../components/atoms/string-input/string-input.component';
import { ButtonComponent } from '../../components/atoms/button/button.component';
import { UploadButtonComponent } from '../../components/atoms/upload-button/upload-button.component';

@Component({
  selector: 'jhi-settings-documents',
  standalone: true,
  imports: [
    CommonModule,
    DividerModule,
    ReactiveFormsModule,
    StringInputComponent,
    TranslateModule,
    ButtonComponent,
    TooltipModule,
    FontAwesomeModule,
    UploadButtonComponent,
  ],
  templateUrl: './settings-documents.component.html',
})
export class SettingsDocumentsComponent implements OnInit {
  fb = inject(FormBuilder);

  form = this.fb.group({
    bachelorDegreeName: [''],
    bachelorDegreeUniversity: [''],
    bachelorGradeUpperLimit: [''],
    bachelorGradeLowerLimit: [''],
    bachelorGrade: [''],
    masterDegreeName: [''],
    masterDegreeUniversity: [''],
    masterGradeUpperLimit: [''],
    masterGradeLowerLimit: [''],
    masterGrade: [''],
  });

  // Document tracking for upload components
  bachelorDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  masterDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  cvDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  referenceDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);

  // Placeholder ID to render the same upload UI structure as application page 2.
  applicationIdForDocuments = signal<string>('00000000-0000-0000-0000-000000000000');

  saving = signal(false);
  hasLoaded = signal(false);
  bachelorGradeLimits = signal<GradingScaleLimitsResult>(null);
  masterGradeLimits = signal<GradingScaleLimitsResult>(null);
  lastBachelorGrade = signal<string>(this.form.controls.bachelorGrade.value ?? '');
  lastMasterGrade = signal<string>(this.form.controls.masterGrade.value ?? '');
  initialFormValue = signal(this.form.getRawValue());
  initialBachelorDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  initialMasterDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  initialCvDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  initialReferenceDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);

  queuedBachelorFiles = signal<File[]>([]);
  queuedMasterFiles = signal<File[]>([]);
  queuedCvFiles = signal<File[]>([]);
  queuedReferenceFiles = signal<File[]>([]);

  hasFormChanges = computed(() => this.hasLoaded() && !deepEqual(this.normalizedFormValue(), this.initialFormValue()));
  hasDocumentChanges = computed(() => {
    if (!this.hasLoaded()) return false;
    return (
      !deepEqual(this.normalizedDocuments(this.bachelorDocuments()), this.normalizedDocuments(this.initialBachelorDocuments())) ||
      !deepEqual(this.normalizedDocuments(this.masterDocuments()), this.normalizedDocuments(this.initialMasterDocuments())) ||
      !deepEqual(this.normalizedDocuments(this.cvDocuments()), this.normalizedDocuments(this.initialCvDocuments())) ||
      !deepEqual(this.normalizedDocuments(this.referenceDocuments()), this.normalizedDocuments(this.initialReferenceDocuments()))
    );
  });
  hasChanges = computed(() => this.hasFormChanges() || this.hasDocumentChanges());

  private applicationService = inject(ApplicationResourceApiService);
  private toastService = inject(ToastService);
  private accountService = inject(AccountService);
  private translateService = inject(TranslateService);
  private dialogService = inject(DialogService);

  private currentLang = toSignal(this.translateService.onLangChange);
  private formChangeTick = toSignal(this.form.valueChanges.pipe(map(() => Date.now())), { initialValue: 0 });

  private bachelorGradeValue = toSignal(this.form.controls.bachelorGrade.valueChanges.pipe(debounceTime(500), distinctUntilChanged()), {
    initialValue: this.form.controls.bachelorGrade.value,
  });
  private masterGradeValue = toSignal(this.form.controls.masterGrade.valueChanges.pipe(debounceTime(500), distinctUntilChanged()), {
    initialValue: this.form.controls.masterGrade.value,
  });

  helperTextBachelorGrade = computed(() => {
    this.currentLang();
    const limits = this.bachelorGradeLimits();
    if (!limits) return '';

    const scale = this.translateService.instant('entity.applicationPage2.helperText.scale') as string;
    const gradingScale = this.translateService.instant('entity.applicationPage2.helperText.gradingScale', {
      upperLimit: limits.upperLimit,
      lowerLimit: limits.lowerLimit,
    }) as string;

    return `${scale}${gradingScale}`;
  });

  helperTextMasterGrade = computed(() => {
    this.currentLang();
    const limits = this.masterGradeLimits();
    if (!limits) return '';

    const scale = this.translateService.instant('entity.applicationPage2.helperText.scale') as string;
    const gradingScale = this.translateService.instant('entity.applicationPage2.helperText.gradingScale', {
      upperLimit: limits.upperLimit,
      lowerLimit: limits.lowerLimit,
    }) as string;

    return `${scale}${gradingScale}`;
  });

  warningTextBachelorGrade = computed(() => {
    this.currentLang();
    const grade = this.bachelorGradeValue() ?? '';
    return shouldShowGradeWarning(grade) ? this.translateService.instant('entity.applicationPage2.warnText') : '';
  });

  warningTextMasterGrade = computed(() => {
    this.currentLang();
    const grade = this.masterGradeValue() ?? '';
    return shouldShowGradeWarning(grade) ? this.translateService.instant('entity.applicationPage2.warnText') : '';
  });

  private bachelorGradeEffect = effect(() => {
    const grade = this.bachelorGradeValue();
    if (grade === undefined) return;
    if (grade === this.lastBachelorGrade()) return;
    this.updateBachelorGradeLimits(grade ?? '');
  });

  private masterGradeEffect = effect(() => {
    const grade = this.masterGradeValue();
    if (grade === undefined) return;
    if (grade === this.lastMasterGrade()) return;
    this.updateMasterGradeLimits(grade ?? '');
  });

  ngOnInit(): void {
    void this.loadProfile();
  }

  onChangeGradingScale(gradeType: 'bachelor' | 'master'): void {
    const currentUpperLimit =
      gradeType === 'bachelor'
        ? (this.form.get('bachelorGradeUpperLimit')?.value ?? '')
        : (this.form.get('masterGradeUpperLimit')?.value ?? '');

    const currentLowerLimit =
      gradeType === 'bachelor'
        ? (this.form.get('bachelorGradeLowerLimit')?.value ?? '')
        : (this.form.get('masterGradeLowerLimit')?.value ?? '');

    const dialogRef = this.dialogService.open(GradingScaleEditDialogComponent, {
      header: this.translateService.instant('entity.applicationPage2.helperText.changeScale'),
      width: '40rem',
      style: { background: 'var(--color-background-default)' },
      closable: true,
      draggable: false,
      modal: true,
      data: {
        gradeType,
        currentGrade: gradeType === 'bachelor' ? this.form.get('bachelorGrade')?.value : this.form.get('masterGrade')?.value,
        currentUpperLimit,
        currentLowerLimit,
      },
    });

    dialogRef?.onClose.subscribe((result?: { upperLimit: string; lowerLimit: string }) => {
      if (!result) return;
      if (gradeType === 'bachelor') {
        this.form.patchValue({
          bachelorGradeUpperLimit: result.upperLimit,
          bachelorGradeLowerLimit: result.lowerLimit,
        });
        this.bachelorGradeLimits.set({ upperLimit: result.upperLimit, lowerLimit: result.lowerLimit });
      } else {
        this.form.patchValue({
          masterGradeUpperLimit: result.upperLimit,
          masterGradeLowerLimit: result.lowerLimit,
        });
        this.masterGradeLimits.set({ upperLimit: result.upperLimit, lowerLimit: result.lowerLimit });
      }
    });
  }

  async saveAll(): Promise<void> {
    if (!this.hasChanges() || this.saving()) {
      return;
    }

    this.saving.set(true);
    try {
      // update applicant profile fields
      const loadedUser = this.accountService.loadedUser();
      if (!loadedUser?.id) {
        this.toastService.showErrorKey('settings.documents.saveFailed');
        return;
      }

      const applicantDTO: ApplicantDTO = {
        user: { userId: loadedUser.id },
        bachelorDegreeName: this.form.get('bachelorDegreeName')?.value ?? undefined,
        bachelorUniversity: this.form.get('bachelorDegreeUniversity')?.value ?? undefined,
        bachelorGradeUpperLimit: this.form.get('bachelorGradeUpperLimit')?.value ?? undefined,
        bachelorGradeLowerLimit: this.form.get('bachelorGradeLowerLimit')?.value ?? undefined,
        bachelorGrade: this.form.get('bachelorGrade')?.value ?? undefined,
        masterDegreeName: this.form.get('masterDegreeName')?.value ?? undefined,
        masterUniversity: this.form.get('masterDegreeUniversity')?.value ?? undefined,
        masterGradeUpperLimit: this.form.get('masterGradeUpperLimit')?.value ?? undefined,
        masterGradeLowerLimit: this.form.get('masterGradeLowerLimit')?.value ?? undefined,
        masterGrade: this.form.get('masterGrade')?.value ?? undefined,
      };

      await firstValueFrom(this.applicationService.updateApplicantProfile(applicantDTO));
      await this.saveQueuedDocuments();
      this.storeInitialStateSnapshot();

      this.toastService.showSuccessKey('settings.documents.saved');
    } catch (err) {
      console.error(err);
      this.toastService.showErrorKey('settings.documents.saveFailed');
    } finally {
      this.saving.set(false);
    }
  }

  onBachelorQueuedFilesChange(files: File[]): void {
    this.queuedBachelorFiles.set(files);
  }

  onMasterQueuedFilesChange(files: File[]): void {
    this.queuedMasterFiles.set(files);
  }

  onCvQueuedFilesChange(files: File[]): void {
    this.queuedCvFiles.set(files);
  }

  onReferenceQueuedFilesChange(files: File[]): void {
    this.queuedReferenceFiles.set(files);
  }

  private async loadProfile(): Promise<void> {
    try {
      const profile = await firstValueFrom(this.applicationService.getApplicantProfile());

      this.form.patchValue({
        bachelorDegreeName: profile.bachelorDegreeName ?? '',
        bachelorDegreeUniversity: profile.bachelorUniversity ?? '',
        bachelorGradeUpperLimit: profile.bachelorGradeUpperLimit ?? '',
        bachelorGradeLowerLimit: profile.bachelorGradeLowerLimit ?? '',
        bachelorGrade: profile.bachelorGrade ?? '',
        masterDegreeName: profile.masterDegreeName ?? '',
        masterDegreeUniversity: profile.masterUniversity ?? '',
        masterGradeUpperLimit: profile.masterGradeUpperLimit ?? '',
        masterGradeLowerLimit: profile.masterGradeLowerLimit ?? '',
        masterGrade: profile.masterGrade ?? '',
      });

      const bachelorGrade = profile.bachelorGrade ?? '';
      const masterGrade = profile.masterGrade ?? '';
      this.lastBachelorGrade.set(bachelorGrade);
      this.lastMasterGrade.set(masterGrade);

      if (bachelorGrade) {
        if (profile.bachelorGradeUpperLimit && profile.bachelorGradeLowerLimit) {
          this.bachelorGradeLimits.set(
            normalizeLimitsForGrade(bachelorGrade, {
              upperLimit: profile.bachelorGradeUpperLimit,
              lowerLimit: profile.bachelorGradeLowerLimit,
            }),
          );
        } else {
          this.bachelorGradeLimits.set(detectGradingScale(bachelorGrade));
        }
      }

      if (masterGrade) {
        if (profile.masterGradeUpperLimit && profile.masterGradeLowerLimit) {
          this.masterGradeLimits.set(
            normalizeLimitsForGrade(masterGrade, {
              upperLimit: profile.masterGradeUpperLimit,
              lowerLimit: profile.masterGradeLowerLimit,
            }),
          );
        } else {
          this.masterGradeLimits.set(detectGradingScale(masterGrade));
        }
      }

      this.storeInitialStateSnapshot();
      this.hasLoaded.set(true);
    } catch (err) {
      console.error(err);
      this.toastService.showErrorKey('settings.documents.loadFailed');
    }
  }

  private updateBachelorGradeLimits(grade: string): void {
    this.lastBachelorGrade.set(grade);

    const limits = detectGradingScale(grade);
    this.bachelorGradeLimits.set(limits);

    this.form.patchValue({
      bachelorGradeUpperLimit: limits?.upperLimit ?? '',
      bachelorGradeLowerLimit: limits?.lowerLimit ?? '',
    });
  }

  private updateMasterGradeLimits(grade: string): void {
    this.lastMasterGrade.set(grade);

    const limits = detectGradingScale(grade);
    this.masterGradeLimits.set(limits);

    this.form.patchValue({
      masterGradeUpperLimit: limits?.upperLimit ?? '',
      masterGradeLowerLimit: limits?.lowerLimit ?? '',
    });
  }

  private normalizedFormValue() {
    this.formChangeTick();
    const value = this.form.getRawValue();
    return {
      bachelorDegreeName: value.bachelorDegreeName ?? '',
      bachelorDegreeUniversity: value.bachelorDegreeUniversity ?? '',
      bachelorGradeUpperLimit: value.bachelorGradeUpperLimit ?? '',
      bachelorGradeLowerLimit: value.bachelorGradeLowerLimit ?? '',
      bachelorGrade: value.bachelorGrade ?? '',
      masterDegreeName: value.masterDegreeName ?? '',
      masterDegreeUniversity: value.masterDegreeUniversity ?? '',
      masterGradeUpperLimit: value.masterGradeUpperLimit ?? '',
      masterGradeLowerLimit: value.masterGradeLowerLimit ?? '',
      masterGrade: value.masterGrade ?? '',
    };
  }

  private normalizedDocuments(docs: DocumentInformationHolderDTO[] | undefined): DocumentInformationHolderDTO[] {
    return [...(docs ?? [])].sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));
  }

  private storeInitialStateSnapshot(): void {
    this.initialFormValue.set(this.normalizedFormValue());
    this.initialBachelorDocuments.set(this.normalizedDocuments(this.bachelorDocuments()));
    this.initialMasterDocuments.set(this.normalizedDocuments(this.masterDocuments()));
    this.initialCvDocuments.set(this.normalizedDocuments(this.cvDocuments()));
    this.initialReferenceDocuments.set(this.normalizedDocuments(this.referenceDocuments()));

    this.queuedBachelorFiles.set([]);
    this.queuedMasterFiles.set([]);
    this.queuedCvFiles.set([]);
    this.queuedReferenceFiles.set([]);
  }

  private async saveQueuedDocuments(): Promise<void> {
    await this.uploadQueuedByType('BACHELOR_TRANSCRIPT', this.queuedBachelorFiles(), this.bachelorDocuments);
    await this.uploadQueuedByType('MASTER_TRANSCRIPT', this.queuedMasterFiles(), this.masterDocuments);
    await this.uploadQueuedByType('CV', this.queuedCvFiles(), this.cvDocuments);
    await this.uploadQueuedByType('REFERENCE', this.queuedReferenceFiles(), this.referenceDocuments);
  }

  private async uploadQueuedByType(
    documentType: 'BACHELOR_TRANSCRIPT' | 'MASTER_TRANSCRIPT' | 'CV' | 'REFERENCE',
    files: File[],
    targetSignal: {
      set: (value: DocumentInformationHolderDTO[] | undefined) => void;
    },
  ): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const uploadResults = await Promise.all(
      files.map(file => firstValueFrom(this.applicationService.uploadApplicantDocuments(documentType, file))),
    );

    const latestResult = uploadResults[uploadResults.length - 1];
    if (latestResult) {
      targetSignal.set(latestResult);
    }
  }
}
