import { Component, computed, effect, inject, model, output, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { TranslateDirective } from 'app/shared/language';
import { selectCountries } from 'app/shared/language/countries';
import { selectNationality } from 'app/shared/language/nationalities';

import { selectGender } from 'app/shared/constants/genders';
import { postalCodeValidator } from 'app/shared/validators/custom-validators';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
import { DatePickerComponent } from 'app/shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { AiResourceApiService } from 'app/generated/api/aiResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

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
  ],
  templateUrl: './application-creation-page1.component.html',
  standalone: true,
})
export default class ApplicationCreationPage1Component {
  data = model.required<ApplicationCreationPage1Data>();

  applicationIdForDocuments = input<string | undefined>();
  documentIdsCv = model<DocumentInformationHolderDTO[] | undefined>();
  queuedCvFiles = model<File[]>([]);
  cvValid = signal<boolean>(false);
  latestUploadedCv = signal<File | undefined>(undefined);
  isExtracting = signal<boolean>(false);

  valid = output<boolean>();
  changed = output<boolean>();

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
  aiResourceService = inject(AiResourceApiService);
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

  // Effect to update CV validity when documentIdsCv or queuedCvFiles change
  private updateCvValidity = effect(() => {
    const cvDocs = this.documentIdsCv();
    const queuedDocs = this.queuedCvFiles();
    const isValid = (cvDocs !== undefined && cvDocs.length > 0) || (queuedDocs !== undefined && queuedDocs.length > 0);

    // Schedule the emission avoiding ExpressionChangedAfterItHasBeenCheckedError
    queueMicrotask(() => {
      this.cvValid.set(isValid);
      this.valid.emit(this.page1Form().valid && isValid);
    });
  });

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

  async generateFromCV(): Promise<void> {
    const cvFile = (this.queuedCvFiles() && this.queuedCvFiles().length > 0)
      ? this.queuedCvFiles()[0]
      : this.latestUploadedCv();

    if (!cvFile) {
      this.toastService.showErrorKey('entity.applicationPage1.aiExtraction.noFileError');
      return;
    }

    this.isExtracting.set(true);

    try {
      const extracted = await firstValueFrom(
        this.aiResourceService.extractPdfData(this.applicationIdForDocuments() || 'draft', cvFile)
      );

      const toPatch: Partial<ApplicationCreationPage1Data> = {};

      if (extracted.firstName) toPatch.firstName = extracted.firstName;
      if (extracted.lastName) toPatch.lastName = extracted.lastName;
      if (extracted.city) toPatch.city = extracted.city;
      if (extracted.street) toPatch.street = extracted.street;
      if (extracted.postalCode) toPatch.postcode = extracted.postalCode;
      if (extracted.phoneNumber) toPatch.phoneNumber = extracted.phoneNumber;
      if (extracted.dateOfBirth) toPatch.dateOfBirth = extracted.dateOfBirth;
      if (extracted.website) toPatch.website = extracted.website;
      if (extracted.linkedinUrl) toPatch.linkedIn = extracted.linkedinUrl;

      if (extracted.gender) {
        const lowerGender = extracted.gender.toLowerCase();
        const genderMatch = this.selectGenderLocal.find(g =>
          g.name?.toString().toLowerCase() === lowerGender || g.value?.toString().toLowerCase() === lowerGender
        );
        if (genderMatch) toPatch.gender = genderMatch;
      }

      if (extracted.nationality) {
        const lowerNat = extracted.nationality.toLowerCase();
        const natMatch = this.selectNationalityComputed().find(n =>
          n.name?.toString().toLowerCase() === lowerNat || n.value?.toString().toLowerCase() === lowerNat
        );
        if (natMatch) toPatch.nationality = natMatch;
      }

      if (extracted.country) {
        const lowerCountry = extracted.country.toLowerCase();
        const countryMatch = this.selectCountriesLocal().find(c =>
          c.name?.toString().toLowerCase() === lowerCountry || c.value?.toString().toLowerCase() === lowerCountry
        );
        if (countryMatch) toPatch.country = countryMatch;
      }

      this.data.set({
        ...this.data(),
        ...toPatch,
      });

      this.page1Form().patchValue(toPatch);

      this.toastService.showSuccessKey('entity.applicationPage1.aiExtraction.success');
    } catch {
      this.toastService.showErrorKey('entity.applicationPage1.aiExtraction.error');
    } finally {
      this.isExtracting.set(false);
    }
  }
}
