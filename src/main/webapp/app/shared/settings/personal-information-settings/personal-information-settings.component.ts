import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { firstValueFrom } from 'rxjs';
import { TranslateDirective } from 'app/shared/language';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { ApplicantDTO } from 'app/generated/model/applicantDTO';
import { selectCountries } from 'app/shared/language/countries';
import { selectNationality } from 'app/shared/language/nationalities';
import { selectGender } from 'app/shared/constants/genders';
import { postalCodeValidator } from 'app/shared/validators/custom-validators';
import { deepEqual } from 'app/core/util/deepequal-util';

import { SelectComponent, SelectOption } from '../../components/atoms/select/select.component';
import { DatePickerComponent } from '../../components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from '../../components/atoms/string-input/string-input.component';
import { ButtonComponent } from '../../components/atoms/button/button.component';

export type PersonalInformationData = {
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

type PersonalInformationSnapshot = {
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
};

@Component({
  selector: 'jhi-personal-information-settings',
  imports: [
    ReactiveFormsModule,
    DividerModule,
    SelectComponent,
    DatePickerComponent,
    StringInputComponent,
    TranslateModule,
    TranslateDirective,
    ButtonComponent,
  ],
  templateUrl: './personal-information-settings.component.html',
  standalone: true,
})
export class PersonalInformationSettingsComponent {
  data = signal<PersonalInformationData>({
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
  initialDataSnapshot = signal<PersonalInformationSnapshot | null>(null);
  hasChanges = computed(() => {
    const initial = this.initialDataSnapshot();
    if (initial == null) {
      return false;
    }
    return !deepEqual(this.toSnapshot(this.data()), initial);
  });

  disabledEmail = computed<boolean>(() => this.accountService.signedIn());

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
  applicationResourceService = inject(ApplicationResourceApiService);
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

  personalInfoForm = computed(() => {
    const currentData = this.data();
    return this.formbuilder.group({
      firstName: [currentData.firstName],
      lastName: [currentData.lastName],
      email: [{ value: currentData.email, disabled: this.disabledEmail() }, Validators.email],
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

  formEffect = effect(onCleanup => {
    const form = this.personalInfoForm();
    const data = this.data();
    const valueSubscription = form.valueChanges.subscribe((value: Record<string, unknown>) => {
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

  constructor() {
    // Load initial data from backend API
    void this.loadPersonalInformation();
  }

  async loadPersonalInformation(): Promise<void> {
    try {
      // Load current applicant profile directly from database (like createApplication does)
      const profile = await firstValueFrom(this.applicationResourceService.getApplicantProfile());

      // Map ApplicantDTO to PersonalInformationData
      const personalInfo: PersonalInformationData = {
        firstName: profile.user.firstName ?? '',
        lastName: profile.user.lastName ?? '',
        email: profile.user.email ?? '',
        phoneNumber: profile.user.phoneNumber ?? '',
        gender: profile.user.gender != null ? { value: profile.user.gender, name: `genders.${profile.user.gender}` } : undefined,
        nationality:
          profile.user.nationality != null ? { value: profile.user.nationality, name: `countries.${profile.user.nationality}` } : undefined,
        dateOfBirth: profile.user.birthday ?? '',
        website: profile.user.website ?? '',
        linkedIn: profile.user.linkedinUrl ?? '',
        street: profile.street ?? '',
        city: profile.city ?? '',
        country: profile.country != null ? { value: profile.country, name: `countries.${profile.country}` } : undefined,
        postcode: profile.postalCode ?? '',
      };

      this.data.set(personalInfo);
      this.initialDataSnapshot.set(this.toSnapshot(personalInfo));
    } catch {
      this.toastService.showErrorKey('settings.personalInformation.loadFailed');
    }
  }

  setDateOfBirth($event: string | undefined): void {
    this.data.set({
      ...this.data(),
      dateOfBirth: $event ?? '',
    });
  }

  updateSelect(field: keyof PersonalInformationData, value: SelectOption | undefined): void {
    this.data.set({
      ...this.data(),
      [field]: value,
    });
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

      await firstValueFrom(this.applicationResourceService.updateApplicantProfile(applicantDTO));
      this.toastService.showSuccessKey('settings.personalInformation.saved');
      this.initialDataSnapshot.set(this.toSnapshot(this.data()));
    } catch {
      this.toastService.showErrorKey('settings.personalInformation.saveFailed');
    }
  }

  async onCancel(): Promise<void> {
    await this.loadPersonalInformation();
  }

  private toSnapshot(data: PersonalInformationData): PersonalInformationSnapshot {
    return {
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      email: data.email ?? '',
      phoneNumber: data.phoneNumber ?? '',
      gender: data.gender?.value,
      nationality: data.nationality?.value,
      dateOfBirth: data.dateOfBirth ?? '',
      website: data.website ?? '',
      linkedIn: data.linkedIn ?? '',
      street: data.street ?? '',
      city: data.city ?? '',
      country: data.country?.value,
      postcode: data.postcode ?? '',
    };
  }
}
