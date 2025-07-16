import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { JobResourceService } from 'app/generated/api/jobResource.service';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { Location } from '@angular/common';

import SharedModule from '../../shared/shared.module';
import { DropdownComponent } from '../../shared/components/atoms/dropdown/dropdown.component';
import { JobDTO, JobFormDTO } from '../../generated';
import { DatePickerComponent } from '../../shared/components/atoms/datepicker/datepicker.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import ButtonGroupComponent, { ButtonGroupData } from '../../shared/components/molecules/button-group/button-group.component';
import { StringInputComponent } from '../../shared/components/atoms/string-input/string-input.component';
import { AccountService } from '../../core/auth/account.service';
import * as DropdownOptions from '.././dropdown-options';

const JobFormModes = {
  CREATE: 'create',
  EDIT: 'edit',
} as const;

type JobFormMode = (typeof JobFormModes)[keyof typeof JobFormModes];

/**
 * JobCreationFormComponent
 * ------------------------
 * This component provides a multi-step form interface for creating a new doctoral job position.
 * It handles data binding, validation, and communication with the server via JobResourceService.
 */
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
    ButtonComponent,
    ButtonGroupComponent,
    StringInputComponent,
  ],
  providers: [JobResourceService],
})
export class JobCreationFormComponent {
  mode = signal<JobFormMode>('create');
  jobId = signal<string>('');
  userId = signal<string>('');
  currentStep = 1;
  isLoading = signal<boolean>(true);

  // Reactive form groups for each step of the wizard
  basicInfoForm: FormGroup = this.fb.group({});
  positionDetailsForm: FormGroup = this.fb.group({});
  additionalInformationForm: FormGroup = this.fb.group({});

  protected readonly DropdownOptions = DropdownOptions;

  readonly pageTitle = computed(() =>
    this.mode() === 'edit' ? 'jobCreationForm.header.title.edit' : 'jobCreationForm.header.title.create',
  );

  private jobResourceService = inject(JobResourceService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private location = inject(Location);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
  ) {
    this.init(route);
  }

  // Button Group Data consisting of 'Next' and 'Save Draft' Buttons
  nextAndSaveButtons(): ButtonGroupData {
    return {
      direction: 'horizontal',
      buttons: [
        {
          label: 'jobActionButton.saveDraft',
          icon: 'floppy-disk',
          severity: 'secondary',
          disabled: this.basicInfoForm.invalid,
          onClick: () => void this.saveDraft(),
          shouldTranslate: true,
        },
        {
          label: 'jobActionButton.next',
          icon: undefined,
          severity: 'primary',
          disabled: false,
          onClick: () => this.nextStep(),
          shouldTranslate: true,
        },
      ],
    };
  }
  // Button Group Data consisting of 'Publish Job' and 'Save Draft' Buttons
  publishAndSaveButtons(): ButtonGroupData {
    return {
      direction: 'horizontal',
      buttons: [
        {
          label: 'jobActionButton.saveDraft',
          icon: 'floppy-disk',
          severity: 'secondary',
          disabled: this.basicInfoForm.invalid,
          onClick: () => void this.saveDraft(),
          shouldTranslate: true,
        },
        {
          label: 'jobActionButton.publish',
          icon: undefined,
          severity: 'primary',
          disabled: this.basicInfoForm.invalid || this.positionDetailsForm.invalid,
          onClick: () => void this.publishJob(),
          shouldTranslate: true,
        },
      ],
    };
  }

  /**
   * Calculates the current length of the input fields with a character limit.
   * Used for character count feedback.
   */
  get descriptionLength(): number {
    return this.positionDetailsForm.get('description')?.value?.length ?? 0;
  }

  get tasksLength(): number {
    return this.positionDetailsForm.get('tasks')?.value?.length ?? 0;
  }

  get requirementsLength(): number {
    return this.positionDetailsForm.get('requirements')?.value?.length ?? 0;
  }

  /**
   * Initializes all three form groups used in the form wizard.
   * Sets up validators, default values, and disabled controls.
   */
  initForms(job?: JobDTO): void {
    /**
     * Updates the specified form control with a selected dropdown option value.
     * The value can be a string, number, or enum used in dropdown selections.
     */
    const findOption = <T>(options: T[], value: any, valueField: keyof T): T | null => {
      return job ? (options.find(opt => opt[valueField] === value) ?? null) : null;
    };

    // Initialize dropdown options
    const locationOption = findOption(DropdownOptions.locations, job?.location, 'value');
    const fieldOfStudiesOption = findOption(DropdownOptions.fieldsOfStudies, job?.fieldOfStudies, 'value');
    const workloadOption = findOption(DropdownOptions.workloadOptions, job?.workload, 'value');
    const contractDurationOption = findOption(DropdownOptions.contractDurations, job?.contractDuration, 'value');
    const fundingTypeOption = findOption(DropdownOptions.fundingTypes, job?.fundingType, 'value');

    // Basic Information form
    this.basicInfoForm = this.fb.group({
      title: [job?.title ?? '', Validators.required],
      researchArea: [job?.researchArea ?? '', Validators.required],
      fieldOfStudies: [fieldOfStudiesOption, Validators.required],
      supervisingProfessor: this.fb.control(
        {
          value: this.accountService.loadedUser()?.name ?? '',
          disabled: true,
        },
        Validators.required,
      ),
      location: [locationOption, Validators.required],
      startDate: [job?.startDate ?? ''],
      workload: [workloadOption],
      contractDuration: [contractDurationOption],
      fundingType: [fundingTypeOption, Validators.required],
    });

    // Position Details form
    this.positionDetailsForm = this.fb.group({
      description: [job?.description ?? '', [Validators.required, Validators.maxLength(1000)]],
      tasks: [job?.tasks ?? '', [Validators.required, Validators.maxLength(1000)]],
      requirements: [job?.requirements ?? '', [Validators.required, Validators.maxLength(1000)]],
    });

    // Additional Information form
    this.additionalInformationForm = this.fb.group({});
  }

  /**
   * Advances the form wizard to the next/previous step.
   */
  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onCancel(): void {
    this.location.back();
  }

  /**
   * Initializes the form based on the current route.
   * Determines whether the form is in create or edit mode,
   * and loads job data if editing an existing position.
   *
   * @param route - The current ActivatedRoute instance used to inspect route segments
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
      const firstSegment = segments[1]?.path;

      if (firstSegment === JobFormModes.CREATE) {
        this.mode.set(JobFormModes.CREATE);
        this.initForms();
      } else if (firstSegment === JobFormModes.EDIT) {
        this.mode.set(JobFormModes.EDIT);
        this.jobId.set(this.route.snapshot.paramMap.get('job_id') ?? '');

        if (this.jobId() === '') {
          console.error('Invalid job ID');
          this.router.navigate(['/my-positions']);
          return;
        }

        const job = await firstValueFrom(this.jobResourceService.getJobById(this.jobId()));
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
   * Saves the current form state as a draft.
   * Sends a partial or full JobFormDTO to the server with "Draft" status.
   */
  async saveDraft(): Promise<void> {
    const jobFormDto: JobFormDTO = {
      title: this.basicInfoForm.value.title,
      researchArea: this.basicInfoForm.value.researchArea,
      fieldOfStudies: this.basicInfoForm.value.fieldOfStudies?.value ?? null,
      supervisingProfessor: this.userId(),
      location: this.basicInfoForm.value.location?.value ?? null,
      startDate: this.basicInfoForm.value.startDate,
      workload: this.basicInfoForm.value.workload?.value ?? null,
      contractDuration: this.basicInfoForm.value.contractDuration?.value ?? null,
      fundingType: this.basicInfoForm.value.fundingType?.value ?? null,
      description: this.positionDetailsForm.value.description,
      tasks: this.positionDetailsForm.value.tasks,
      requirements: this.positionDetailsForm.value.requirements,
      state: JobFormDTO.StateEnum.Draft,
    };
    try {
      if (this.jobId() !== '' && this.mode() === JobFormModes.EDIT) {
        await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), jobFormDto));
      } else {
        await firstValueFrom(this.jobResourceService.createJob(jobFormDto));
      }
      void this.router.navigate(['/my-positions']);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }

  /**
   * Finalizes and submits the form by publishing the job post.
   */
  async publishJob(): Promise<void> {
    const jobFormDto: JobFormDTO = {
      title: this.basicInfoForm.value.title,
      researchArea: this.basicInfoForm.value.researchArea,
      fieldOfStudies: this.basicInfoForm.value.fieldOfStudies?.value ?? null,
      supervisingProfessor: this.userId(),
      location: this.basicInfoForm.value.location?.value ?? null,
      startDate: this.basicInfoForm.value.startDate,
      workload: this.basicInfoForm.value.workload?.value ?? null,
      contractDuration: this.basicInfoForm.value.contractDuration?.value ?? null,
      fundingType: this.basicInfoForm.value.fundingType?.value ?? null,
      description: this.positionDetailsForm.value.description,
      tasks: this.positionDetailsForm.value.tasks,
      requirements: this.positionDetailsForm.value.requirements,
      state: JobFormDTO.StateEnum.Published,
    };

    try {
      if (this.jobId() !== '' && this.mode() === JobFormModes.EDIT) {
        await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), jobFormDto));
      } else {
        await firstValueFrom(this.jobResourceService.createJob(jobFormDto));
      }
      void this.router.navigate(['/my-positions']);
    } catch (error) {
      console.error('Failed to publish job:', error);
    }
  }

  /**
   * Utility function used to patch values to a form control dynamically.
   *
   * @param form - The FormGroup that contains the control
   * @param controlName - The name of the control to update
   * @param value - The value to patch into the control
   */
  onSelectionChange(form: FormGroup, controlName: string, value: unknown): void {
    form.patchValue({ [controlName]: value });
  }
}
