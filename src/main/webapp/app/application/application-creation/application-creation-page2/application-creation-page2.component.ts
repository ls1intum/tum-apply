import { CommonModule } from '@angular/common';
import { Component, Signal, effect, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplicantDTO, ApplicationForApplicantDTO, DocumentInformationHolderDTO } from 'app/generated';
import { SelectComponent, SelectOption } from 'app/shared/components/atoms/select/select.component';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { StringInputComponent } from '../../../shared/components/atoms/string-input/string-input.component';
import { ApplicationCreationPageBaseComponent } from '../application-creation-page.component';

export type ApplicationCreationPage2Data = {
  bachelorDegreeName: string;
  bachelorDegreeUniversity: string;
  bachelorGradingScale: SelectOption;
  bachelorGrade: string;
  masterDegreeName: string;
  masterDegreeUniversity: string;
  masterGradingScale: SelectOption;
  masterGrade: string;
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
  imports: [
    CommonModule,
    DividerModule,
    SelectComponent,
    UploadButtonComponent,
    ReactiveFormsModule,
    StringInputComponent,
    TranslateModule,
  ],
  templateUrl: './application-creation-page2.component.html',
  styleUrl: './application-creation-page2.component.scss',
  standalone: true,
})
export default class ApplicationCreationPage2Component extends ApplicationCreationPageBaseComponent<ApplicationCreationPage2Data> {
  bachelorGradingScaleLocal = bachelorGradingScale;
  masterGradingScaleLocal = masterGradingScale;

  applicationIdForDocuments = input<string | undefined>();
  documentIdsBachelorTranscript = input<DocumentInformationHolderDTO[] | undefined>();
  documentIdsMasterTranscript = input<DocumentInformationHolderDTO[] | undefined>();

  page2Form: FormGroup = this.fb.group({
    bachelorDegreeName: ['', Validators.required],
    bachelorDegreeUniversity: ['', Validators.required],
    bachelorGrade: ['', Validators.required],
    bachelorGradingScale: [bachelorGradingScale[0]], // Default value
    masterDegreeName: ['', Validators.required],
    masterDegreeUniversity: ['', Validators.required],
    masterGrade: ['', Validators.required],
    masterGradingScale: [masterGradingScale[0]], // Default value
  });

  get pageForm(): FormGroup {
    return this.page2Form;
  }

  formValue: Signal<ApplicationCreationPage2Data> = toSignal(this.formValue$(), { initialValue: this.pageForm.value });

  initializeFormEffect = effect(() => {
    if (this.hasInitialized()) return;
    const data = this.data();
    if (!data) return;

    this.page2Form.patchValue({
      bachelorDegreeName: data.bachelorDegreeName,
      bachelorDegreeUniversity: data.bachelorDegreeUniversity,
      bachelorGrade: data.bachelorGrade,
      bachelorGradingScale: data.bachelorGradingScale,
      masterDegreeName: data.masterDegreeName,
      masterDegreeUniversity: data.masterDegreeUniversity,
      masterGrade: data.masterGrade,
      masterGradingScale: data.masterGradingScale,
    });

    this.hasInitialized.set(true);
  });
}
