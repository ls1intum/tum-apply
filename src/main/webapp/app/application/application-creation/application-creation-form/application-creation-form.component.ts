import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { CommonModule } from '@angular/common';
import { ApplicationResourceService, CreateApplicationDTO, JobResourceService } from 'app/generated';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import ApplicationCreationPage1Component, {
  ApplicationCreationPage1Data,
} from '../application-creation-page1/application-creation-page1.component';
import ApplicationCreationPage3Component, {
  ApplicationCreationPage3Data,
} from '../application-creation-page3/application-creation-page3.component';
import ApplicationCreationPage2Component, {
  ApplicationCreationPage2Data,
  bachelorGradingScale,
  masterGradingScale,
} from '../application-creation-page2/application-creation-page2.component';

type ApplicationFormMode = 'create'; /* TODO | 'edit' | 'view' */

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
  standalone: true,
})
export default class ApplicationCreationFormComponent {
  page1: ApplicationCreationPage1Data = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: undefined,
    nationality: undefined,
    language: undefined,
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
    bachelorDegreeName: '',
    bachelorDegreeUniversity: '',
    bachelorGradingScale: bachelorGradingScale[0],
    bachelorGrade: '',
    masterDegreeName: '',
    masterDegreeUniversity: '',
    masterGradingScale: masterGradingScale[0],
    masterGrade: '',
  };
  page3: ApplicationCreationPage3Data = {
    desiredStartDate: '',
    motivation: '',
    skills: '',
    experiences: '',
  };

  panel1 = viewChild<TemplateRef<any>>('panel1');
  panel2 = viewChild<TemplateRef<any>>('panel2');
  panel3 = viewChild<TemplateRef<any>>('panel3');
  title = 'Machine Learning for Climate Science';
  jobId = '';
  mode: ApplicationFormMode = 'create';
  page1Valid = signal<boolean>(false);
  page2Valid = signal<boolean>(false);
  page3Valid = signal<boolean>(false);
  allPagesValid = computed(() => this.page1Valid() && this.page2Valid() && this.page3Valid());
  stepData = computed<StepData[]>(() => {
    const sendData = (state: 'SAVED' | 'SENT'): void => {
      this.sendCreateApplicationData(state);
    };

    const steps: StepData[] = [];
    const panel1 = this.panel1();
    const panel2 = this.panel2();
    const panel3 = this.panel3();
    if (panel1) {
      steps.push({
        name: 'Personal Information',
        panelTemplate: panel1,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'info',
            icon: 'caret-left',
            onClick() {},
            disabled: false,
            label: 'Cancel',
            changePanel: false,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: false,
            label: 'Next',
            changePanel: true,
          },
        ],
      });
    }
    if (panel2) {
      steps.push({
        name: 'Education',
        panelTemplate: panel2,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'arrow-left',
            onClick() {},
            disabled: false,
            label: 'Prev',
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: false,
            label: 'Next',
            changePanel: true,
          },
        ],
      });
    }
    if (panel3) {
      steps.push({
        name: 'Application Details',
        panelTemplate: panel3,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'arrow-left',
            onClick() {},
            disabled: false,
            label: 'Prev',
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'secondary',
            icon: 'save',
            onClick() {
              sendData('SAVED');
            },
            disabled: false,
            label: 'Save Draft',
            changePanel: false,
          },
          {
            severity: 'primary',
            icon: 'paper-plane',
            onClick() {
              sendData('SENT');
            },
            disabled: this.allPagesValid(),
            label: 'Send',
            changePanel: false,
          },
        ],
      });
    }
    return steps;
  });
  private applicationResourceService = inject(ApplicationResourceService);
  private jobResourceService = inject(JobResourceService);
  private router = inject(Router);

  constructor(private route: ActivatedRoute) {
    this.init(route);
  }

  async init(route: ActivatedRoute): Promise<void> {
    const segments = await firstValueFrom(route.url);
    const firstSegment = segments[1]?.path;
    if (firstSegment === 'create') {
      this.mode = 'create';
      const jobId = this.route.snapshot.paramMap.get('job_id');
      if (jobId === null) {
        alert('Error: this is no valid jobId');
      } else {
        this.jobId = jobId;
      }
      const job = await firstValueFrom(this.jobResourceService.getJobDetails(this.jobId));

      if (job.title !== undefined && job.title.trim().length > 0) {
        this.title = job.title;
      }
    } else {
      alert('Error: this is no valid application page link');
    }
  }

  sendCreateApplicationData(state: 'SAVED' | 'SENT'): void {
    const createApplication: CreateApplicationDTO = {
      applicant: {
        user: {
          birthday: this.page1.dateOfBirth,
          firstName: this.page1.firstName,
          lastName: this.page1.lastName,
          email: this.page1.email,
          gender: this.page1.gender?.value as string,
          linkedinUrl: this.page1.linkedIn,
          nationality: this.page1.nationality?.value as string,
          phoneNumber: this.page1.phoneNumber,
          website: this.page1.website,
          selectedLanguage: this.page1.language?.value as string,
          userId: '00000000-0000-0000-0000-000000000103',
        },
        bachelorDegreeName: this.page2.bachelorDegreeName,
        masterDegreeName: this.page2.masterDegreeName,
        bachelorGrade: this.page2.bachelorGrade,
        masterGrade: this.page2.masterGrade,
        // bachelorGradingScale: 'ONE_TO_FOUR', // this.page2.bachelorsGradingScale,
        // masterGradingScale: 'ONE_TO_FOUR', // this.page2.mastersGradingScale,
      },
      jobId: this.jobId,
      applicationState: state,
      desiredDate: this.page3.desiredStartDate,
      motivation: this.page3.motivation,
      specialSkills: this.page3.skills,
      projects: this.page3.experiences,
      // answers: new Set(),
    };
    const router = this.router;
    this.applicationResourceService.createApplication(createApplication).subscribe({
      next() {
        alert('Successfully sent application');
        router.navigate(['/']);
      },
      error(err) {
        console.error('Failed to publish application:', err);
      },
    });
  }

  onPage1ValidityChanged(isValid: boolean): void {
    this.page1Valid.set(isValid);
  }

  onPage2ValidityChanged(isValid: boolean): void {
    this.page2Valid.set(isValid);
  }

  onPage3ValidityChanged(isValid: boolean): void {
    this.page3Valid.set(isValid);
  }
}
