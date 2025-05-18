import { CommonModule } from '@angular/common';
import { Component, OnInit, model, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';

import { DividerComponent } from 'app/shared/components/atoms/divider/divider.component';
import { ApplicationForApplicantDTO } from 'app/generated';

import { DatePickerComponent } from '../../../../shared/components/atoms/datepicker/datepicker.component';
import { UploadButtonComponent } from 'app/shared/components/atoms/upload-button/upload-button.component';

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
    DividerComponent,
    DatePickerComponent,
    TextareaModule,
    UploadButtonComponent,
  ],
  templateUrl: './application-creation-page3.component.html',
  styleUrl: './application-creation-page3.component.scss',
})
export default class ApplicationCreationPage3Component implements OnInit {
  data = model.required<ApplicationCreationPage3Data>();

  valid = output<boolean>();

  page3Form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.page3Form = this.fb.group({
      experiences: [this.data().experiences, Validators.required],
      motivation: [this.data().motivation, Validators.required],
      skills: [this.data().skills, Validators.required],
    });

    this.page3Form.valueChanges.subscribe(value => {
      this.data().experiences = value.experiences;
      this.data().motivation = value.motivation;
      this.data().skills = value.skills;
      this.valid.emit(this.page3Form.valid);
    });
  }
}
