import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, model, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DividerComponent } from 'app/shared/components/atoms/divider/divider.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';

import { DatePickerComponent } from '../../../../shared/components/atoms/datepicker/datepicker.component';
import { ApplicationForApplicantDTO } from 'app/generated';

export type ApplicationCreationPage3Data = {
  desiredStartDate: string;
  // TODO cv
  // TODO references
  motivation: string;
  skills: string;
  experiences: string;
};

@Component({
  selector: 'jhi-application-creation-page3',
  imports: [CommonModule, ReactiveFormsModule, StringInputComponent, DividerComponent, DatePickerComponent],
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

    // Keep form values in sync with the model
    this.page3Form.valueChanges.subscribe(value => {
      // this.data().desiredStartDate = value.desiredStartDate;
      this.data().experiences = value.experiences;
      this.data().motivation = value.motivation;
      this.data().skills = value.skills;
      this.valid.emit(this.page3Form.valid);
    });
  }
}

export const getPage3FromApplication = (application: ApplicationForApplicantDTO): ApplicationCreationPage3Data => {
  return {
    desiredStartDate: application.desiredDate ?? '',
    motivation: application.motivation ?? '',
    skills: application.specialSkills ?? '',
    experiences: application.projects ?? '',
  };
};
