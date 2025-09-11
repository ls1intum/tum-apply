import { Component, TemplateRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { CommonModule, Location } from '@angular/common';
import {
  ApplicationDetailDTO,
  ApplicationDocumentIdsDTO,
  ApplicationForApplicantDTO,
  ApplicationResourceService,
  UpdateApplicationDTO,
} from 'app/generated';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { ButtonColor } from 'app/shared/components/atoms/button/button.component';
import { ApplicationDraftData, LocalStorageService } from 'app/service/localStorage.service';
import ApplicationDetailForApplicantComponent from 'app/application/application-detail-for-applicant/application-detail-for-applicant.component';

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
    ApplicationDetailForApplicantComponent,
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
    country: undefined,
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

  previewData = computed(() => this.mapPagesToDTO() as ApplicationDetailDTO);

  panel1 = viewChild<TemplateRef<ApplicationCreationPage1Component>>('panel1');
  panel2 = viewChild<TemplateRef<ApplicationCreationPage2Component>>('panel2');
  panel3 = viewChild<TemplateRef<ApplicationCreationPage3Component>>('panel3');
  panel4 = viewChild<TemplateRef<ApplicationDetailForApplicantComponent>>('panel4');
  savedStatusPanel = viewChild<TemplateRef<HTMLDivElement>>('saving_state_panel');
  sendConfirmDialog = viewChild<ConfirmDialog>('sendConfirmDialog');

  title = signal<string>('');
  jobId = signal<string>('');
  applicantId = signal<string>('');
  applicationId = signal<string>('');
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

  useLocalStorage = signal<boolean>(false);

  stepData = computed<StepData[]>(() => {
    const steps: StepData[] = [];
    const panel1 = this.panel1();
    const panel2 = this.panel2();
    const panel3 = this.panel3();
    const panel4 = this.panel4();
    const applicantId = this.applicantId();
    const page1Valid = this.page1Valid();
    const page2Valid = this.page2Valid();
    const page3Valid = this.page3Valid();
    const page1And2Valid = page1Valid && page2Valid;
    const page1And2And3Valid = page1Valid && page2Valid && page3Valid;
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
            label: 'entity.applicationSteps.buttons.back',
            changePanel: false,
            shouldTranslate: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: !(page1Valid && applicantId !== ''),
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
        disabled: !page1Valid,
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
            icon: 'arrow-right',
            onClick() {
              updateDocumentInformation();
            },
            disabled: !page3Valid,
            label: 'entity.applicationSteps.buttons.next',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        disabled: !page1And2Valid,
        status: statusPanel,
      });
    }

    if (panel4) {
      steps.push({
        name: 'entity.applicationSteps.summary',
        shouldTranslate: true,
        panelTemplate: panel4,
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
        disabled: !page1And2And3Valid,
        status: statusPanel,
      });
    }
    return steps;
  });

  private initCalled = signal(false);

  private location = inject(Location);
  private applicationResourceService = inject(ApplicationResourceService);
  private accountService = inject(AccountService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private localStorageService = inject(LocalStorageService);

  private initEffect = effect(() => {
    if (!untracked(() => this.initCalled())) {
      this.initCalled.set(true);
      this.init();
    }
  });

  private automaticSaveEffect = effect(() => {
    const intervalId = setInterval(() => {
      this.performAutomaticSave();
    }, 3000);
    return () => clearInterval(intervalId);
  });

  async init(): Promise<void> {
    this.applicantId.set(this.accountService.loadedUser()?.id ?? '');

    const jobId = this.route.snapshot.queryParamMap.get('job');
    const applicationId = this.route.snapshot.queryParamMap.get('application');

    if (this.applicantId() === '') {
      this.initPageForLocalStorageCase(jobId);
    } else {
      try {
        let application: ApplicationForApplicantDTO;

        if (applicationId) {
          application = await this.initPageLoadExistingApplication(applicationId);
        } else if (jobId) {
          application = await this.initPageCreateApplication(jobId);
        } else {
          throw new Error('Either job ID or application ID must be provided in the URL.');
        }

        // Set job information
        this.jobId.set(application.job.jobId);
        if (application.job.title && application.job.title.trim().length > 0) {
          this.title.set(application.job.title);
        }

        this.applicationState.set(application.applicationState);
        this.useLocalStorage.set(false);

        // Load data from application
        this.page1.set(getPage1FromApplication(application));
        this.page2.set(getPage2FromApplication(application));
        this.page3.set(getPage3FromApplication(application));

        this.updateDocumentInformation();
      } catch (error: unknown) {
        const httpError = error as HttpErrorResponse;
        this.showInitErrorMessage('entity.toast.applyFlow.initLoadFailed');
        throw new Error(`Init failed with HTTP ${httpError.status} ${httpError.statusText}: ${httpError.message}`);
      }
    }
  }

  initPageForLocalStorageCase(jobId: string | null): void {
    this.useLocalStorage.set(true);
    if (jobId) {
      // TODO fetch jobData for lateron displaying jobDetails
      this.jobId.set(jobId);
      this.loadPage1FromLocalStorage(jobId);
      this.applicationState.set('SAVED');
    } else {
      this.showInitErrorMessage('entity.toast.applyFlow.missingJobIdUnauthenticated');
    }
  }

  async initPageLoadExistingApplication(applicationId: string): Promise<ApplicationForApplicantDTO> {
    const application = await firstValueFrom(this.applicationResourceService.getApplicationById(applicationId));

    if (application.applicationState !== 'SAVED') {
      this.toastService.showErrorKey('entity.toast.applyFlow.notEditable');
      await this.router.navigate(['/application/detail', applicationId]);
      throw new Error('Application is not editable.');
    }

    this.applicationId.set(applicationId);
    return application;
  }

  async initPageCreateApplication(jobId: string): Promise<ApplicationForApplicantDTO> {
    const application = await firstValueFrom(this.applicationResourceService.createApplication(jobId));

    if (application.applicationState !== 'SAVED') {
      this.toastService.showErrorKey('entity.toast.applyFlow.notEditable');
      await this.router.navigate(['/application/detail', application.applicationId]);
      throw new Error('Application is not editable.');
    }

    this.applicationId.set(application.applicationId ?? '');

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { job: jobId, application: application.applicationId },
      queryParamsHandling: 'merge',
    });

    return application;
  }

  async performAutomaticSave(): Promise<void> {
    if (this.savingState() === SavingStates.SAVING) {
      let savedSuccessFully;
      if (this.useLocalStorage()) {
        savedSuccessFully = this.saveToLocalStorage();
      } else {
        savedSuccessFully = await this.sendCreateApplicationData(this.applicationState(), false);
      }
      if (savedSuccessFully) {
        this.savingState.set(SavingStates.SAVED);
      }
    }
  }

  async sendCreateApplicationData(state: ApplicationForApplicantDTO.ApplicationStateEnum, rerouteToOtherPage: boolean): Promise<boolean> {
    const location = this.location;
    const applicationId = this.applicationId();

    if (applicationId === '') {
      this.toastService.showErrorKey('entity.toast.applyFlow.errorApplicationId');
      return false;
    }

    // If using local storage, we can't send to server
    if (this.useLocalStorage()) {
      this.toastService.showErrorKey('entity.toast.applyFlow.authRequired');
      return false;
    }

    const updateApplication = this.mapPagesToDTO(state) as UpdateApplicationDTO;

    try {
      await firstValueFrom(this.applicationResourceService.updateApplication(updateApplication));

      // Clear local storage on successful server save
      this.clearLocalStorage();

      if (rerouteToOtherPage) {
        this.toastService.showSuccessKey('entity.toast.applyFlow.submitted');
        // TODO: browser history is not working as expected for location.back()

        location.back();
      }
    } catch (err) {
      const httpError = err as HttpErrorResponse;
      this.toastService.showErrorKey('entity.toast.applyFlow.saveFailedWithStatus', { status: httpError.statusText });
      return false;
    }
    return true;
  }

  updateDocumentInformation(): void {
    // Skip document update if using local storage
    if (this.useLocalStorage()) {
      return;
    }

    firstValueFrom(this.applicationResourceService.getDocumentDictionaryIds(this.applicationId()))
      .then(ids => {
        this.documentIds.set(ids);
      })
      .catch(() => this.toastService.showErrorKey('entity.toast.applyFlow.fetchDocumentIdsFailed'));
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

  private mapPagesToDTO(state?: ApplicationDetailDTO.ApplicationStateEnum | 'SENT'): UpdateApplicationDTO | ApplicationDetailDTO {
    const p1 = this.page1();
    const p2 = this.page2();
    const p3 = this.page3();

    const base = {
      applicationId: this.applicationId(),
      applicant: {
        user: {
          userId: this.applicantId(),
          email: p1.email,
          gender: p1.gender?.value as string,
          nationality: p1.nationality?.value as string,
          birthday: p1.dateOfBirth,
          website: p1.website,
          linkedinUrl: p1.linkedIn,
        },
        bachelorDegreeName: p2.bachelorDegreeName,
        bachelorUniversity: p2.bachelorDegreeUniversity,
        bachelorGrade: p2.bachelorGrade,
        bachelorGradingScale: p2.bachelorGradingScale.value,
        masterDegreeName: p2.masterDegreeName,
        masterUniversity: p2.masterDegreeUniversity,
        masterGrade: p2.masterGrade,
        masterGradingScale: p2.masterGradingScale.value,
      },
      motivation: p3?.motivation ?? '',
      specialSkills: p3?.skills ?? '',
      desiredDate: p3?.desiredStartDate ?? '',
      projects: p3?.experiences,
      jobTitle: this.title(),
    };

    if (state !== undefined) {
      return {
        ...base,
        applicationState: state,
        applicant: {
          ...base.applicant,
          city: p1.city,
          country: p1.country?.value,
          postalCode: p1.postcode,
          street: p1.street,
          user: {
            ...base.applicant.user,
            firstName: p1.firstName,
            lastName: p1.lastName,
            phoneNumber: p1.phoneNumber,
            selectedLanguage: p1.language?.value as string,
          },
          bachelorGradingScale: 'ONE_TO_FOUR',
          masterGradingScale: 'ONE_TO_FOUR',
        },
      } as UpdateApplicationDTO;
    }

    return {
      ...base,
      applicationState: this.applicationState(),
    } as ApplicationDetailDTO;
  }

  private saveToLocalStorage(): boolean {
    const applicationData: ApplicationDraftData = {
      page1: this.page1(),
      applicationId: this.applicationId(),
      jobId: this.jobId(),
      timestamp: new Date().toISOString(),
    };
    try {
      this.localStorageService.saveApplicationDraft(applicationData);
    } catch {
      this.toastService.showErrorKey('entity.toast.applyFlow.saveFailed');
      return false;
    }
    return true;
  }

  /**
   * Loads application form data for the first page from localStorage for the current application.
   * Validates applicationId match before applying data to form page.
   *
   * @returns {boolean} True if data was successfully loaded, false otherwise
   * @private
   */
  private loadPage1FromLocalStorage(jobId: string): void {
    try {
      const draft = this.localStorageService.loadApplicationDraft(undefined, jobId);
      if (draft) {
        this.page1.set(draft.page1);
        this.applicationId.set(draft.applicationId);
        this.jobId.set(draft.jobId);
      }
    } catch (err) {
      queueMicrotask(() => {
        this.toastService.showErrorKey('entity.toast.applyFlow.loadFailed');
        throw new Error('Local load failed: ' + (err as Error).message);
      });
    }
  }

  private clearLocalStorage(): void {
    this.localStorageService.clearApplicationDraft(this.applicationId(), this.jobId());
  }

  /* TODO
   * `queueMicroTask` is here to fix a timing issue with the ToastService.
   * on opening the webpage directly to this component, the Toastservice is not ready to be rendered in the DOM, so it's functions are being executed, but no toast is visible
   * tried different strategies of fixing the timing issue:
   *  - `afterNextRender`
   *  - different LifecylceStrategies (constructor, constructor with effect, ngOnInit)
   *
   * What also works is `setTimeout(() => {})`
   * This might be a problem of the Toastservice instead of this component. A waiting queue
   * and a flag that waits for initialisation before executing the primeng messageservice did not fix the issue,
   * because while the component was initialised (createGlobalToast had been executed and toastComponent was not empty)
   * it was likely not ready being rendered in the DOM
   */
  private showInitErrorMessage(key: string): void {
    queueMicrotask(() => {
      // Use key-based toast instead of hardcoded text so messages are translated and consistent across the application.
      this.toastService.showErrorKey(key);

      setTimeout(() => void this.router.navigate(['/job-overview']), 3000);
    });
  }
}
