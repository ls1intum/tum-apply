import { CommonModule } from '@angular/common';
import { Component, model } from '@angular/core';
import { DividerComponent } from 'app/shared/components/atoms/divider/divider.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';

import { DropdownComponent, DropdownOption } from '../../../../shared/components/atoms/dropdown/dropdown.component';
import { DatePickerComponent } from '../../../../shared/components/atoms/datepicker/datepicker.component';

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
  { value: 'female', name: 'female' },
  { value: 'male', name: 'male' },
  { value: 'other', name: 'other' },
];

export const dropdownLanguage: DropdownOption[] = [
  { value: 'de', name: 'deutsch' },
  { value: 'en', name: 'english' },
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

@Component({
  selector: 'jhi-application-creation-page1',
  imports: [CommonModule, StringInputComponent, DividerComponent, DropdownComponent, DatePickerComponent],
  templateUrl: './application-creation-page1.component.html',
  styleUrl: './application-creation-page1.component.scss',
})
export default class ApplicationCreationPage1Component {
  data = model.required<ApplicationCreationPage1Data>();

  dropdownGenderLocal = dropdownGender;
  dropdownLanguageLocal = dropdownLanguage;
  dropdownNationalityLocal = dropdownNationality;
}
