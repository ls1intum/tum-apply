import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { CommonModule, Location } from '@angular/common';
import { ApplicationDocumentIdsDTO, ApplicationResourceService, UpdateApplicationDTO } from 'app/generated';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountService } from 'app/core/auth/account.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import ApplicationCreationPage1Component, {
  ApplicationCreationPage1Data,
  getPage1FromApplication,
} from '../application-creation-page1/application-creation-page1.component';
import ApplicationCreationPage3Component, {
  ApplicationCreationPage3Data,
  getPage3FromApplication,
} from '../application-creation-page3/application-creation-page3.component';
import ApplicationCreationPage2Component, {
  ApplicationCreationPage2Data,
  bachelorGradingScale,
  getPage2FromApplication,
  masterGradingScale,
} from '../application-creation-page2/application-creation-page2.component';

const ApplicationFormModes = {
  CREATE: 'create',
  EDIT: 'edit',
} as const;

type ApplicationFormMode = (typeof ApplicationFormModes)[keyof typeof ApplicationFormModes];

const ApplicationStates = {
  SAVED: 'SAVED',
  SENT: 'SENT',
} as const;

type ApplicationState = (typeof ApplicationStates)[keyof typeof ApplicationStates];

const SavingStates = {
  Saved: 'Saved',
  Saving: 'Saving...',
} as const;

type SavingState = (typeof SavingStates)[keyof typeof SavingStates];

@Component({
  selector: 'jhi-application-creation-form',
  imports: [
    CommonModule,
    ProgressStepperComponent,
    ApplicationCreationPage1Component,
    ApplicationCreationPage2Component,
    ApplicationCreationPage3Component,
    FontAwesomeModule,
  ],
  templateUrl: './application-creation-form.component.html',
  styleUrl: './application-creation-form.component.scss',
  standalone: true,
})
export default class ApplicationCreationFormComponent {
  page1 = signal<ApplicationCreationPage1Data>({
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
  });
  page2 = signal<ApplicationCreationPage2Data>({
    bachelorDegreeName: '',
    bachelorDegreeUniversity: '',
    bachelorGradingScale: bachelorGradingScale[0],
    bachelorGrade: '',
    masterDegreeName: '',
    masterDegreeUniversity: '',
    masterGradingScale: masterGradingScale[0],
    masterGrade: '',
  });
  page3 = signal<ApplicationCreationPage3Data>({
    desiredStartDate: '',
    motivation: '',
    skills: '',
    experiences: '',
  });

  savingBadgeCalculatedClass = computed<string>(
    () =>
      `flex flex-wrap justify-around content-center gap-1 ${this.savingState() === SavingStates.Saved ? 'saved_color' : 'unsaved_color'}`,
  );

  panel1 = viewChild<TemplateRef<any>>('panel1');
  panel2 = viewChild<TemplateRef<any>>('panel2');
  panel3 = viewChild<TemplateRef<any>>('panel3');
  savedStatusPanel = viewChild<TemplateRef<HTMLDivElement>>('saving_state_panel');

  stepData = computed<StepData[]>(() => {
    const sendData = (state: ApplicationState): void => {
      this.sendCreateApplicationData(state, true);
    };

    const deleteApplication = (): void => {
      this.deleteApplication();
    };

    const steps: StepData[] = [];
    const panel1 = this.panel1();
    const panel2 = this.panel2();
    const panel3 = this.panel3();
    const router = this.router;
    const performAutomaticSave = this.performAutomaticSave;
    const statusPanel = this.savedStatusPanel();
    if (panel1) {
      steps.push({
        name: 'Personal Information',
        panelTemplate: panel1,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'info',
            icon: 'caret-left',
            onClick() {
              performAutomaticSave();
              router.navigate(['/']);
            },
            disabled: false,
            label: 'Cancel',
            changePanel: false,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'danger',
            onClick() {
              deleteApplication();
            },
            disabled: false,
            label: 'Delete',
            changePanel: false,
          },
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: false,
            label: 'Next',
            changePanel: true,
          },
        ],
        status: statusPanel,
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
            severity: 'danger',
            onClick() {
              deleteApplication();
            },
            disabled: false,
            label: 'Delete',
            changePanel: false,
          },
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: false,
            label: 'Next',
            changePanel: true,
          },
        ],
        status: statusPanel,
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
            severity: 'danger',
            onClick() {
              deleteApplication();
            },
            disabled: false,
            label: 'Delete',
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
        status: statusPanel,
      });
    }
    return steps;
  });

  title = signal<string>('');

  jobId = signal<string>('');
  applicantId = signal<string>('');
  applicationId = signal<string | undefined>(undefined);

  applicationState = signal<ApplicationState>(ApplicationStates.SAVED);

  savingState = signal<SavingState>(SavingStates.Saved);

  mode: ApplicationFormMode = 'create';

  page1Valid = signal<boolean>(false);
  page2Valid = signal<boolean>(false);
  page3Valid = signal<boolean>(false);

  savingTick = signal<number>(0);

  allPagesValid = computed(() => this.page1Valid() && this.page2Valid() && this.page3Valid());

  documentIds = signal<ApplicationDocumentIdsDTO | undefined>(undefined);

  private applicationResourceService = inject(ApplicationResourceService);
  private accountService = inject(AccountService);
  private router = inject(Router);

  private location = inject(Location);

  constructor(private route: ActivatedRoute) {
    this.init(route);

    effect(() => {
      const intervalId = setInterval(() => {
        this.performAutomaticSave();
      }, 10000);
      return () => clearInterval(intervalId);
    });
  }

  async init(route: ActivatedRoute): Promise<void> {
    this.applicantId.set(this.accountService.loadedUser()?.id ?? '');
    const segments = await firstValueFrom(route.url);
    const firstSegment = segments[1]?.path;
    let application;
    if (firstSegment === ApplicationFormModes.CREATE) {
      this.mode = ApplicationFormModes.CREATE;
      const jobId = this.route.snapshot.paramMap.get('job_id');
      if (jobId === null) {
        alert('Error: this is no valid jobId');
      } else {
        this.jobId.set(jobId);
      }
      application = await firstValueFrom(this.applicationResourceService.createApplication(this.jobId(), this.applicantId()));
    } else if (firstSegment === ApplicationFormModes.EDIT) {
      this.mode = ApplicationFormModes.EDIT;
      const applicationId = this.route.snapshot.paramMap.get('application_id');
      if (applicationId === null) {
        alert('Error: this is no valid applicationId');
        return;
      }
      application = await firstValueFrom(this.applicationResourceService.getApplicationById(applicationId));
    } else {
      alert('Error: this is no valid application page link');
      return;
    }
    this.jobId.set(application.job.jobId);
    if (application.job.title && application.job.title.trim().length > 0) {
      this.title.set(application.job.title);
    }
    this.applicationId.set(application.applicationId);
    this.page1.set(getPage1FromApplication(application));
    this.page2.set(getPage2FromApplication(application));
    this.page3.set(getPage3FromApplication(application));

    firstValueFrom(this.applicationResourceService.getDocumentDictionaryIds(application.applicationId))
      .then(ids => {
        this.documentIds.set(ids);
      })
      .catch(() => alert('Error: fetching the document ids for this application'));
    this.location.replaceState(`${segments[0].path}/${ApplicationFormModes.EDIT}/${this.applicationId()}`);
  }

  performAutomaticSave(): void {
    if (this.savingState() === SavingStates.Saving) {
      this.sendCreateApplicationData(this.applicationState(), false);
      this.savingState.set(SavingStates.Saved);
    }
  }

  sendCreateApplicationData(state: ApplicationState, rerouteToOtherPage: boolean): void {
    const router = this.router;
    const applicationId = this.applicationId();
    if (applicationId === undefined) {
      alert('There is an error with the applicationId');
      return;
    }
    const updateApplication: UpdateApplicationDTO = {
      applicationId,
      applicant: {
        user: {
          birthday: this.page1().dateOfBirth,
          firstName: this.page1().firstName,
          lastName: this.page1().lastName,
          email: this.page1().email,
          gender: this.page1().gender?.value as string,
          linkedinUrl: this.page1().linkedIn,
          nationality: this.page1().nationality?.value as string,
          phoneNumber: this.page1().phoneNumber,
          website: this.page1().website,
          selectedLanguage: this.page1().language?.value as string,
          userId: this.applicantId(),
        },
        bachelorDegreeName: this.page2().bachelorDegreeName,
        masterDegreeName: this.page2().masterDegreeName,
        bachelorGrade: this.page2().bachelorGrade,
        masterGrade: this.page2().masterGrade,
        bachelorGradingScale: 'ONE_TO_FOUR', // this.page2.bachelorsGradingScale,
        masterGradingScale: 'ONE_TO_FOUR', // this.page2.mastersGradingScale,
        city: this.page1().city,
        country: this.page1().country,
        postalCode: this.page1().postcode,
        street: this.page1().street,
        bachelorUniversity: this.page2().bachelorDegreeUniversity,
        masterUniversity: this.page2().masterDegreeUniversity,
      },
      applicationState: state,
      desiredDate: this.page3().desiredStartDate,
      motivation: this.page3().motivation,
      specialSkills: this.page3().skills,
      projects: this.page3().experiences,
      // answers: new Set(),
    };
    this.applicationResourceService.updateApplication(updateApplication).subscribe({
      next() {
        if (rerouteToOtherPage) {
          alert('Successfully saved application');
          router.navigate(['/']);
        }
      },
      error(err) {
        alert('Failed to save application:' + (err as HttpErrorResponse).statusText);
        console.error('Failed to save application:', err);
      },
    });
  }

  async deleteApplication(): Promise<void> {
    const confirmResult = confirm('Are you sure you want to delete this application?');
    if (!confirmResult) {
      return;
    }
    const router = this.router;
    const applicationId = this.applicationId();
    if (applicationId !== undefined && applicationId.trim().length !== 0) {
      try {
        await firstValueFrom(this.applicationResourceService.deleteApplication(applicationId));
        alert('Application sucessfully deleted');
        router.navigate(['/']);
      } catch (err) {
        alert('Error deleting this application' + (err as HttpErrorResponse).statusText);
        console.error('Failed to delete this application');
      }
    } else {
      alert('There was an error because of an invalid applicationId');
      this.router.navigate(['/']);
    }
  }

  onPage1ValidityChanged(isValid: boolean): void {
    this.page1Valid.set(isValid);
  }

  onValueChanged(): void {
    this.savingState.set(SavingStates.Saving);
  }

  onPage2ValidityChanged(isValid: boolean): void {
    this.page2Valid.set(isValid);
  }

  onPage3ValidityChanged(isValid: boolean): void {
    this.page3Valid.set(isValid);
  }
}
