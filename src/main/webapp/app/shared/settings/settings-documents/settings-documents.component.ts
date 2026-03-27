import { Component, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import { ToastService } from 'app/service/toast-service';
import { CommonModule } from '@angular/common';
import { ApplicantDTO } from 'app/generated/model/applicant-dto';
import { ApplicationDocumentIdsDTO } from 'app/generated/model/application-document-ids-dto';
import { AccountService } from 'app/core/auth/account.service';
import { Observable, debounceTime, distinctUntilChanged, firstValueFrom, map } from 'rxjs';
import { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';
import { toSignal } from '@angular/core/rxjs-interop';
import { DialogService } from 'primeng/dynamicdialog';
import { deepEqual } from 'app/core/util/deepequal-util';
import {
  GradingScaleLimitsResult,
  getDetectedGradeLimitsPatch,
  getGradeHelperText,
  getGradeWarningText,
  resolveGradingScaleLimits,
} from 'app/shared/util/grading-scale.utils';
import { GradingScaleEditDialogComponent } from 'app/application/application-creation/application-creation-page2/grading-scale-edit-dialog/grading-scale-edit-dialog';
import { DegreeDocumentSectionComponent } from 'app/shared/components/molecules/degree-document-section/degree-document-section.component';

import { ButtonComponent } from '../../components/atoms/button/button.component';
import { UploadButtonComponent } from '../../components/atoms/upload-button/upload-button.component';

interface NormalizedSettingsDocumentsFormValue {
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
}

@Component({
  selector: 'jhi-settings-documents',
  standalone: true,
  imports: [
    CommonModule,
    DegreeDocumentSectionComponent,
    DividerModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonComponent,
    TooltipModule,
    FontAwesomeModule,
    UploadButtonComponent,
  ],
  templateUrl: './settings-documents.component.html',
})
export class SettingsDocumentsComponent {
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
  hasInitialLimitsSet = signal(false);
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

  helperTextBachelorGrade = computed(() => {
    this.currentLang();
    return getGradeHelperText(this.translateService, this.bachelorGradeLimits());
  });

  helperTextMasterGrade = computed(() => {
    this.currentLang();
    return getGradeHelperText(this.translateService, this.masterGradeLimits());
  });

  warningTextBachelorGrade = computed(() => {
    this.currentLang();
    const grade = this.bachelorGradeValue() ?? '';
    return getGradeWarningText(this.translateService, grade);
  });

  warningTextMasterGrade = computed(() => {
    this.currentLang();
    const grade = this.masterGradeValue() ?? '';
    return getGradeWarningText(this.translateService, grade);
  });

  private applicantService = inject(ApplicantResourceApi);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private accountService = inject(AccountService);
  private translateService = inject(TranslateService);
  private dialogService = inject(DialogService);

  private currentLang = toSignal(this.translateService.onLangChange);
  private formChangeTick = toSignal(this.form.valueChanges.pipe(map(() => Date.now())), { initialValue: 0 });

  private bachelorGradeValue = toSignal(this.form.controls.bachelorGrade.valueChanges.pipe(debounceTime(500), distinctUntilChanged()));
  private masterGradeValue = toSignal(this.form.controls.masterGrade.valueChanges.pipe(debounceTime(500), distinctUntilChanged()));

  private bachelorGradeEffect = effect(() => {
    if (!this.hasInitialLimitsSet()) return;

    const grade = this.bachelorGradeValue();
    if (grade == null) return;
    if (grade === this.lastBachelorGrade()) return;
    this.updateBachelorGradeLimits(grade);
  });

  private masterGradeEffect = effect(() => {
    if (!this.hasInitialLimitsSet()) return;

    const grade = this.masterGradeValue();
    if (grade == null) return;
    if (grade === this.lastMasterGrade()) return;
    this.updateMasterGradeLimits(grade);
  });

  constructor() {
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
      const loadedUser = this.accountService.loadedUser();
      if (loadedUser?.id == null || loadedUser.id === '') {
        this.toastService.showErrorKey('settings.documents.saveFailed');
        return;
      }

      const applicantDTO: ApplicantDTO = {
        user: {
          userId: loadedUser.id,
          email: undefined,
          firstName: undefined,
          lastName: undefined,
          phoneNumber: undefined,
          gender: undefined,
          nationality: undefined,
          birthday: undefined,
          website: undefined,
          linkedinUrl: undefined,
        },
        street: undefined,
        postalCode: undefined,
        city: undefined,
        country: undefined,
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

      await firstValueFrom(this.applicantService.updateApplicantDocumentSettings(applicantDTO));
      await this.saveDeferredDocumentChanges();
      await this.loadProfile();

      this.toastService.showSuccessKey('settings.documents.saved');
    } catch {
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

  // Loads the persisted profile + document state and resets the change-tracking baseline to that backend snapshot.
  private async loadProfile(): Promise<void> {
    try {
      this.hasInitialLimitsSet.set(false);

      const profile = await firstValueFrom(this.applicantService.getApplicantProfile());
      const profileDocumentIds = await firstValueFrom(this.applicantService.getApplicantProfileDocumentIds());
      this.applyProfileDocumentIds(profileDocumentIds);

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

      if (bachelorGrade !== '') {
        this.bachelorGradeLimits.set(
          resolveGradingScaleLimits(bachelorGrade, {
            upperLimit: profile.bachelorGradeUpperLimit,
            lowerLimit: profile.bachelorGradeLowerLimit,
          }),
        );
      } else {
        this.bachelorGradeLimits.set(null);
      }

      if (masterGrade !== '') {
        this.masterGradeLimits.set(
          resolveGradingScaleLimits(masterGrade, {
            upperLimit: profile.masterGradeUpperLimit,
            lowerLimit: profile.masterGradeLowerLimit,
          }),
        );
      } else {
        this.masterGradeLimits.set(null);
      }

      this.hasInitialLimitsSet.set(true);
      this.storeInitialStateSnapshot();
      this.hasLoaded.set(true);
    } catch {
      this.toastService.showErrorKey('settings.documents.loadFailed');
    }
  }

  private updateBachelorGradeLimits(grade: string): void {
    this.lastBachelorGrade.set(grade);
    const limits = getDetectedGradeLimitsPatch(grade);
    this.bachelorGradeLimits.set(resolveGradingScaleLimits(grade));

    this.form.patchValue({
      bachelorGradeUpperLimit: limits.upperLimit,
      bachelorGradeLowerLimit: limits.lowerLimit,
    });
  }

  private updateMasterGradeLimits(grade: string): void {
    this.lastMasterGrade.set(grade);
    const limits = getDetectedGradeLimitsPatch(grade);
    this.masterGradeLimits.set(resolveGradingScaleLimits(grade));

    this.form.patchValue({
      masterGradeUpperLimit: limits.upperLimit,
      masterGradeLowerLimit: limits.lowerLimit,
    });
  }

  private normalizedFormValue(): NormalizedSettingsDocumentsFormValue {
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

  // Sorts by stable backend id so document comparisons stay insensitive to UI ordering.
  private normalizedDocuments(docs: DocumentInformationHolderDTO[] | undefined): DocumentInformationHolderDTO[] {
    return Array.from(docs ?? [])
      .map(doc => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  // Persists the current form/document state as the new clean baseline after a successful load or save.
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

  private applyProfileDocumentIds(documentIds: ApplicationDocumentIdsDTO): void {
    this.bachelorDocuments.set(documentIds.bachelorDocumentDictionaryIds ?? []);
    this.masterDocuments.set(documentIds.masterDocumentDictionaryIds ?? []);
    this.cvDocuments.set(documentIds.cvDocumentDictionaryId != null ? [documentIds.cvDocumentDictionaryId] : []);
    this.referenceDocuments.set(documentIds.referenceDocumentDictionaryIds ?? []);
  }

  private async saveQueuedDocuments(): Promise<void> {
    await this.uploadQueuedByType('BACHELOR_TRANSCRIPT', this.queuedBachelorFiles(), this.bachelorDocuments);
    await this.uploadQueuedByType('MASTER_TRANSCRIPT', this.queuedMasterFiles(), this.masterDocuments);
    await this.uploadQueuedByType('CV', this.queuedCvFiles(), this.cvDocuments);
    await this.uploadQueuedByType('REFERENCE', this.queuedReferenceFiles(), this.referenceDocuments);
  }

  private async saveDeferredDocumentChanges(): Promise<void> {
    await this.commitDocumentTypeChanges(this.initialBachelorDocuments(), this.bachelorDocuments());
    await this.commitDocumentTypeChanges(this.initialMasterDocuments(), this.masterDocuments());
    await this.commitDocumentTypeChanges(this.initialCvDocuments(), this.cvDocuments());
    await this.commitDocumentTypeChanges(this.initialReferenceDocuments(), this.referenceDocuments());
    await this.saveQueuedDocuments();
  }

  private async commitDocumentTypeChanges(
    initialDocs: DocumentInformationHolderDTO[] | undefined,
    currentDocs: DocumentInformationHolderDTO[] | undefined,
  ): Promise<void> {
    // Only persisted documents participate in the diff; temporary placeholders are uploaded separately afterwards.
    const initial = this.normalizedDocuments(initialDocs);
    const currentPersistedDocs = this.normalizedDocuments(currentDocs).filter(doc => !this.isTemporaryDocument(doc));
    const currentById = new Map(currentPersistedDocs.map(doc => [doc.id, doc]));

    const deletedIds = initial.filter(doc => !currentById.has(doc.id)).map(doc => doc.id);
    const renamedDocs = currentPersistedDocs.flatMap(doc => {
      const initialDoc = initial.find(existing => existing.id === doc.id);
      const newName = doc.name?.trim();
      return initialDoc !== undefined && newName != null && newName !== '' && initialDoc.name !== doc.name ? [{ id: doc.id, newName }] : [];
    });

    for (const documentId of deletedIds) {
      await firstValueFrom(this.applicantService.deleteApplicantProfileDocument(documentId));
    }

    for (const document of renamedDocs) {
      await firstValueFrom(this.applicantService.renameApplicantProfileDocument(document.id, document.newName));
    }
  }

  private async uploadQueuedByType(
    documentType: 'BACHELOR_TRANSCRIPT' | 'MASTER_TRANSCRIPT' | 'CV' | 'REFERENCE',
    files: File[],
    targetSignal: {
      set: (_value: DocumentInformationHolderDTO[] | undefined) => void;
    },
  ): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const uploadResults = await Promise.all(files.map(file => firstValueFrom(this.uploadApplicantProfileDocument(documentType, file))));

    const latestResult: DocumentInformationHolderDTO[] | undefined = uploadResults[uploadResults.length - 1];
    targetSignal.set(latestResult);
  }

  private isTemporaryDocument(document: DocumentInformationHolderDTO): boolean {
    return document.id.startsWith('temp-');
  }

  private uploadApplicantProfileDocument(
    documentType: 'BACHELOR_TRANSCRIPT' | 'MASTER_TRANSCRIPT' | 'CV' | 'REFERENCE',
    file: File,
  ): Observable<DocumentInformationHolderDTO[]> {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<DocumentInformationHolderDTO[]>(`/api/applicants/profile/documents/${documentType}`, formData);
  }
}
