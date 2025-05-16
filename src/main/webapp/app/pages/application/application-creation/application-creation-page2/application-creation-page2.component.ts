import { CommonModule } from '@angular/common';
import { Component, model } from '@angular/core';
import { ApplicantDTO } from 'app/generated';
import { DividerComponent } from 'app/shared/components/atoms/divider/divider.component';
import { DropdownComponent, DropdownOption } from 'app/shared/components/atoms/dropdown/dropdown.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';

export type ApplicationCreationPage2Data = {
  bachelorDegreeName: string;
  bachelorDegreeUniversity: string;
  bachelorGradingScale: DropdownOption; // ApplicantDTO.BachelorGradingScaleEnum;
  bachelorGrade: string;
  masterDegreeName: string;
  masterDegreeUniversity: string;
  masterGradingScale: DropdownOption;
  masterGrade: string;
  // TODO Fileupload
};

export const bachelorGradingScale: DropdownOption[] = Object.values(ApplicantDTO.BachelorGradingScaleEnum).map(v => ({
  value: v,
  name: v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()),
}));
export const masterGradingScale: DropdownOption[] = Object.values(ApplicantDTO.MasterGradingScaleEnum).map(v => ({
  value: v,
  name: v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()),
}));

@Component({
  selector: 'jhi-application-creation-page2',
  imports: [CommonModule, StringInputComponent, DividerComponent, DropdownComponent],
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
})
export default class ApplicationCreationPage2Component {
  data = model.required<ApplicationCreationPage2Data>();

  bachelorGradingScaleLocal = bachelorGradingScale;
  masterGradingScaleLocal = masterGradingScale;
}
