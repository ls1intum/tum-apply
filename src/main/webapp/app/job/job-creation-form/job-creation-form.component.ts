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
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { JobFormDTO } from 'app/generated/model/jobFormDTO';
import { JobDTO } from 'app/generated/model/jobDTO';
import { ImageResourceApiService } from 'app/generated/api/imageResourceApi.service';
import { ImageDTO } from 'app/generated/model/imageDTO';

import { JobDetailComponent } from '../job-detail/job-detail.component';
import * as DropdownOptions from '.././dropdown-options';

type JobFormMode = 'create' | 'edit';

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

  readonly publishButtonSeverity = 'primary' as ButtonColor;
  readonly publishButtonIcon = 'paper-plane';

  // Mode / meta
  mode = signal<JobFormMode>('create');
  jobId = signal<string>('');
  userId = signal<string>('');
  isLoading = signal<boolean>(true);

  // Saving state
  savingState = signal<SavingState>(SavingStates.SAVED);
  lastSavedData = signal<JobFormDTO | undefined>(undefined);
  publishAttempted = signal<boolean>(false);

  // Job description UI (single editor)
  jobDescriptionSignal = signal<string>('');
  currentDescriptionLanguage = signal<Language>('en');

  // Store both language versions always
  jobDescriptionEN = signal<string>('');
  jobDescriptionDE = signal<string>('');

  // Translation bookkeeping
  isTranslating = signal<boolean>(false);
  lastTranslatedEN = signal<string>('');
  lastTranslatedDE = signal<string>('');

  // AI
  isGeneratingDraft = signal<boolean>(false);
  aiToggleSignal = signal<boolean>(true);
  rewriteButtonSignal = signal<boolean>(false);
  showAiPanel = computed(() => this.aiToggleSignal());
  templateText = computed(() => this.translate.instant('jobCreationForm.positionDetailsSection.jobDescription.template'));

  // Image upload state
  defaultImages = signal<ImageDTO[]>([]);
  researchGroupImages = signal<ImageDTO[]>([]);
  selectedImage = signal<ImageDTO | undefined>(undefined);
  isUploadingImage = signal<boolean>(false);

  hasCustomImage = computed(() => {
    const image = this.selectedImage();
    return image !== undefined && image.imageType !== 'DEFAULT_JOB_BANNER';
  });

  uploadContainerClasses = computed(() => {
    if (this.isUploadingImage()) {
      return 'relative rounded-lg transition-all opacity-50 pointer-events-none';
    }
    return 'relative rounded-lg transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1';
  });

  uploadInnerClasses = computed(() => {
    const base = 'aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all';
    const hover = !this.isUploadingImage() ? 'hover:border-primary hover:bg-background-surface-alt' : '';
    return `${base} border-border-default ${hover}`.trim();
  });

  // DI
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
  jobDescriptionEditor = viewChild<EditorComponent>('jobDescriptionEditor');

  // Validity
  basicInfoValid = signal(false);
  positionDetailsValid = signal(false);
  allFormsValid = computed(() => this.basicInfoValid() && this.positionDetailsValid());
  imageSelected = computed(() => this.selectedImage() !== undefined);

  // Signals from form changes
  basicInfoChanges = toSignal(this.basicInfoForm.statusChanges, { initialValue: this.basicInfoForm.status });
  positionDetailsChanges = toSignal(this.positionDetailsForm.statusChanges, { initialValue: this.positionDetailsForm.status });

  privacyAcceptedSignal = toSignal(this.additionalInfoForm.controls['privacyAccepted'].valueChanges, {
    initialValue: this.additionalInfoForm.controls['privacyAccepted'].value,
  });

  formValidationEffect = effect(() => {
    this.basicInfoChanges();
    this.positionDetailsChanges();
    this.jobDescriptionSignal();

    this.basicInfoValid.set(this.basicInfoForm.valid);
    this.positionDetailsValid.set(this.positionDetailsForm.valid);
  });

  publishableJobData = computed<JobFormDTO | undefined>(() => (this.allFormsValid() ? this.createJobDTO('PUBLISHED') : undefined));

  hasUnsavedChanges = computed(() => {
    const current = this.currentJobData();
    const lastSaved = this.lastSavedData();
    return JSON.stringify(current) !== JSON.stringify(lastSaved);
  });

  readonly pageTitle = computed(() =>
    this.mode() === 'edit' ? 'jobCreationForm.header.title.edit' : 'jobCreationForm.header.title.create',
  );

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

  // Step config
  readonly stepData = computed<StepData[]>(() => this.buildStepData());

  // Helpers for translation toggles
  segmentValueForLang(lang: Language): SegmentedToggleValue {
    return lang === 'en' ? 'left' : 'right';
  }

  langForSegmentValue(v: SegmentedToggleValue): Language {
    return v === 'left' ? 'en' : 'de';
  }

  // Dropdown translate signals
  currentLang = toSignal(this.translate.onLangChange);

  translatedFieldsOfStudies = computed(() => {
    void this.currentLang();
    return DropdownOptions.fieldsOfStudies
      .map(option => ({ value: option.value, name: this.translate.instant(option.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  translatedLocations = computed(() => {
    void this.currentLang();
    return DropdownOptions.locations
      .map(option => ({ value: option.value, name: this.translate.instant(option.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  translatedFundingTypes = computed(() => {
    void this.currentLang();
    return DropdownOptions.fundingTypes
      .map(option => ({ value: option.value, name: this.translate.instant(option.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // Data computation
  basicInfoFormValueSignal = toSignal(this.basicInfoForm.valueChanges, {
    initialValue: this.basicInfoForm.getRawValue(),
  });
  positionDetailsFormValueSignal = toSignal(this.positionDetailsForm.valueChanges, {
    initialValue: this.positionDetailsForm.getRawValue(),
  });
  imageFormValueSignal = toSignal(this.imageForm.valueChanges, {
    initialValue: this.imageForm.getRawValue(),
  });

  currentJobData = computed<JobFormDTO>(() => {
    this.basicInfoFormValueSignal();
    this.positionDetailsFormValueSignal();
    this.imageFormValueSignal();
    return this.createJobDTO('DRAFT');
  });

  // Autosave
  private autoSaveTimer: number | undefined;
  private autoSaveInitialized = false;

  // Allowed image file types for upload
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
  readonly acceptedImageTypes = this.ALLOWED_IMAGE_TYPES.join(',');
  private readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  private readonly MAX_IMAGE_DIMENSION_PX = 4096;

  constructor() {
    this.init();
    this.setupAutoSave();
  }

  // ---------------------------
  // Language switching
  // ---------------------------

  async changeDescriptionLanguage(newLang: Language): Promise<void> {
    const currentLang = this.currentDescriptionLanguage();
    if (newLang === currentLang || this.isTranslating()) return;

    // If a save is pending, flush it first so we don't lose text
    if (this.autoSaveTimer !== undefined) {
      this.clearAutoSaveTimer();
      this.syncCurrentEditorIntoLanguageSignals();
      await this.performAutoSave();
    }

    // Wait for translation if one is still running (defensive)
    if (this.isTranslating()) {
      await new Promise<void>(resolve => {
        const interval = setInterval(() => {
          if (!this.isTranslating()) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    }

    this.currentDescriptionLanguage.set(newLang);
  }

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
   * Updates editor when language changes (loads the stored EN/DE version)
   */
  languageChangeEffect = effect(() => {
    const newLanguage = this.currentDescriptionLanguage();
    if (!this.autoSaveInitialized) return;

    const targetContent = newLanguage === 'en' ? this.jobDescriptionEN() : this.jobDescriptionDE();

    this.basicInfoForm.get('jobDescription')?.setValue(targetContent, { emitEvent: false });
    this.jobDescriptionSignal.set(targetContent);
    this.jobDescriptionEditor()?.forceUpdate(targetContent);
  });

  // ---------------------------
  // Translation
  // ---------------------------

  private async translateJobDescription(text: string, fromLang: Language, toLang: Language): Promise<void> {
    if (!text || text.trim().length === 0) return;

    this.isTranslating.set(true);
    try {
      const response = await firstValueFrom(this.aiService.translateText(text));
      const translatedText = response.translatedText ?? '';

      if (translatedText) {
        if (toLang === 'en') {
          this.jobDescriptionEN.set(translatedText);
          this.lastTranslatedEN.set(translatedText);
          this.lastTranslatedDE.set(text);
        } else {
          this.jobDescriptionDE.set(translatedText);
          this.lastTranslatedDE.set(translatedText);
          this.lastTranslatedEN.set(text);
        }

        // Only touch the editor if user is currently on that target language
        if (this.currentDescriptionLanguage() === toLang) {
          this.basicInfoForm.get('jobDescription')?.setValue(translatedText, { emitEvent: false });
          this.jobDescriptionSignal.set(translatedText);
          this.jobDescriptionEditor()?.forceUpdate(translatedText);
        }
      }
    } catch {
      this.toastService.showErrorKey('jobCreationForm.toastMessages.translationFailed');
    } finally {
      this.isTranslating.set(false);
    }
  }

  // ---------------------------
  // AI toggle template behavior (unchanged)
  // ---------------------------

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

  // ---------------------------
  // Publish
  // ---------------------------

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

  onBack(): void {
    this.location.back();
  }

  // ---------------------------
  // Images
  // ---------------------------

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

  selectImage(image: ImageDTO): void {
    this.selectedImage.set(image);
    this.imageForm.patchValue({ imageId: image.imageId });
  }

  clearImageSelection(): void {
    this.selectedImage.set(undefined);
    this.imageForm.patchValue({ imageId: null });
  }

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

  async deleteSelectedImage(): Promise<void> {
    await this.deleteImage(this.selectedImage()?.imageId);
  }

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

  // ---------------------------
  // AI generation (language-aware)
  // ---------------------------

  async generateJobApplicationDraft(): Promise<void> {
    const ctrl = this.basicInfoForm.get('jobDescription');
    const lang = this.currentDescriptionLanguage();

    this.isGeneratingDraft.set(true);
    this.rewriteButtonSignal.set(true);

    const originalContent = ctrl?.value;

    this.jobDescriptionEditor()?.forceUpdate(
      `<p><em>${this.translate.instant('jobCreationForm.positionDetailsSection.jobDescription.aiFillerText') as string}</em></p>`,
    );

    try {
      // Ensure background signals reflect current editor before sending
      this.syncCurrentEditorIntoLanguageSignals();

      // IMPORTANT: send language info so backend selects EN/DE prompt input
      // Assumes JobFormDTO now has a field like descriptionLanguage (string enum 'en'|'de')
      const request: JobFormDTO = {
        title: this.basicInfoForm.get('title')?.value ?? '',
        researchArea: this.basicInfoForm.get('researchArea')?.value ?? '',
        fieldOfStudies: this.basicInfoForm.get('fieldOfStudies')?.value?.value ?? '',
        supervisingProfessor: this.userId(),
        location: this.basicInfoForm.get('location')?.value?.value as JobFormDTO.LocationEnum,

        jobDescriptionEN: this.jobDescriptionEN() || undefined,
        jobDescriptionDE: this.jobDescriptionDE() || undefined,

        state: JobFormDTO.StateEnum.Draft,
      };

      const response = await firstValueFrom(this.aiService.generateJobApplicationDraft(lang, request));

      if (response.jobDescription) {
        // Update current editor
        this.basicInfoForm.get('jobDescription')?.setValue(response.jobDescription);
        this.basicInfoForm.get('jobDescription')?.markAsDirty();
        this.jobDescriptionSignal.set(response.jobDescription);
        this.jobDescriptionEditor()?.forceUpdate(response.jobDescription);
        this.basicInfoValid.set(this.basicInfoForm.valid);

        // Persist to correct language bucket
        if (lang === 'en') {
          this.jobDescriptionEN.set(response.jobDescription);
        } else {
          this.jobDescriptionDE.set(response.jobDescription);
        }
      }
    } catch {
      this.jobDescriptionEditor()?.forceUpdate(originalContent);
      this.toastService.showErrorKey('jobCreationForm.toastMessages.saveFailed');
    } finally {
      this.isGeneratingDraft.set(false);
    }
  }

  // ---------------------------
  // Forms
  // ---------------------------

  private createBasicInfoForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      researchArea: ['', [Validators.required]],
      fieldOfStudies: [undefined, [Validators.required]],
      location: [undefined, [Validators.required]],
      supervisingProfessor: [{ value: this.accountService.loadedUser()?.name ?? '' }, Validators.required],

      // single editor control
      jobDescription: ['', [htmlTextRequiredValidator, htmlTextMaxLengthValidator(1500)]],
    });
  }

  private createPositionDetailsForm(): FormGroup {
    return this.fb.group({
      fundingType: [undefined],
      startDate: [''],
      applicationDeadline: [''],
      workload: [undefined],
      contractDuration: [undefined],
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

  // ---------------------------
  // Init / populate
  // ---------------------------

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

    // store baseline lastSaved as DTO
    this.lastSavedData.set(this.createJobDTO('DRAFT'));
  }

  // ---------------------------
  // Autosave
  // ---------------------------

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

  private clearAutoSaveTimer(): void {
    if (this.autoSaveTimer !== undefined) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  private async performAutoSave(): Promise<void> {
    const currentLang = this.currentDescriptionLanguage();
    const description = this.basicInfoForm.get('jobDescription')?.value ?? '';

    // build dto after syncing signals (so EN/DE are correct)
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

      // Trigger translation only if changed since last baseline
      const lastBaseline = currentLang === 'en' ? this.lastTranslatedEN() : this.lastTranslatedDE();

      if (Boolean(description.trim()) && description !== lastBaseline) {
        const targetLang: Language = currentLang === 'en' ? 'de' : 'en';
        await this.translateJobDescription(description, currentLang, targetLang);
      }
    } catch {
      this.savingState.set('FAILED');
      this.toastService.showErrorKey('toast.saveFailed');
    }
  }

  // ---------------------------
  // Stepper
  // ---------------------------

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

  // ---------------------------
  // Helpers
  // ---------------------------

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

  private findDropdownOption<T extends { value: unknown }>(options: T[], value: unknown): T | undefined {
    return options.find(opt => opt.value === value);
  }
}
