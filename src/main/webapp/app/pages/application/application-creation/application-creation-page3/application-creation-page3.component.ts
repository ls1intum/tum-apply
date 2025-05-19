import { CommonModule } from '@angular/common';
import { Component, effect, inject, model, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ApplicationForApplicantDTO } from 'app/generated';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';
import { DividerModule } from 'primeng/divider';

import { DatePickerComponent } from '../../../../shared/components/atoms/datepicker/datepicker.component';

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
  imports: [CommonModule, ReactiveFormsModule, FloatLabelModule, DividerModule, DatePickerComponent, TextareaModule, UploadButtonComponent],
  templateUrl: './application-creation-page3.component.html',
  styleUrl: './application-creation-page3.component.scss',
})
export default class ApplicationCreationPage3Component {
  data = model.required<ApplicationCreationPage3Data>();

  valid = output<boolean>();

  page3Form = signal<FormGroup | undefined>(undefined);

  fb = inject(FormBuilder);

  constructor() {
    effect(() => {
      const currentData = this.data(); // will throw until data is set
      this.page3Form.set(
        this.fb.group({
          experiences: [currentData.experiences, Validators.required],
          motivation: [currentData.motivation, Validators.required],
          skills: [currentData.skills, Validators.required],
        }),
      );

      this.valid.emit(this.page3Form()?.valid ?? false);
    });

    effect(() => {
      const form = this.page3Form();
      if (form) {
        form.valueChanges.subscribe(value => {
          this.data.set({
            ...this.data(),
            ...value,
          });

          this.valid.emit(form.valid);
        });
      }
    });
  }
}
