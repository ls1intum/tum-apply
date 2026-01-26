import { CommonModule, Location } from '@angular/common';
import { Component, TemplateRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Language, TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TranslateDirective } from 'app/shared/language';
import { ProgressStepperComponent, StepData } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { ButtonColor, ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { EditorComponent } from 'app/shared/components/atoms/editor/editor.component';
import { DatePickerComponent } from 'app/shared/components/atoms/datepicker/datepicker.component';
import { StringInputComponent } from 'app/shared/components/atoms/string-input/string-input.component';
import { SelectComponent } from 'app/shared/components/atoms/select/select.component';
import { NumberInputComponent } from 'app/shared/components/atoms/number-input/number-input.component';
import { ProgressSpinnerComponent } from 'app/shared/components/atoms/progress-spinner/progress-spinner.component';
import { ToggleSwitchComponent } from 'app/shared/components/atoms/toggle-switch/toggle-switch.component';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import { MessageComponent } from 'app/shared/components/atoms/message/message.component';
import { SegmentedToggleComponent, SegmentedToggleValue } from 'app/shared/components/atoms/segmented-toggle/segmented-toggle.component';
import { SavingState, SavingStates } from 'app/shared/constants/saving-states';
import { htmlTextMaxLengthValidator, htmlTextRequiredValidator } from 'app/shared/validators/custom-validators';
import { AiResourceApiService } from 'app/generated';
import { AiStreamingService } from 'app/service/ai-streaming.service';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { JobFormDTO } from 'app/generated/model/jobFormDTO';
import { JobDTO } from 'app/generated/model/jobDTO';
import { ImageResourceApiService } from 'app/generated/api/imageResourceApi.service';
import { ImageDTO } from 'app/generated/model/imageDTO';

import { JobDetailComponent } from '../job-detail/job-detail.component';
import * as DropdownOptions from '.././dropdown-options';

/** Represents the mode of the job creation form: creating a new job or editing an existing one */
type JobFormMode = 'create' | 'edit';

/**
 * JobCreationFormComponent
 *
 * A multi-step form for creating and editing job postings.
 * Features:
 * - 4-step form wizard (Basic Info → Position Details → Image Selection → Summary)
 * - Dual-language support (EN/DE) with automatic AI translation
 * - AI-powered job description generation
 * - Auto-save functionality with 3-second debounce
 * - Image upload and selection for job banners
 *
 */
@Component({
  selector: 'jhi-job-creation-form',
  standalone: true,
  templateUrl: './job-creation-form.component.html',
  styleUrls: ['./job-creation-form.component.scss'],
  imports: [
    CommonModule,
    TooltipModule,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    DatePickerComponent,
    StringInputComponent,
    ProgressStepperComponent,
    TranslateModule,
    TranslateDirective,
    SelectComponent,
    NumberInputComponent,
    EditorComponent,
    ConfirmDialog,
    JobDetailComponent,
    DividerModule,
    ButtonComponent,
    ProgressSpinnerModule,
    CheckboxModule,
    ToggleSwitchModule,
    ProgressSpinnerComponent,
    ToggleSwitchComponent,
    InfoBoxComponent,
    MessageComponent,
    SegmentedToggleComponent,
  ],
  providers: [JobResourceApiService],
})
export class JobCreationFormComponent {
  /* eslint-disable @typescript-eslint/member-ordering */

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════════════════
  readonly publishButtonSeverity = 'primary' as ButtonColor;
  readonly publishButtonIcon = 'paper-plane';

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE & META SIGNALS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current form mode: 'create' for new jobs, 'edit' for existing jobs */
  mode = signal<JobFormMode>('create');

  jobId = signal<string>('');

  userId = signal<string>('');

  isLoading = signal<boolean>(true);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVING STATE SIGNALS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current auto-save state: 'SAVED', 'SAVING', or 'FAILED' */
  savingState = signal<SavingState>(SavingStates.SAVED);

  /** Snapshot of the last successfully saved job data (used for change detection) */
  lastSavedData = signal<JobFormDTO | undefined>(undefined);

  /** Tracks if the user has attempted to publish (triggers validation display) */
  publishAttempted = signal<boolean>(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // JOB DESCRIPTION SIGNALS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current content of the job description editor */
  jobDescriptionSignal = signal<string>('');

  /** Currently selected language tab for the job description editor */
  currentDescriptionLanguage = signal<Language>('en');

  /** Stores the English version of the job description */
  jobDescriptionEN = signal<string>('');

  /** Stores the German version of the job description */
  jobDescriptionDE = signal<string>('');

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSLATION STATE SIGNALS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Indicates whether AI translation is in progress */
  isTranslating = signal<boolean>(false);

  /** Last successfully translated English text (used to avoid redundant translations) */
  lastTranslatedEN = signal<string>('');

  /** Last successfully translated German text (used to avoid redundant translations) */
  lastTranslatedDE = signal<string>('');

  // ═══════════════════════════════════════════════════════════════════════════
  // AI GENERATION SIGNALS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Indicates whether AI is currently generating a job description draft */
  isGeneratingDraft = signal<boolean>(false);

  /** Controls visibility of the AI generation panel */
  aiToggleSignal = signal<boolean>(true);

  /** Tracks if the rewrite button should be shown (after first generation) */
  rewriteButtonSignal = signal<boolean>(false);

  /** Computed: determines if the AI panel should be displayed */
  showAiPanel = computed(() => this.aiToggleSignal());

  /** Computed: returns the localized template text for manual job description */
  templateText = computed(() => this.translate.instant('jobCreationForm.positionDetailsSection.jobDescription.template'));

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE UPLOAD SIGNALS
  // ═══════════════════════════════════════════════════════════════════════════

  /** List of default job banner images provided by the system */
  defaultImages = signal<ImageDTO[]>([]);

  /** List of custom images uploaded by the research group */
  researchGroupImages = signal<ImageDTO[]>([]);

  /** Currently selected image for the job banner */
  selectedImage = signal<ImageDTO | undefined>(undefined);

  /** Indicates whether an image upload is in progress */
  isUploadingImage = signal<boolean>(false);

  /** Computed: checks if the selected image is a custom upload (not a default) */
  hasCustomImage = computed(() => {
    const image = this.selectedImage();
    return image !== undefined && image.imageType !== 'DEFAULT_JOB_BANNER';
  });

  /** Computed: CSS classes for the upload container based on upload state */
  uploadContainerClasses = computed(() => {
    if (this.isUploadingImage()) {
      return 'relative rounded-lg transition-all opacity-50 pointer-events-none';
    }
    return 'relative rounded-lg transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1';
  });

  /** Computed: CSS classes for the inner upload area */
  uploadInnerClasses = computed(() => {
    const base = 'aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all';
    const hover = !this.isUploadingImage() ? 'hover:border-primary hover:bg-background-surface-alt' : '';
    return `${base} border-border-default ${hover}`.trim();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPENDENCY INJECTION
  // ═══════════════════════════════════════════════════════════════════════════

  private fb = inject(FormBuilder);
  private jobResourceService = inject(JobResourceApiService);
  private imageResourceService = inject(ImageResourceApiService);
  private accountService = inject(AccountService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private aiService = inject(AiResourceApiService);
  private aiStreamingService = inject(AiStreamingService);

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM GROUPS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Step 1: Basic job information (title, research area, field, location, description) */
  basicInfoForm = this.createBasicInfoForm();

  /** Step 2: Position details (funding, dates, workload, contract duration) */
  positionDetailsForm = this.createPositionDetailsForm();

  /** Step 3: Image selection for job banner */
  imageForm = this.createImageForm();

  /** Step 4: Additional info including privacy consent */
  additionalInfoForm = this.createAdditionalInfoForm();

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE REFERENCES (ViewChild)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Template for Step 1: Basic Info panel */
  panel1 = viewChild<TemplateRef<HTMLDivElement>>('panel1');

  /** Template for Step 2: Position Details panel */
  panel2 = viewChild<TemplateRef<HTMLDivElement>>('panel2');

  /** Template for Step 3: Image Selection panel */
  panel3 = viewChild<TemplateRef<HTMLDivElement>>('panel3');

  /** Template for Step 4: Summary/Preview panel */
  panel4 = viewChild<TemplateRef<HTMLDivElement>>('panel4');

  /** Template for the saving state indicator */
  savingStatePanel = viewChild<TemplateRef<HTMLDivElement>>('savingStatePanel');

  /** Reference to the publish confirmation dialog */
  sendPublishDialog = viewChild<ConfirmDialog>('sendPublishDialog');

  /** Reference to the job description rich-text editor */
  jobDescriptionEditor = viewChild<EditorComponent>('jobDescriptionEditor');

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM VALIDITY SIGNALS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Tracks validity of Step 1 (Basic Info) */
  basicInfoValid = signal(false);

  /** Tracks validity of Step 2 (Position Details) */
  positionDetailsValid = signal(false);

  /** Computed: true when all required forms are valid */
  allFormsValid = computed(() => this.basicInfoValid() && this.positionDetailsValid());

  /** Computed: true when an image has been selected */
  imageSelected = computed(() => this.selectedImage() !== undefined);

  // ═══════════════════════════════════════════════════════════════════════════
  // REACTIVE FORM STATUS SIGNALS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Signal that emits when basicInfoForm status changes */
  basicInfoChanges = toSignal(this.basicInfoForm.statusChanges, { initialValue: this.basicInfoForm.status });

  /** Signal that emits when positionDetailsForm status changes */
  positionDetailsChanges = toSignal(this.positionDetailsForm.statusChanges, { initialValue: this.positionDetailsForm.status });

  /** Signal tracking the privacy consent checkbox state */
  privacyAcceptedSignal = toSignal(this.additionalInfoForm.controls['privacyAccepted'].valueChanges, {
    initialValue: this.additionalInfoForm.controls['privacyAccepted'].value,
  });

  /**
   * Effect: Updates validity signals whenever form status changes.
   * This keeps the stepper navigation buttons in sync with form state.
   */
  formValidationEffect = effect(() => {
    this.basicInfoChanges();
    this.positionDetailsChanges();
    this.jobDescriptionSignal();

    this.basicInfoValid.set(this.basicInfoForm.valid);
    this.positionDetailsValid.set(this.positionDetailsForm.valid);
  });

  /** Computed: Returns the job DTO ready for publishing, or undefined if forms are invalid */
  publishableJobData = computed<JobFormDTO | undefined>(() => (this.allFormsValid() ? this.createJobDTO('PUBLISHED') : undefined));

  /** Computed: Detects if there are unsaved changes by comparing current data with last saved */
  hasUnsavedChanges = computed(() => {
    const current = this.currentJobData();
    const lastSaved = this.lastSavedData();
    return JSON.stringify(current) !== JSON.stringify(lastSaved);
  });

  /** Computed: Returns the appropriate page title translation key based on mode */
  readonly pageTitle = computed(() =>
    this.mode() === 'edit' ? 'jobCreationForm.header.title.edit' : 'jobCreationForm.header.title.create',
  );

  /** Computed: CSS classes for the saving state badge based on current state */
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

  // ═══════════════════════════════════════════════════════════════════════════
  // STEPPER CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Computed: Builds the configuration for the multi-step wizard.
   * Each step defines its panel template, navigation buttons, and validation state.
   */
  readonly stepData = computed<StepData[]>(() => this.buildStepData());

  // ═══════════════════════════════════════════════════════════════════════════
  // LANGUAGE TOGGLE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Converts a language code to the corresponding segmented toggle value.
   * @param lang - The language code ('en' or 'de')
   * @returns 'left' for English, 'right' for German
   */
  segmentValueForLang(lang: Language): SegmentedToggleValue {
    return lang === 'en' ? 'left' : 'right';
  }

  /**
   * Converts a segmented toggle value to the corresponding language code.
   * @param toggleValue - The toggle position ('left' or 'right')
   * @returns 'en' for left, 'de' for right
   */
  langForSegmentValue(toggleValue: SegmentedToggleValue): Language {
    return toggleValue === 'left' ? 'en' : 'de';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSLATED DROPDOWN OPTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Signal that tracks the current UI language for dropdown translations */
  currentLang = toSignal(this.translate.onLangChange);

  /** Computed: Returns localized and sorted field of study options */
  translatedFieldsOfStudies = computed(() => {
    void this.currentLang();
    return DropdownOptions.fieldsOfStudies
      .map(option => ({ value: option.value, name: this.translate.instant(option.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Computed: Returns localized and sorted location options */
  translatedLocations = computed(() => {
    void this.currentLang();
    return DropdownOptions.locations
      .map(option => ({ value: option.value, name: this.translate.instant(option.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Computed: Returns localized and sorted funding type options */
  translatedFundingTypes = computed(() => {
    void this.currentLang();
    return DropdownOptions.fundingTypes
      .map(option => ({ value: option.value, name: this.translate.instant(option.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM VALUE SIGNALS (for change detection)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Signal that emits the current basicInfoForm values */
  basicInfoFormValueSignal = toSignal(this.basicInfoForm.valueChanges, {
    initialValue: this.basicInfoForm.getRawValue(),
  });

  /** Signal that emits the current positionDetailsForm values */
  positionDetailsFormValueSignal = toSignal(this.positionDetailsForm.valueChanges, {
    initialValue: this.positionDetailsForm.getRawValue(),
  });

  /** Signal that emits the current imageForm values */
  imageFormValueSignal = toSignal(this.imageForm.valueChanges, {
    initialValue: this.imageForm.getRawValue(),
  });

  /** Computed: Aggregates all form data into a JobFormDTO for saving */
  currentJobData = computed<JobFormDTO>(() => {
    this.basicInfoFormValueSignal();
    this.positionDetailsFormValueSignal();
    this.imageFormValueSignal();
    return this.createJobDTO('DRAFT');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-SAVE INTERNALS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Timer ID for the debounced auto-save (3-second delay) */
  private autoSaveTimer: number | undefined;

  /** Flag to prevent auto-save from triggering during initial form population */
  private autoSaveInitialized = false;

  private isAutoScrolling = false;

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE UPLOAD CONSTRAINTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Allowed MIME types for image uploads */
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  /** Formatted string of allowed types for the file input accept attribute */
  readonly acceptedImageTypes = this.ALLOWED_IMAGE_TYPES.join(',');

  /** Maximum file size for uploads: 5MB */
  private readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

  /** Maximum image dimension (width or height): 4096px */
  private readonly MAX_IMAGE_DIMENSION_PX = 4096;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════════════

  constructor() {
    this.init();
    this.setupAutoSave();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LANGUAGE SWITCHING METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Switches the job description editor to a different language tab.
   * Ensures pending saves are flushed before switching to prevent data loss.
   *
   * @param newLang - The target language ('en' or 'de')
   */
  changeDescriptionLanguage(newLang: Language): void {
    const currentLang = this.currentDescriptionLanguage();
    if (newLang === currentLang || this.isTranslating()) return;

    // If a save is pending, flush it first so we don't lose text
    if (this.autoSaveTimer !== undefined) {
      this.clearAutoSaveTimer();
      this.syncCurrentEditorIntoLanguageSignals();
    }

    this.currentDescriptionLanguage.set(newLang);
  }

  /**
   * Syncs the current editor content into the appropriate language signal (EN or DE).
   * Called before saving or switching languages to ensure no content is lost.
   */
  private syncCurrentEditorIntoLanguageSignals(): void {
    const description = this.basicInfoForm.get('jobDescription')?.value ?? '';
    const lang = this.currentDescriptionLanguage();
    if (lang === 'en') {
      this.jobDescriptionEN.set(description);
    } else {
      this.jobDescriptionDE.set(description);
    }
  }

  /**
   * Effect: Automatically updates the editor when the description language changes.
   * Loads the stored content for the selected language into the editor.
   */
  languageChangeEffect = effect(() => {
    const newLanguage = this.currentDescriptionLanguage();
    if (!this.autoSaveInitialized) return;

    const targetContent = newLanguage === 'en' ? this.jobDescriptionEN() : this.jobDescriptionDE();

    this.basicInfoForm.get('jobDescription')?.setValue(targetContent, { emitEvent: false });
    this.jobDescriptionSignal.set(targetContent);
    this.jobDescriptionEditor()?.forceUpdate(targetContent);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // AI TOGGLE EFFECT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Effect: Manages the job description template based on AI toggle state.
   * - When AI is disabled and editor is empty: inserts template
   * - When AI is enabled and content equals template: clears editor
   */
  private aiToggleEffect = effect(() => {
    const aiEnabled = this.aiToggleSignal();
    const ctrl = this.basicInfoForm.get('jobDescription');
    const current = (ctrl?.value ?? '') as string;
    const template = this.templateText();

    const isEmpty = !current || current.trim() === '' || current.trim() === '<p><br></p>';

    if (!aiEnabled && isEmpty) {
      ctrl?.setValue(template);
      this.jobDescriptionEditor()?.forceUpdate(template);
    }

    if (aiEnabled && current === template) {
      ctrl?.setValue('');
      this.jobDescriptionEditor()?.forceUpdate('');
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLISH METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Publishes the job posting after validation.
   * Requires privacy consent and valid forms.
   * Navigates to /my-positions on success.
   */
  async publishJob(): Promise<void> {
    const jobData = this.publishableJobData();
    this.publishAttempted.set(true);

    if (!Boolean(this.privacyAcceptedSignal())) {
      this.toastService.showErrorKey('privacy.privacyConsent.toastError');
      return;
    }
    if (!jobData) return;

    try {
      const saved = await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), jobData));
      // refresh local truth from server response
      this.applyServerJobForm(saved);
      this.toastService.showSuccessKey('toast.published');
      void this.router.navigate(['/my-positions']);
    } catch {
      this.toastService.showErrorKey('toast.publishFailed');
    }
  }

  /**
   * Navigates back to the previous page in browser history.
   */
  onBack(): void {
    this.location.back();
  }

  /**
   * Performs a save after changing the step.
   */
  async onStepChange(): Promise<void> {
    // Timer sofort abbrechen und speichern
    if (this.autoSaveTimer !== undefined) {
      this.clearAutoSaveTimer();
      this.syncCurrentEditorIntoLanguageSignals();
      await this.performAutoSave();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // IMAGE MANAGEMENT METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handles image file selection and upload.
   * Validates file type, size, and dimensions before uploading.
   *
   * @param event - The file input change event
   */
  async onImageSelected(event: Event): Promise<void> {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const input = target;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (file.size > this.MAX_FILE_SIZE_BYTES) {
      this.toastService.showErrorKey('jobCreationForm.imageSection.fileTooLarge');
      return;
    }

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.toastService.showErrorKey('jobCreationForm.imageSection.invalidFileType');
      return;
    }

    try {
      const dimensions = await this.getImageDimensions(file);
      if (dimensions.width > this.MAX_IMAGE_DIMENSION_PX || dimensions.height > this.MAX_IMAGE_DIMENSION_PX) {
        this.toastService.showErrorKey('jobCreationForm.imageSection.dimensionsTooLarge');
        return;
      }
    } catch {
      this.toastService.showErrorKey('jobCreationForm.imageSection.invalidImage');
      return;
    }

    this.isUploadingImage.set(true);

    try {
      const uploadedImage = await firstValueFrom(this.imageResourceService.uploadJobBanner(file));

      this.selectedImage.set(uploadedImage);
      this.imageForm.patchValue({ imageId: uploadedImage.imageId });

      const researchGroupImages = await firstValueFrom(this.imageResourceService.getResearchGroupJobBanners());
      this.researchGroupImages.set(researchGroupImages);

      this.toastService.showSuccessKey('jobCreationForm.imageSection.uploadSuccess');
    } catch {
      this.toastService.showErrorKey('jobCreationForm.imageSection.uploadFailed');
    } finally {
      this.isUploadingImage.set(false);
      input.value = '';
    }
  }

  /**
   * Selects an image from the available options as the job banner.
   *
   * @param image - The image DTO to select
   */
  selectImage(image: ImageDTO): void {
    this.selectedImage.set(image);
    this.imageForm.patchValue({ imageId: image.imageId });
  }

  /**
   * Clears the current image selection.
   */
  clearImageSelection(): void {
    this.selectedImage.set(undefined);
    this.imageForm.patchValue({ imageId: null });
  }

  /**
   * Deletes an uploaded image from the server.
   *
   * @param imageId - The ID of the image to delete
   */
  async deleteImage(imageId: string | undefined): Promise<void> {
    if (!imageId) return;

    try {
      await firstValueFrom(this.imageResourceService.deleteImage(imageId));

      if (this.selectedImage()?.imageId === imageId) {
        this.clearImageSelection();
      }

      try {
        const researchGroupImages = await firstValueFrom(this.imageResourceService.getResearchGroupJobBanners());
        this.researchGroupImages.set(researchGroupImages);
      } catch {
        this.researchGroupImages.set(this.researchGroupImages().filter(img => img.imageId !== imageId));
      }

      this.toastService.showSuccessKey('jobCreationForm.imageSection.deleteImageSuccess');
    } catch {
      this.toastService.showErrorKey('jobCreationForm.imageSection.deleteImageFailed');
    }
  }

  /**
   * Deletes the currently selected image.
   */
  async deleteSelectedImage(): Promise<void> {
    await this.deleteImage(this.selectedImage()?.imageId);
  }

  /**
   * Loads available images (defaults and research group uploads) from the server.
   */
  async loadImages(): Promise<void> {
    try {
      try {
        const defaults = await firstValueFrom(this.imageResourceService.getMyDefaultJobBanners());
        this.defaultImages.set(defaults);
      } catch {
        this.defaultImages.set([]);
      }

      const researchGroupImages = await firstValueFrom(this.imageResourceService.getResearchGroupJobBanners());
      this.researchGroupImages.set(researchGroupImages);
    } catch {
      this.toastService.showErrorKey('jobCreationForm.imageSection.loadImagesFailed');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AI GENERATION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generates a job description draft using AI.
   * Uses current form values as context for generation.
   * Shows "Generating..." initially, then displays partial content as it streams in.
   * After generation completes, the final content is force-updated to ensure correctness.
   */
  async generateJobApplicationDraft(): Promise<void> {
    const originalContent = this.basicInfoForm.get('jobDescription')?.value;
    const language = this.currentDescriptionLanguage();

    this.isGeneratingDraft.set(true);
    this.rewriteButtonSignal.set(true);
    this.isAutoScrolling = true;

    // Show "Generating" message in the editor while AI is working
    this.jobDescriptionEditor()?.forceUpdate(
      `<p><em>${this.translate.instant('jobCreationForm.positionDetailsSection.jobDescription.aiFillerText') as string}</em></p>`,
    );

    try {
      // Ensure background signals reflect the current editor before sending
      this.syncCurrentEditorIntoLanguageSignals();

      const request: JobFormDTO = {
        title: this.basicInfoForm.get('title')?.value ?? '',
        researchArea: this.basicInfoForm.get('researchArea')?.value ?? '',
        fieldOfStudies: this.basicInfoForm.get('fieldOfStudies')?.value?.value ?? '',
        supervisingProfessor: this.userId(),
        location: this.basicInfoForm.get('location')?.value?.value as JobFormDTO.LocationEnum,

        jobDescriptionEN: this.jobDescriptionEN() || '',
        jobDescriptionDE: this.jobDescriptionDE() || '',

        state: JobFormDTO.StateEnum.Draft,
      };
      this.autoScrollStreaming();

      // Use the AiStreamingService with live updates during streaming
      const accumulatedContent = await this.aiStreamingService.generateJobDescriptionStream(language, request, this.jobId(), content => {
        // Try to extract content from the partial JSON
        const extractedContent = this.extractJobDescriptionFromStream(content);
        this.jobDescriptionEditor()?.forceUpdate(
          extractedContent ??
            `<p><em>${this.translate.instant('jobCreationForm.positionDetailsSection.jobDescription.aiFillerText') as string}</em></p>`,
        );
      });
      this.isAutoScrolling = false;

      // Final update after streaming completes - parse the complete JSON
      if (accumulatedContent) {
        // Extract final content from complete JSON
        const finalContent = this.extractJobDescriptionFromStream(accumulatedContent);

        if (finalContent && finalContent.length > 0) {
          // Force update with the final, correctly parsed content
          this.basicInfoForm.get('jobDescription')?.setValue(finalContent);
          this.basicInfoForm.get('jobDescription')?.markAsDirty();
          this.jobDescriptionSignal.set(finalContent);
          this.jobDescriptionEditor()?.forceUpdate(finalContent);
          this.basicInfoValid.set(this.basicInfoForm.valid);

          // Persist to correct language bucket
          if (language === 'en') {
            this.jobDescriptionEN.set(finalContent);
          } else {
            this.jobDescriptionDE.set(finalContent);
          }

          // We need to fetch the translated version from the server
          await this.loadTranslatedDescription(language === 'en' ? 'de' : 'en');
        } else {
          // Extraction failed - show error and restore original content
          this.jobDescriptionEditor()?.forceUpdate(originalContent);
          this.toastService.showErrorKey('jobCreationForm.toastMessages.aiGenerationFailed');
        }
      }
    } catch (error) {
      this.jobDescriptionEditor()?.forceUpdate(originalContent);
      this.isAutoScrolling = false;
      // Show error toast with appropriate message
      if (error instanceof Error && error.message.includes('HTTP error')) {
        this.toastService.showErrorKey('jobCreationForm.toastMessages.aiGenerationFailed');
      } else {
        this.toastService.showErrorKey('jobCreationForm.toastMessages.saveFailed');
      }
    } finally {
      this.isAutoScrolling = false;
      this.isGeneratingDraft.set(false);
    }
  }

  /**
   * Extracts the jobDescription content from the AI response.
   * The AI returns JSON like: {"jobDescription":"<html content>"}
   * This method extracts the HTML content from the JSON wrapper.
   *
   * @param content The complete streamed content (should be valid JSON when complete)
   * @returns The extracted HTML content, or null if extraction fails
   */
  private extractJobDescriptionFromStream(content: string): string | null {
    if (!content || content.trim().length === 0) {
      return null;
    }

    const trimmed = content.trim();

    // Method 1: Try to parse as complete JSON (most reliable)
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.jobDescription && typeof parsed.jobDescription === 'string') {
        return parsed.jobDescription;
      }
    } catch {
      // JSON parsing failed, try manual extraction
    }

    // Method 2: Manual extraction from JSON structure
    // Look for the pattern: {"jobDescription":"<content>"}
    const startMarker = '"jobDescription"';
    const startIndex = trimmed.indexOf(startMarker);

    if (startIndex === -1) {
      // Not a JSON response, return as-is (might be plain HTML)
      return trimmed;
    }

    // Find the opening quote after the colon
    const colonIndex = trimmed.indexOf(':', startIndex);
    if (colonIndex === -1) return null;

    // Find the first quote after the colon (start of value)
    let valueStart = trimmed.indexOf('"', colonIndex + 1);
    if (valueStart === -1) return null;
    valueStart++; // Move past the opening quote

    // Find the closing quote - need to handle escaped quotes
    let valueEnd = valueStart;
    while (valueEnd < trimmed.length) {
      const char = trimmed[valueEnd];
      if (char === '\\') {
        // Skip escaped character
        valueEnd += 2;
      } else if (char === '"') {
        // Found the closing quote
        break;
      } else {
        valueEnd++;
      }
    }

    if (valueEnd >= trimmed.length) {
      // No closing quote found - incomplete JSON
      // Try to extract what we have
      let extracted = trimmed.substring(valueStart);
      // Remove trailing incomplete parts
      if (extracted.endsWith('"')) {
        extracted = extracted.slice(0, -1);
      }
      if (extracted.endsWith('"}')) {
        extracted = extracted.slice(0, -2);
      }
      // Unescape
      return this.unescapeJsonString(extracted);
    }

    // Extract the value between quotes
    const rawValue = trimmed.substring(valueStart, valueEnd);
    return this.unescapeJsonString(rawValue);
  }

  /**
   * Unescapes a JSON string value (handles \n, \r, \t, \", \\)
   */
  private unescapeJsonString(str: string): string {
    return str.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  /**
   * Loads the translated job description from the server after AI generation.
   * This is needed because the server translates asynchronously after streaming.
   * Uses retry logic with delay to wait for the translation to complete.
   *
   * @param targetLang The language to load ('en' or 'de')
   * @param maxRetries Maximum number of retry attempts (default: 5)
   * @param delayMs Delay between retries in milliseconds (default: 2000)
   */
  private async loadTranslatedDescription(targetLang: 'en' | 'de', maxRetries = 5, delayMs = 2000): Promise<void> {
    const jobId = this.jobId();
    if (!jobId) return;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Wait before checking (translation needs time to complete)
        await new Promise(resolve => setTimeout(resolve, delayMs));

        const job = await firstValueFrom(this.jobResourceService.getJobById(jobId));
        const translatedContent = targetLang === 'en' ? job.jobDescriptionEN : job.jobDescriptionDE;

        if (translatedContent && translatedContent.trim().length > 0) {
          // Translation found - update the signal
          if (targetLang === 'en') {
            this.jobDescriptionEN.set(translatedContent);
          } else {
            this.jobDescriptionDE.set(translatedContent);
          }
          return; // Success - exit
        }
        // Error translating, will retry
      } catch {
        // Error fetching job, will retry
      }
    }
  }
  /**
  * Automatically scrolls the editor to the bottom during AI streaming.
  * Runs every 200ms while isAutoScrolling is true.
*/
  private autoScrollStreaming(): void {
    const smoothScroll = (): void => {
      if (!this.isAutoScrolling) {
        return;
      }
      const editorContainer = document.querySelector('.ql-editor') as HTMLElement;
      editorContainer.scrollTo({
        top: editorContainer.scrollHeight,
        behavior: 'smooth',
      });
      setTimeout(() => requestAnimationFrame(smoothScroll), 200);
    };
    requestAnimationFrame(smoothScroll);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FORM CREATION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Creates the Step 1 form group with validation rules.
   * Required fields: title, research area, field of studies, location, job description
   */
  private createBasicInfoForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      researchArea: ['', [Validators.required]],
      fieldOfStudies: [undefined, [Validators.required]],
      location: [undefined, [Validators.required]],
      supervisingProfessor: [{ value: this.accountService.loadedUser()?.name ?? '' }, Validators.required],
      jobDescription: ['', [htmlTextRequiredValidator, htmlTextMaxLengthValidator(1500)]],
    });
  }

  /**
   * Creates the Step 2 form group for optional position details.
   * All fields are optional: funding type, start date, deadline, workload, duration
   */
  private createPositionDetailsForm(): FormGroup {
    return this.fb.group({
      // Position Details Form: Currently required for publishing a job
      fundingType: [undefined],
      startDate: [''],
      applicationDeadline: [''],
      workload: [undefined],
      contractDuration: [undefined],
    });
  }

  /**
   * Creates the Step 3 form group for image selection.
   */
  private createImageForm(): FormGroup {
    return this.fb.group({
      imageId: [undefined],
    });
  }

  /**
   * Creates the Step 4 form group for additional information.
   * Contains the required privacy consent checkbox.
   */
  private createAdditionalInfoForm(): FormGroup {
    return this.fb.group({
      privacyAccepted: [false, [Validators.required]],
    });
  }

  /**
   * Constructs a JobFormDTO from all form values.
   * Combines data from all steps into a single DTO for API submission.
   *
   * @param state - The job state ('DRAFT' or 'PUBLISHED')
   * @returns The complete job form DTO
   */
  private createJobDTO(state: JobFormDTO.StateEnum): JobFormDTO {
    const basicInfoValue = this.basicInfoForm.getRawValue();
    const positionDetailsValue = this.positionDetailsForm.getRawValue();
    const imageValue = this.imageForm.getRawValue();

    // Ensure current editor content is always included in the right language bucket
    const lang = this.currentDescriptionLanguage();
    const currentText = (basicInfoValue.jobDescription ?? '').trim();

    const jobDescriptionEN = lang === 'en' ? currentText : this.jobDescriptionEN();
    const jobDescriptionDE = lang === 'de' ? currentText : this.jobDescriptionDE();

    return {
      title: this.basicInfoForm.get('title')?.value ?? '',
      researchArea: basicInfoValue.researchArea?.trim() ?? '',
      fieldOfStudies: basicInfoValue.fieldOfStudies?.value !== undefined ? String(basicInfoValue.fieldOfStudies.value) : '',
      supervisingProfessor: this.userId(),
      location: basicInfoValue.location?.value as JobFormDTO.LocationEnum,

      jobDescriptionEN: jobDescriptionEN ?? undefined,
      jobDescriptionDE: jobDescriptionDE ?? undefined,

      startDate: positionDetailsValue.startDate ?? '',
      endDate: positionDetailsValue.applicationDeadline ?? '',
      workload: positionDetailsValue.workload,
      contractDuration: positionDetailsValue.contractDuration,
      fundingType: positionDetailsValue.fundingType?.value as JobFormDTO.FundingTypeEnum,
      imageId: imageValue.imageId ?? null,
      state,
    };
  }

  /**
   * Applies server-returned job data to local state.
   * Used after save operations to sync with server-side changes.
   *
   * @param saved - The job form DTO returned from the server
   */
  private applyServerJobForm(saved: JobFormDTO): void {
    // refresh local truth from server (important for autosave / server-side adjustments)
    this.jobDescriptionEN.set(saved.jobDescriptionEN ?? '');
    this.jobDescriptionDE.set(saved.jobDescriptionDE ?? '');
    this.lastSavedData.set(saved);

    // keep editor in sync with selected language (without triggering autosave loop)
    const lang = this.currentDescriptionLanguage();
    const content = lang === 'en' ? this.jobDescriptionEN() : this.jobDescriptionDE();
    this.basicInfoForm.get('jobDescription')?.setValue(content, { emitEvent: false });
    this.jobDescriptionSignal.set(content);
    this.jobDescriptionEditor()?.forceUpdate(content);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initializes the component based on the route.
   * - Validates user authentication
   * - Loads available images
   * - Determines mode (create/edit) from URL
   * - Fetches existing job data in edit mode
   */
  private async init(): Promise<void> {
    try {
      const userId = this.accountService.loadedUser()?.id ?? '';
      if (!userId) {
        this.router.navigate(['/login']);
        return;
      }
      this.userId.set(userId);

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

        // prevent autosave from firing immediately after patching
        this.autoSaveInitialized = false;
      }
    } catch {
      this.toastService.showErrorKey('toast.loadFailed');
      this.router.navigate(['/my-positions']);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Populates all forms with initial/existing job data.
   * Sets up dual-language description signals.
   *
   * @param job - Optional existing job data (undefined for create mode)
   */
  private populateForm(job?: JobDTO): void {
    const user = this.accountService.loadedUser();

    // Default tab EN
    this.currentDescriptionLanguage.set('en');

    const en = job?.jobDescriptionEN ?? '';
    const de = job?.jobDescriptionDE ?? '';

    this.jobDescriptionEN.set(en);
    this.jobDescriptionDE.set(de);

    this.basicInfoForm.patchValue({
      title: job?.title ?? '',
      researchArea: job?.researchArea ?? '',
      supervisingProfessor: user?.name,
      fieldOfStudies: this.findDropdownOption(DropdownOptions.fieldsOfStudies, job?.fieldOfStudies),
      location: this.findDropdownOption(DropdownOptions.locations, job?.location),
      jobDescription: en,
    });

    this.jobDescriptionSignal.set(en);
    this.jobDescriptionEditor()?.forceUpdate(en);

    this.positionDetailsForm.patchValue({
      startDate: job?.startDate ?? '',
      applicationDeadline: job?.endDate ?? '',
      workload: job?.workload ?? undefined,
      contractDuration: job?.contractDuration ?? undefined,
      fundingType: this.findDropdownOption(DropdownOptions.fundingTypes, job?.fundingType),
    });

    if (job?.imageId !== undefined && job.imageUrl !== undefined) {
      this.imageForm.patchValue({ imageId: job.imageId });

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

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO-SAVE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sets up the auto-save effect with 3-second debounce.
   * Triggers save when any form value changes.
   * Skips during initial population and AI generation.
   */
  private setupAutoSave(): void {
    effect(() => {
      const description = this.basicInfoForm.get('jobDescription')?.value ?? '';

      this.basicInfoFormValueSignal();
      this.positionDetailsFormValueSignal();
      this.imageFormValueSignal();

      if (!this.autoSaveInitialized) {
        this.autoSaveInitialized = true;
        return;
      }

      if (this.isGeneratingDraft()) {
        return;
      }

      this.jobDescriptionSignal.set(description);

      this.clearAutoSaveTimer();
      this.savingState.set('SAVING');

      this.autoSaveTimer = window.setTimeout(() => {
        this.syncCurrentEditorIntoLanguageSignals();
        void this.performAutoSave();
      }, 3000);
    });
  }

  /**
   * Clears any pending auto-save timer.
   */
  private clearAutoSaveTimer(): void {
    if (this.autoSaveTimer !== undefined) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  /**
   * Performs the actual auto-save operation.
   * Creates job on first save, updates on subsequent saves.
   * Triggers translation after successful save if content changed.
   */
  private async performAutoSave(): Promise<void> {
    const currentLang = this.currentDescriptionLanguage();
    const description = this.basicInfoForm.get('jobDescription')?.value ?? '';
    const currentData = this.createJobDTO('DRAFT');

    try {
      let saved: JobFormDTO;

      if (this.jobId()) {
        saved = await firstValueFrom(this.jobResourceService.updateJob(this.jobId(), currentData));
      } else {
        saved = await firstValueFrom(this.jobResourceService.createJob(currentData));
        this.jobId.set(saved.jobId ?? '');
      }

      // refresh local truth from server
      this.lastSavedData.set(saved);
      this.jobDescriptionEN.set(saved.jobDescriptionEN ?? this.jobDescriptionEN());
      this.jobDescriptionDE.set(saved.jobDescriptionDE ?? this.jobDescriptionDE());

      this.savingState.set('SAVED');

      // fire-and-forget translation (don't block autosave UX)
      void this.translateAndStoreOtherLanguage(currentLang, description);
    } catch {
      this.savingState.set('FAILED');
      this.toastService.showErrorKey('toast.saveFailed');
    }
  }

  private async translateAndStoreOtherLanguage(currentLang: Language, currentText: string): Promise<void> {
    const jobId = this.jobId();
    const text = currentText.trim();
    if (!jobId || !text) return;

    const lastBaseline = currentLang === 'en' ? this.lastTranslatedEN() : this.lastTranslatedDE();
    if (text === lastBaseline) return;

    if (this.isTranslating()) return;

    const targetLang: Language = currentLang === 'en' ? 'de' : 'en';

    this.isTranslating.set(true);
    try {
      const response = await firstValueFrom(this.aiService.translateJobDescriptionForJob(jobId, targetLang, text));

      const translatedText = (response.translatedText ?? '').trim();
      if (!translatedText) return;

      // Update local hidden language signals only (no editor update)
      if (targetLang === 'en') {
        this.jobDescriptionEN.set(translatedText);
        this.lastTranslatedEN.set(translatedText);
        this.lastTranslatedDE.set(text);
      } else {
        this.jobDescriptionDE.set(translatedText);
        this.lastTranslatedDE.set(translatedText);
        this.lastTranslatedEN.set(text);
      }

      // Keep lastSavedData in sync so hasUnsavedChanges stays stable
      const lastSaved = this.lastSavedData();
      if (lastSaved) {
        this.lastSavedData.set({
          title: lastSaved.title,
          researchArea: lastSaved.researchArea,
          fieldOfStudies: lastSaved.fieldOfStudies,
          supervisingProfessor: lastSaved.supervisingProfessor,
          location: lastSaved.location,

          jobDescriptionEN: this.jobDescriptionEN() || undefined,
          jobDescriptionDE: this.jobDescriptionDE() || undefined,

          startDate: lastSaved.startDate,
          endDate: lastSaved.endDate,
          workload: lastSaved.workload,
          contractDuration: lastSaved.contractDuration,
          fundingType: lastSaved.fundingType,
          imageId: lastSaved.imageId,
          state: lastSaved.state,
          jobId: lastSaved.jobId,
        });
      }
    } catch {
      this.toastService.showErrorKey('jobCreationForm.toastMessages.aiTranslationFailed');
    } finally {
      this.isTranslating.set(false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEPPER CONFIGURATION BUILDER
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Builds the configuration array for the progress stepper component.
   * Defines 4 steps with their templates, navigation buttons, and validation states:
   *
   * 1. Basic Info - Back exits, Next requires basicInfoValid
   * 2. Position Details - Optional fields, always navigable
   * 3. Image Selection - Optional, always navigable
   * 4. Summary - Shows publish button instead of next
   *
   * @returns Array of StepData objects for the ProgressStepperComponent
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
            onClick: () => {
              void this.onStepChange();
            },
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
            disabled: false,
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
            onClick: () => this.sendPublishDialog()?.confirm(),
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

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Gets the dimensions of an image file before upload.
   * Used for validation against MAX_IMAGE_DIMENSION_PX.
   *
   * @param file - The image file to measure
   * @returns Promise resolving to width and height in pixels
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      img.src = objectUrl;
    });
  }

  /**
   * Finds a dropdown option by its value.
   * Used to pre-select dropdown values when editing existing jobs.
   *
   * @param options - Array of dropdown options
   * @param value - The value to find
   * @returns The matching option or undefined
   */
  private findDropdownOption<T extends { value: unknown }>(options: T[], value: unknown): T | undefined {
    return options.find(opt => opt.value === value);
  }
}
