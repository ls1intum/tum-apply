import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonColor } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { htmlTextRequiredValidator } from 'app/shared/validators/custom-validators';
import { HttpErrorResponse } from '@angular/common/http';

import SharedModule from '../../shared/shared.module';
import { DatePickerComponent } from '../../shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from '../../shared/components/atoms/string-input/string-input.component';
import { AccountService } from '../../core/auth/account.service';
import * as DropdownOptions from '.././dropdown-options';
import { SelectComponent } from '../../shared/components/atoms/select/select.component';
import { NumberInputComponent } from '../../shared/components/atoms/number-input/number-input.component';
import { EditorComponent } from '../../shared/components/atoms/editor/editor.component';
import { ToastService } from '../../service/toast-service';
import { JobDetailComponent } from '../job-detail/job-detail.component';
import { JobResourceApiService } from '../../generated/api/jobResourceApi.service';
import { JobFormDTO } from '../../generated/model/jobFormDTO';
import { JobDTO } from '../../generated/model/jobDTO';

type JobFormMode = 'create' | 'edit';
type SavingState = 'SAVED' | 'SAVING';

@Component({
  selector: 'jhi-job-creation-form',
  standalone: true,
  templateUrl: './job-creation-form.component.html',
  styleUrls: ['./job-creation-form.component.scss'],
  imports: [
    CommonModule,
    TooltipModule,
    SharedModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    DatePickerComponent,
    StringInputComponent,
    ProgressStepperComponent,
    TranslateModule,
    SelectComponent,
    NumberInputComponent,
    EditorComponent,
    ConfirmDialog,
    JobDetailComponent,
  ],
  providers: [JobResourceApiService],
})
export class JobCreationFormComponent {
  /* eslint-disable @typescript-eslint/member-ordering */

  readonly publishButtonLabel = 'jobActionButton.publish';
  readonly publishButtonSeverity = 'primary' as ButtonColor;
  readonly publishButtonIcon = 'paper-plane';
  private readonly translateService = inject(TranslateService);
  // Services
  private fb = inject(FormBuilder);
  private jobResourceService = inject(JobResourceApiService);
  private accountService = inject(AccountService);
  private autoSaveTimer: number | undefined;
  private router = inject(Router);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private autoSaveInitialized = false;

  constructor() {
    this.init();
    this.setupAutoSave();
  }

  // State signals
  mode = signal<JobFormMode>('create');
  jobId = signal<string>('');
  userId = signal<string>('');
  isLoading = signal<boolean>(true);
  savingState = signal<SavingState>('SAVED');
  lastSavedData = signal<JobFormDTO | undefined>(undefined);
  publishAttempted = signal<boolean>(false);

  // Forms
  basicInfoForm = this.createBasicInfoForm();
  positionDetailsForm = this.createPositionDetailsForm();
  additionalInfoForm = this.createAdditionalInfoForm();

  // Template references
  panel1 = viewChild<TemplateRef<HTMLDivElement>>('panel1');
  panel2 = viewChild<TemplateRef<HTMLDivElement>>('panel2');
  panel3 = viewChild<TemplateRef<HTMLDivElement>>('panel3');
  panel4 = viewChild<TemplateRef<HTMLDivElement>>('panel4');
  savingStatePanel = viewChild<TemplateRef<HTMLDivElement>>('savingStatePanel');
  sendPublishDialog = viewChild<ConfirmDialog>('sendPublishDialog');

  // Tracks form validity
  basicInfoValid = signal(false);
  positionDetailsValid = signal(false);
  allFormsValid = computed(() => this.basicInfoValid() && this.positionDetailsValid());

  basicInfoChanges = toSignal(this.basicInfoForm.statusChanges, { initialValue: this.basicInfoForm.status });
  positionDetailsChanges = toSignal(this.positionDetailsForm.statusChanges, { initialValue: this.positionDetailsForm.status });
  privacyAcceptedSignal = toSignal(this.additionalInfoForm.controls['privacyAccepted'].valueChanges, {
    initialValue: this.additionalInfoForm.controls['privacyAccepted'].value,
  });

  /** Effect that updates validity signals when form status changes */
  formValidationEffect = effect(() => {
    this.basicInfoChanges();
    this.positionDetailsChanges();

    this.basicInfoValid.set(this.basicInfoForm.valid);
    this.positionDetailsValid.set(this.positionDetailsForm.valid);
  });

  // Data computation
  currentJobData = computed<JobFormDTO>(() => {
    this.basicInfoFormValueSignal();
    this.positionDetailsFormValueSignal();
    return this.createJobDTO('DRAFT');
  });

  publishableJobData = computed<JobFormDTO | undefined>(() => (this.allFormsValid() ? this.createJobDTO('PUBLISHED') : undefined));

  hasUnsavedChanges = computed(() => {
    const current = this.currentJobData();
    const lastSaved = this.lastSavedData();
    return JSON.stringify(current) !== JSON.stringify(lastSaved);
  });

  /** Computed page title based on current mode (create/edit) */
  readonly pageTitle = computed(() =>
    this.mode() === 'edit' ? 'jobCreationForm.header.title.edit' : 'jobCreationForm.header.title.create',
  );

  /** Computed CSS classes for saving badge based on current saving state */
  readonly savingBadgeCalculatedClass = computed(
    () => `flex flex-wrap justify-around content-center gap-1 ${this.savingState() === 'SAVED' ? 'saved_color' : 'saving_color'}`,
  );

  // Step configuration
  readonly stepData = computed<StepData[]>(() => this.buildStepData());

  /**
   * Builds step configuration data for the progress stepper component
   */
  private buildStepData(): StepData[] {
    const steps: StepData[] = [];
    const templates = {
      panel1: this.panel1(),
      panel2: this.panel2(),
      panel3: this.panel3(),
      panel4: this.panel4(),
      status: this.savingStatePanel(),
    };

    if (templates.panel1) {
      steps.push({
        name: 'jobCreationForm.header.steps.basicInfo',
        panelTemplate: templates.panel1,
        shouldTranslate: true,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'chevron-left',
            onClick: () => this.onBack(),
            disabled: false,
            label: 'jobActionButton.back',
            changePanel: false,
            shouldTranslate: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: !this.basicInfoValid(),
            label: 'jobActionButton.next',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        status: templates.status,
      });
    }

    if (templates.panel2) {
      steps.push({
        name: 'jobCreationForm.header.steps.positionDetails',
        panelTemplate: templates.panel2,
        shouldTranslate: true,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'arrow-left',
            onClick() {},
            disabled: false,
            label: 'jobActionButton.back',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: !this.positionDetailsValid(),
            label: 'jobActionButton.next',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        disabled: !this.basicInfoValid(),
        status: templates.status,
      });
    }

    // TODO: Add additional info step back in if needed

    /* if (templates.panel3) {
      steps.push({
        name: 'jobCreationForm.header.steps.additionalInfo',
        panelTemplate: templates.panel3,
        shouldTranslate: true,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'arrow-left',
            onClick() {},
            disabled: false,
            label: 'jobActionButton.back',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'arrow-right',
            onClick() {},
            disabled: !this.positionDetailsValid(),
            label: 'jobActionButton.next',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        status: templates.status,
      });
    }*/

    if (templates.panel4) {
      steps.push({
        name: 'jobCreationForm.header.steps.summary',
        panelTemplate: templates.panel4,
        shouldTranslate: true,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'arrow-left',
            onClick() {},
            disabled: false,
            label: 'jobActionButton.back',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: this.publishButtonSeverity,
            icon: this.publishButtonIcon,
            onClick: () => {
              this.sendPublishDialog()?.confirm();
            },
            disabled: !this.allFormsValid(),
            label: this.publishButtonLabel,
            shouldTranslate: true,
            changePanel: false,
          },
        ],
        disabled: !(this.basicInfoValid() && this.positionDetailsValid()),
        status: templates.status,
      });
    }

    return steps;
  }

  DropdownOptions = DropdownOptions;

  basicInfoFormValueSignal = toSignal(this.basicInfoForm.valueChanges, {
    initialValue: this.basicInfoForm.getRawValue(),
  });
  positionDetailsFormValueSignal = toSignal(this.positionDetailsForm.valueChanges, {
    initialValue: this.positionDetailsForm.getRawValue(),
  });

  async publishJob(): Promise<void> {
    const jobData = this.publishableJobData();
    this.publishAttempted.set(true);
    if (!Boolean(this.privacyAcceptedSignal())) {
      this.toastService.showError({
        summary: this.translateService.instant('privacy.privacyConsent.toastError.summary'),
        detail: this.translateService.instant('privacy.privacyConsent.toastError.detail'),
      });
      return;
    }
    if (!jobData) return;

    try {
      await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), jobData));
      this.router.navigate(['/my-positions']);
    } catch (err) {
      const httpError = err as HttpErrorResponse;
      this.toastService.showError({ summary: 'Error', detail: 'Failed to publish job: ' + httpError.statusText });
    }
  }

  onBack(): void {
    this.location.back();
  }

  private createBasicInfoForm(): FormGroup {
    return this.fb.group({
      // Basic Info Form: Currently required for saving a job
      title: ['', [Validators.required]],
      researchArea: ['', [Validators.required]],
      fieldOfStudies: [undefined, [Validators.required]],
      location: [undefined, [Validators.required]],
      fundingType: [undefined],
      supervisingProfessor: [{ value: this.accountService.loadedUser()?.name ?? '' }, Validators.required],
      startDate: [''],
      applicationDeadline: [''],
      workload: [undefined],
      contractDuration: [undefined],
    });
  }

  private createPositionDetailsForm(): FormGroup {
    return this.fb.group({
      // Position Details Form: Currently required for publishing a job
      description: ['', [htmlTextRequiredValidator, Validators.maxLength(1000)]],
      tasks: ['', [htmlTextRequiredValidator, Validators.maxLength(1000)]],
      requirements: ['', [htmlTextRequiredValidator, Validators.maxLength(1000)]],
    });
  }

  private createAdditionalInfoForm(): FormGroup {
    return this.fb.group({
      privacyAccepted: [false, [Validators.required]],
    });
  }

  private createJobDTO(state: JobFormDTO.StateEnum): JobFormDTO {
    const basicInfoValue = this.basicInfoForm.getRawValue();
    const positionDetailsValue = this.positionDetailsForm.getRawValue();

    return {
      title: this.basicInfoForm.get('title')?.value ?? '',
      researchArea: basicInfoValue.researchArea?.trim() ?? '',
      fieldOfStudies: basicInfoValue.fieldOfStudies?.value !== undefined ? String(basicInfoValue.fieldOfStudies.value) : '',
      supervisingProfessor: this.userId(),
      location: basicInfoValue.location?.value as JobFormDTO.LocationEnum,
      startDate: basicInfoValue.startDate ?? '',
      endDate: basicInfoValue.applicationDeadline ?? '',
      workload: basicInfoValue.workload,
      contractDuration: basicInfoValue.contractDuration,
      fundingType: basicInfoValue.fundingType?.value as JobFormDTO.FundingTypeEnum,
      description: positionDetailsValue.description?.trim() ?? '',
      tasks: positionDetailsValue.tasks?.trim() ?? '',
      requirements: positionDetailsValue.requirements?.trim() ?? '',
      state,
    };
  }

  /**
   * Initializes the component by determining mode (create/edit) and loading existing data if needed
   */
  private async init(): Promise<void> {
    try {
      const userId = this.accountService.loadedUser()?.id ?? '';
      if (!userId) {
        this.router.navigate(['/login']);
        return;
      }
      this.userId.set(userId);

      const segments = await firstValueFrom(this.route.url);
      const mode = segments[1]?.path as JobFormMode;

      if (mode === 'create') {
        this.mode.set('create');
        this.populateForm();
      } else {
        this.mode.set('edit');
        const jobId = this.route.snapshot.paramMap.get('job_id') ?? '';

        if (!jobId) {
          this.router.navigate(['/my-positions']);
          return;
        }

        this.jobId.set(jobId);
        const job = await firstValueFrom(this.jobResourceService.getJobById(jobId));
        this.populateForm(job);
        this.autoSaveInitialized = false;
      }
    } catch (err) {
      const httpError = err as HttpErrorResponse;
      this.toastService.showError({ summary: 'Error', detail: 'Failed to load job form: ' + httpError.statusText });
      this.router.navigate(['/my-positions']);
    } finally {
      this.isLoading.set(false);
    }
  }

  private populateForm(job?: JobDTO): void {
    const user = this.accountService.loadedUser();

    this.basicInfoForm.patchValue({
      title: job?.title ?? '',
      researchArea: job?.researchArea ?? '',
      supervisingProfessor: user?.name,
      fieldOfStudies: this.findDropdownOption(DropdownOptions.fieldsOfStudies, job?.fieldOfStudies),
      location: this.findDropdownOption(DropdownOptions.locations, job?.location),
      startDate: job?.startDate ?? '',
      applicationDeadline: job?.endDate ?? '',
      workload: job?.workload ?? undefined,
      contractDuration: job?.contractDuration ?? undefined,
      fundingType: this.findDropdownOption(DropdownOptions.fundingTypes, job?.fundingType),
    });

    this.positionDetailsForm.patchValue({
      description: job?.description ?? '',
      tasks: job?.tasks ?? '',
      requirements: job?.requirements ?? '',
    });

    this.additionalInfoForm.patchValue({
      privacyAccepted: false,
    });
    this.lastSavedData.set(this.createJobDTO('DRAFT'));
  }

  /**
   * Sets up auto-save functionality using effects to detect changes in form data
   * Debounces save operations with a 3-second delay
   */
  private setupAutoSave(): void {
    effect(() => {
      this.basicInfoFormValueSignal();
      this.positionDetailsFormValueSignal();

      // Don't auto-save as soon as the form is opened
      if (!this.autoSaveInitialized) {
        this.autoSaveInitialized = true;
        return;
      }

      // TODO: currently state changes to saving on form loading
      this.clearAutoSaveTimer();
      this.savingState.set('SAVING');

      this.autoSaveTimer = window.setTimeout(() => {
        void this.performAutoSave();
      }, 3000);
    });
  }

  private clearAutoSaveTimer(): void {
    if (this.autoSaveTimer !== undefined) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }
  /**
   * Performs the actual auto-save operation by calling the appropriate API endpoint
   * Handles both create and update scenarios based on existing job ID
   */
  private async performAutoSave(): Promise<void> {
    const currentData = this.createJobDTO('DRAFT');

    try {
      if (this.jobId()) {
        await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), currentData));
      } else {
        const createdJob = await firstValueFrom(this.jobResourceService.createJob(currentData));
        this.jobId.set(createdJob.jobId ?? '');
      }

      this.lastSavedData.set(currentData);
      this.savingState.set('SAVED');
    } catch (err) {
      const httpError = err as HttpErrorResponse;
      this.toastService.showError({ summary: 'Error', detail: 'Failed to save job: ' + httpError.statusText });
    }
  }

  private findDropdownOption<T extends { value: unknown }>(options: T[], value: unknown): T | undefined {
    return options.find(opt => opt.value === value);
  }
}
