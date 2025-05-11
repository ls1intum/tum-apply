import { Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { CommonModule } from '@angular/common';

import ApplicationCreationPage1Component, {
  ApplicationCreationPage1Data,
} from '../application-creation-page1/application-creation-page1.component';
import ApplicationCreationPage3Component, {
  ApplicationCreationPage3Data,
} from '../application-creation-page3/application-creation-page3.component';
import ApplicationCreationPage2Component, {
  ApplicationCreationPage2Data,
} from '../application-creation-page2/application-creation-page2.component';
import { ApplicationResourceService, CreateApplicationDTO } from 'app/generated';

@Component({
  selector: 'jhi-application-creation-form',
  imports: [
    CommonModule,
    ProgressStepperComponent,
    ApplicationCreationPage1Component,
    ApplicationCreationPage2Component,
    ApplicationCreationPage3Component,
  ],
  templateUrl: './application-creation-form.component.html',
  styleUrl: './application-creation-form.component.scss',
})
export default class ApplicationCreationFormComponent implements OnInit {
  page1: ApplicationCreationPage1Data = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    nationality: '',
    language: '',
    dateOfBirth: '',
    website: '',
    linkedIn: '',
    street: '',
    city: '',
    country: '',
    postcode: '',
    streetnumber: '',
  };
  page2: ApplicationCreationPage2Data = {
    bachelorsDegreeName: '',
    bachelorsDegreeUniversity: '',
    bachelorsGradingScale: '',
    bachelorsGrade: '',
    mastersDegreeName: '',
    mastersDegreeUniversity: '',
    mastersGradingScale: '',
    mastersGrade: '',
  };
  page3: ApplicationCreationPage3Data = {
    desiredStartDate: { day: 1, month: 1, year: 1970 },
    motivation: '',
    skills: '',
    experiences: '',
  };

  @ViewChild('panel1', { static: true }) panel1!: TemplateRef<any>;
  @ViewChild('panel2', { static: true }) panel2!: TemplateRef<any>;
  @ViewChild('panel3', { static: true }) panel3!: TemplateRef<any>;

  private applicationResourceService = inject(ApplicationResourceService);

  stepData: StepData[] = [];

  ngOnInit(): void {
    const sendData = (state: 'SAVED' | 'SENT') => {
      this.sendCreateApplicationData(state);
    };
    this.stepData = [
      {
        name: 'Personal Information', // TODO translation
        panelTemplate: this.panel1,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            color: 'info',
            icon: 'caret-left',
            onClick() {},
            disabled: false,
            label: 'Cancel', // TODO translation
          },
        ],
        buttonGroupNext: [
          {
            variant: 'filled',
            color: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: false,
            label: 'Next',
            changePanel: true,
          },
        ],
      },
      {
        name: 'Education', // TODO translation
        panelTemplate: this.panel2,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            color: 'primary',
            icon: 'arrow-left',
            onClick() {},
            disabled: false,
            label: 'Prev',
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            variant: 'filled',
            color: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: false,
            label: 'Next',
            changePanel: true,
          },
        ],
      },
      {
        name: 'Application Details', // TODO translation
        panelTemplate: this.panel3,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            color: 'primary',
            icon: 'arrow-left',
            onClick() {},
            disabled: false,
            label: 'Prev',
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            variant: 'filled',
            color: 'secondary',
            icon: 'save',
            onClick() {
              sendData('SAVED');
            },
            disabled: false,
            label: 'Save Draft',
          },
          {
            variant: 'filled',
            color: 'primary',
            icon: 'paper-plane',
            onClick() {
              sendData('SENT');
            },
            disabled: false,
            label: 'Send',
          },
        ],
      },
    ];
  }

  sendCreateApplicationData(state: 'SAVED' | 'SENT') {
    let createApplication: CreateApplicationDTO = {
      applicant: {
        user: {
          birthday: this.page1.dateOfBirth,
          firstName: this.page1.firstName,
          lastName: this.page1.lastName,
          email: this.page1.email,
          gender: this.page1.gender,
          linkedinUrl: this.page1.linkedIn,
          nationality: this.page1.nationality,
          phoneNumber: this.page1.phoneNumber,
          website: this.page1.website,
          //id?
        },
        bachelorDegreeName: this.page2.bachelorsDegreeName,
        masterDegreeName: this.page2.mastersDegreeName,
        bachelorGrade: this.page2.bachelorsGrade,
        masterGrade: this.page2.mastersGrade,
        bachelorGradingScale: 'ONE_TO_FOUR', //this.page2.bachelorsGradingScale,
        masterGradingScale: 'ONE_TO_FOUR', //this.page2.mastersGradingScale,
      },
      applicationState: state,
      answers: new Set(),
      desiredDate: `${this.page3.desiredStartDate.year}-${this.page3.desiredStartDate.month}-${this.page3.desiredStartDate.day}`, // TODO
      job: undefined, // TODO,
      motivation: this.page3.motivation,
      specialSkills: this.page3.skills,
      projects: this.page3.experiences,
    };

    this.applicationResourceService.createApplication(createApplication);
  }
}
