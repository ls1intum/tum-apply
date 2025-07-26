import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { JobResourceService } from 'app/generated/api/jobResource.service';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { Location } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';

import SharedModule from '../../shared/shared.module';
import { DropdownComponent } from '../../shared/components/atoms/dropdown/dropdown.component';
import { JobDTO, JobFormDTO } from '../../generated';
import { DatePickerComponent } from '../../shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from '../../shared/components/atoms/string-input/string-input.component';
import { AccountService } from '../../core/auth/account.service';
import * as DropdownOptions from '.././dropdown-options';

// Constants
const JobFormModes = { CREATE: 'create', EDIT: 'edit' } as const;
const SavingStates = { SAVED: 'SAVED', SAVING: 'SAVING' } as const;

type JobFormMode = (typeof JobFormModes)[keyof typeof JobFormModes];
type SavingState = (typeof SavingStates)[keyof typeof SavingStates];

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
  // Signals
  mode = signal<JobFormMode>('create');
  jobId = signal<string>('');
  userId = signal<string>('');
  isLoading = signal<boolean>(true);
  savingState = signal<SavingState>(SavingStates.SAVED);
  formData = signal<JobFormDTO | undefined>(undefined);
  lastSavedJobData = signal<JobFormDTO | undefined>(undefined);
  formsInitialized = signal<boolean>(false);

  // Forms
  basicInfoForm: FormGroup;
  positionDetailsForm: FormGroup;
  additionalInformationForm: FormGroup;

  // Template references
  panel1 = viewChild<TemplateRef<HTMLDivElement>>('panel1');
  panel2 = viewChild<TemplateRef<HTMLDivElement>>('panel2');
  panel3 = viewChild<TemplateRef<HTMLDivElement>>('panel3');
  savingStatePanel = viewChild<TemplateRef<HTMLDivElement>>('savingStatePanel');

  // Computed properties
  readonly pageTitle = computed(() =>
    this.mode() === 'edit' ? 'jobCreationForm.header.title.edit' : 'jobCreationForm.header.title.create',
  );

  readonly savingBadgeCalculatedClass = computed(
    () =>
      `flex flex-wrap justify-around content-center gap-1 ${this.savingState() === SavingStates.SAVED ? 'saved_color' : 'unsaved_color'}`,
  );

  // Character counters
  readonly descriptionLength = computed(() => this.positionDetailsForm?.get('description')?.value?.length ?? 0);
  readonly tasksLength = computed(() => this.positionDetailsForm?.get('tasks')?.value?.length ?? 0);
  readonly requirementsLength = computed(() => this.positionDetailsForm?.get('requirements')?.value?.length ?? 0);

  // Step configuration
  readonly stepData = computed<StepData[]>(() => this.buildStepData());

  readonly DropdownOptions = DropdownOptions;

  // Form validation
  private stepper = viewChild.required<ProgressStepperComponent>('stepper');
  private readonly isBasicInfoValid = computed(() => this.validateBasicInfo());
  private readonly isPositionDetailsValid = computed(() => this.validatePositionDetails());
  private readonly isAdditionalInfoValid = computed(() => true);
  private readonly isAllFormsValid = computed(
    () => this.isBasicInfoValid() && this.isPositionDetailsValid() && this.isAdditionalInfoValid(),
  );

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
  }

  private currentSavePromise: Promise<void> | null = null;

  private setupAutoSave(): void {
    effect(() => {
      const formData = this.formData();
      const lastSaved = this.lastSavedJobData();

      if (formData && JSON.stringify(formData) !== JSON.stringify(lastSaved)) {
        if (this.autoSaveTimer) {
          clearTimeout(this.autoSaveTimer);
        }
        // Only wait 3 seconds before auto-saving if the form is not in the process of saving
        this.autoSaveTimer = window.setTimeout(() => {
          if (!this.currentSavePromise) {
            this.savingState.set(SavingStates.SAVING);
          }
          this.performAutoSave();
        }, 3000);
      }
    });
  }

  private validateBasicInfo(): boolean {
    const formData = this.formData();
    if (!formData || !this.basicInfoForm || !this.userId()) {
      console.log('Basic validation failed - missing dependencies');
      return false;
    }

    const isFormValid = this.basicInfoForm.valid;
    const hasTitle = !!formData.title?.trim();
    const hasResearchArea = !!formData.researchArea?.trim();
    const hasFieldOfStudies = this.hasValue(formData.fieldOfStudies);
    const hasLocation = this.hasValue(formData.location);
    const hasFundingType = this.hasValue(formData.fundingType);

    return isFormValid && hasTitle && hasResearchArea && hasFieldOfStudies && hasLocation && hasFundingType;
  }

  private validatePositionDetails(): boolean {
    const formData = this.formData();
    if (!formData || !this.positionDetailsForm) return false;

    return (
      this.positionDetailsForm.valid &&
      !!formData.description?.trim() &&
      this.hasValue(formData.tasks) &&
      this.hasValue(formData.requirements)
    );
  }

  private hasValue(value: any): boolean {
    if (value === undefined) return false;
    return typeof value === 'object' && 'value' in value ? !!value.value : !!value;
  }

  private buildStepData(): StepData[] {
    const steps: StepData[] = [];
    const templates = {
      panel1: this.panel1(),
      panel2: this.panel2(),
      panel3: this.panel3(),
      status: this.savingStatePanel(),
    };

    if (templates.panel1) {
      steps.push(
        this.createStepConfig(
          'jobCreationForm.header.steps.basicInfo',
          templates.panel1,
          templates.status,
          !this.isBasicInfoValid(),
          'jobActionButton.next',
          () => this.onBack(),
        ),
      );
    }

    if (templates.panel2) {
      steps.push(
        this.createStepConfig(
          'jobCreationForm.header.steps.positionDetails',
          templates.panel2,
          templates.status,
          !this.isPositionDetailsValid(),
          'jobActionButton.next',
          () => this.stepper().goToStep(1), // Go to step 1
          () => this.stepper().goToStep(3), // Go to step 3
        ),
      );
    }

    if (templates.panel3) {
      steps.push(
        this.createStepConfig(
          'jobCreationForm.header.steps.additionalInfo',
          templates.panel3,
          templates.status,
          !this.isAllFormsValid(),
          'jobActionButton.publish',
          () => this.stepper().goToStep(2), // Go to step 2
          () => void this.publishJob(),
          false,
        ),
      );
    }

    return steps;
  }

  private createStepConfig(
    name: string,
    panel: TemplateRef<HTMLDivElement>,
    status: TemplateRef<HTMLDivElement> | undefined,
    disabled: boolean,
    buttonLabel: string,
    backAction?: () => void,
    nextAction?: () => void,
    changePanel = true,
  ): StepData {
    return {
      name,
      panelTemplate: panel,
      shouldTranslate: true,
      buttonGroupPrev: backAction
        ? [
            {
              variant: 'outlined',
              severity: 'primary',
              icon: 'chevron-left',
              onClick: backAction,
              disabled: false,
              label: 'jobActionButton.back',
              changePanel: false,
              shouldTranslate: true,
            },
          ]
        : [],
      buttonGroupNext: [
        {
          severity: 'primary',
          icon: undefined,
          onClick: nextAction || (() => {}),
          disabled,
          label: buttonLabel,
          shouldTranslate: true,
          changePanel,
        },
      ],
      status,
    };
  }

  private getCurrentJobFormDto(): JobFormDTO {
    const basic = this.basicInfoForm?.value || {};
    const position = this.positionDetailsForm?.value || {};

    return {
      title: basic.title || '',
      researchArea: basic.researchArea || '',
      fieldOfStudies: basic.fieldOfStudies?.value,
      supervisingProfessor: this.userId() || '',
      location: basic.location?.value,
      startDate: basic.startDate,
      workload: basic.workload?.value,
      contractDuration: basic.contractDuration?.value,
      fundingType: basic.fundingType?.value,
      description: position.description || '',
      tasks: position.tasks || '',
      requirements: position.requirements || '',
      state: JobFormDTO.StateEnum.Draft,
    };
  }

  private async performAutoSave(): Promise<void> {
    const currentData = this.getCurrentJobFormDto();

    try {
      if (this.jobId()) {
        await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), currentData));
      } else {
        const createdJob = await firstValueFrom(this.jobResourceService.createJob(currentData));
        this.jobId.set(createdJob.jobId ?? '');
      }

      this.lastSavedJobData.set(currentData);
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

  private setupFormSubscriptions(): void {
    const updateFormData = () => {
      const currentData = this.getCurrentJobFormDto();
      this.formData.set(currentData);
    };

    // Initial update
    updateFormData();

    [this.basicInfoForm, this.positionDetailsForm, this.additionalInformationForm].forEach(form =>
      form?.valueChanges.subscribe(() => {
        this.basicInfoForm.markAllAsTouched();
        updateFormData();
      }),
    );
  }

  async init(route: ActivatedRoute): Promise<void> {
    try {
      const user = this.accountService.loadedUser();
      if (!user?.id) {
        this.router.navigate(['/login']);
        return;
      }

      this.userId.set(user.id);
      const segments = await firstValueFrom(route.url);
      const mode = segments[1]?.path as JobFormMode;

      if (mode === JobFormModes.CREATE) {
        this.mode.set(JobFormModes.CREATE);
        this.initForms();
      } else if (mode === JobFormModes.EDIT) {
        this.mode.set(JobFormModes.EDIT);
        const jobId = route.snapshot.paramMap.get('job_id');

        if (!jobId) {
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

  initForms(job?: JobDTO): void {
    const user = this.accountService.loadedUser();

    // Initialize basic info form
    this.basicInfoForm = this.fb.group({
      title: [job?.title ?? '', Validators.required],
      researchArea: [job?.researchArea ?? '', Validators.required],
      fieldOfStudies: [this.findDropdownOption(DropdownOptions.fieldsOfStudies, job?.fieldOfStudies, 'value'), Validators.required],
      location: [this.findDropdownOption(DropdownOptions.locations, job?.location, 'value'), Validators.required],
      startDate: [job?.startDate ?? ''],
      workload: [this.findDropdownOption(DropdownOptions.workloadOptions, job?.workload, 'value')],
      contractDuration: [this.findDropdownOption(DropdownOptions.contractDurations, job?.contractDuration, 'value')],
      fundingType: [this.findDropdownOption(DropdownOptions.fundingTypes, job?.fundingType, 'value'), Validators.required],
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

    // Mark forms as initialized before setting form data
    this.formsInitialized.set(true);

    // Set initial data
    //this.lastSavedJobData.set(this.getCurrentJobFormDto());
    const initialData = this.getCurrentJobFormDto();
    this.formData.set(initialData);
    this.lastSavedJobData.set(initialData);

    this.setupFormSubscriptions();
  }

  async publishJob(): Promise<void> {
    const jobFormDto: JobFormDTO = {
      ...this.getCurrentJobFormDto(),
      state: JobFormDTO.StateEnum.Published,
    };

    try {
      if (this.jobId()) {
        await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), jobFormDto));
      } else {
        const createdJob = await firstValueFrom(this.jobResourceService.createJob(jobFormDto));
        this.jobId.set(createdJob.jobId ?? '');
      }
      this.router.navigate(['/my-positions']);
    } catch (error) {
      console.error('Failed to publish job:', error);
    }
  }

  onBack(): void {
    this.location.back();
  }

  onSelectionChange(form: FormGroup, controlName: string, value: unknown): void {
    form.patchValue({ [controlName]: value });
  }
}
