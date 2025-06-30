import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, model, output } from '@angular/core';
import { ApplicationForApplicantDTO } from 'app/generated';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DividerModule } from 'primeng/divider';

import { DropdownComponent, DropdownOption } from '../../../shared/components/atoms/dropdown/dropdown.component';
import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';

export type ApplicationCreationPage1Data = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender?: DropdownOption;
  nationality?: DropdownOption;
  language?: DropdownOption;
  dateOfBirth: string;
  website: string;
  linkedIn: string;
  street: string;
  city: string;
  country: string;
  postcode: string;
};

export const dropdownGender: DropdownOption[] = [
  { value: 'female', name: 'Female' },
  { value: 'male', name: 'Male' },
  { value: 'other', name: 'Other' },
];

export const dropdownLanguage: DropdownOption[] = [
  { value: 'de', name: 'German' },
  { value: 'en', name: 'English' },
];

export const dropdownNationality: DropdownOption[] = [
  { value: 'al', name: 'Albanian' },
  { value: 'ad', name: 'Andorran' },
  { value: 'am', name: 'Armenian' },
  { value: 'at', name: 'Austrian' },
  { value: 'az', name: 'Azerbaijani' },
  { value: 'by', name: 'Belarusian' },
  { value: 'be', name: 'Belgian' },
  { value: 'ba', name: 'Bosnian' },
  { value: 'bg', name: 'Bulgarian' },
  { value: 'hr', name: 'Croatian' },
  { value: 'cy', name: 'Cypriot' },
  { value: 'cz', name: 'Czech' },
  { value: 'dk', name: 'Danish' },
  { value: 'nl', name: 'Dutch' },
  { value: 'ee', name: 'Estonian' },
  { value: 'fi', name: 'Finnish' },
  { value: 'fr', name: 'French' },
  { value: 'ge', name: 'Georgian' },
  { value: 'de', name: 'German' },
  { value: 'gr', name: 'Greek' },
  { value: 'hu', name: 'Hungarian' },
  { value: 'is', name: 'Icelandic' },
  { value: 'ie', name: 'Irish' },
  { value: 'it', name: 'Italian' },
  { value: 'kz', name: 'Kazakh' },
  { value: 'xk', name: 'Kosovar' },
  { value: 'lv', name: 'Latvian' },
  { value: 'li', name: 'Liechtensteiner' },
  { value: 'lt', name: 'Lithuanian' },
  { value: 'lu', name: 'Luxembourgish' },
  { value: 'mt', name: 'Maltese' },
  { value: 'md', name: 'Moldovan' },
  { value: 'mc', name: 'Monégasque' },
  { value: 'me', name: 'Montenegrin' },
  { value: 'mk', name: 'North Macedonian' },
  { value: 'no', name: 'Norwegian' },
  { value: 'pl', name: 'Polish' },
  { value: 'pt', name: 'Portuguese' },
  { value: 'ro', name: 'Romanian' },
  { value: 'ru', name: 'Russian' },
  { value: 'sm', name: 'San Marinese' },
  { value: 'rs', name: 'Serbian' },
  { value: 'sk', name: 'Slovak' },
  { value: 'si', name: 'Slovenian' },
  { value: 'es', name: 'Spanish' },
  { value: 'se', name: 'Swedish' },
  { value: 'ch', name: 'Swiss' },
  { value: 'tr', name: 'Turkish' },
  { value: 'ua', name: 'Ukrainian' },
  { value: 'va', name: 'Vatican' },
];

export const getPage1FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage1Data => {
  return {
    firstName: application.applicant?.user.firstName ?? '',
    lastName: application.applicant?.user.lastName ?? '',
    email: application.applicant?.user.email ?? '',
    phoneNumber: application.applicant?.user.phoneNumber ?? '',
    gender: dropdownGender.find(val => val.value === application.applicant?.user.gender),
    nationality: dropdownNationality.find(val => val.value === application.applicant?.user.nationality),
    language: dropdownLanguage.find(val => val.value === application.applicant?.user.selectedLanguage),
    dateOfBirth: application.applicant?.user.birthday ?? '',
    website: application.applicant?.user.website ?? '',
    linkedIn: application.applicant?.user.linkedinUrl ?? '',
    street: application.applicant?.street ?? '',
    city: application.applicant?.city ?? '',
    country: application.applicant?.country ?? '',
    postcode: application.applicant?.postalCode ?? '',
  };
};

@Component({
  selector: 'jhi-application-creation-page1',
  imports: [CommonModule, ReactiveFormsModule, DividerModule, DropdownComponent, DatePickerComponent, StringInputComponent],
  templateUrl: './application-creation-page1.component.html',
  styleUrl: './application-creation-page1.component.scss',
  standalone: true,
})
export default class ApplicationCreationPage1Component {
  data = model.required<ApplicationCreationPage1Data>();

  valid = output<boolean>();
  changed = output<boolean>();

  dropdownGenderLocal = dropdownGender;
  dropdownLanguageLocal = dropdownLanguage;
  dropdownNationalityLocal = dropdownNationality;
  fb = inject(FormBuilder);
  page1Form = computed(() => {
    const currentData = this.data();
    return this.fb.group({
      firstName: [currentData.firstName, Validators.required],
      lastName: [currentData.lastName, Validators.required],
      email: [currentData.email, Validators.required],
      phoneNumber: [currentData.phoneNumber, Validators.required],

      street: [currentData.street, Validators.required],
      city: [currentData.city, Validators.required],
      country: [currentData.country, Validators.required],
      postcode: [currentData.postcode, Validators.required],
    });
  });

  constructor() {
    effect(onCleanup => {
      const form = this.page1Form();
      const valueSubscription = form.valueChanges.subscribe(value => {
        const normalizedValue = Object.fromEntries(Object.entries(value).map(([key, val]) => [key, val ?? '']));
        this.data.set({
          ...this.data(),
          ...normalizedValue,
        });
        this.changed.emit(true);
        this.valid.emit(form.valid);
      });

      const statusSubscription = form.statusChanges.subscribe(() => {
        this.valid.emit(form.valid);
      });

      onCleanup(() => {
        valueSubscription.unsubscribe();
        statusSubscription.unsubscribe();
      });
    });
  }
}
