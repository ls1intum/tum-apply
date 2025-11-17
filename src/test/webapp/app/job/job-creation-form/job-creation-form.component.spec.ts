import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { of, throwError, Subject } from 'rxjs';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { Location } from '@angular/common';
import { signal, TemplateRef } from '@angular/core';

import { JobCreationFormComponent } from 'app/job/job-creation-form/job-creation-form.component';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { ImageResourceApiService } from 'app/generated/api/imageResourceApi.service';
import { User } from 'app/core/auth/account.service';
import { JobFormDTO } from 'app/generated/model/jobFormDTO';
import { JobDTO } from 'app/generated/model/jobDTO';
import { ImageDTO } from 'app/generated/model/imageDTO';
import * as DropdownOptions from 'app/job/dropdown-options';

import { provideTranslateMock } from '../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../util/fontawesome.testing';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';
import { createRouterMock, provideRouterMock } from '../../../util/router.mock';

interface Step {
  name: string;
  disabled?: boolean;
  buttonGroupPrev?: { onClick: () => void }[];
  buttonGroupNext?: { onClick: () => void; disabled?: boolean }[];
}

// Helper functions
function fillValidJobForm(component: JobCreationFormComponent) {
  component.basicInfoForm.patchValue({
    title: 'T',
    researchArea: 'AI',
    fieldOfStudies: { value: 'CS' },
    location: { value: 'MUNICH' },
    supervisingProfessor: 'Prof',
  });
  component.positionDetailsForm.patchValue({
    description: 'desc',
    tasks: 'tasks',
    requirements: 'reqs',
  });
  component.additionalInfoForm.patchValue({ privacyAccepted: true });

  component.basicInfoForm.updateValueAndValidity();
  component.positionDetailsForm.updateValueAndValidity();
}

function createMockFile(name: string, type: string, size: number): File {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function createMockFileEvent(file: File): Event {
  const mockInput = document.createElement('input');
  Object.defineProperty(mockInput, 'files', {
    value: [file],
    writable: false,
  });
  return { target: mockInput } as unknown as Event;
}

function mockPanelTemplates(component: JobCreationFormComponent) {
  (component as { panel1: () => object }).panel1 = () => ({});
  (component as { panel2: () => object }).panel2 = () => ({});
  (component as { panel4: () => object }).panel4 = () => ({});
  (component as { savingStatePanel: () => object }).savingStatePanel = () => ({});
}

describe('JobCreationFormComponent', () => {
  let fixture: ComponentFixture<JobCreationFormComponent>;
  let component: JobCreationFormComponent;
  let jobService: {
    getJobById: ReturnType<typeof vi.fn>;
    createJob: ReturnType<typeof vi.fn>;
    updateJob: ReturnType<typeof vi.fn>;
  };
  let imageService: {
    getDefaultJobBanners: ReturnType<typeof vi.fn>;
    uploadJobBanner: ReturnType<typeof vi.fn>;
    deleteImage: ReturnType<typeof vi.fn>;
  };
  let mockAccountService: ReturnType<typeof createAccountServiceMock>;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockRouter: ReturnType<typeof createRouterMock>;
  let location: Pick<Location, 'back'>;
  let route$: Subject<UrlSegment[]>;

  beforeEach(async () => {
    jobService = {
      getJobById: vi.fn().mockReturnValue(of({ title: 'Loaded Job', description: 'Desc' })),
      createJob: vi.fn().mockReturnValue(of({ jobId: 'new123' })),
      updateJob: vi.fn().mockReturnValue(of({})),
    };

    imageService = {
      getDefaultJobBanners: vi.fn().mockReturnValue(of([])),
      uploadJobBanner: vi.fn().mockReturnValue(of({ imageId: 'img123', url: '/images/test.jpg', imageType: 'JOB_BANNER' })),
      deleteImage: vi.fn().mockReturnValue(of({})),
    };

    mockAccountService = createAccountServiceMock();
    mockAccountService.user.set({ id: 'u1', name: 'Test User' } as User);
    mockToastService = createToastServiceMock();
    mockRouter = createRouterMock();
    location = { back: vi.fn() };
    route$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [JobCreationFormComponent],
      providers: [
        { provide: JobResourceApiService, useValue: jobService },
        { provide: ImageResourceApiService, useValue: imageService },
        { provide: Location, useValue: location },
        { provide: ActivatedRoute, useValue: { url: route$, snapshot: { paramMap: new Map() } } },
        provideAccountServiceMock(mockAccountService),
        provideToastServiceMock(mockToastService),
        provideRouterMock(mockRouter),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    })
      .overrideComponent(JobCreationFormComponent, {
        remove: { providers: [JobResourceApiService, ImageResourceApiService] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(JobCreationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture?.destroy();
  });

  describe('Component Initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should set mode to create by default', () => {
      expect(component.mode()).toBe('create');
    });

    it('should set userId from loaded user', () => {
      expect(component.userId()).toBe('u1');
    });

    it('should initialize in create mode and populate form', async () => {
      route$.next([new UrlSegment('job', {}), new UrlSegment('create', {})]);
      const fixture2 = TestBed.createComponent(JobCreationFormComponent);
      fixture2.detectChanges();
      await fixture2.whenStable();

      expect(fixture2.componentInstance.mode()).toBe('create');
      expect(imageService.getDefaultJobBanners).toHaveBeenCalled();
    });

    it('should navigate to /my-positions if edit mode but no jobId', async () => {
      route$.next([new UrlSegment('job', {}), new UrlSegment('edit', {})]);
      const routeMock = TestBed.inject(ActivatedRoute) as unknown as {
        url: Subject<UrlSegment[]>;
        snapshot: { paramMap: { get: (key: string) => string | null } };
      };
      routeMock.snapshot.paramMap = { get: () => null };

      const fixture2 = TestBed.createComponent(JobCreationFormComponent);
      fixture2.detectChanges();
      await fixture2.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-positions']);
    });

    it('should handle init error by showing toast and navigating', async () => {
      const routeMock = TestBed.inject(ActivatedRoute) as ActivatedRoute;
      routeMock.url = of([new UrlSegment('job', {}), new UrlSegment('create', {})]);
      imageService.getDefaultJobBanners.mockReturnValueOnce(throwError(() => new Error('fail')));

      const fixture2 = TestBed.createComponent(JobCreationFormComponent);
      fixture2.detectChanges();
      await fixture2.whenStable();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.loadImagesFailed');
    });
  });

  describe('Mode and Page Title', () => {
    it('should compute pageTitle based on mode', () => {
      component.mode.set('create');
      expect(component.pageTitle()).toContain('create');

      component.mode.set('edit');
      expect(component.pageTitle()).toContain('edit');
    });

    it('should display correct page title based on mode', () => {
      component.mode.set('create');
      expect(component.pageTitle()).toContain('create');

      component.mode.set('edit');
      expect(component.pageTitle()).toContain('edit');
    });
  });

  describe('Navigation', () => {
    it('should call Location.back on onBack', () => {
      component.onBack();
      expect(location.back).toHaveBeenCalled();
    });
  });

  describe('Auto-Save and Saving State', () => {
    it('should detect unsaved changes', () => {
      const last = component.lastSavedData();
      component.basicInfoForm.patchValue({ title: 'changed' });
      expect(component.hasUnsavedChanges()).toBe(true);
      component.basicInfoForm.patchValue({ title: last?.title });
    });

    it('should detect hasUnsavedChanges when form changes', () => {
      const initialData = component.currentJobData();
      component.lastSavedData.set(initialData);
      expect(component.hasUnsavedChanges()).toBe(false);

      component.basicInfoForm.patchValue({ title: 'Modified Title' });
      fixture.detectChanges();

      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('should set savingState to FAILED when autoSave fails', async () => {
      vi.spyOn(jobService, 'updateJob').mockReturnValueOnce(throwError(() => new Error('fail')));
      component.jobId.set('id123');
      await (component as unknown as { performAutoSave: () => Promise<void> }).performAutoSave();

      expect(component.savingState()).toBe('FAILED');
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('toast.saveFailed');
    });

    it('should compute savingBadgeCalculatedClass correctly', () => {
      component.savingState.set('SAVED');
      expect(component.savingBadgeCalculatedClass()).toContain('saved_color');

      component.savingState.set('FAILED');
      expect(component.savingBadgeCalculatedClass()).toContain('failed_color');

      component.savingState.set('SAVING');
      expect(component.savingBadgeCalculatedClass()).toContain('saving_color');
    });

    it('should set jobId after creating a new job', async () => {
      jobService.createJob.mockReturnValueOnce(of({ jobId: 'abc123' }));
      component.jobId.set('');
      await (component as unknown as { performAutoSave: () => Promise<void> }).performAutoSave();

      expect(component.jobId()).toBe('abc123');
      expect(jobService.createJob).toHaveBeenCalled();
    });

    it('should call updateJob when jobId is set in performAutoSave', async () => {
      component.jobId.set('job123');
      await (component as unknown as { performAutoSave: () => Promise<void> }).performAutoSave();

      expect(jobService.updateJob).toHaveBeenCalledWith('job123', expect.any(Object));
    });

    it('should clear autoSaveTimer if set', () => {
      const spy = vi.spyOn(global, 'clearTimeout');
      (component as unknown as { autoSaveTimer: number | undefined }).autoSaveTimer = 123;
      (component as unknown as { clearAutoSaveTimer: () => void }).clearAutoSaveTimer();

      expect(spy).toHaveBeenCalledWith(123);
      expect((component as unknown as { autoSaveTimer?: number }).autoSaveTimer).toBeUndefined();
    });

    it('should trigger performAutoSave from setupAutoSave effect', async () => {
      vi.useFakeTimers();
      const spy = vi.spyOn(component as unknown as { performAutoSave: () => Promise<void> }, 'performAutoSave').mockResolvedValue();
      (component as unknown as { autoSaveInitialized: boolean }).autoSaveInitialized = true;

      component.basicInfoForm.patchValue({ title: 'new title' });
      vi.runAllTimers();
      await Promise.resolve();

      expect(spy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Job Publishing', () => {
    it('should show error if privacy not accepted on publish', async () => {
      component.additionalInfoForm.patchValue({ privacyAccepted: false });
      await component.publishJob();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('privacy.privacyConsent.toastError');
    });

    it('should publish successfully and navigate', async () => {
      fillValidJobForm(component);
      fixture.detectChanges();
      component.jobId.set('id123');

      await component.publishJob();

      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('toast.published');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-positions']);
    });

    it('should handle publishJob failure', async () => {
      jobService.updateJob.mockReturnValueOnce(throwError(() => new Error('fail')));
      fillValidJobForm(component);
      fixture.detectChanges();
      component.jobId.set('id123');

      await component.publishJob();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('toast.publishFailed');
    });

    it('should return early in publishJob when jobData is undefined', async () => {
      component.additionalInfoForm.patchValue({ privacyAccepted: true });
      component.basicInfoForm.patchValue({ title: '' });
      component.positionDetailsForm.patchValue({ description: '' });

      await component.publishJob();

      expect(mockToastService.showSuccessKey).not.toHaveBeenCalled();
      expect(mockToastService.showErrorKey).not.toHaveBeenCalled();
    });
  });

  describe('Job Loading and Form Population', () => {
    it('should enter edit mode and call getJobById when jobId is present', async () => {
      jobService.getJobById.mockReturnValueOnce(
        of({
          jobId: 'job123',
          title: 'JobX',
          description: 'Desc',
          imageId: 'img1',
          imageUrl: '/images/test.jpg',
        }),
      );

      component.jobId.set('job123');
      component.mode.set('edit');

      const job = await vi.waitFor(() => jobService.getJobById('job123'));
      expect(job).toBeDefined();
      expect(jobService.getJobById).toHaveBeenCalledWith('job123');
    });

    it('should populate fundingType when job has it', () => {
      const job: JobDTO = {
        jobId: 'job1',
        state: 'DRAFT',
        title: 'Job',
        researchArea: 'R',
        description: 'D',
        tasks: 'T',
        requirements: 'Q',
        supervisingProfessor: 'Prof',
        fundingType: DropdownOptions.fundingTypes[0].value,
      };

      const populateForm = (component as unknown as { populateForm: (job: JobDTO) => void }).populateForm;
      populateForm.call(component, job);
      expect(component.basicInfoForm.get('fundingType')?.value).toEqual(DropdownOptions.fundingTypes[0]);
    });

    it('should populate form with job image data as default banner', () => {
      const job: JobDTO = {
        title: 'Test Job',
        imageId: 'img123',
        imageUrl: '/images/test.jpg',
      } as JobDTO;

      component.defaultImages.set([{ imageId: 'img123', url: '/images/test.jpg', imageType: 'DEFAULT_JOB_BANNER' }]);

      const populateForm = (component as unknown as { populateForm: (job: JobDTO) => void }).populateForm;
      populateForm.call(component, job);

      expect(component.selectedImage()?.imageId).toBe('img123');
      expect(component.selectedImage()?.imageType).toBe('DEFAULT_JOB_BANNER');
    });

    it('should populate form with custom (non-default) job image', () => {
      const job: JobDTO = {
        title: 'Test Job',
        imageId: 'custom123',
        imageUrl: '/images/custom.jpg',
      } as JobDTO;

      component.defaultImages.set([{ imageId: 'default1', url: '/images/default.jpg', imageType: 'DEFAULT_JOB_BANNER' }]);

      const populateForm = (component as unknown as { populateForm: (job: JobDTO) => void }).populateForm;
      populateForm.call(component, job);

      expect(component.selectedImage()?.imageId).toBe('custom123');
      expect(component.selectedImage()?.imageType).toBe('JOB_BANNER');
    });
  });

  describe('Image Upload and Selection', () => {
    beforeEach(() => {
      // Mock getImageDimensions for image upload tests
      vi.spyOn(
        component as unknown as { getImageDimensions: (file: File) => Promise<{ width: number; height: number }> },
        'getImageDimensions',
      ).mockResolvedValue({ width: 1920, height: 1080 });
    });

    it('should upload image successfully', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024); // 1MB
      const mockEvent = createMockFileEvent(file);
      const mockImage: ImageDTO = { imageId: 'uploaded123', url: '/images/uploaded.jpg', imageType: 'JOB_BANNER' };
      imageService.uploadJobBanner.mockReturnValueOnce(of(mockImage));

      await component.onImageSelected(mockEvent);

      expect(component.selectedImage()).toEqual(mockImage);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('jobCreationForm.imageSection.uploadSuccess');
      expect(component.isUploadingImage()).toBe(false);
      expect((mockEvent.target as HTMLInputElement).value).toBe('');
    });

    it('should reject file that is too large', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 6 * 1024 * 1024); // 6MB
      const mockEvent = createMockFileEvent(file);

      await component.onImageSelected(mockEvent);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.fileTooLarge');
      expect(imageService.uploadJobBanner).not.toHaveBeenCalled();
    });

    it('should reject invalid file type', async () => {
      const file = createMockFile('test.svg', 'image/svg+xml', 1024);
      const mockEvent = createMockFileEvent(file);

      await component.onImageSelected(mockEvent);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.invalidFileType');
      expect(imageService.uploadJobBanner).not.toHaveBeenCalled();
    });

    it('should reject image with dimensions too large', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      const mockEvent = createMockFileEvent(file);
      const getImageDimensions = vi.spyOn(
        component as unknown as { getImageDimensions: (file: File) => Promise<{ width: number; height: number }> },
        'getImageDimensions',
      );
      getImageDimensions.mockResolvedValueOnce({ width: 5000, height: 5000 });

      await component.onImageSelected(mockEvent);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.dimensionsTooLarge');
      expect(imageService.uploadJobBanner).not.toHaveBeenCalled();
    });

    it('should handle invalid image file', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      const mockEvent = createMockFileEvent(file);
      const getImageDimensions = vi.spyOn(
        component as unknown as { getImageDimensions: (file: File) => Promise<{ width: number; height: number }> },
        'getImageDimensions',
      );
      getImageDimensions.mockRejectedValueOnce(new Error('Invalid image'));

      await component.onImageSelected(mockEvent);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.invalidImage');
      expect(imageService.uploadJobBanner).not.toHaveBeenCalled();
    });

    it('should handle image upload failure', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      const mockEvent = createMockFileEvent(file);
      imageService.uploadJobBanner.mockReturnValueOnce(throwError(() => new Error('Upload failed')));

      await component.onImageSelected(mockEvent);

      expect(component.isUploadingImage()).toBe(false);
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.uploadFailed');
      expect((mockEvent.target as HTMLInputElement).value).toBe('');
    });

    it('should handle event with no files', async () => {
      const mockEvent = {
        target: { files: [] } as unknown as HTMLInputElement,
      } as unknown as Event;

      await component.onImageSelected(mockEvent);

      expect(imageService.uploadJobBanner).not.toHaveBeenCalled();
    });

    it('should handle non-input target', async () => {
      const mockEvent = {
        target: document.createElement('div'),
      } as unknown as Event;

      await component.onImageSelected(mockEvent);

      expect(imageService.uploadJobBanner).not.toHaveBeenCalled();
    });

    it('should select a default image', () => {
      const image: ImageDTO = { imageId: 'default1', url: '/images/default1.jpg', imageType: 'DEFAULT_JOB_BANNER' };
      component.selectImage(image);

      expect(component.selectedImage()).toEqual(image);
      expect(component.imageForm.get('imageId')?.value).toBe('default1');
    });

    it('should not select default image if custom image already uploaded', () => {
      component.selectedImage.set({ imageId: 'custom1', url: '/images/custom.jpg', imageType: 'JOB_BANNER' });

      const defaultImage: ImageDTO = { imageId: 'default1', url: '/images/default1.jpg', imageType: 'DEFAULT_JOB_BANNER' };
      component.selectImage(defaultImage);

      expect(component.selectedImage()?.imageId).toBe('custom1');
    });

    it('should allow selecting default image when no custom image exists', () => {
      component.selectedImage.set(undefined);

      const defaultImage: ImageDTO = { imageId: 'default1', url: '/default.jpg', imageType: 'DEFAULT_JOB_BANNER' };
      component.selectImage(defaultImage);

      expect(component.selectedImage()).toEqual(defaultImage);
    });

    it('should clear image selection', () => {
      component.selectedImage.set({ imageId: 'img1', url: '/url', imageType: 'JOB_BANNER' });
      component.imageForm.patchValue({ imageId: 'img1' });

      component.clearImageSelection();

      expect(component.selectedImage()).toBeUndefined();
      expect(component.imageForm.get('imageId')?.value).toBeNull();
    });

    it('should delete selected image', async () => {
      component.selectedImage.set({ imageId: 'img1', url: '/url', imageType: 'JOB_BANNER' });

      await component.deleteSelectedImage();

      expect(imageService.deleteImage).toHaveBeenCalledWith('img1');
      expect(component.selectedImage()).toBeUndefined();
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('jobCreationForm.imageSection.deleteImageSuccess');
    });

    it('should handle delete image failure', async () => {
      component.selectedImage.set({ imageId: 'img1', url: '/url', imageType: 'JOB_BANNER' });
      imageService.deleteImage.mockReturnValueOnce(throwError(() => new Error('Delete failed')));

      await component.deleteSelectedImage();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.deleteImageFailed');
    });

    it('should not delete if no image selected', async () => {
      component.selectedImage.set(undefined);

      await component.deleteSelectedImage();

      expect(imageService.deleteImage).not.toHaveBeenCalled();
    });

    it('should compute hasCustomImage correctly', () => {
      component.selectedImage.set(undefined);
      expect(component.hasCustomImage()).toBe(false);

      component.selectedImage.set({ imageId: 'default1', url: '/url', imageType: 'DEFAULT_JOB_BANNER' });
      expect(component.hasCustomImage()).toBe(false);

      component.selectedImage.set({ imageId: 'custom1', url: '/url', imageType: 'JOB_BANNER' });
      expect(component.hasCustomImage()).toBe(true);
    });

    it('should load default images successfully', async () => {
      const mockImages: ImageDTO[] = [
        { imageId: 'default1', url: '/images/default1.jpg', imageType: 'DEFAULT_JOB_BANNER' },
        { imageId: 'default2', url: '/images/default2.jpg', imageType: 'DEFAULT_JOB_BANNER' },
      ];
      imageService.getDefaultJobBanners.mockReturnValueOnce(of(mockImages));

      await component.loadImages();

      expect(imageService.getDefaultJobBanners).toHaveBeenCalled();
      expect(component.defaultImages()).toEqual(mockImages);
    });

    it('should handle error when loading default images fails', async () => {
      imageService.getDefaultJobBanners.mockReturnValueOnce(throwError(() => new Error('Load failed')));

      await component.loadImages();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.loadImagesFailed');
    });
  });

  describe('JobDTO Creation', () => {
    it('should create JobDTO with DRAFT state', () => {
      fillValidJobForm(component);
      component.imageForm.patchValue({ imageId: 'img123' });

      const createJobDTO = (component as unknown as { createJobDTO: (state: JobFormDTO.StateEnum) => JobFormDTO }).createJobDTO;
      const jobDTO = createJobDTO.call(component, 'DRAFT');

      expect(jobDTO.state).toBe('DRAFT');
      expect(jobDTO.title).toBe('T');
      expect(jobDTO.researchArea).toBe('AI');
      expect(jobDTO.description).toBe('desc');
      expect(jobDTO.tasks).toBe('tasks');
      expect(jobDTO.requirements).toBe('reqs');
      expect(jobDTO.imageId).toBe('img123');
    });

    it('should create JobDTO with PUBLISHED state', () => {
      fillValidJobForm(component);

      const createJobDTO = (component as unknown as { createJobDTO: (state: JobFormDTO.StateEnum) => JobFormDTO }).createJobDTO;
      const jobDTO = createJobDTO.call(component, 'PUBLISHED');

      expect(jobDTO.state).toBe('PUBLISHED');
    });

    it('should build Job DTO with default empty strings when form fields missing', () => {
      component.basicInfoForm.reset();
      component.positionDetailsForm.reset();

      const dto = (component as unknown as { createJobDTO: () => JobFormDTO }).createJobDTO();

      expect(dto.title).toBe('');
      expect(dto.researchArea).toBe('');
      expect(dto.startDate).toBe('');
      expect(dto.endDate).toBe('');
      expect(dto.description).toBe('');
      expect(dto.tasks).toBe('');
      expect(dto.requirements).toBe('');
    });

    it('should build Job DTO with provided form values', () => {
      component.basicInfoForm.patchValue({
        title: 'My Job',
        researchArea: 'AI ',
        startDate: '2025-10-03',
        applicationDeadline: '2025-11-01',
      });
      component.positionDetailsForm.patchValue({
        description: 'Some description ',
        tasks: 'Some tasks ',
        requirements: 'Some requirements ',
      });

      const dto = (component as unknown as { createJobDTO: () => JobFormDTO }).createJobDTO();

      expect(dto.title).toBe('My Job');
      expect(dto.researchArea).toBe('AI');
      expect(dto.startDate).toBe('2025-10-03');
      expect(dto.endDate).toBe('2025-11-01');
      expect(dto.description).toBe('Some description');
      expect(dto.tasks).toBe('Some tasks');
      expect(dto.requirements).toBe('Some requirements');
    });

    it('should trim whitespace from text fields', () => {
      component.basicInfoForm.patchValue({ researchArea: '  AI Research  ' });
      component.positionDetailsForm.patchValue({
        description: '  Description with spaces  ',
        tasks: '  Tasks  ',
        requirements: '  Requirements  ',
      });

      const createJobDTO = (component as unknown as { createJobDTO: (state: JobFormDTO.StateEnum) => JobFormDTO }).createJobDTO;
      const jobDTO = createJobDTO.call(component, 'DRAFT');

      expect(jobDTO.researchArea).toBe('AI Research');
      expect(jobDTO.description).toBe('Description with spaces');
      expect(jobDTO.tasks).toBe('Tasks');
      expect(jobDTO.requirements).toBe('Requirements');
    });

    it('should set imageId to null when no image selected', () => {
      fillValidJobForm(component);
      component.imageForm.patchValue({ imageId: null });

      const createJobDTO = (component as unknown as { createJobDTO: (state: JobFormDTO.StateEnum) => JobFormDTO }).createJobDTO;
      const jobDTO = createJobDTO.call(component, 'DRAFT');

      expect(jobDTO.imageId).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('should validate basicInfoForm with required fields', () => {
      expect(component.basicInfoForm.valid).toBe(false);

      component.basicInfoForm.patchValue({
        title: 'Job Title',
        researchArea: 'AI',
        fieldOfStudies: { value: 'CS' },
        location: { value: 'MUNICH' },
        supervisingProfessor: 'Prof',
      });

      expect(component.basicInfoForm.valid).toBe(true);
    });

    it('should invalidate basicInfoForm when required fields are missing', () => {
      component.basicInfoForm.patchValue({
        title: '',
        researchArea: '',
      });

      expect(component.basicInfoForm.valid).toBe(false);
      expect(component.basicInfoForm.get('title')?.invalid).toBe(true);
    });

    it('should validate positionDetailsForm with required HTML fields', () => {
      expect(component.positionDetailsForm.valid).toBe(false);

      component.positionDetailsForm.patchValue({
        description: '<p>Description</p>',
        tasks: '<p>Tasks</p>',
        requirements: '<p>Requirements</p>',
      });

      expect(component.positionDetailsForm.valid).toBe(true);
    });

    it('should require privacy acceptance in additionalInfoForm', () => {
      expect(component.additionalInfoForm.get('privacyAccepted')?.value).toBe(false);

      component.additionalInfoForm.patchValue({ privacyAccepted: true });

      expect(component.additionalInfoForm.valid).toBe(true);
      expect(component.additionalInfoForm.get('privacyAccepted')?.value).toBe(true);
    });

    it('should update form validity signals', () => {
      component.basicInfoForm.patchValue({
        title: 'Job',
        researchArea: 'AI',
        fieldOfStudies: { value: 'CS' },
        location: { value: 'MUNICH' },
        supervisingProfessor: 'Prof',
      });
      component.basicInfoForm.updateValueAndValidity();
      fixture.detectChanges();

      expect(component.basicInfoValid()).toBe(true);
    });
  });

  describe('Computed Signals', () => {
    it('should compute allFormsValid when both basic and position forms are valid', () => {
      expect(component.allFormsValid()).toBe(false);

      fillValidJobForm(component);
      fixture.detectChanges();

      expect(component.allFormsValid()).toBe(true);
    });

    it('should compute publishableJobData only when all forms are valid', () => {
      expect(component.publishableJobData()).toBeUndefined();

      fillValidJobForm(component);
      fixture.detectChanges();

      const publishableData = component.publishableJobData();
      expect(publishableData).toBeDefined();
      expect(publishableData?.state).toBe('PUBLISHED');
    });

    it('should compute currentJobData with DRAFT state', () => {
      fillValidJobForm(component);

      const currentData = component.currentJobData();
      expect(currentData).toBeDefined();
      expect(currentData.state).toBe('DRAFT');
      expect(currentData.title).toBe('T');
    });
  });

  describe('Form Status Tracking', () => {
    it('should track basicInfoForm status changes', () => {
      const initialStatus = component.basicInfoChanges();
      expect(initialStatus).toBeDefined();

      component.basicInfoForm.patchValue({ title: 'Test' });
      fixture.detectChanges();

      expect(component.basicInfoChanges()).toBeDefined();
    });

    it('should track positionDetailsForm status changes', () => {
      const initialStatus = component.positionDetailsChanges();
      expect(initialStatus).toBeDefined();

      component.positionDetailsForm.patchValue({ description: 'Test' });
      fixture.detectChanges();

      expect(component.positionDetailsChanges()).toBeDefined();
    });

    it('should track privacy acceptance changes', () => {
      expect(component.privacyAcceptedSignal()).toBe(false);

      component.additionalInfoForm.patchValue({ privacyAccepted: true });
      fixture.detectChanges();

      expect(component.privacyAcceptedSignal()).toBe(true);
    });
  });

  describe('Step Navigation and Build', () => {
    beforeEach(() => {
      mockPanelTemplates(component);
    });

    it('should disable steps in buildStepData when forms invalid', () => {
      component.basicInfoValid.set(false);
      component.positionDetailsValid.set(false);

      const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

      const step2 = steps.find(s => s.name.includes('positionDetails'));
      const step4 = steps.find(s => s.name.includes('summary'));

      expect(step2?.disabled).toBe(true);
      expect(step4?.disabled).toBe(true);
    });

    it('should execute panel1 onClick in buildStepData', () => {
      (component as { panel1: () => object }).panel1 = () => ({});
      (component as { savingStatePanel: () => object }).savingStatePanel = () => ({});

      component.basicInfoValid.set(false);
      let steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();
      expect(steps[0].buttonGroupNext?.[0].disabled).toBe(true);

      component.basicInfoValid.set(true);
      steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();
      expect(steps[0].buttonGroupNext?.[0].disabled).toBe(false);

      steps[0].buttonGroupNext?.[0].onClick?.();
    });

    it('should execute back buttons in buildStepData for panel2 and panel4', () => {
      const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

      const panel2Back = steps.find(s => s.name.includes('positionDetails'))?.buttonGroupPrev?.[0];
      const panel4Back = steps.find(s => s.name.includes('summary'))?.buttonGroupPrev?.[0];

      expect(() => panel2Back?.onClick()).not.toThrow();
      expect(() => panel4Back?.onClick()).not.toThrow();
    });

    it('should call onClick of step1 prev and next buttons', () => {
      (component as unknown as { panel1: () => object }).panel1 = () => ({});
      (component as unknown as { savingStatePanel: () => object }).savingStatePanel = () => ({});

      const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

      const backBtn = steps[0].buttonGroupPrev?.[0];
      backBtn?.onClick();
      expect(location.back).toHaveBeenCalled();

      const nextBtn = steps[0].buttonGroupNext?.[0];
      expect(() => nextBtn?.onClick()).not.toThrow();
    });

    it('should execute panel2 next button onClick (noop)', () => {
      const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

      const panel2Next = steps.find(s => s.name.includes('positionDetails'))?.buttonGroupNext?.[0];
      expect(() => panel2Next?.onClick()).not.toThrow();
    });

    it('should call confirm() on sendPublishDialog when publish step button clicked', () => {
      const confirmSpy = vi.fn();
      (component as unknown as { sendPublishDialog: () => { confirm: () => void } }).sendPublishDialog = () => ({
        confirm: confirmSpy,
      });

      component.basicInfoValid.set(true);
      component.positionDetailsValid.set(true);

      const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();
      const publishBtn = steps.find(s => s.name.includes('summary'))?.buttonGroupNext?.[0];
      publishBtn?.onClick();

      expect(confirmSpy).toHaveBeenCalled();
    });
  });

  describe('Panel3 (Image Step)', () => {
    it('should build step data with panel3 (image selection)', () => {
      const mockTemplate = {} as TemplateRef<HTMLDivElement>;
      Object.defineProperty(component, 'panel1', { get: () => signal(mockTemplate).asReadonly() });
      Object.defineProperty(component, 'panel2', { get: () => signal(mockTemplate).asReadonly() });
      Object.defineProperty(component, 'panel3', { get: () => signal(mockTemplate).asReadonly() });
      Object.defineProperty(component, 'panel4', { get: () => signal(mockTemplate).asReadonly() });
      Object.defineProperty(component, 'savingStatePanel', { get: () => signal(mockTemplate).asReadonly() });

      component.basicInfoValid.set(false);
      component.positionDetailsValid.set(false);

      const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

      const imageStep = steps.find(s => s.name.includes('imageSelection'));
      expect(imageStep).toBeDefined();
      expect(imageStep?.disabled).toBe(true);
    });

    it('should execute panel3 prev and next buttons', () => {
      const mockTemplate = {} as TemplateRef<HTMLDivElement>;
      Object.defineProperty(component, 'panel1', { get: () => signal(mockTemplate).asReadonly() });
      Object.defineProperty(component, 'panel2', { get: () => signal(mockTemplate).asReadonly() });
      Object.defineProperty(component, 'panel3', { get: () => signal(mockTemplate).asReadonly() });
      Object.defineProperty(component, 'savingStatePanel', { get: () => signal(mockTemplate).asReadonly() });

      component.basicInfoValid.set(true);
      component.positionDetailsValid.set(true);

      const steps = (component as unknown as { buildStepData: () => Step[] }).buildStepData();

      const imageStep = steps.find(s => s.name.includes('imageSelection'));
      const prevBtn = imageStep?.buttonGroupPrev?.[0];
      const nextBtn = imageStep?.buttonGroupNext?.[0];

      expect(() => prevBtn?.onClick()).not.toThrow();
      expect(() => nextBtn?.onClick()).not.toThrow();
    });
  });

  describe('Utility Functions', () => {
    it('should return undefined when findDropdownOption has no match', () => {
      const result = (
        component as unknown as { findDropdownOption: (arr: { value: string }[], val: string) => unknown }
      ).findDropdownOption([{ value: 'x' }], 'y');
      expect(result).toBeUndefined();
    });

    it('should find matching dropdown option', () => {
      const options = [{ value: 'a' }, { value: 'b' }];
      const result = (
        component as unknown as { findDropdownOption: (arr: { value: string }[], val: string) => unknown }
      ).findDropdownOption(options, 'b');
      expect(result).toEqual({ value: 'b' });
    });
  });
});
