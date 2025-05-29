import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, model, output } from '@angular/core';
import { ApplicationForApplicantDTO } from 'app/generated';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DividerModule } from 'primeng/divider';

import { DropdownComponent, DropdownOption } from '../../../../shared/components/atoms/dropdown/dropdown.component';
import { DatePickerComponent } from '../../../../shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from '../../../../shared/components/atoms/string-input/string-input.component';

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
  streetnumber: string;
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
  { value: 'albanian', name: 'Albanian' },
  { value: 'andorran', name: 'Andorran' },
  { value: 'armenian', name: 'Armenian' },
  { value: 'austrian', name: 'Austrian' },
  { value: 'azerbaijani', name: 'Azerbaijani' },
  { value: 'belarusian', name: 'Belarusian' },
  { value: 'belgian', name: 'Belgian' },
  { value: 'bosnian', name: 'Bosnian' },
  { value: 'bulgarian', name: 'Bulgarian' },
  { value: 'croatian', name: 'Croatian' },
  { value: 'cypriot', name: 'Cypriot' },
  { value: 'czech', name: 'Czech' },
  { value: 'danish', name: 'Danish' },
  { value: 'dutch', name: 'Dutch' },
  { value: 'estonian', name: 'Estonian' },
  { value: 'finnish', name: 'Finnish' },
  { value: 'french', name: 'French' },
  { value: 'georgian', name: 'Georgian' },
  { value: 'german', name: 'German' },
  { value: 'greek', name: 'Greek' },
  { value: 'hungarian', name: 'Hungarian' },
  { value: 'icelandic', name: 'Icelandic' },
  { value: 'irish', name: 'Irish' },
  { value: 'italian', name: 'Italian' },
  { value: 'kazakh', name: 'Kazakh' },
  { value: 'kosovar', name: 'Kosovar' },
  { value: 'latvian', name: 'Latvian' },
  { value: 'liechtensteiner', name: 'Liechtensteiner' },
  { value: 'lithuanian', name: 'Lithuanian' },
  { value: 'luxembourgish', name: 'Luxembourgish' },
  { value: 'maltese', name: 'Maltese' },
  { value: 'moldovan', name: 'Moldovan' },
  { value: 'monégasque', name: 'Monégasque' },
  { value: 'montenegrin', name: 'Montenegrin' },
  { value: 'north_macedonian', name: 'North Macedonian' },
  { value: 'norwegian', name: 'Norwegian' },
  { value: 'polish', name: 'Polish' },
  { value: 'portuguese', name: 'Portuguese' },
  { value: 'romanian', name: 'Romanian' },
  { value: 'russian', name: 'Russian' },
  { value: 'san_marinese', name: 'San Marinese' },
  { value: 'serbian', name: 'Serbian' },
  { value: 'slovak', name: 'Slovak' },
  { value: 'slovenian', name: 'Slovenian' },
  { value: 'spanish', name: 'Spanish' },
  { value: 'swedish', name: 'Swedish' },
  { value: 'swiss', name: 'Swiss' },
  { value: 'turkish', name: 'Turkish' },
  { value: 'ukrainian', name: 'Ukrainian' },
  { value: 'vatican', name: 'Vatican' },
];

export const getPage1FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage1Data => {
  return {
    firstName: application.applicant?.user?.firstName ?? '',
    lastName: application.applicant?.user?.lastName ?? '',
    email: application.applicant?.user?.email ?? '',
    phoneNumber: application.applicant?.user?.phoneNumber ?? '',
    gender: dropdownGender.find(val => val.value === application.applicant?.user?.gender),
    nationality: dropdownNationality.find(val => val.value === application.applicant?.user?.nationality),
    language: dropdownLanguage.find(val => val.value === application.applicant?.user?.selectedLanguage),
    dateOfBirth: application.applicant?.user?.birthday ?? '',
    website: application.applicant?.user?.website ?? '',
    linkedIn: application.applicant?.user?.linkedinUrl ?? '',
    street: application.applicant?.street ?? '',
    city: application.applicant?.city ?? '',
    country: application.applicant?.country ?? '',
    postcode: application.applicant?.postalCode ?? '',
    streetnumber: '', // TODO
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

  dropdownGenderLocal = dropdownGender;
  dropdownLanguageLocal = dropdownLanguage;
  dropdownNationalityLocal = dropdownNationality;

  page1Form = computed(() => {
    const currentData = this.data();
    return this.fb.group({
      firstName: [currentData.firstName, Validators.required],
      lastName: [currentData.lastName, Validators.required],
      email: [currentData.email, Validators.required],
      phoneNumber: [currentData.phoneNumber, Validators.required],
      dateOfBirth: [currentData.dateOfBirth, Validators.required],

      street: [currentData.street, Validators.required],
      city: [currentData.city, Validators.required],
      country: [currentData.country, Validators.required],
      postcode: [currentData.postcode, Validators.required],
    });
  });

  fb = inject(FormBuilder);

  constructor() {
    effect(onCleanup => {
      const form = this.page1Form();
      const valueSubscription = form.valueChanges.subscribe(value => {
        const normalizedValue = Object.fromEntries(Object.entries(value).map(([key, val]) => [key, val ?? '']));
        this.data.set({
          ...this.data(),
          ...normalizedValue,
        });

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
