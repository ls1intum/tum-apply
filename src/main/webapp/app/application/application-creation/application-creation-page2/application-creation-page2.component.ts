import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, model, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplicantDTO, ApplicationForApplicantDTO, DocumentInformationHolderDTO } from 'app/generated';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { NumberInputComponent } from 'app/shared/components/atoms/number-input/number-input.component';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';

export type ApplicationCreationPage2Data = {
  bachelorDegreeName: string;
  bachelorDegreeUniversity: string;
  bachelorGradingScale: SelectOption;
  bachelorGrade?: number;
  masterDegreeName: string;
  masterDegreeUniversity: string;
  masterGradingScale: SelectOption;
  masterGrade?: number;
};

export const bachelorGradingScale: SelectOption[] = Object.values(ApplicantDTO.BachelorGradingScaleEnum).map(v => ({
  value: v,
  name: v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()),
}));
export const masterGradingScale: SelectOption[] = Object.values(ApplicantDTO.MasterGradingScaleEnum).map(v => ({
  value: v,
  name: v
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase()),
}));

export const getPage2FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage2Data => {
  const bachelorGradeApplicant = application.applicant?.bachelorGrade;
  const masterGradeApplicant = application.applicant?.masterGrade;
  return {
    bachelorDegreeName: application.applicant?.bachelorDegreeName ?? '',
    bachelorDegreeUniversity: application.applicant?.bachelorUniversity ?? '',
    bachelorGradingScale: bachelorGradingScale[0], // TODO
    bachelorGrade: bachelorGradeApplicant !== undefined ? Number.parseFloat(bachelorGradeApplicant) : undefined,
    masterDegreeName: application.applicant?.masterDegreeName ?? '',
    masterDegreeUniversity: application.applicant?.masterUniversity ?? '',
    masterGradingScale: masterGradingScale[0],
    masterGrade: masterGradeApplicant !== undefined ? Number.parseFloat(masterGradeApplicant) : undefined,
  };
};

@Component({
  selector: 'jhi-application-creation-page2',
  imports: [
    CommonModule,
    DividerModule,
    SelectComponent,
    UploadButtonComponent,
    ReactiveFormsModule,
    StringInputComponent,
    TranslateModule,
    NumberInputComponent,
    TooltipModule,
    FontAwesomeModule,
  ],
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
  standalone: true,
})
export default class ApplicationCreationPage2Component {
  BachelorGradingScaleEnumLocal = ApplicantDTO.BachelorGradingScaleEnum;
  MasterGradingScaleEnumLocal = ApplicantDTO.MasterGradingScaleEnum;
  bachelorGradingScaleLocal = bachelorGradingScale;
  masterGradingScaleLocal = masterGradingScale;

  data = model.required<ApplicationCreationPage2Data>();

  applicationIdForDocuments = input<string | undefined>(undefined);
  documentIdsBachelorTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);
  documentIdsMasterTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);

  valid = output<boolean>();
  changed = output<boolean>();

  formbuilder = inject(FormBuilder);
  page2Form = computed(() => {
    const currentData = this.data();
    return this.formbuilder.group({
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
        this.changed.emit(true);
      });

      const statusSubscription = form.statusChanges.subscribe(() => {
        this.valid.emit(form.valid);
      });

      this.valid.emit(form.valid);

      onCleanup(() => {
        valueSubscription.unsubscribe();
        statusSubscription.unsubscribe();
      });
    });
  }

  setBachelorGradeAsNumber(gradeInputValue: number | undefined): void {
    this.data.set({
      ...this.data(),
      bachelorGrade: gradeInputValue,
    });
  }
  setMasterGradeAsNumber(gradeInputValue: number | undefined): void {
    this.data.set({
      ...this.data(),
      masterGrade: gradeInputValue,
    });
  }
}
