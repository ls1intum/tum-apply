import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, Location } from '@angular/common';
import { JobResourceService } from 'app/generated/api/jobResource.service';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';

import SharedModule from '../../shared/shared.module';
import { DropdownComponent } from '../../shared/components/atoms/dropdown/dropdown.component';
import { JobDTO, JobFormDTO } from '../../generated';
import { DatePickerComponent } from '../../shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from '../../shared/components/atoms/string-input/string-input.component';
import { AccountService } from '../../core/auth/account.service';
import * as DropdownOptions from '.././dropdown-options';
import { DropdownOption } from '../../shared/components/atoms/dropdown/dropdown.component';

// Constants
const JobFormModes = { CREATE: 'create', EDIT: 'edit' } as const;
const SavingStates = { SAVED: 'SAVED', SAVING: 'SAVING' } as const;

type JobFormMode = (typeof JobFormModes)[keyof typeof JobFormModes];
type SavingState = (typeof SavingStates)[keyof typeof SavingStates];

/**
 * Data structure for basic job information including title, research area, and dropdown selections
 */
export type JobBasicInfoData = {
  title: string;
  researchArea: string;
  fieldOfStudies?: DropdownOption;
  location?: DropdownOption;
  startDate: string;
  workload?: DropdownOption;
  contractDuration?: DropdownOption;
  fundingType?: DropdownOption;
  supervisingProfessor: string;
};

/**
 * Data structure for job position details including description, tasks, and requirements
 */
export type JobPositionDetailsData = {
  description: string;
  tasks: string;
  requirements: string;
};

/**
 * Data structure for additional job information (extensible for future fields)
 */
export type JobAdditionalInfoData = {
  // Add additional fields here in the future
};

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
    DropdownComponent,
    DatePickerComponent,
    StringInputComponent,
    ProgressStepperComponent,
    TranslateModule,
  ],
  providers: [JobResourceService],
})
export class JobCreationFormComponent {
  /** Signal containing all basic job information form fields */
  basicInfo = signal<JobBasicInfoData>({
    title: '',
    researchArea: '',
    fieldOfStudies: undefined,
    location: undefined,
    startDate: '',
    workload: undefined,
    contractDuration: undefined,
    fundingType: undefined,
    supervisingProfessor: '',
  });

  /** Signal containing position details form fields */
  positionDetails = signal<JobPositionDetailsData>({
    description: '',
    tasks: '',
    requirements: '',
  });

  /** Signal containing additional information form fields */
  additionalInfo = signal<JobAdditionalInfoData>({});

  // State Signals
  mode = signal<JobFormMode>('create');
  jobId = signal<string>('');
  userId = signal<string>('');
  isLoading = signal<boolean>(true);
  savingState = signal<SavingState>(SavingStates.SAVED);
  lastSavedData = signal<JobFormDTO | undefined>(undefined);

  // Validation Signals
  basicInfoValid = signal<boolean>(false);
  positionDetailsValid = signal<boolean>(false);
  additionalInfoValid = signal<boolean>(true);

  // Forms for validation
  basicInfoForm: FormGroup;
  positionDetailsForm: FormGroup;
  additionalInformationForm: FormGroup;

  // Template references
  panel1 = viewChild<TemplateRef<HTMLDivElement>>('panel1');
  panel2 = viewChild<TemplateRef<HTMLDivElement>>('panel2');
  panel3 = viewChild<TemplateRef<HTMLDivElement>>('panel3');
  savingStatePanel = viewChild<TemplateRef<HTMLDivElement>>('savingStatePanel');

  /** Computed page title based on current mode (create/edit) */
  readonly pageTitle = computed(() =>
    this.mode() === 'edit' ? 'jobCreationForm.header.title.edit' : 'jobCreationForm.header.title.create',
  );

  /** Computed CSS classes for saving badge based on current saving state */
  readonly savingBadgeCalculatedClass = computed(
    () =>
      `flex flex-wrap justify-around content-center gap-1 ${this.savingState() === SavingStates.SAVED ? 'saved_color' : 'unsaved_color'}`,
  );

  readonly allValid = computed(() => this.basicInfoValid() && this.positionDetailsValid() && this.additionalInfoValid());

  /**
   * Computed current job data by combining all form signals into JobFormDTO format
   * Handles type conversion from DropdownOption values to expected DTO types
   */
  readonly currentJobData = computed<JobFormDTO>(() => ({
    title: this.basicInfo().title,
    researchArea: this.basicInfo().researchArea,
    fieldOfStudies: String(this.basicInfo().fieldOfStudies?.value),
    supervisingProfessor: this.userId(),
    location: this.basicInfo().location?.value as JobFormDTO.LocationEnum,
    startDate: this.basicInfo().startDate,
    workload: Number(this.basicInfo().workload?.value),
    contractDuration: Number(this.basicInfo().contractDuration?.value),
    fundingType: this.basicInfo().fundingType?.value as JobFormDTO.FundingTypeEnum,
    description: this.positionDetails().description,
    tasks: this.positionDetails().tasks,
    requirements: this.positionDetails().requirements,
    state: JobFormDTO.StateEnum.Draft,
  }));

  // Character counters (will be removed after Editor integration)
  readonly descriptionLength = computed(() => this.positionDetails().description.length);
  readonly tasksLength = computed(() => this.positionDetails().tasks.length);
  readonly requirementsLength = computed(() => this.positionDetails().requirements.length);

  // Step configuration
  readonly stepData = computed<StepData[]>(() => this.buildStepData());

  readonly DropdownOptions = DropdownOptions;

  // Services
  private readonly fb = inject(FormBuilder);
  private readonly jobResourceService = inject(JobResourceService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  // Auto-save
  private autoSaveTimer: number | undefined = undefined;

  constructor(private route: ActivatedRoute) {
    // Initialize forms
    this.basicInfoForm = this.fb.group({});
    this.positionDetailsForm = this.fb.group({});
    this.additionalInformationForm = this.fb.group({});

    this.init(route);
    this.setupAutoSave();
    this.setupValidation();
    this.setupFormEffects();
  }

  /**
   * Initializes the component by determining mode (create/edit) and loading existing data if needed
   */
  async init(route: ActivatedRoute): Promise<void> {
    try {
      this.userId.set(this.accountService.loadedUser()?.id ?? '');
      if (this.userId() === '') {
        console.error('User not authenticated');
        this.router.navigate(['/login']);
        return;
      }

      const segments = await firstValueFrom(route.url);
      const mode = segments[1]?.path;

      if (mode === JobFormModes.CREATE) {
        this.mode.set(JobFormModes.CREATE);
        this.initForms();
      } else if (mode === JobFormModes.EDIT) {
        this.mode.set(JobFormModes.EDIT);
        const jobId = route.snapshot.paramMap.get('job_id') ?? '';

        if (jobId === '') {
          this.router.navigate(['/my-positions']);
          return;
        }

        this.jobId.set(jobId);
        const job = await firstValueFrom(this.jobResourceService.getJobById(jobId));
        this.initForms(job);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      this.router.navigate(['/my-positions']);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Initializes reactive forms and sets initial signal values
   * Handles both create mode (empty forms) and edit mode (pre-populated with job data)
   */
  initForms(job?: JobDTO): void {
    const user = this.accountService.loadedUser();

    // Initialize basic info form
    this.basicInfoForm = this.fb.group({
      title: [job?.title ?? '', Validators.required],
      researchArea: [job?.researchArea ?? '', Validators.required],
      /* removed this
      fieldOfStudies: [this.findDropdownOption(DropdownOptions.fieldsOfStudies, job?.fieldOfStudies, 'value'), Validators.required],
      location: [this.findDropdownOption(DropdownOptions.locations, job?.location, 'value'), Validators.required],
      startDate: [job?.startDate ?? ''],
      workload: [this.findDropdownOption(DropdownOptions.workloadOptions, job?.workload, 'value')],
      contractDuration: [this.findDropdownOption(DropdownOptions.contractDurations, job?.contractDuration, 'value')],
      fundingType: [this.findDropdownOption(DropdownOptions.fundingTypes, job?.fundingType, 'value'), Validators.required],
      to this */
      supervisingProfessor: [{ value: user?.name ?? '', disabled: true }],
    });

    // Initialize position details form
    this.positionDetailsForm = this.fb.group({
      description: [job?.description ?? '', [Validators.required, Validators.maxLength(1000)]],
      tasks: [job?.tasks ?? '', [Validators.required, Validators.maxLength(1000)]],
      requirements: [job?.requirements ?? '', [Validators.required, Validators.maxLength(1000)]],
    });

    // Initialize additional info form
    this.additionalInformationForm = this.fb.group({});

    // Set signal data
    this.basicInfo.set({
      title: job?.title ?? '',
      researchArea: job?.researchArea ?? '',
      fieldOfStudies: this.findDropdownOption(DropdownOptions.fieldsOfStudies, job?.fieldOfStudies, 'value'),
      location: this.findDropdownOption(DropdownOptions.locations, job?.location, 'value'),
      startDate: job?.startDate ?? '',
      workload: this.findDropdownOption(DropdownOptions.workloadOptions, job?.workload, 'value'),
      contractDuration: this.findDropdownOption(DropdownOptions.contractDurations, job?.contractDuration, 'value'),
      fundingType: this.findDropdownOption(DropdownOptions.fundingTypes, job?.fundingType, 'value'),
      supervisingProfessor: user?.name ?? '',
    });

    this.positionDetails.set({
      description: job?.description ?? '',
      tasks: job?.tasks ?? '',
      requirements: job?.requirements ?? '',
    });

    // Set initial saved data
    this.lastSavedData.set(this.currentJobData());
  }

  async publishJob(): Promise<void> {
    const jobFormDto: JobFormDTO = {
      ...this.currentJobData(),
      state: JobFormDTO.StateEnum.Published,
    };

    try {
      await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), jobFormDto));
      this.router.navigate(['/my-positions']);
    } catch (error) {
      console.error('Failed to publish job:', error);
    }
  }

  onBack(): void {
    this.location.back();
  }

  onValueChanged(): void {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Set saving state after 3 seconds delay
    this.autoSaveTimer = window.setTimeout(() => {
      this.savingState.set(SavingStates.SAVING);
    }, 1000);
  }

  onBasicInfoInputChange(field: keyof JobBasicInfoData, value: unknown): void {
    this.basicInfo.update(current => ({
      ...current,
      [field]: value,
    }));
    this.onValueChanged();
  }

  onPositionDetailsInputChange(field: keyof JobPositionDetailsData, event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;

    this.positionDetails.update(current => ({
      ...current,
      [field]: value,
    }));

    this.onValueChanged();
  }

  /**
   * Sets up reactive validation for form sections using effects
   */
  /* TODO: clean up this method if possible */
  private setupValidation(): void {
    // Basic Info Validation
    effect(() => {
      const data = this.basicInfo();
      const isValid =
        !!data.title.trim() &&
        !!data.researchArea.trim() &&
        !!data.fieldOfStudies &&
        !!data.location &&
        !!data.fundingType &&
        this.basicInfoForm.valid;
      this.basicInfoValid.set(isValid);
    });

    // Position Details Validation
    effect(() => {
      const data = this.positionDetails();
      const isValid = !!data.description.trim() && !!data.tasks.trim() && !!data.requirements.trim() && this.positionDetailsForm.valid;
      this.positionDetailsValid.set(isValid);
    });
  }

  /**
   * Sets up form synchronization effects to keep reactive forms in sync with signals
   */
  /* TODO: clean up this method if possibe*/
  private setupFormEffects(): void {
    // Effect for basic info form changes
    effect(() => {
      const basicInfoData = this.basicInfo();

      // Update form values when signal changes
      if (this.basicInfoForm.get('title')?.value !== basicInfoData.title) {
        this.basicInfoForm.get('title')?.setValue(basicInfoData.title, { emitEvent: false });
      }
      if (this.basicInfoForm.get('researchArea')?.value !== basicInfoData.researchArea) {
        this.basicInfoForm.get('researchArea')?.setValue(basicInfoData.researchArea, { emitEvent: false });
      }
    });

    // Effect for position details form changes
    effect(() => {
      const positionDetailsData = this.positionDetails();

      // Update form values when signal changes
      if (this.positionDetailsForm.get('description')?.value !== positionDetailsData.description) {
        this.positionDetailsForm.get('description')?.setValue(positionDetailsData.description, { emitEvent: false });
      }
      if (this.positionDetailsForm.get('tasks')?.value !== positionDetailsData.tasks) {
        this.positionDetailsForm.get('tasks')?.setValue(positionDetailsData.tasks, { emitEvent: false });
      }
      if (this.positionDetailsForm.get('requirements')?.value !== positionDetailsData.requirements) {
        this.positionDetailsForm.get('requirements')?.setValue(positionDetailsData.requirements, { emitEvent: false });
      }
    });
  }

  /**
   * Builds step configuration data for the progress stepper component
   */
  private buildStepData(): StepData[] {
    const steps: StepData[] = [];
    const templates = {
      panel1: this.panel1(),
      panel2: this.panel2(),
      panel3: this.panel3(),
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
            onClick: () => {},
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
            onClick: () => {},
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
            onClick: () => {},
            disabled: !this.positionDetailsValid(),
            label: 'jobActionButton.next',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        status: templates.status,
      });
    }

    if (templates.panel3) {
      steps.push({
        name: 'jobCreationForm.header.steps.additionalInfo',
        panelTemplate: templates.panel3,
        shouldTranslate: true,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'arrow-left',
            onClick: () => {},
            disabled: false,
            label: 'jobActionButton.back',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'paper-plane',
            onClick: () => void this.publishJob(),
            disabled: !this.allValid(),
            label: 'jobActionButton.publish',
            shouldTranslate: true,
            changePanel: false,
          },
        ],
        status: templates.status,
      });
    }

    return steps;
  }

  /**
   * Sets up auto-save functionality using effects to detect changes in form data
   * Debounces save operations with a 3-second delay
   */
  private setupAutoSave(): void {
    effect(() => {
      const currentData = this.currentJobData();
      const lastSaved = this.lastSavedData();

      if (JSON.stringify(currentData) !== JSON.stringify(lastSaved)) {
        if (this.autoSaveTimer) {
          clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = window.setTimeout(() => {
          this.savingState.set(SavingStates.SAVING);
          this.performAutoSave();
        }, 3000);
      }
    });
  }

  /**
   * Performs the actual auto-save operation by calling the appropriate API endpoint
   * Handles both create and update scenarios based on existing job ID
   */
  private async performAutoSave(): Promise<void> {
    const currentData = this.currentJobData();

    try {
      if (this.jobId()) {
        await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), currentData));
      } else {
        const createdJob = await firstValueFrom(this.jobResourceService.createJob(currentData));
        this.jobId.set(createdJob.jobId ?? '');
      }

      this.lastSavedData.set(currentData);
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      // Wait 3 seconds before changing the state to SAVED
      this.autoSaveTimer = window.setTimeout(() => {
        this.savingState.set(SavingStates.SAVED);
      }, 3000);
    }
  }

  private findDropdownOption<T>(options: T[], value: any, valueField: keyof T): T | undefined {
    return options.find(opt => opt[valueField] === value);
  }
}
