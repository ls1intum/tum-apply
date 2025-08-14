import { CommonModule } from '@angular/common';
import { Component, Signal, computed, effect, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ApplicationForApplicantDTO, DocumentInformationHolderDTO } from 'app/generated';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import SharedModule from 'app/shared/shared.module';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { toSignal } from '@angular/core/rxjs-interop';

import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';
import { ApplicationCreationPageBaseComponent } from '../application-creation-page.component';

export type ApplicationCreationPage3Data = {
  desiredStartDate: string;
  motivation: string;
  skills: string;
  experiences: string;
};

export const getPage3FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage3Data => {
  return {
    desiredStartDate: application.desiredDate ?? '',
    motivation: application.motivation ?? '',
    skills: application.specialSkills ?? '',
    experiences: application.projects ?? '',
  };
};

@Component({
  selector: 'jhi-application-creation-page3',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FloatLabelModule,
    DividerModule,
    DatePickerComponent,
    TextareaModule,
    UploadButtonComponent,
    FontAwesomeModule,
    TooltipModule,
    TranslateModule,
    SharedModule,
    EditorComponent,
  ],
  templateUrl: './application-creation-page3.component.html',
  styleUrl: './application-creation-page3.component.scss',
  standalone: true,
})
export default class ApplicationCreationPage3Component extends ApplicationCreationPageBaseComponent<ApplicationCreationPage3Data> {
  applicationIdForDocuments = input<string | undefined>();
  documentIdsCv = input<DocumentInformationHolderDTO | undefined>();
  documentIdsReferences = input<DocumentInformationHolderDTO[] | undefined>();

  page3Form: FormGroup = this.fb.group({
    experiences: [this.data()?.experiences ?? '', Validators.required],
    motivation: [this.data()?.motivation ?? '', Validators.required],
    skills: [this.data()?.skills ?? '', Validators.required],
    desiredStartDate: [this.data()?.desiredStartDate ?? ''],
  });

  get pageForm(): FormGroup {
    return this.page3Form;
  }

  formValue: Signal<ApplicationCreationPage3Data> = toSignal(this.formValue$(), { initialValue: this.pageForm.value });

  computedDocumentIdsCvSet = computed(() => {
    const doc = this.documentIdsCv();
    return doc ? [doc] : undefined;
  });


  initializeFormEffect = effect(() => {
    if (this.hasInitialized()) return;
    const data = this.data();
    if (!data) return;
    this.page3Form.patchValue({
      experiences: data.experiences,
      motivation: data.motivation,
      skills: data.skills,
      desiredStartDate: data.desiredStartDate,
    });
    this.hasInitialized.set(true);
  });

  setDesiredStartDate($event: string | undefined): void {
    const currentData = this.data();
    if (currentData !== undefined) {
      this.data.set({
        ...currentData,
        desiredStartDate: $event ?? '',
      });
    }
    this.emitChanged();
  }
}
