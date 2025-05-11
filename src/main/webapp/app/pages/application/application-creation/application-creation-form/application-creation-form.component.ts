import { Component, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import ApplicationCreationPage1Component, {
  ApplicationCreationPage1Data,
} from '../application-creation-page1/application-creation-page1.component';
import ApplicationCreationPage3Component, {
  ApplicationCreationPage3Data,
} from '../application-creation-page3/application-creation-page3.component';
import ApplicationCreationPage2Component, {
  ApplicationCreationPage2Data,
} from '../application-creation-page2/application-creation-page2.component';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { CommonModule } from '@angular/common';

type ApplicationCreationFormData = {
  page1: ApplicationCreationPage1Data;
  page2: ApplicationCreationPage2Data;
  page3: ApplicationCreationPage3Data;
};

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
  applicationData = signal<ApplicationCreationFormData>({
    page1: {
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
      streetnumber: -1,
    },
    page2: {
      bachelorsDegreeName: '',
      bachelorsDegreeUniversity: '',
      bachelorsGradingScale: '',
      bachelorsGrade: '',
      mastersDegreeName: '',
      mastersDegreeUniversity: '',
      mastersGradingScale: '',
      mastersGrade: '',
    },
    page3: {
      desiredStartDate: new Date(),
      motivation: '',
      skills: '',
      experiences: '',
    },
  });

  @ViewChild('panel1', { static: true }) panel1!: TemplateRef<any>;
  @ViewChild('panel2', { static: true }) panel2!: TemplateRef<any>;
  @ViewChild('panel3', { static: true }) panel3!: TemplateRef<any>;

  stepData: StepData[] = [];

  ngOnInit(): void {
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
        name: 'Application Details', //TODO translation
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
            onClick() {},
            disabled: false,
            label: 'Save Draft',
          },
          {
            variant: 'filled',
            color: 'primary',
            icon: 'paper-plane',
            onClick() {},
            disabled: false,
            label: 'Send',
          },
        ],
      },
    ];
  }
}
