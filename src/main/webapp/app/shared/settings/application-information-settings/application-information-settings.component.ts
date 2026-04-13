import { Component, computed, effect, inject, signal, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AiResourceApi } from 'app/generated/api/ai-resource-api';
import { UserResourceApi } from 'app/generated/api/user-resource-api';
import { DividerModule } from 'primeng/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { firstValueFrom, Observable, shareReplay } from 'rxjs';
import { ExtractedApplicationDataDTO } from 'app/generated/model/extracted-application-data-dto';
import { TranslateDirective } from 'app/shared/language';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import { ApplicantDTO } from 'app/generated/model/applicant-dto';
import { DocumentInformationHolderDTODocumentTypeEnum } from 'app/generated/model/document-information-holder-dto';
import { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';
import { selectCountries } from 'app/shared/language/countries';
import { selectNationality } from 'app/shared/language/nationalities';
import { selectGender } from 'app/shared/constants/genders';
import { postalCodeValidator } from 'app/shared/validators/custom-validators';
import { deepEqual } from 'app/core/util/deepequal-util';

import { SelectComponent, SelectOption } from '../../components/atoms/select/select.component';
import { DatePickerComponent } from '../../components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from '../../components/atoms/string-input/string-input.component';
import { ButtonComponent } from '../../components/atoms/button/button.component';
import { UploadButtonComponent } from '../../components/atoms/upload-button/upload-button.component';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { AiExtractionBoxComponent } from 'app/shared/components/molecules/ai-extraction-box/ai-extraction-box.component';

const activeExtractions = new Map<string, Observable<ExtractedApplicationDataDTO>>();

export interface ApplicationInformationData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender?: SelectOption;
  nationality?: SelectOption;
  dateOfBirth: string;
  website: string;
  linkedIn: string;
  street: string;
  city: string;
  country?: SelectOption;
  postcode: string;
}

interface ApplicationInformationSnapshot {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender?: string | number;
  nationality?: string | number;
  dateOfBirth: string;
  website: string;
  linkedIn: string;
  street: string;
  city: string;
  country?: string | number;
  postcode: string;
}

@Component({
  selector: 'jhi-application-information-settings',
  imports: [
    ReactiveFormsModule,
    DividerModule,
    SelectComponent,
    DatePickerComponent,
    StringInputComponent,
    TranslateModule,
    TranslateDirective,
    ButtonComponent,
    UploadButtonComponent,
    AiExtractionBoxComponent,
  ],
  templateUrl: './application-information-settings.component.html',
  standalone: true,
})
export class ApplicationInformationSettingsComponent {
  data = signal<ApplicationInformationData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: undefined,
    nationality: undefined,
    dateOfBirth: '',
    website: '',
    linkedIn: '',
    street: '',
    city: '',
    country: undefined,
    postcode: '',
  });

  isValid = signal<boolean>(false);
  loadedProfile = signal<ApplicantDTO | undefined>(undefined);
  initialDataSnapshot = signal<ApplicationInformationSnapshot | undefined>(undefined);
  hasChanges = computed(() => {
    const initial = this.initialDataSnapshot();
    if (initial === undefined) {
      return false;
    }
    const personalChanged = !deepEqual(this.toSnapshot(this.data()), initial);
    const cvChanged = !deepEqual(this.normalizedDocuments(this.cvDocuments()), this.normalizedDocuments(this.initialCvDocuments()));
    return personalChanged || cvChanged;
  });

  protected readonly UserShortDTORolesEnum = UserShortDTORolesEnum;
  readonly disabledEmail = true;

  readonly minDate = new Date(1900, 0, 1);
  readonly maxDate = (() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  })(); // ensures minimum age of 18
  readonly defaultBirthDate = new Date(2000, 0, 1);

  selectGenderLocal = selectGender;
  selectNationalityLocal = selectNationality;
  accountService = inject(AccountService);
  translate = inject(TranslateService);
  formbuilder = inject(FormBuilder);
  applicantApi = inject(ApplicantResourceApi);
  http = inject(HttpClient);
  aiApi = inject(AiResourceApi);
  userApi = inject(UserResourceApi);
  destroyRef = inject(DestroyRef);
  toastService = inject(ToastService);

  currentLang = toSignal(this.translate.onLangChange);

  // Computed signal that adds translated labels to country options for filtering
  selectCountriesLocal = computed(() => {
    void this.currentLang();

    return selectCountries
      .map(option => ({
        value: option.value,
        name: this.translate.instant(option.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // Computed signal that adds translated labels to nationality options for filtering
  selectNationalityComputed = computed(() => {
    void this.currentLang();

    return selectNationality
      .map(option => ({
        value: option.value,
        name: this.translate.instant(option.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  applicationInfoForm = computed(() => {
    const currentData = this.data();
    return this.formbuilder.group({
      firstName: [currentData.firstName],
      lastName: [currentData.lastName],
      email: [{ value: currentData.email, disabled: this.disabledEmail }, Validators.email],
      phoneNumber: [currentData.phoneNumber],

      street: [currentData.street],
      city: [currentData.city],
      country: [currentData.country],
      postcode: [currentData.postcode, [postalCodeValidator(() => this.data().country?.value as string)]],

      // Optional fields
      gender: [currentData.gender ?? null],
      nationality: [currentData.nationality ?? null],
      dateOfBirth: [currentData.dateOfBirth],
      website: [currentData.website],
      linkedIn: [currentData.linkedIn],
    });
  });

  // Document (CV) handling
  cvDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  initialCvDocuments = signal<DocumentInformationHolderDTO[] | undefined>(undefined);
  queuedCvFiles = signal<File[]>([]);

  // Placeholder ID to render the same upload UI structure as application page 2.
  applicationIdForDocuments = signal<string>('00000000-0000-0000-0000-000000000000');

  // AI extraction
  aiFeaturesEnabled = signal<boolean>(false);
  isExtractingAi = signal<boolean>(false);

  formEffect = effect(onCleanup => {
    const form = this.applicationInfoForm();
    const data = this.data();
    const valueSubscription = form.valueChanges.subscribe(() => {
      const normalizedValue = Object.fromEntries(Object.entries(form.getRawValue()).map(([key, val]) => [key, val ?? '']));
      const nextData: ApplicationInformationData = {
        firstName: normalizedValue.firstName as string,
        lastName: normalizedValue.lastName as string,
        email: normalizedValue.email as string,
        phoneNumber: normalizedValue.phoneNumber as string,
        gender: data.gender,
        nationality: data.nationality,
        dateOfBirth: data.dateOfBirth,
        website: normalizedValue.website as string,
        linkedIn: normalizedValue.linkedIn as string,
        street: normalizedValue.street as string,
        city: normalizedValue.city as string,
        country: data.country,
        postcode: normalizedValue.postcode as string,
      };
      this.data.set(nextData);
      this.isValid.set(form.valid);
    });

    const statusSubscription = form.statusChanges.subscribe(() => {
      this.isValid.set(form.valid);
    });

    this.isValid.set(form.valid);

    onCleanup(() => {
      valueSubscription.unsubscribe();
      statusSubscription.unsubscribe();
    });
  });

  // Restores spinner and re-subscribes if an extraction is still in flight from before navigation
  private restoreExtractionState = effect(() => {
    const appId = this.applicationIdForDocuments();
    if (!appId) return;

    const active$ = activeExtractions.get(appId);
    if (active$) {
      this.isExtractingAi.set(true);
      this.subscribeToExtraction(active$, appId);
    }
  });

  constructor() {
    // Load initial data from backend API
    void this.loadApplicationInformation();
    void this.loadAiConsent();
  }

  async loadApplicationInformation(): Promise<void> {
    try {
      // Load current applicant profile directly from database (like createApplication does)
      const profile = await firstValueFrom(this.applicantApi.getApplicantProfile());
      const profileDocumentIds = await firstValueFrom(this.applicantApi.getApplicantProfileDocumentIds());

      // Map ApplicantDTO to ApplicationInformationData
      const applicationInformation: ApplicationInformationData = {
        firstName: profile.user.firstName ?? '',
        lastName: profile.user.lastName ?? '',
        email: profile.user.email ?? '',
        phoneNumber: profile.user.phoneNumber ?? '',
        gender: profile.user.gender != null ? { value: profile.user.gender, name: `genders.${profile.user.gender}` } : undefined,
        nationality:
          profile.user.nationality != null
            ? { value: profile.user.nationality, name: `nationalities.${profile.user.nationality}` }
            : undefined,
        dateOfBirth: profile.user.birthday ?? '',
        website: profile.user.website ?? '',
        linkedIn: profile.user.linkedinUrl ?? '',
        street: profile.street ?? '',
        city: profile.city ?? '',
        country: profile.country != null ? { value: profile.country, name: `countries.${profile.country}` } : undefined,
        postcode: profile.postalCode ?? '',
      };

      this.loadedProfile.set(profile);
      this.data.set(applicationInformation);
      this.initialDataSnapshot.set(this.toSnapshot(applicationInformation));
      this.cvDocuments.set(profileDocumentIds.cvDocumentDictionaryId != null ? [profileDocumentIds.cvDocumentDictionaryId] : []);
      this.initialCvDocuments.set(this.normalizedDocuments(this.cvDocuments()));
    } catch {
      this.toastService.showErrorKey('settings.applicationInformation.loadFailed');
    }
  }

  private async loadAiConsent(): Promise<void> {
    try {
      const isEnabled = await firstValueFrom(this.userApi.getAiConsent());
      this.aiFeaturesEnabled.set(isEnabled);
    } catch {
      this.toastService.showErrorKey('settings.applicationInformation.loadFailed');
    }
  }

  setDateOfBirth($event: string | undefined): void {
    const updatedData = structuredClone(this.data());
    updatedData.dateOfBirth = $event ?? '';
    this.data.set(updatedData);
  }

  updateSelect(field: keyof ApplicationInformationData, value: SelectOption | undefined): void {
    const updatedData = structuredClone(this.data());
    updatedData[field] = value as never;
    this.data.set(updatedData);
  }

  async onSave(): Promise<void> {
    try {
      const loadedUser = this.accountService.loadedUser();
      if (loadedUser?.id == null) {
        this.toastService.showErrorKey('settings.personalInformation.saveFailed');
        return;
      }

      const data = this.data();

      // Build ApplicantDTO payload
      const applicantDTO: ApplicantDTO = {
        user: {
          userId: loadedUser.id,
          email: data.email || undefined,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          phoneNumber: data.phoneNumber || undefined,
          gender: data.gender?.value as string | undefined,
          nationality: data.nationality?.value as string | undefined,
          birthday: data.dateOfBirth || undefined,
          website: data.website || undefined,
          linkedinUrl: data.linkedIn || undefined,
        },
        street: data.street || undefined,
        postalCode: data.postcode || undefined,
        city: data.city || undefined,
        country: data.country?.value as string | undefined,
        bachelorDegreeName: undefined,
        bachelorGradeUpperLimit: undefined,
        bachelorGradeLowerLimit: undefined,
        bachelorGrade: undefined,
        bachelorUniversity: undefined,
        masterDegreeName: undefined,
        masterGradeUpperLimit: undefined,
        masterGradeLowerLimit: undefined,
        masterGrade: undefined,
        masterUniversity: undefined,
      };

      const updatedProfile = await firstValueFrom(this.applicantApi.updateApplicantPersonalInformation(applicantDTO));
      await this.saveDeferredCvChanges();
      this.loadedProfile.set(updatedProfile);
      this.toastService.showSuccessKey('settings.personalInformation.saved');
      this.initialDataSnapshot.set(this.toSnapshot(this.data()));
      this.initialCvDocuments.set(this.normalizedDocuments(this.cvDocuments()));
    } catch {
      this.toastService.showErrorKey('settings.personalInformation.saveFailed');
    }
  }

  async onCancel(): Promise<void> {
    await this.loadApplicationInformation();
  }

  private toSnapshot(data: ApplicationInformationData): ApplicationInformationSnapshot {
    return {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      gender: data.gender?.value,
      nationality: data.nationality?.value,
      dateOfBirth: data.dateOfBirth,
      website: data.website,
      linkedIn: data.linkedIn,
      street: data.street,
      city: data.city,
      country: data.country?.value,
      postcode: data.postcode,
    };
  }

  // -- CV document helpers (subset of logic from SettingsDocumentsComponent) --
  onCvQueuedFilesChange(files: File[]): void {
    this.queuedCvFiles.set(files);
  }

  private normalizedDocuments(docs: DocumentInformationHolderDTO[] | undefined): DocumentInformationHolderDTO[] {
    return Array.from(docs ?? [])
      .map(doc => ({
        id: doc.id,
        name: doc.name,
        size: doc.size,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  private isTemporaryDocument(document: DocumentInformationHolderDTO): boolean {
    return document.id.startsWith('temp-');
  }

  private async saveDeferredCvChanges(): Promise<void> {
    // Commit persisted doc changes (delete/rename) for CV
    await this.commitDocumentTypeChanges(this.initialCvDocuments(), this.cvDocuments());
    // Upload queued CV files
    await this.uploadQueuedByType(DocumentInformationHolderDTODocumentTypeEnum.Cv, this.queuedCvFiles(), this.cvDocuments);
  }

  /**
   * Extracts personal data from the uploaded CV using AI.
   * Logic mirrors the extraction used on the application creation page 1.
   */
  extractAiData(): void {
    const appId = this.applicationIdForDocuments();
    const cvDocs = this.cvDocuments();

    if (appId === undefined || cvDocs === undefined || cvDocs.length === 0) {
      return;
    }

    const docId = cvDocs[0].id;
    if (!docId) return;

    this.isExtractingAi.set(true);

    let extraction$ = activeExtractions.get(appId);
    if (!extraction$) {
      extraction$ = this.aiApi.extractPdfData(appId, [docId], true, false).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      activeExtractions.set(appId, extraction$);
    }

    this.subscribeToExtraction(extraction$, appId);
  }

  private subscribeToExtraction(extraction$: Observable<ExtractedApplicationDataDTO>, appId: string): void {
    extraction$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: extractedData => {
        const form = this.applicationInfoForm();
        const patch: Record<string, string> = {};
        const setIfEmpty = (formKey: string, value: string | undefined): void => {
          if (value !== undefined && (form.get(formKey)?.value as string) === '') {
            patch[formKey] = value;
          }
        };

        setIfEmpty('firstName', extractedData.firstName);
        setIfEmpty('lastName', extractedData.lastName);
        setIfEmpty('phoneNumber', extractedData.phoneNumber);
        setIfEmpty('website', extractedData.website);
        setIfEmpty('linkedIn', extractedData.linkedinUrl);
        setIfEmpty('street', extractedData.street);
        setIfEmpty('city', extractedData.city);
        setIfEmpty('postcode', extractedData.postalCode);

        form.patchValue(patch);

        activeExtractions.delete(appId);
        this.isExtractingAi.set(false);
      },
      error: () => {
        this.toastService.showErrorKey('entity.applicationPage1.aiExtractionFailed');
        activeExtractions.delete(appId);
        this.isExtractingAi.set(false);
      },
    });
  }

  private async commitDocumentTypeChanges(
    initialDocs: DocumentInformationHolderDTO[] | undefined,
    currentDocs: DocumentInformationHolderDTO[] | undefined,
  ): Promise<void> {
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
      await firstValueFrom(this.applicantApi.deleteApplicantProfileDocument(documentId));
    }

    for (const document of renamedDocs) {
      await firstValueFrom(this.applicantApi.renameApplicantProfileDocument(document.id, document.newName));
    }
  }

  private async uploadQueuedByType(
    documentType: DocumentInformationHolderDTODocumentTypeEnum,
    files: File[],
    targetSignal: { set: (_value: DocumentInformationHolderDTO[] | undefined) => void },
  ): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const uploadResults = await Promise.all(files.map(file => firstValueFrom(this.uploadApplicantProfileDocument(documentType, file))));

    const latestResult: DocumentInformationHolderDTO[] | undefined = uploadResults[uploadResults.length - 1];
    targetSignal.set(latestResult);
  }

  private uploadApplicantProfileDocument(documentType: DocumentInformationHolderDTODocumentTypeEnum, file: File) {
    const formData = new FormData();
    formData.append('files', file);
    return this.http.post<DocumentInformationHolderDTO[]>(`/api/applicants/profile/documents/${documentType}`, formData);
  }
}
