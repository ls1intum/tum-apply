import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';

export type ApplicationCreationPage3Data = {
  desiredStartDate: string;
  motivation: string;
  skills: string;
  experiences: string;
  privacyAccepted?: boolean;
};

export const getPage3FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage3Data => {
  return {
    desiredStartDate: application.desiredDate ?? '',
    motivation: application.motivation ?? '',
    skills: application.specialSkills ?? '',
    experiences: application.projects ?? '',
  };
};

function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

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
  submitAttempted = input<boolean>(false);

  valid = output<boolean>();
  changed = output<boolean>();
  privacyAcceptedChanged = output<boolean>();

  formbuilder = inject(FormBuilder);

  hasInitialized = signal(false);

  page3Form: FormGroup = this.formbuilder.group({
    experiences: [this.data()?.experiences ?? '', Validators.required],
    motivation: [this.data()?.motivation ?? '', Validators.required],
    skills: [this.data()?.skills ?? '', Validators.required],
    desiredStartDate: [this.data()?.desiredStartDate ?? ''],
    privacyAccepted: [this.data()?.privacyAccepted ?? false],
  });

  privacyAcceptedSignal = toSignal(this.page3Form.controls.privacyAccepted.valueChanges, {
    initialValue: this.page3Form.controls.privacyAccepted.value,
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
    this.valid.emit(this.computeContentValid());
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

  private emitPrivacyChangeEffect = effect(() => {
    const accepted = !!this.privacyAcceptedSignal();
    this.privacyAcceptedChanged.emit(accepted);
  });

  emitChanged(): void {
    this.changed.emit(true);
  }

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

  private computeContentValid(): boolean {
    const f = this.page3Form.controls;
    return f.experiences.valid && f.motivation.valid && f['skills'].valid;
  }
}
