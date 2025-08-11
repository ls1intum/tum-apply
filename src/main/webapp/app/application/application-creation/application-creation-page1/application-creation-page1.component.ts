import { CommonModule } from '@angular/common';
import { Component, Signal, effect } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import SharedModule from 'app/shared/shared.module';
import * as postalCodes from 'postal-codes-js';
import { ApplicationForApplicantDTO } from 'app/generated';
import { toSignal } from '@angular/core/rxjs-interop';

import { SelectComponent, SelectOption } from '../../../shared/components/atoms/select/select.component';
import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { ApplicationCreationPageBaseComponent } from '../application-creation-page.component';

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
export default class ApplicationCreationPage1Component extends ApplicationCreationPageBaseComponent<ApplicationCreationPage1Data> {
  selectGenderLocal = selectGender;
  selectLanguageLocal = selectLanguage;
  selectNationalityLocal = selectNationality;
  selectCountryLocal = selectCountries;

  page1Form: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', Validators.required],
    street: ['', Validators.required],
    city: ['', Validators.required],
    postcode: ['', Validators.required],
    dateOfBirth: [''],
    website: [''],
    linkedIn: [''],
  });

  get pageForm(): FormGroup {
    return this.page1Form;
  }

  formValue: Signal<ApplicationCreationPage1Data> = toSignal(this.formValue$(), { initialValue: this.pageForm.value });

  initializeFormEffect = effect(() => {
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
    if (postcodeControl) {
      postcodeControl.addValidators([Validators.required, postalCodeValidator(() => this.data()?.country?.value as string)]);
    }

    this.hasInitialized.set(true);
  });

  setDateOfBirth($event: string | undefined): void {
    const currentData = this.data();
    if (currentData !== undefined) {
      this.data.set({
        ...currentData,
        dateOfBirth: $event ?? '',
      });
    }
    this.changed.emit(true);
  }

  updateSelectField(field: keyof ApplicationCreationPage1Data, value: any): void {
    const currentData = this.data();
    if (currentData !== undefined) {
      this.data.set({
        ...currentData,
        [field]: value,
      });
    }
    this.changed.emit(true);
  }
}
