import { CommonModule } from '@angular/common';
import { Component, OnInit, model, output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApplicantDTO, ApplicationForApplicantDTO } from 'app/generated';
import { DropdownComponent, DropdownOption } from 'app/shared/components/atoms/dropdown/dropdown.component';
import { StringInputTemporaryComponent } from 'app/shared/components/atoms/string-input-temporary/string-input-temporary.component';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';

export type ApplicationCreationPage2Data = {
  bachelorDegreeName: string;
  bachelorDegreeUniversity: string;
  bachelorGradingScale: DropdownOption;
  bachelorGrade: string;
  masterDegreeName: string;
  masterDegreeUniversity: string;
  masterGradingScale: DropdownOption;
  masterGrade: string;
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

export const getPage2FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage2Data => {
  return {
    bachelorDegreeName: application.applicant?.bachelorDegreeName ?? '',
    bachelorDegreeUniversity: application.applicant?.bachelorUniversity ?? '',
    bachelorGradingScale: bachelorGradingScale[0], // TODO
    bachelorGrade: application.applicant?.bachelorGrade ?? '',
    masterDegreeName: application.applicant?.masterDegreeName ?? '',
    masterDegreeUniversity: application.applicant?.masterUniversity ?? '',
    masterGradingScale: masterGradingScale[0],
    masterGrade: application.applicant?.masterGrade ?? '',
  };
};

@Component({
  selector: 'jhi-application-creation-page2',
  imports: [CommonModule, StringInputTemporaryComponent, DividerModule, DropdownComponent, UploadButtonComponent],
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
})
export default class ApplicationCreationPage2Component implements OnInit {
  bachelorGradingScaleLocal = bachelorGradingScale;
  masterGradingScaleLocal = masterGradingScale;

  data = model.required<ApplicationCreationPage2Data>();
  valid = output<boolean>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      bachelorDegreeName: [this.data().bachelorDegreeName, Validators.required],
      bachelorDegreeUniversity: [this.data().bachelorDegreeUniversity, Validators.required],
      bachelorGrade: [this.data().bachelorGrade, Validators.required],
      masterDegreeName: [this.data().masterDegreeName, Validators.required],
      masterDegreeUniversity: [this.data().masterDegreeUniversity, Validators.required],
      masterGrade: [this.data().masterGrade, Validators.required],
    });

    this.form.valueChanges.subscribe(value => {
      Object.assign(this.data(), value);
    });

    this.form.statusChanges.subscribe(() => {
      this.valid.emit(this.form.valid);
    });

    this.valid.emit(this.form.valid);
  }
}
