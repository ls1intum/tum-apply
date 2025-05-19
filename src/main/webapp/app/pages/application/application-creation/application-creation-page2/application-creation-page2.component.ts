import { CommonModule } from '@angular/common';
import { Component, effect, inject, model, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, StringInputTemporaryComponent, DividerModule, DropdownComponent, UploadButtonComponent, ReactiveFormsModule],
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
})
export default class ApplicationCreationPage2Component {
  bachelorGradingScaleLocal = bachelorGradingScale;
  masterGradingScaleLocal = masterGradingScale;

  data = model.required<ApplicationCreationPage2Data>();
  valid = output<boolean>();

  page2Form = signal<FormGroup | undefined>(undefined);

  fb = inject(FormBuilder);

  constructor() {
    effect(() => {
      const currentData = this.data();
      this.page2Form.set(
        this.fb.group({
          bachelorDegreeName: [currentData.bachelorDegreeName, Validators.required],
          bachelorDegreeUniversity: [currentData.bachelorDegreeUniversity, Validators.required],
          bachelorGrade: [currentData.bachelorGrade, Validators.required],
          masterDegreeName: [currentData.masterDegreeName, Validators.required],
          masterDegreeUniversity: [currentData.masterDegreeUniversity, Validators.required],
          masterGrade: [currentData.masterGrade, Validators.required],
        }),
      );
    });

    effect(() => {
      const form = this.page2Form();
      if (form) {
        form.valueChanges.subscribe(value => {
          this.data.set({
            ...this.data(),
            ...value,
          });

          this.valid.emit(form.valid);
        });

        form.statusChanges.subscribe(() => {
          this.valid.emit(form.valid);
        });
      }
    });
  }
}
