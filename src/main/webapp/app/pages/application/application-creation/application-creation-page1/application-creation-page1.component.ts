import { CommonModule } from '@angular/common';
import { Component, model } from '@angular/core';
import { DividerComponent } from 'app/shared/components/atoms/divider/divider.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { DropdownComponent, DropdownOption } from '../../../../shared/components/atoms/dropdown/dropdown.component';

export type ApplicationCreationPage1Data = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  gender?: DropdownOption;
  nationality: string;
  language: string;
  dateOfBirth: string;
  website: string;
  linkedIn: string;
  street: string;
  streetnumber: string;
  city: string;
  country: string;
  postcode: string;
};

@Component({
  selector: 'jhi-application-creation-page1',
  imports: [CommonModule, StringInputComponent, DividerComponent, DropdownComponent],
  templateUrl: './application-creation-page1.component.html',
  styleUrl: './application-creation-page1.component.scss',
})
export default class ApplicationCreationPage1Component {
  data = model.required<ApplicationCreationPage1Data>();

  dropdownGender: DropdownOption[] = [
    { value: 'female', name: 'female' },
    { value: 'male', name: 'male' },
    { value: 'other', name: 'other' },
  ];
}
