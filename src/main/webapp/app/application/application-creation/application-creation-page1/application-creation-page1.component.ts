import { CommonModule } from '@angular/common';
import { Component, effect, inject, model, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import SharedModule from 'app/shared/shared.module';
import * as postalCodes from 'postal-codes-js';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ApplicationForApplicantDTO } from 'app/generated';

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
    country: selectCountries.find(val => val.value === application.applicant?.country),
    postcode: application.applicant?.postalCode ?? '',
  };
};

function postalCodeValidator(getCountryFn: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const country = getCountryFn().toUpperCase();
    const value = control.value;
    if (!country || !value) return null;
    const result = postalCodes.validate(country, value);
    return result === true ? null : { invalidPostalCode: result };
  };
}

function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) return false;
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
  }
  return true;
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
  data = model<ApplicationCreationPage1Data>();

  valid = output<boolean>();
  changed = output<boolean>();

  fb = inject(FormBuilder);
  hasInitialized = signal(false);

  selectGenderLocal = selectGender;
  selectLanguageLocal = selectLanguage;
  selectNationalityLocal = selectNationality;
  selectCountryLocal = selectCountries;

  page1Form: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', Validators.required],
    phoneNumber: ['', Validators.required],
    street: ['', Validators.required],
    city: ['', Validators.required],
    postcode: ['', Validators.required],
    dateOfBirth: [''],
    website: [''],
    linkedIn: [''],
  });

  formValue = toSignal(this.page1Form.valueChanges.pipe(debounceTime(100), distinctUntilChanged(deepEqual)), {
    initialValue: this.page1Form.value,
  });

  formStatus = toSignal(this.page1Form.statusChanges, {
    initialValue: this.page1Form.status,
  });

  private updateEffect = effect(() => {
    if (!this.hasInitialized()) return;

    const data = this.data();
    if (!data) return;

    const raw = this.formValue();
    const normalized = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v ?? ''])) as Partial<ApplicationCreationPage1Data>;

    const selectFields = {
      gender: data.gender,
      nationality: data.nationality,
      language: data.language,
      country: data.country,
      dateOfBirth: data.dateOfBirth,
    };

    const newData = { ...data, ...selectFields, ...normalized };
    if (!deepEqual(newData, this.data())) {
      this.data.set(newData);
      this.changed.emit(true);
    }

    this.valid.emit(this.page1Form.valid);
  });

  private initializeFormEffect = effect(() => {
    if (this.hasInitialized()) return;

    const data = this.data();
    if (!data) return;

    this.page1Form.patchValue({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      street: data.street,
      city: data.city,
      postcode: data.postcode,
      dateOfBirth: data.dateOfBirth,
      website: data.website,
      linkedIn: data.linkedIn,
    });

    const postcodeControl = this.page1Form.get('postcode');

    postcodeControl?.addValidators(postalCodeValidator(() => this.data()?.country?.value as string));

    this.hasInitialized.set(true);
  });

  emitChanged(): void {
    this.changed.emit(true);
    this.page1Form.updateValueAndValidity();
  }

  setDateOfBirth($event: string | undefined): void {
    const currentData = this.data();
    if (currentData !== undefined) {
      this.data.set({
        ...currentData,
        dateOfBirth: $event ?? '',
      });
    }
    this.emitChanged();
  }
}
