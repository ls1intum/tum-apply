import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { TranslateDirective } from 'app/shared/language';
import { selectCountries } from 'app/shared/language/countries';
import { selectNationality } from 'app/shared/language/nationalities';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { DocumentInformationHolderDTO } from 'app/generated/model/document-information-holder-dto';
import { selectGender } from 'app/shared/constants/genders';
import { postalCodeValidator } from 'app/shared/validators/custom-validators';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
import { DatePickerComponent } from 'app/shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { ApplicationForApplicantDTO } from 'app/generated/model/application-for-applicant-dto';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ProgressSpinnerComponent } from 'app/shared/components/atoms/progress-spinner/progress-spinner.component';
import { AiResourceApi } from 'app/generated/api/ai-resource-api';
import { ExtractedApplicationDataDTO } from 'app/generated/model/extracted-application-data-dto';
import { firstValueFrom } from 'rxjs';
import { ToastService } from 'app/service/toast-service';

export type ApplicationCreationPage1Data = {
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
};

export const selectLanguage: SelectOption[] = [
  { value: 'de', name: 'German' },
  { value: 'en', name: 'English' },
];

// Suppressed: flat object mapping logic causes high cyclomatic complexity, but function is safe and readable
// codacy-disable-next-line
export const getPage1FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage1Data => {
  return {
    firstName: application.applicant?.user.firstName ?? '',
    lastName: application.applicant?.user.lastName ?? '',
    email: application.applicant?.user.email ?? '',
    phoneNumber: application.applicant?.user.phoneNumber ?? '',
    gender: selectGender.find(val => val.value === application.applicant?.user.gender),
    nationality: selectNationality.find(val => val.value === application.applicant?.user.nationality),
    dateOfBirth: application.applicant?.user.birthday ?? '',
    website: application.applicant?.user.website ?? '',
    linkedIn: application.applicant?.user.linkedinUrl ?? '',
    street: application.applicant?.street ?? '',
    city: application.applicant?.city ?? '',
    country: selectCountries.find(country => country.value === application.applicant?.country),
    postcode: application.applicant?.postalCode ?? '',
  };
};

@Component({
  selector: 'jhi-application-creation-page1',
  imports: [
    ReactiveFormsModule,
    DividerModule,
    SelectComponent,
    DatePickerComponent,
    StringInputComponent,
    TranslateModule,
    TranslateDirective,
    UploadButtonComponent,
    FontAwesomeModule,
    TooltipModule,
    ButtonComponent,
    ProgressSpinnerComponent,
  ],
  templateUrl: './application-creation-page1.component.html',
  standalone: true,
})
export default class ApplicationCreationPage1Component {
  data = model.required<ApplicationCreationPage1Data>();

  applicationIdForDocuments = input<string | undefined>();
  documentIdsCv = input<DocumentInformationHolderDTO | undefined>();

  valid = output<boolean>();
  changed = output<boolean>();
  educationDataExtracted = output<ExtractedApplicationDataDTO>();

  cvValid = signal<boolean>(this.documentIdsCv() !== undefined);

  computedDocumentIdsCvSet = computed(() => {
    const docInfoHolder = this.documentIdsCv();
    return docInfoHolder ? [docInfoHolder] : undefined;
  });

  disabledEmail = computed<boolean>(() => this.accountService.signedIn());

  readonly minDate = new Date(1900, 0, 1);
  readonly maxDate = (() => {
    const today = new Date();
    return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  })(); // ensures minimum age of 18
  readonly defaultBirthDate = new Date(2000, 0, 1);

  selectGenderLocal = selectGender;
  selectLanguageLocal = selectLanguage;
  selectNationalityLocal = selectNationality;
  accountService = inject(AccountService);
  translate = inject(TranslateService);
  formbuilder = inject(FormBuilder);
  private aiApi = inject(AiResourceApi);
  private toastService = inject(ToastService);

  isExtractingAi = signal<boolean>(false);

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

  page1Form = computed(() => {
    const currentData = this.data();
    return this.formbuilder.group({
      firstName: [currentData.firstName, Validators.required],
      lastName: [currentData.lastName, Validators.required],
      email: [{ value: currentData.email, disabled: this.disabledEmail() }, [Validators.required, Validators.email]],
      phoneNumber: [currentData.phoneNumber, Validators.required],

      street: [currentData.street, Validators.required],
      city: [currentData.city, Validators.required],
      country: [currentData.country, Validators.required],
      postcode: [currentData.postcode, [Validators.required, postalCodeValidator(() => this.data().country?.value as string)]],

      // Optional fields
      gender: [currentData.gender ?? null],
      nationality: [currentData.nationality ?? null],
      dateOfBirth: [currentData.dateOfBirth],
      website: [currentData.website],
      linkedIn: [currentData.linkedIn],
    });
  });

  private initializeCvDocs = effect(() => {
    const cvDocs = this.computedDocumentIdsCvSet();
    this.cvDocsSetValidity(cvDocs);
  });

  constructor() {
    effect(onCleanup => {
      const form = this.page1Form();
      const data = this.data();
      const valueSubscription = form.valueChanges.subscribe(value => {
        const normalizedValue = Object.fromEntries(Object.entries(value).map(([key, val]) => [key, val ?? '']));
        const selectFields = {
          gender: data.gender,
          nationality: data.nationality,
          country: data.country,
          dateOfBirth: data.dateOfBirth,
        };
        this.data.set({
          ...this.data(),
          ...selectFields,
          ...normalizedValue,
        });
        this.changed.emit(true);
        this.valid.emit(form.valid && this.cvValid());
      });

      const statusSubscription = form.statusChanges.subscribe(() => {
        this.valid.emit(form.valid && this.cvValid());
      });

      this.valid.emit(form.valid && this.cvValid());

      onCleanup(() => {
        valueSubscription.unsubscribe();
        statusSubscription.unsubscribe();
      });
    });
  }

  cvDocsSetValidity(cvDocs: DocumentInformationHolderDTO[] | undefined): void {
    if (cvDocs === undefined || cvDocs.length === 0) {
      this.cvValid.set(false);
    } else {
      this.cvValid.set(true);
    }
  }

  emitChanged(): void {
    this.changed.emit(true);
  }

  setDateOfBirth($event: string | undefined): void {
    this.data.set({
      ...this.data(),
      dateOfBirth: $event ?? '',
    });
    this.emitChanged();
  }

  updateSelect(field: keyof ApplicationCreationPage1Data, value: SelectOption | undefined): void {
    this.data.set({
      ...this.data(),
      [field]: value,
    });
    this.emitChanged();
  }

  async extractAiData(): Promise<void> {
    const appId = this.applicationIdForDocuments();
    const cvDocs = this.computedDocumentIdsCvSet();

    if (!appId || !cvDocs || cvDocs.length === 0) {
      return;
    }

    const docId = cvDocs[0].id;

    if (!docId) {
      return;
    }

    this.isExtractingAi.set(true);

    try {
      const extractedData = await firstValueFrom(this.aiApi.extractPdfData(appId, docId));
      const patch: Record<string, string> = {};
      if (extractedData.firstName) patch['firstName'] = extractedData.firstName;
      if (extractedData.lastName) patch['lastName'] = extractedData.lastName;
      if (extractedData.phoneNumber) patch['phoneNumber'] = extractedData.phoneNumber;
      if (extractedData.website) patch['website'] = extractedData.website;
      if (extractedData.linkedinUrl) patch['linkedIn'] = extractedData.linkedinUrl;
      if (extractedData.street) patch['street'] = extractedData.street;
      if (extractedData.city) patch['city'] = extractedData.city;
      if (extractedData.postalCode) patch['postcode'] = extractedData.postalCode;

      this.page1Form().patchValue(patch);
      this.educationDataExtracted.emit(extractedData);
    } catch {
      this.toastService.showErrorKey('entity.applicationPage1.aiExtractionFailed');
    } finally {
      this.isExtractingAi.set(false);
    }
  }
}
