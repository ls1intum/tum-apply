import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, model, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectComponent } from 'app/shared/components/atoms/select/select.component';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { NumberInputComponent } from 'app/shared/components/atoms/number-input/number-input.component';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import TranslateDirective from 'app/shared/language/translate.directive';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { ApplicationForApplicantDTO } from '../../../generated/model/applicationForApplicantDTO';
import { DocumentInformationHolderDTO } from '../../../generated/model/documentInformationHolderDTO';

export type ApplicationCreationPage2Data = {
  bachelorDegreeName: string;
  bachelorDegreeUniversity: string;
  bachelorGradeUpperLimit: string;
  bachelorGradeLowerLimit: string;
  bachelorGrade?: string;
  masterDegreeName: string;
  masterDegreeUniversity: string;
  masterGradeUpperLimit: string;
  masterGradeLowerLimit: string;
  masterGrade?: string;
};

export const getPage2FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage2Data => {
  return {
    bachelorDegreeName: application.applicant?.bachelorDegreeName ?? '',
    bachelorDegreeUniversity: application.applicant?.bachelorUniversity ?? '',
    bachelorGradeUpperLimit: application.applicant?.bachelorGradeUpperLimit ?? '',
    bachelorGradeLowerLimit: application.applicant?.bachelorGradeLowerLimit ?? '',
    bachelorGrade: application.applicant?.bachelorGrade ?? '',
    masterDegreeName: application.applicant?.masterDegreeName ?? '',
    masterDegreeUniversity: application.applicant?.masterUniversity ?? '',
    masterGradeUpperLimit: application.applicant?.masterGradeUpperLimit ?? '',
    masterGradeLowerLimit: application.applicant?.masterGradeLowerLimit ?? '',
    masterGrade: application.applicant?.masterGrade ?? '',
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
    TranslateDirective,
  ],
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
  standalone: true,
})
export default class ApplicationCreationPage2Component {
  data = model.required<ApplicationCreationPage2Data>();

  applicationIdForDocuments = input<string | undefined>(undefined);
  documentIdsBachelorTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);
  documentIdsMasterTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);

  valid = output<boolean>();
  changed = output<boolean>();

  formbuilder = inject(FormBuilder);
  page2Form = computed(() => {
    const currentData = this.data();
    const form = this.formbuilder.group({
      bachelorDegreeName: [currentData.bachelorDegreeName, Validators.required],
      bachelorGradeUpperLimit: [currentData.bachelorGradeUpperLimit, Validators.required],
      bachelorGradeLowerLimit: [currentData.bachelorGradeLowerLimit, Validators.required],
      bachelorDegreeUniversity: [currentData.bachelorDegreeUniversity, Validators.required],
      bachelorGrade: [currentData.bachelorGrade, Validators.required],
      masterDegreeName: [currentData.masterDegreeName, Validators.required],
      masterDegreeUniversity: [currentData.masterDegreeUniversity, Validators.required],
      masterGradeUpperLimit: [currentData.masterGradeUpperLimit, Validators.required],
      masterGradeLowerLimit: [currentData.masterGradeLowerLimit, Validators.required],
      masterGrade: [currentData.masterGrade, Validators.required],
    });

    return form;
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
}
