import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { CommonModule, Location } from '@angular/common';
import { ApplicationDocumentIdsDTO, ApplicationForApplicantDTO, ApplicationResourceService, UpdateApplicationDTO } from 'app/generated';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { ButtonColor } from 'app/shared/components/atoms/button/button.component';

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

const SavingStates = {
  SAVED: 'SAVED',
  SAVING: 'SAVING',
} as const;

type SavingState = (typeof SavingStates)[keyof typeof SavingStates];

const LOCAL_STORAGE_KEY = 'application_draft';

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
    ConfirmDialog,
  ],
  templateUrl: './application-creation-form.component.html',
  styleUrl: './application-creation-form.component.scss',
  standalone: true,
})
export default class ApplicationCreationFormComponent {
  readonly sendButtonLabel = 'entity.applicationSteps.buttons.send';
  readonly sendButtonSeverity = 'primary' as ButtonColor;
  readonly sendButtonIcon = 'paper-plane';

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

  page3 = signal<ApplicationCreationPage3Data | undefined>(undefined);
  panel1 = viewChild<TemplateRef<any>>('panel1');
  panel2 = viewChild<TemplateRef<any>>('panel2');
  panel3 = viewChild<TemplateRef<any>>('panel3');
  savedStatusPanel = viewChild<TemplateRef<HTMLDivElement>>('saving_state_panel');
  sendConfirmDialog = viewChild<ConfirmDialog>('sendConfirmDialog');

  title = signal<string>('');
  jobId = signal<string>('');
  applicantId = signal<string>('');
  applicationId = signal<string | undefined>(undefined);
  applicationState = signal<ApplicationForApplicantDTO.ApplicationStateEnum>('SAVED');
  savingState = signal<SavingState>(SavingStates.SAVED);

  savingBadgeCalculatedClass = computed<string>(
    () =>
      `flex flex-wrap justify-around content-center gap-1 ${this.savingState() === SavingStates.SAVED ? 'saved_color' : 'unsaved_color'}`,
  );

  page1Valid = signal<boolean>(false);
  page2Valid = signal<boolean>(false);
  page3Valid = signal<boolean>(false);
  savingTick = signal<number>(0);
  allPagesValid = computed(() => this.page1Valid() && this.page2Valid() && this.page3Valid());
  documentIds = signal<ApplicationDocumentIdsDTO | undefined>(undefined);

  location = inject(Location);

  stepData = computed<StepData[]>(() => {
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
            severity: this.sendButtonSeverity,
            icon: this.sendButtonIcon,
            onClick: () => {
              this.sendConfirmDialog()?.confirm();
            },
            disabled: !allPagesValid,
            label: this.sendButtonLabel,
            shouldTranslate: true,
            changePanel: false,
          },
        ],
        status: statusPanel,
      });
    }
    return steps;
  });

  private applicationResourceService = inject(ApplicationResourceService);
  private accountService = inject(AccountService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  constructor() {
    this.init();

    effect(() => {
      const intervalId = setInterval(() => {
        this.performAutomaticSave();
      }, 3000);
      return () => clearInterval(intervalId);
    });
  }

  async init(): Promise<void> {
    this.applicantId.set(this.accountService.loadedUser()?.id ?? '');

    // Get query parameters
    const jobId = this.route.snapshot.queryParamMap.get('job');
    const applicationId = this.route.snapshot.queryParamMap.get('application');

    let application: ApplicationForApplicantDTO;

    try {
      if (applicationId) {
        // Edit mode - load existing application
        application = await firstValueFrom(this.applicationResourceService.getApplicationById(applicationId));

        // Check if application state allows editing
        if (application.applicationState !== 'SAVED') {
          this.toastService.showError({
            summary: 'Error',
            detail: 'This application cannot be edited as it has already been submitted or is in a non-draft state.',
          });
          await this.router.navigate(['/application/detail', applicationId]);
          return;
        }

        this.applicationId.set(applicationId);
      } else if (jobId) {
        // Create mode - create new application
        try {
          application = await firstValueFrom(this.applicationResourceService.createApplication(jobId));
          this.applicationId.set(application.applicationId);

          // Update URL to include the new applicationId
          await this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { job: jobId, application: application.applicationId },
            queryParamsHandling: 'merge',
          });
        } catch (error) {
          this.toastService.showError({
            summary: 'Error',
            detail: 'Failed to create application. Please try again.',
          });
          console.error('Failed to create application:', error);
          return;
        }
      } else {
        this.toastService.showError({
          summary: 'Error',
          detail: 'Either job ID or application ID must be provided in the URL.',
        });
        return;
      }

      // Set job information
      this.jobId.set(application.job.jobId);
      if (application.job.title && application.job.title.trim().length > 0) {
        this.title.set(application.job.title);
      }

      // Set application state
      this.applicationState.set(application.applicationState);

      // Load data from application or local storage
      if (this.applicationId() === undefined) {
        this.loadFromLocalStorage();
      } else {
        this.page1.set(getPage1FromApplication(application));
        this.page2.set(getPage2FromApplication(application));
        this.page3.set(getPage3FromApplication(application));
      }

      this.updateDocumentInformation();
    } catch (error: any) {
      if (error?.error?.errorCode === 'OPERATION_NOT_ALLOWED') {
        this.toastService.showError({
          summary: 'Error',
          detail: 'You have already applied to this job',
        });
      } else {
        console.error('Unexpected error during application:', error);
        this.toastService.showError({
          summary: 'Error',
          detail: 'Something went wrong while applying for the job',
        });
      }

      const httpError = error as HttpErrorResponse;
      this.toastService.showError({
        summary: 'Error',
        detail: 'Failed to load application: ' + httpError.statusText,
      });
      console.error('Failed to load application:', error);
    }
  }

  async performAutomaticSave(): Promise<void> {
    if (this.savingState() === SavingStates.SAVING) {
      const applicationId = this.applicationId();
      if (applicationId === undefined) {
        this.saveToLocalStorage();
      } else {
        await this.sendCreateApplicationData(applicationId, this.applicationState(), false);
      }
      this.savingState.set(SavingStates.SAVED);
    }
  }

  async sendCreateApplicationData(
    applicationId: string,
    state: ApplicationForApplicantDTO.ApplicationStateEnum,
    rerouteToOtherPage: boolean,
  ): Promise<void> {
    const location = this.location;

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
      desiredDate: this.page3()?.desiredStartDate ?? '',
      motivation: this.page3()?.motivation ?? '',
      specialSkills: this.page3()?.skills ?? '',
      projects: this.page3()?.experiences,
    };

    try {
      await firstValueFrom(this.applicationResourceService.updateApplication(updateApplication));

      // Clear local storage on successful server save
      this.clearLocalStorage();

      if (rerouteToOtherPage) {
        this.toastService.showSuccess({ detail: 'Successfully saved application' });
        location.back();
      }
    } catch (err) {
      const httpError = err as HttpErrorResponse;
      this.toastService.showError({
        summary: 'Error',
        detail: 'Failed to save application: ' + httpError.statusText,
      });
      console.error('Failed to save application:', err);
    }
  }

  updateDocumentInformation(): void {
    // Skip document update if using local storage
    const applicationId = this.applicationId();
    if (applicationId === undefined) {
      return;
    }

    firstValueFrom(this.applicationResourceService.getDocumentDictionaryIds(applicationId))
      .then(ids => {
        this.documentIds.set(ids);
      })
      .catch(() =>
        this.toastService.showError({
          summary: 'Error',
          detail: 'fetching the document ids for this application',
        }),
      );
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

  private saveToLocalStorage(): void {
    const applicationData = {
      page1: this.page1(),
      page2: this.page2(),
      page3: this.page3(),
      applicationId: this.applicationId(),
      jobId: this.jobId(),
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(applicationData));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
      this.toastService.showError({
        summary: 'Error',
        detail: 'Failed to save application data locally.',
      });
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);

        // Only load if it's for the same application
        if (parsedData.applicationId === this.applicationId()) {
          this.page1.set(parsedData.page1 ?? this.page1());
          this.page2.set(parsedData.page2 ?? this.page2());
          this.page3.set(parsedData.page3 ?? this.page3());
        }
      }
    } catch (error) {
      console.error('Failed to load from local storage:', error);
    }
  }

  private clearLocalStorage(): void {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear local storage:', error);
    }
  }
}
