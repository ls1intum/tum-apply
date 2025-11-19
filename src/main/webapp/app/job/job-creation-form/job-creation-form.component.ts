import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, Location } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonColor, ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { htmlTextMaxLengthValidator, htmlTextRequiredValidator } from 'app/shared/validators/custom-validators';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SavingState, SavingStates } from 'app/shared/constants/saving-states';

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
import { ImageResourceApiService } from '../../generated/api/imageResourceApi.service';
import { ImageDTO } from '../../generated/model/imageDTO';

type JobFormMode = 'create' | 'edit';

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
    DividerModule,
    ButtonComponent,
    ProgressSpinnerModule,
  ],
  providers: [JobResourceApiService],
})
export class JobCreationFormComponent {
  /* eslint-disable @typescript-eslint/member-ordering */

  readonly publishButtonSeverity = 'primary' as ButtonColor;
  readonly publishButtonIcon = 'paper-plane';
  // Services
  private fb = inject(FormBuilder);
  private jobResourceService = inject(JobResourceApiService);
  private imageResourceService = inject(ImageResourceApiService);
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
  savingState = signal<SavingState>(SavingStates.SAVED);
  lastSavedData = signal<JobFormDTO | undefined>(undefined);
  publishAttempted = signal<boolean>(false);

  // Image upload state
  defaultImages = signal<ImageDTO[]>([]);
  researchGroupImages = signal<ImageDTO[]>([]);
  selectedImage = signal<ImageDTO | undefined>(undefined);
  isUploadingImage = signal<boolean>(false);
  // Pending image upload (not yet uploaded to server)
  pendingImageFile = signal<File | undefined>(undefined);
  pendingImagePreviewUrl = signal<string | undefined>(undefined);
  // Check if there's a custom uploaded image (not a default image)
  hasCustomImage = computed(() => {
    const image = this.selectedImage();
    return image !== undefined && image.imageType !== 'DEFAULT_JOB_BANNER';
  });

  // Forms
  basicInfoForm = this.createBasicInfoForm();
  positionDetailsForm = this.createPositionDetailsForm();
  imageForm = this.createImageForm();
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
    this.imageFormValueSignal();
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
    () =>
      `flex flex-wrap justify-around content-center gap-1 ${
        this.savingState() === SavingStates.SAVED
          ? 'saved_color'
          : this.savingState() === SavingStates.FAILED
            ? 'failed_color'
            : 'saving_color'
      }`,
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
            severity: 'info',
            icon: 'arrow-left',
            onClick: () => this.onBack(),
            disabled: false,
            label: 'button.back',
            changePanel: false,
            shouldTranslate: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'chevron-right',
            onClick() {},
            disabled: !this.basicInfoValid(),
            label: 'button.next',
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
            icon: 'chevron-left',
            onClick() {},
            disabled: false,
            label: 'button.back',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'chevron-right',
            onClick() {},
            disabled: !this.positionDetailsValid(),
            label: 'button.next',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        disabled: !this.basicInfoValid(),
        status: templates.status,
      });
    }

    // Step 3: Image Upload/Selection
    if (templates.panel3) {
      steps.push({
        name: 'jobCreationForm.header.steps.imageSelection',
        panelTemplate: templates.panel3,
        shouldTranslate: true,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'chevron-left',
            onClick() {},
            disabled: false,
            label: 'button.back',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        buttonGroupNext: [
          {
            severity: 'primary',
            icon: 'chevron-right',
            onClick() {},
            disabled: false, // Image is optional
            label: 'button.next',
            shouldTranslate: true,
            changePanel: true,
          },
        ],
        disabled: !this.positionDetailsValid(),
        status: templates.status,
      });
    }

    if (templates.panel4) {
      steps.push({
        name: 'jobCreationForm.header.steps.summary',
        panelTemplate: templates.panel4,
        shouldTranslate: true,
        buttonGroupPrev: [
          {
            variant: 'outlined',
            severity: 'primary',
            icon: 'chevron-left',
            onClick() {},
            disabled: false,
            label: 'button.back',
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
            label: 'button.publish',
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
  imageFormValueSignal = toSignal(this.imageForm.valueChanges, {
    initialValue: this.imageForm.getRawValue(),
  });

  async publishJob(): Promise<void> {
    const jobData = this.publishableJobData();
    this.publishAttempted.set(true);
    if (!Boolean(this.privacyAcceptedSignal())) {
      this.toastService.showErrorKey('privacy.privacyConsent.toastError');
      return;
    }
    if (!jobData) return;

    try {
      // Image is already uploaded and saved with the draft, no need to upload again
      await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), jobData));
      this.toastService.showSuccessKey('toast.published');
      void this.router.navigate(['/my-positions']);
    } catch {
      this.toastService.showErrorKey('toast.publishFailed');
    }
  }

  onBack(): void {
    this.location.back();
  }

  async onImageSelected(event: Event): Promise<void> {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const input = target;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large:', file.size);
      this.toastService.showErrorKey('jobCreationForm.imageSection.fileTooLarge');
      return;
    }

    // Validate file type - allow only specific image formats (no SVG)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      this.toastService.showErrorKey('jobCreationForm.imageSection.invalidFileType');
      return;
    }

    // Validate image dimensions (1920x1080 max)
    try {
      const dimensions = await this.getImageDimensions(file);
      if (dimensions.width > 4096 || dimensions.height > 4096) {
        console.error('Dimensions too large:', dimensions);
        this.toastService.showErrorKey('jobCreationForm.imageSection.dimensionsTooLarge');
        return;
      }
    } catch (error) {
      console.error('Failed to read image dimensions:', error);
      this.toastService.showErrorKey('jobCreationForm.imageSection.invalidImage');
      return;
    }

    // Upload the image immediately
    this.isUploadingImage.set(true);

    try {
      const uploadedImage = await firstValueFrom(this.imageResourceService.uploadJobBanner(file));

      this.selectedImage.set(uploadedImage);
      this.imageForm.patchValue({ imageId: uploadedImage.imageId });

      // Reload research group images to include the newly uploaded image
      const researchGroupImages = await firstValueFrom(this.imageResourceService.getResearchGroupJobBanners());
      this.researchGroupImages.set(researchGroupImages);

      this.toastService.showSuccessKey('jobCreationForm.imageSection.uploadSuccess');
    } catch (error) {
      console.error('Failed to upload image:', error);
      this.toastService.showErrorKey('jobCreationForm.imageSection.uploadFailed');
    } finally {
      this.isUploadingImage.set(false);
      input.value = '';
    }
  }

  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  selectImage(image: ImageDTO): void {
    // Only prevent selecting default images if a custom image is already uploaded
    // Allow switching between custom/research group images freely
    if (this.hasCustomImage() && image.imageType === 'DEFAULT_JOB_BANNER') {
      return;
    }
    this.selectedImage.set(image);
    this.imageForm.patchValue({ imageId: image.imageId });
  }

  clearImageSelection(): void {
    this.selectedImage.set(undefined);
    this.imageForm.patchValue({ imageId: null });
  }

  async deleteImage(imageId: string | undefined): Promise<void> {
    if (!imageId || imageId.length === 0) {
      return;
    }

    try {
      // Delete from server
      await firstValueFrom(this.imageResourceService.deleteImage(imageId));

      // Clear selection if the deleted image was selected
      if (this.selectedImage()?.imageId === imageId) {
        this.clearImageSelection();
      }

      // Reload research group images to reflect the deletion
      try {
        const researchGroupImages = await firstValueFrom(this.imageResourceService.getResearchGroupJobBanners());
        this.researchGroupImages.set(researchGroupImages);
      } catch (error) {
        console.error('Failed to reload research group images after deletion:', error);
        // Even if reload fails, keep the UI consistent by removing the deleted image
        this.researchGroupImages.set(this.researchGroupImages().filter(img => img.imageId !== imageId));
      }

      this.toastService.showSuccessKey('jobCreationForm.imageSection.deleteImageSuccess');
    } catch (error) {
      console.error('Failed to delete image:', error);
      this.toastService.showErrorKey('jobCreationForm.imageSection.deleteImageFailed');
    }
  }

  async deleteSelectedImage(): Promise<void> {
    await this.deleteImage(this.selectedImage()?.imageId);
  }

  async loadImages(): Promise<void> {
    try {
      const user = this.accountService.loadedUser();
      const researchGroupId = user?.researchGroup?.researchGroupId;

      // Load default images filtered by research group
      const defaults = await firstValueFrom(this.imageResourceService.getDefaultJobBanners(researchGroupId));
      this.defaultImages.set(defaults);

      // Load research group's custom images
      const researchGroupImages = await firstValueFrom(this.imageResourceService.getResearchGroupJobBanners());
      this.researchGroupImages.set(researchGroupImages);
    } catch {
      this.toastService.showErrorKey('jobCreationForm.imageSection.loadImagesFailed');
    }
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
      description: ['', [htmlTextRequiredValidator, htmlTextMaxLengthValidator(1000)]],
      tasks: ['', [htmlTextRequiredValidator, htmlTextMaxLengthValidator(1000)]],
      requirements: ['', [htmlTextRequiredValidator, htmlTextMaxLengthValidator(1000)]],
    });
  }

  private createImageForm(): FormGroup {
    return this.fb.group({
      imageId: [undefined],
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
    const imageValue = this.imageForm.getRawValue();

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
      imageId: imageValue.imageId ?? null,
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

      // Load images for selection
      await this.loadImages();

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
    } catch {
      this.toastService.showErrorKey('toast.loadFailed');
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

    // Set image if available - reconstruct ImageDTO from job data
    if (job?.imageId !== undefined && job.imageUrl !== undefined) {
      this.imageForm.patchValue({ imageId: job.imageId });

      // Check if this image is a default image (exists in defaultImages array)
      const isDefaultImage = this.defaultImages().some(img => img.imageId === job.imageId);
      const imageType = isDefaultImage ? 'DEFAULT_JOB_BANNER' : 'JOB_BANNER';

      this.selectedImage.set({
        imageId: job.imageId,
        url: job.imageUrl,
        imageType: imageType as 'JOB_BANNER' | 'DEFAULT_JOB_BANNER' | 'PROFILE_PICTURE',
      });
    }

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
      this.imageFormValueSignal();

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
    } catch {
      this.savingState.set('FAILED');
      this.toastService.showErrorKey('toast.saveFailed');
    }
  }

  private findDropdownOption<T extends { value: unknown }>(options: T[], value: unknown): T | undefined {
    return options.find(opt => opt.value === value);
  }
}
