import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { CommonModule, Location } from '@angular/common';
import { ApplicationDocumentIdsDTO, ApplicationResourceService, UpdateApplicationDTO } from 'app/generated';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountService } from 'app/core/auth/account.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
  SAVED: 'SAVED',
  SAVING: 'SAVING',
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
    TranslateModule,
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
      `flex flex-wrap justify-around content-center gap-1 ${this.savingState() === SavingStates.SAVED ? 'saved_color' : 'unsaved_color'}`,
  );

  panel1 = viewChild<TemplateRef<any>>('panel1');
  panel2 = viewChild<TemplateRef<any>>('panel2');
  panel3 = viewChild<TemplateRef<any>>('panel3');
  savedStatusPanel = viewChild<TemplateRef<HTMLDivElement>>('saving_state_panel');

  stepData = computed<StepData[]>(() => {
    const sendData = (state: ApplicationState): void => {
      this.sendCreateApplicationData(state, true);
    };

    const steps: StepData[] = [];
    const panel1 = this.panel1();
    const panel2 = this.panel2();
    const panel3 = this.panel3();
    const page1Valid = this.page1Valid();
    const page2Valid = this.page2Valid();
    const allPagesValid = this.allPagesValid();
    const location = this.location;
    const performAutomaticSaveLocal: () => Promise<void> = () => this.performAutomaticSave();
    const statusPanel = this.savedStatusPanel();
    const updateDocumentInformation = this.updateDocumentInformation.bind(this);
    if (panel1) {
      steps.push({
        name: 'entity.applicationSteps.personalInformation',
        panelTemplate: panel1,
        shouldTranslate: true,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'info',
            icon: 'caret-left',
            onClick(): void {
              (async () => {
                await performAutomaticSaveLocal();
                location.back();
              })();
            },
            disabled: false,
            label: 'entity.applicationSteps.buttons.cancel',
            changePanel: false,
            shouldTranslate: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: !page1Valid,
            label: 'entity.applicationSteps.buttons.next',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        status: statusPanel,
      });
    }

    if (panel2) {
      steps.push({
        name: 'entity.applicationSteps.education',
        panelTemplate: panel2,
        shouldTranslate: true,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'arrow-left',
            onClick() {
              updateDocumentInformation();
            },
            disabled: false,
            label: 'entity.applicationSteps.buttons.prev',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {
              updateDocumentInformation();
            },
            disabled: !page2Valid,
            label: 'entity.applicationSteps.buttons.next',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        status: statusPanel,
      });
    }

    if (panel3) {
      steps.push({
        name: 'entity.applicationSteps.applicationDetails',
        shouldTranslate: true,
        panelTemplate: panel3,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'arrow-left',
            onClick() {
              updateDocumentInformation();
            },
            disabled: false,
            label: 'entity.applicationSteps.buttons.prev',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'paper-plane',
            onClick() {
              sendData('SENT');
            },
            disabled: !allPagesValid,
            label: 'entity.applicationSteps.buttons.send',
            shouldTranslate: true,
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
  applicationId = signal<string>('');

  applicationState = signal<ApplicationState>(ApplicationStates.SAVED);

  savingState = signal<SavingState>(SavingStates.SAVED);

  mode: ApplicationFormMode = 'create';

  page1Valid = signal<boolean>(false);
  page2Valid = signal<boolean>(false);
  page3Valid = signal<boolean>(false);

  savingTick = signal<number>(0);

  allPagesValid = computed(() => this.page1Valid() && this.page2Valid() && this.page3Valid());

  documentIds = signal<ApplicationDocumentIdsDTO | undefined>(undefined);

  private applicationResourceService = inject(ApplicationResourceService);
  private accountService = inject(AccountService);

  private location = inject(Location);
  private translate = inject(TranslateService);

  constructor(private route: ActivatedRoute) {
    this.init(route);

    effect(() => {
      const intervalId = setInterval(() => {
        this.performAutomaticSave();
      }, 3000);
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
      application = await firstValueFrom(this.applicationResourceService.createApplication(this.jobId()));
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

    this.updateDocumentInformation();
    this.location.replaceState(`${segments[0].path}/${ApplicationFormModes.EDIT}/${this.applicationId()}`);
  }

  async performAutomaticSave(): Promise<void> {
    if (this.savingState() === SavingStates.SAVING) {
      await this.sendCreateApplicationData(this.applicationState(), false);
      this.savingState.set(SavingStates.SAVED);
    }
  }

  async sendCreateApplicationData(state: 'SAVED' | 'SENT', rerouteToOtherPage: boolean): Promise<void> {
    const location = this.location;
    const applicationId = this.applicationId();
    if (applicationId === '') {
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
    try {
      await firstValueFrom(this.applicationResourceService.updateApplication(updateApplication));
      if (rerouteToOtherPage) {
        alert('Successfully saved application');
        location.back();
      }
    } catch (err) {
      const httpError = err as HttpErrorResponse;
      alert('Failed to save application: ' + httpError.statusText);
      console.error('Failed to save application:', err);
    }
  }

  updateDocumentInformation(): void {
    firstValueFrom(this.applicationResourceService.getDocumentDictionaryIds(this.applicationId()))
      .then(ids => {
        this.documentIds.set(ids);
      })
      .catch(() => alert('Error: fetching the document ids for this application'));
  }

  onValueChanged(): void {
    this.savingState.set(SavingStates.SAVING);
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
