import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
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
import { ApplicantDTO } from '../../../generated/model/applicantDTO';
import { ApplicationForApplicantDTO } from '../../../generated/model/applicationForApplicantDTO';
import { DocumentInformationHolderDTO } from '../../../generated/model/documentInformationHolderDTO';

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
  name: `entity.applicationSteps.gradingScale.${v}`,
}));
export const masterGradingScale: SelectOption[] = Object.values(ApplicantDTO.MasterGradingScaleEnum).map(v => ({
  value: v,
  name: `entity.applicationSteps.gradingScale.${v}`,
}));

export const getPage2FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage2Data => {
  const bachelorGradeApplicant = application.applicant?.bachelorGrade;
  const masterGradeApplicant = application.applicant?.masterGrade;
  return {
    bachelorDegreeName: application.applicant?.bachelorDegreeName ?? '',
    bachelorDegreeUniversity: application.applicant?.bachelorUniversity ?? '',
    bachelorGradingScale: bachelorGradingScale[0], // TODO: set from data
    bachelorGrade: bachelorGradeApplicant !== undefined ? Number.parseFloat(bachelorGradeApplicant) : undefined,
    masterDegreeName: application.applicant?.masterDegreeName ?? '',
    masterDegreeUniversity: application.applicant?.masterUniversity ?? '',
    masterGradingScale: masterGradingScale[0],
    masterGrade: masterGradeApplicant !== undefined ? Number.parseFloat(masterGradeApplicant) : undefined,
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
})
export default class ApplicationCreationPage2Component {
  BachelorGradingScaleEnumLocal = ApplicantDTO.BachelorGradingScaleEnum;
  MasterGradingScaleEnumLocal = ApplicantDTO.MasterGradingScaleEnum;
  bachelorGradingScaleLocal = bachelorGradingScale;
  masterGradingScaleLocal = masterGradingScale;

  data = model<ApplicationCreationPage2Data>();

  applicationIdForDocuments = input<string | undefined>(undefined);
  documentIdsBachelorTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);
  documentIdsMasterTranscript = input<DocumentInformationHolderDTO[] | undefined>(undefined);

  valid = output<boolean>();
  changed = output<boolean>();

  formbuilder = inject(FormBuilder);

  page2Form = this.formbuilder.group({
    bachelorDegreeName: ['', Validators.required],
    bachelorDegreeUniversity: ['', Validators.required],
    bachelorGrade: [0, [Validators.required, Validators.min(1), Validators.max(4)]],
    masterDegreeName: ['', Validators.required],
    masterDegreeUniversity: ['', Validators.required],
    masterGrade: [0, [Validators.required, Validators.min(1), Validators.max(4)]],
  });

  private hasInitialized = signal(false);

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
      bachelorGrade: data.bachelorGrade ?? null,
      masterDegreeName: data.masterDegreeName,
      masterDegreeUniversity: data.masterDegreeUniversity,
      masterGrade: data.masterGrade ?? null,
    });

    this.hasInitialized.set(true);
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

  setBachelorGradeAsNumber = (gradeInputValue: number | undefined): void => {
    const currentData = this.data();
    if (!currentData) return;

    this.data.set({
      ...currentData,
      bachelorGrade: gradeInputValue,
    });

    this.page2Form.patchValue({
      bachelorGrade: gradeInputValue ?? null,
    });
  };

  setMasterGradeAsNumber = (gradeInputValue: number | undefined): void => {
    const currentData = this.data();
    if (!currentData) return;

    this.data.set({
      ...currentData,
      masterGrade: gradeInputValue,
    });

    this.page2Form.patchValue({
      masterGrade: gradeInputValue ?? null,
    });
  };
}
