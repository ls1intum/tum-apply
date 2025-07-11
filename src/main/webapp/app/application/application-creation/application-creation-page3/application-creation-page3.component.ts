import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, model, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ApplicationForApplicantDTO } from 'app/generated';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TooltipModule } from 'primeng/tooltip';

import { DatePickerComponent } from '../../../shared/components/atoms/datepicker/datepicker.component';

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
  ],
  templateUrl: './application-creation-page3.component.html',
  styleUrl: './application-creation-page3.component.scss',
  standalone: true,
})
export default class ApplicationCreationPage3Component {
  data = model.required<ApplicationCreationPage3Data>();

  applicationIdForDocuments = input<string | undefined>(undefined);
  documentIdsCv = input<string | undefined>(undefined);
  computedDocumentIdsCvSet = computed<string[] | undefined>(() => {
    const documentIdsCv = this.documentIdsCv();
    if (documentIdsCv) {
      return [documentIdsCv];
    }
    return undefined;
  });
  documentIdsReferences = input<string[] | undefined>(undefined);

  valid = output<boolean>();
  changed = output<boolean>();

  fb = inject(FormBuilder);
  page3Form = computed(() => {
    const currentData = this.data();
    return this.fb.group({
      experiences: [currentData.experiences, Validators.required],
      motivation: [currentData.motivation, Validators.required],
      skills: [currentData.skills, Validators.required],
      // optional
      desiredStartDate: [currentData.desiredStartDate],
    });
  });

  constructor() {
    effect(onCleanup => {
      const form = this.page3Form();
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

      onCleanup(() => {
        valueSubscription.unsubscribe();
        statusSubscription.unsubscribe();
      });
    });
  }

  emitChanged(): void {
    this.changed.emit(true);
  }

  setDesiredStartDate($event: string | undefined): void {
    this.data.set({
      ...this.data(),
      desiredStartDate: $event ?? '',
    });
    this.emitChanged();
  }
}
