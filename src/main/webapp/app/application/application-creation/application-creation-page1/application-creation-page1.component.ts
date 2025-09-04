import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, model, output } from '@angular/core';
import { ApplicationForApplicantDTO } from 'app/generated';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import SharedModule from 'app/shared/shared.module';
import * as postalCodes from 'postal-codes-js';

import { SelectComponent, SelectOption } from '../../../shared/components/atoms/select/select.component';
import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';

import { selectCountries, selectNationality } from './nationalities';

export type ApplicationCreationPage1Data = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender?: SelectOption;
  nationality?: SelectOption;
  language?: SelectOption;
  dateOfBirth: string;
  website: string;
  linkedIn: string;
  street: string;
  city: string;
  country?: SelectOption;
  postcode: string;
};

export const selectGender: SelectOption[] = [
  { value: 'female', name: 'Female' },
  { value: 'male', name: 'Male' },
  { value: 'other', name: 'Other' },
];

export const selectLanguage: SelectOption[] = [
  { value: 'de', name: 'German' },
  { value: 'en', name: 'English' },
];

export const getPage1FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage1Data => {
  return {
    firstName: application.applicant?.user.firstName ?? '',
    lastName: application.applicant?.user.lastName ?? '',
    email: application.applicant?.user.email ?? '',
    phoneNumber: application.applicant?.user.phoneNumber ?? '',
    gender: selectGender.find(val => val.value === application.applicant?.user.gender),
    nationality: selectNationality.find(val => val.value === application.applicant?.user.nationality),
    language: selectLanguage.find(val => val.value === application.applicant?.user.selectedLanguage),
    dateOfBirth: application.applicant?.user.birthday ?? '',
    website: application.applicant?.user.website ?? '',
    linkedIn: application.applicant?.user.linkedinUrl ?? '',
    street: application.applicant?.street ?? '',
    city: application.applicant?.city ?? '',
    country: selectCountries.find(country => country.value === application.applicant?.country),
    postcode: application.applicant?.postalCode ?? '',
  };
};

function postalCodeValidator(getCountryFn: () => string | undefined): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const country = getCountryFn()?.toUpperCase();
    const value = control.value;
    if (!country || !value) return null;
    const isPostalCodeValid = postalCodes.validate(country, value);
    const validationError: ValidationErrors = { invalidPostalCode: 'entity.applicationPage1.validation.postalCode' };
    return isPostalCodeValid === true ? null : validationError;
  };
}

@Component({
  selector: 'jhi-application-creation-page1',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DividerModule,
    SelectComponent,
    DatePickerComponent,
    StringInputComponent,
    TranslateModule,
    SharedModule,
  ],
  templateUrl: './application-creation-page1.component.html',
  styleUrl: './application-creation-page1.component.scss',
  standalone: true,
})
export default class ApplicationCreationPage1Component {
  data = model.required<ApplicationCreationPage1Data>();

  valid = output<boolean>();
  changed = output<boolean>();

  selectGenderLocal = selectGender;
  selectLanguageLocal = selectLanguage;
  selectNationalityLocal = selectNationality;
  selectCountriesLocal = selectCountries;

  formbuilder = inject(FormBuilder);
  page1Form = computed(() => {
    const currentData = this.data();
    return this.formbuilder.group({
      firstName: [currentData.firstName, Validators.required],
      lastName: [currentData.lastName, Validators.required],
      email: [currentData.email, [Validators.required, Validators.email]],
      phoneNumber: [currentData.phoneNumber, Validators.required],

      street: [currentData.street, Validators.required],
      city: [currentData.city, Validators.required],
      country: [currentData.country, Validators.required],
      postcode: [currentData.postcode, [Validators.required, postalCodeValidator(() => this.data().country?.value as string)]],

      // Optional fields
      gender: [currentData.gender ?? null],
      nationality: [currentData.nationality ?? null],
      language: [currentData.language ?? null],
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
          language: data.language,
          country: data.country,
          dateOfBirth: data.dateOfBirth,
        };
        this.data.set({
          ...this.data(),
          ...selectFields,
          ...normalizedValue,
        });
        this.changed.emit(true);
        this.valid.emit(form.valid);
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
}
