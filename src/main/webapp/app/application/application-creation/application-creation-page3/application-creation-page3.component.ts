import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import SharedModule from 'app/shared/shared.module';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DatePickerComponent } from 'app/shared/components/atoms/datepicker/datepicker.component';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { DocumentInformationHolderDTO } from 'app/generated/model/documentInformationHolderDTO';
import { htmlTextRequiredValidator } from 'app/shared/validators/custom-validators';
import { deepEqual } from 'app/core/util/deepequal-util';

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
export default class ApplicationCreationPage3Component {
  data = model<ApplicationCreationPage3Data>();

  applicationIdForDocuments = input<string | undefined>();
  documentIdsCv = input<DocumentInformationHolderDTO | undefined>();
  documentIdsReferences = input<DocumentInformationHolderDTO[] | undefined>();

  valid = output<boolean>();
  changed = output<boolean>();

  hasInitialized = signal(false);
  cvValid = signal<boolean>(this.documentIdsCv() !== undefined);

  formbuilder = inject(FormBuilder);

  page3Form: FormGroup = this.formbuilder.group({
    experiences: ['', htmlTextRequiredValidator], // TODO: tried putting htmlTextMaxLengthValidator(1000) but it created bugs such as step 3 not loading fully and auto-save breaking
    motivation: ['', htmlTextRequiredValidator],
    skills: ['', htmlTextRequiredValidator],
    desiredStartDate: [''],
  });

  formValue = toSignal(this.page3Form.valueChanges.pipe(debounceTime(100)).pipe(distinctUntilChanged(deepEqual)), {
    initialValue: this.page3Form.value,
  });

  formStatus = toSignal(this.page3Form.statusChanges, {
    initialValue: this.page3Form.status,
  });

  computedDocumentIdsCvSet = computed(() => {
    const docInfoHolder = this.documentIdsCv();
    return docInfoHolder ? [docInfoHolder] : undefined;
  });

  private updateEffect = effect(() => {
    if (!this.hasInitialized()) return;
    const raw = this.formValue();
    const normalized = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v ?? ''])) as ApplicationCreationPage3Data;

    const newData = { ...this.data(), ...normalized };
    if (!deepEqual(newData, this.data())) {
      this.data.set(newData);
      this.changed.emit(true);
    }
    this.valid.emit(this.page3Form.valid && this.cvValid());
  });

  private initializeFormEffect = effect(() => {
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

  private initializeCvDocs = effect(() => {
    const cvDocs = this.computedDocumentIdsCvSet();
    this.cvDocsSetValidity(cvDocs);
  });

  emitChanged(): void {
    this.changed.emit(true);
  }

  cvDocsSetValidity(cvDocs: DocumentInformationHolderDTO[] | undefined): void {
    if (cvDocs === undefined || cvDocs.length === 0) {
      this.cvValid.set(false);
    } else {
      this.cvValid.set(true);
    }
  }

  setDesiredStartDate($event: string | undefined): void {
    const currentData = this.data();
    if (currentData !== undefined) {
      this.data.set({
        ...currentData,
        desiredStartDate: $event ?? '',
      });
    }

    this.page3Form.patchValue({
      desiredStartDate: $event ?? '',
    });
    this.emitChanged();
  }
}
