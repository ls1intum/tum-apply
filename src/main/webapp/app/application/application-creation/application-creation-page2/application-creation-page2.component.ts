import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { NumberInputComponent } from 'app/shared/components/atoms/number-input/number-input.component';
import { TooltipModule } from 'primeng/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import TranslateDirective from 'app/shared/language/translate.directive';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { deepEqual } from 'app/core/util/deepequal-util';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { ApplicationForApplicantDTO } from '../../../generated/model/applicationForApplicantDTO';
import { DocumentInformationHolderDTO } from '../../../generated/model/documentInformationHolderDTO';

export type ApplicationCreationPage2Data = {
  bachelorDegreeName: string;
  bachelorDegreeUniversity: string;
  bachelorGradeUpperLimit: string;
  bachelorGradeLowerLimit: string;
  bachelorGrade: string;
  masterDegreeName: string;
  masterDegreeUniversity: string;
  masterGradeUpperLimit: string;
  masterGradeLowerLimit: string;
  masterGrade: string;
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
  standalone: true,
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
  imports: [
    CommonModule,
    DividerModule,
    UploadButtonComponent,
    ReactiveFormsModule,
    StringInputComponent,
    TranslateModule,
    TooltipModule,
    FontAwesomeModule,
    TranslateDirective,
    NumberInputComponent,
  ],
})
export default class ApplicationCreationPage2Component {
  data = model<ApplicationCreationPage2Data>();

  applicationIdForDocuments = input<string | undefined>(undefined);
  documentIdsBachelorTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);
  documentIdsMasterTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);

  valid = output<boolean>();
  changed = output<boolean>();

  formbuilder = inject(FormBuilder);

  page2Form = this.formbuilder.group(
    {
      bachelorDegreeName: ['', Validators.required],
      bachelorDegreeUniversity: ['', Validators.required],
      // bachelorGradeUpperLimit: ['', Validators.required],
      // bachelorGradeLowerLimit: ['', Validators.required],
      bachelorGrade: ['', Validators.required],
      masterDegreeName: ['', Validators.required],
      masterDegreeUniversity: ['', Validators.required],
      // masterGradeUpperLimit: ['', Validators.required],
      // masterGradeLowerLimit: ['', Validators.required],
      masterGrade: ['', Validators.required],
    },
    {
      validators: [
        // gradeFormatValidator('bachelorGradeUpperLimit', 'bachelorGradeLowerLimit', 'bachelorGrade'),
        // gradeFormatValidator('masterGradeUpperLimit', 'masterGradeLowerLimit', 'masterGrade'),
      ],
    },
  );

  hasInitialized = signal(false);

  private formValue = toSignal(this.page2Form.valueChanges.pipe(debounceTime(100), distinctUntilChanged(deepEqual)), {
    initialValue: this.page2Form.value,
  });

  private formStatus = toSignal(this.page2Form.statusChanges, {
    initialValue: this.page2Form.status,
  });

  private initializeFormEffect = effect(() => {
    if (this.hasInitialized()) return;
    const data = this.data();
    if (!data) return;

    this.page2Form.patchValue({
      bachelorDegreeName: data.bachelorDegreeName,
      bachelorDegreeUniversity: data.bachelorDegreeUniversity,
      // bachelorGradeUpperLimit: data.bachelorGradeUpperLimit,
      // bachelorGradeLowerLimit: data.bachelorGradeLowerLimit,
      bachelorGrade: data.bachelorGrade,
      masterDegreeName: data.masterDegreeName,
      masterDegreeUniversity: data.masterDegreeUniversity,
      // masterGradeUpperLimit: data.masterGradeUpperLimit,
      // masterGradeLowerLimit: data.masterGradeLowerLimit,
      masterGrade: data.masterGrade,
    });

    this.hasInitialized.set(true);

    // mark prefilled grade fields as touched to show validation errors right away
    const gradeFields = [
      'bachelorGradeUpperLimit',
      'bachelorGradeLowerLimit',
      'bachelorGrade',
      'masterGradeUpperLimit',
      'masterGradeLowerLimit',
      'masterGrade',
    ];

    gradeFields.forEach(fieldName => {
      const control = this.page2Form.get(fieldName);
      if (control?.value) {
        control.markAsTouched();
      }
    });

    this.page2Form.updateValueAndValidity();
    queueMicrotask(() => {
      this.changed.emit(false);
    });
  });

  private updateEffect = effect(() => {
    if (!this.hasInitialized()) return;

    const formData = this.formValue() as Partial<ApplicationCreationPage2Data>;
    const normalized = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, v])) as ApplicationCreationPage2Data;

    const updatedData = {
      ...this.data(),
      ...normalized,
    };

    if (!deepEqual(updatedData, this.data())) {
      this.data.set(updatedData);
      this.changed.emit(true);
    }

    this.valid.emit(this.page2Form.valid);
  });
}
