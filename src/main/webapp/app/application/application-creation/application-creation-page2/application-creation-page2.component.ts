import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, model, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplicantDTO, ApplicationForApplicantDTO } from 'app/generated';
import { DropdownComponent, DropdownOption } from 'app/shared/components/atoms/dropdown/dropdown.component';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';

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
  imports: [CommonModule, DividerModule, DropdownComponent, UploadButtonComponent, ReactiveFormsModule, StringInputComponent],
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
  standalone: true,
})
export default class ApplicationCreationPage2Component {
  bachelorGradingScaleLocal = bachelorGradingScale;
  masterGradingScaleLocal = masterGradingScale;

  data = model.required<ApplicationCreationPage2Data>();

  applicationIdForDocuments = input<string | undefined>(undefined);

  valid = output<boolean>();
  fb = inject(FormBuilder);
  page2Form = computed(() => {
    const currentData = this.data();
    return this.fb.group({
      bachelorDegreeName: [currentData.bachelorDegreeName, Validators.required],
      bachelorDegreeUniversity: [currentData.bachelorDegreeUniversity, Validators.required],
      bachelorGrade: [currentData.bachelorGrade, Validators.required],
      masterDegreeName: [currentData.masterDegreeName, Validators.required],
      masterDegreeUniversity: [currentData.masterDegreeUniversity, Validators.required],
      masterGrade: [currentData.masterGrade, Validators.required],
    });
  });

  constructor() {
    effect(onCleanup => {
      const form = this.page2Form();
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
