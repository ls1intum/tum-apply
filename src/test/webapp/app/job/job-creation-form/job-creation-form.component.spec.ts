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

function mockAllPanelTemplates(component: JobCreationFormComponent) {
  const mockTemplate = {} as TemplateRef<HTMLDivElement>;
  Object.defineProperty(component, 'panel1', { get: () => signal(mockTemplate).asReadonly() });
  Object.defineProperty(component, 'panel2', { get: () => signal(mockTemplate).asReadonly() });
  Object.defineProperty(component, 'panel3', { get: () => signal(mockTemplate).asReadonly() });
  Object.defineProperty(component, 'panel4', { get: () => signal(mockTemplate).asReadonly() });
  Object.defineProperty(component, 'savingStatePanel', { get: () => signal(mockTemplate).asReadonly() });
}

// Type helpers to avoid verbose casting
type ComponentPrivate = {
  performAutoSave: () => Promise<void>;
  clearAutoSaveTimer: () => void;
  autoSaveTimer?: number;
  autoSaveInitialized: boolean;
  populateForm: (job?: JobDTO) => void;
  createJobDTO: (state?: JobFormDTO.StateEnum) => JobFormDTO;
  buildStepData: () => Step[];
  findDropdownOption: (arr: { value: string }[], val: string) => unknown;
  getImageDimensions: (file: File) => Promise<{ width: number; height: number }>;
  sendPublishDialog: () => { confirm: () => void };
  panel1: () => object;
  panel2: () => object;
  savingStatePanel: () => object;
};

function getPrivate(component: JobCreationFormComponent): ComponentPrivate {
  return component as unknown as ComponentPrivate;
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
    getResearchGroupJobBanners: ReturnType<typeof vi.fn>;
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
      getResearchGroupJobBanners: vi.fn().mockReturnValue(of([])),
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
    vi.clearAllMocks();
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
  });

  describe('Navigation', () => {
    it('should call Location.back on onBack', () => {
      component.onBack();
      expect(location.back).toHaveBeenCalled();
    });
  });

  describe('Auto-Save and Saving State', () => {
    it('should detect unsaved changes when form changes', () => {
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
      await getPrivate(component).performAutoSave();

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
      await getPrivate(component).performAutoSave();

      expect(component.jobId()).toBe('abc123');
      expect(jobService.createJob).toHaveBeenCalled();
    });

    it('should call updateJob when jobId is set in performAutoSave', async () => {
      component.jobId.set('job123');
      await getPrivate(component).performAutoSave();

      expect(jobService.updateJob).toHaveBeenCalledWith('job123', expect.any(Object));
    });

    it('should clear autoSaveTimer if set', () => {
      const spy = vi.spyOn(global, 'clearTimeout');
      const priv = getPrivate(component);
      priv.autoSaveTimer = 123;
      priv.clearAutoSaveTimer();

      expect(spy).toHaveBeenCalledWith(123);
      expect(priv.autoSaveTimer).toBeUndefined();
    });

    it('should trigger performAutoSave from setupAutoSave effect', async () => {
      vi.useFakeTimers();
      const priv = getPrivate(component);
      const spy = vi.spyOn(priv, 'performAutoSave').mockResolvedValue();
      priv.autoSaveInitialized = true;

      component.basicInfoForm.patchValue({ title: 'new title' });
      vi.runAllTimers();
      await Promise.resolve();

      expect(spy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Job Publishing', () => {
    it.each([
      {
        name: 'reject when privacy not accepted',
        setup: (comp: JobCreationFormComponent) => comp.additionalInfoForm.patchValue({ privacyAccepted: false }),
        expectations: () => {
          expect(mockToastService.showErrorKey).toHaveBeenCalledWith('privacy.privacyConsent.toastError');
        },
      },
      {
        name: 'publish successfully and navigate',
        setup: (comp: JobCreationFormComponent) => {
          fillValidJobForm(comp);
          fixture.detectChanges();
          comp.jobId.set('id123');
        },
        expectations: () => {
          expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('toast.published');
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-positions']);
        },
      },
      {
        name: 'handle publish failure',
        setup: (comp: JobCreationFormComponent) => {
          jobService.updateJob.mockReturnValueOnce(throwError(() => new Error('fail')));
          fillValidJobForm(comp);
          fixture.detectChanges();
          comp.jobId.set('id123');
        },
        expectations: () => {
          expect(mockToastService.showErrorKey).toHaveBeenCalledWith('toast.publishFailed');
        },
      },
      {
        name: 'skip when form data invalid',
        setup: (comp: JobCreationFormComponent) => {
          comp.additionalInfoForm.patchValue({ privacyAccepted: true });
          comp.basicInfoForm.patchValue({ title: '' });
          comp.positionDetailsForm.patchValue({ description: '' });
        },
        expectations: () => {
          expect(mockToastService.showSuccessKey).not.toHaveBeenCalled();
          expect(mockToastService.showErrorKey).not.toHaveBeenCalled();
        },
      },
    ])('should $name', async ({ setup, expectations }) => {
      setup(component);
      await component.publishJob();
      expectations();
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
        fundingType: DropdownOptions.fundingTypes[0].value,
      } as JobDTO;
      getPrivate(component).populateForm(job);
      expect(component.basicInfoForm.get('fundingType')?.value).toEqual(DropdownOptions.fundingTypes[0]);
    });

    it('should populate form with job image correctly', () => {
      // Default banner
      component.defaultImages.set([{ imageId: 'img123', url: '/images/test.jpg', imageType: 'DEFAULT_JOB_BANNER' }]);
      getPrivate(component).populateForm({ title: 'Test', imageId: 'img123', imageUrl: '/images/test.jpg' } as JobDTO);
      expect(component.selectedImage()?.imageId).toBe('img123');
      expect(component.selectedImage()?.imageType).toBe('DEFAULT_JOB_BANNER');

      // Custom image
      component.defaultImages.set([{ imageId: 'default1', url: '/images/default.jpg', imageType: 'DEFAULT_JOB_BANNER' }]);
      getPrivate(component).populateForm({ title: 'Test', imageId: 'custom123', imageUrl: '/images/custom.jpg' } as JobDTO);
      expect(component.selectedImage()?.imageId).toBe('custom123');
      expect(component.selectedImage()?.imageType).toBe('JOB_BANNER');
    });

    it('should not set image when imageId or imageUrl is missing', () => {
      getPrivate(component).populateForm({ title: 'Test', imageUrl: '/images/test.jpg' } as JobDTO);
      expect(component.selectedImage()).toBeUndefined();

      getPrivate(component).populateForm({ title: 'Test', imageId: 'img123' } as JobDTO);
      expect(component.selectedImage()).toBeUndefined();

      getPrivate(component).populateForm(undefined);
      expect(component.selectedImage()).toBeUndefined();
    });
  });

  describe('Image Upload and Selection', () => {
    beforeEach(() => {
      // Mock getImageDimensions for image upload tests
      vi.spyOn(getPrivate(component), 'getImageDimensions').mockResolvedValue({ width: 1920, height: 1080 });
    });

    it.each([
      {
        name: 'file too large',
        file: createMockFile('test.jpg', 'image/jpeg', 6 * 1024 * 1024),
        errorKey: 'jobCreationForm.imageSection.fileTooLarge',
        setupSpy: (spy?: ReturnType<typeof vi.spyOn>) => spy && vi.spyOn(console, 'error').mockImplementation(() => {}),
      },
      {
        name: 'invalid file type',
        file: createMockFile('test.svg', 'image/svg+xml', 1024),
        errorKey: 'jobCreationForm.imageSection.invalidFileType',
      },
      {
        name: 'dimensions too large',
        file: createMockFile('test.jpg', 'image/jpeg', 1024 * 1024),
        errorKey: 'jobCreationForm.imageSection.dimensionsTooLarge',
        setupSpy: () => vi.spyOn(getPrivate(component), 'getImageDimensions').mockResolvedValueOnce({ width: 5000, height: 5000 }),
      },
      {
        name: 'invalid image file',
        file: createMockFile('test.jpg', 'image/jpeg', 1024 * 1024),
        errorKey: 'jobCreationForm.imageSection.invalidImage',
        setupSpy: () => vi.spyOn(getPrivate(component), 'getImageDimensions').mockRejectedValueOnce(new Error('Invalid')),
      },
      {
        name: 'research group image limit reached',
        file: createMockFile('test.jpg', 'image/jpeg', 1024 * 1024),
        errorKey: 'jobCreationForm.imageSection.maxImagesReached',
        setupSpy: () => {
          const maxImages = Array.from({ length: 10 }, (_, i) => ({
            imageId: `img${i}`,
            url: `/images/img${i}.jpg`,
            imageType: 'JOB_BANNER' as const,
          }));
          component.researchGroupImages.set(maxImages);
        },
      },
      {
        name: 'upload failure',
        file: createMockFile('test.jpg', 'image/jpeg', 1024 * 1024),
        errorKey: 'jobCreationForm.imageSection.uploadFailed',
        setupSpy: () => imageService.uploadJobBanner.mockReturnValueOnce(throwError(() => new Error('Upload failed'))),
      },
    ])('should reject image upload when $name', async ({ file, errorKey, setupSpy }) => {
      const spy = setupSpy?.();
      const mockEvent = createMockFileEvent(file);

      await component.onImageSelected(mockEvent);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith(errorKey);
      expect((mockEvent.target as HTMLInputElement).value).toBe('');
      spy && spy.mockRestore();
    });

    it.each([
      { name: 'no files', event: { target: { files: [] } as unknown as HTMLInputElement } as unknown as Event },
      { name: 'non-input target', event: { target: document.createElement('div') } as unknown as Event },
    ])('should handle $name gracefully', async ({ event }) => {
      await component.onImageSelected(event);
      expect(imageService.uploadJobBanner).not.toHaveBeenCalled();
    });

    it('should upload image successfully', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024);
      const mockEvent = createMockFileEvent(file);
      const mockImage: ImageDTO = { imageId: 'uploaded123', url: '/images/uploaded.jpg', imageType: 'JOB_BANNER' };
      imageService.uploadJobBanner.mockReturnValueOnce(of(mockImage));

      await component.onImageSelected(mockEvent);

      expect(component.selectedImage()).toEqual(mockImage);
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('jobCreationForm.imageSection.uploadSuccess');
      expect(component.isUploadingImage()).toBe(false);
      expect((mockEvent.target as HTMLInputElement).value).toBe('');
    });

    it('should handle image selection and computed signals', () => {
      // Select default image
      const defaultImage: ImageDTO = { imageId: 'default1', url: '/images/default1.jpg', imageType: 'DEFAULT_JOB_BANNER' };
      component.selectImage(defaultImage);
      expect(component.selectedImage()).toEqual(defaultImage);
      expect(component.imageForm.get('imageId')?.value).toBe('default1');
      expect(component.imageSelected()).toBe(true);
      expect(component.hasCustomImage()).toBe(false);

      // Select custom image
      const customImage: ImageDTO = { imageId: 'custom1', url: '/url', imageType: 'JOB_BANNER' };
      component.selectImage(customImage);
      expect(component.hasCustomImage()).toBe(true);
      expect(component.imageSelected()).toBe(true);

      // Clear selection
      component.clearImageSelection();
      expect(component.selectedImage()).toBeUndefined();
      expect(component.imageForm.get('imageId')?.value).toBeNull();
      expect(component.imageSelected()).toBe(false);
      expect(component.hasCustomImage()).toBe(false);
    });

    it('should delete selected image successfully', async () => {
      component.selectedImage.set({ imageId: 'img1', url: '/url', imageType: 'JOB_BANNER' });
      await component.deleteSelectedImage();
      expect(imageService.deleteImage).toHaveBeenCalledWith('img1');
      expect(component.selectedImage()).toBeUndefined();
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('jobCreationForm.imageSection.deleteImageSuccess');
    });

    it('should handle delete failure', async () => {
      component.selectedImage.set({ imageId: 'img1', url: '/url', imageType: 'JOB_BANNER' });
      imageService.deleteImage.mockReturnValueOnce(throwError(() => new Error('Delete failed')));
      await component.deleteSelectedImage();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.deleteImageFailed');
    });

    it('should skip delete when no image selected', async () => {
      component.selectedImage.set(undefined);
      await component.deleteSelectedImage();
      expect(imageService.deleteImage).not.toHaveBeenCalled();
    });

    it.each([
      {
        name: 'skip delete with empty imageId',
        imageId: '',
        expectations: () => {
          expect(imageService.deleteImage).not.toHaveBeenCalled();
        },
      },
      {
        name: 'delete non-selected image',
        imageId: 'img2',
        setup: (comp: JobCreationFormComponent) => {
          comp.selectedImage.set({ imageId: 'img1', url: '/url1', imageType: 'JOB_BANNER' });
          comp.researchGroupImages.set([
            { imageId: 'img1', url: '/url1', imageType: 'JOB_BANNER' },
            { imageId: 'img2', url: '/url2', imageType: 'JOB_BANNER' },
          ]);
        },
        expectations: (comp: JobCreationFormComponent) => {
          expect(imageService.deleteImage).toHaveBeenCalledWith('img2');
          expect(comp.selectedImage()?.imageId).toBe('img1');
          expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('jobCreationForm.imageSection.deleteImageSuccess');
        },
      },
      {
        name: 'handle reload error after deleting selected image',
        imageId: 'img1',
        setup: (comp: JobCreationFormComponent) => {
          comp.selectedImage.set({ imageId: 'img1', url: '/url1', imageType: 'JOB_BANNER' });
          comp.researchGroupImages.set([
            { imageId: 'img1', url: '/url1', imageType: 'JOB_BANNER' },
            { imageId: 'img2', url: '/url2', imageType: 'JOB_BANNER' },
          ]);
        },
        mockSetup: () => imageService.getResearchGroupJobBanners.mockReturnValueOnce(throwError(() => new Error('Reload failed'))),
        expectations: (comp: JobCreationFormComponent) => {
          expect(comp.selectedImage()).toBeUndefined();
          expect(comp.researchGroupImages()).toHaveLength(1);
          expect(comp.researchGroupImages()[0].imageId).toBe('img2');
        },
      },
    ])('should $name', async ({ imageId, setup, mockSetup, expectations }) => {
      setup?.(component);
      mockSetup?.();
      await component.deleteImage(imageId);
      expectations(component);
    });

    it.each([
      { imageCount: 0, expected: false },
      { imageCount: 9, expected: false },
      { imageCount: 10, expected: true },
    ])('should compute isResearchGroupImageLimitReached as $expected when count is $imageCount', ({ imageCount, expected }) => {
      const images = Array.from({ length: imageCount }, (_, i) => ({
        imageId: `img${i}`,
        url: `/url${i}`,
        imageType: 'JOB_BANNER' as const,
      }));
      component.researchGroupImages.set(images);
      expect(component.isResearchGroupImageLimitReached()).toBe(expected);
    });

    it('should load default images successfully', async () => {
      const mockImages: ImageDTO[] = [
        { imageId: 'default1', url: '/images/default1.jpg', imageType: 'DEFAULT_JOB_BANNER' },
        { imageId: 'default2', url: '/images/default2.jpg', imageType: 'DEFAULT_JOB_BANNER' },
      ];
      imageService.getDefaultJobBanners.mockReturnValueOnce(of(mockImages));
      await component.loadImages();
      expect(component.defaultImages()).toEqual(mockImages);
    });

    it('should load images with research group', async () => {
      mockAccountService.user.set({
        id: 'u1',
        name: 'Test User',
        email: 'test@example.com',
        researchGroup: { researchGroupId: 'rg123', researchGroupName: 'Test Group' },
      } as User);
      const mockImages: ImageDTO[] = [{ imageId: 'default1', url: '/images/default1.jpg', imageType: 'DEFAULT_JOB_BANNER' }];
      imageService.getDefaultJobBanners.mockReturnValueOnce(of(mockImages));
      imageService.getResearchGroupJobBanners.mockReturnValueOnce(of([]));
      await component.loadImages();
      expect(imageService.getDefaultJobBanners).toHaveBeenCalledWith('rg123');
    });

    it('should handle error when loading images fails', async () => {
      imageService.getDefaultJobBanners.mockReturnValueOnce(throwError(() => new Error('Load failed')));
      await component.loadImages();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.loadImagesFailed');
    });
  });

  describe('JobDTO Creation', () => {
    it('should create JobDTO with correct state and data', () => {
      fillValidJobForm(component);
      component.imageForm.patchValue({ imageId: 'img123' });

      const draftDTO = getPrivate(component).createJobDTO('DRAFT');
      expect(draftDTO.state).toBe('DRAFT');
      expect(draftDTO.title).toBe('T');
      expect(draftDTO.researchArea).toBe('AI');
      expect(draftDTO.imageId).toBe('img123');

      const publishedDTO = getPrivate(component).createJobDTO('PUBLISHED');
      expect(publishedDTO.state).toBe('PUBLISHED');
    });

    it('should handle empty and whitespace values correctly', () => {
      component.basicInfoForm.reset();
      component.positionDetailsForm.reset();
      let dto = getPrivate(component).createJobDTO();
      expect(dto.title).toBe('');
      expect(dto.researchArea).toBe('');

      component.basicInfoForm.patchValue({ title: 'My Job', researchArea: '  AI Research  ' });
      component.positionDetailsForm.patchValue({ description: '  Some description  ' });
      dto = getPrivate(component).createJobDTO();
      expect(dto.title).toBe('My Job');
      expect(dto.researchArea).toBe('AI Research');
      expect(dto.description).toBe('Some description');
    });

    it.each([
      { fieldOfStudies: { value: undefined }, expected: '' },
      { fieldOfStudies: null, expected: '' },
    ])('should handle fieldOfStudies edge cases', ({ fieldOfStudies, expected }) => {
      component.basicInfoForm.patchValue({
        title: 'Job',
        researchArea: 'AI',
        fieldOfStudies,
        location: { value: 'MUNICH' },
        supervisingProfessor: 'Prof',
      });
      component.positionDetailsForm.patchValue({ description: 'desc', tasks: 'tasks', requirements: 'reqs' });
      const dto = getPrivate(component).createJobDTO('DRAFT');
      expect(dto.fieldOfStudies).toBe(expected);
    });
  });

  describe('Form Validation', () => {
    it('should validate individual forms and their signals', () => {
      // Test invalid state
      expect(component.basicInfoForm.valid).toBe(false);
      expect(component.positionDetailsForm.valid).toBe(false);
      expect(component.allFormsValid()).toBe(false);

      // Test basicInfoForm
      component.basicInfoForm.patchValue({
        title: 'Job Title',
        researchArea: 'AI',
        fieldOfStudies: { value: 'CS' },
        location: { value: 'MUNICH' },
        supervisingProfessor: 'Prof',
      });
      fixture.detectChanges();
      expect(component.basicInfoForm.valid).toBe(true);
      expect(component.basicInfoValid()).toBe(true);

      // Test positionDetailsForm
      component.positionDetailsForm.patchValue({
        description: '<p>Description</p>',
        tasks: '<p>Tasks</p>',
        requirements: '<p>Requirements</p>',
      });
      fixture.detectChanges();
      expect(component.positionDetailsForm.valid).toBe(true);
      expect(component.positionDetailsValid()).toBe(true);

      // Test privacy form
      component.additionalInfoForm.patchValue({ privacyAccepted: true });
      fixture.detectChanges();
      expect(component.additionalInfoForm.valid).toBe(true);
      expect(component.privacyAcceptedSignal()).toBe(true);
      expect(component.allFormsValid()).toBe(true);
    });
  });

  describe('Computed Signals and Form Status Tracking', () => {
    it('should compute signals correctly based on form validity', () => {
      // Invalid state
      expect(component.allFormsValid()).toBe(false);
      expect(component.publishableJobData()).toBeUndefined();
      expect(component.basicInfoChanges()).toBeDefined();
      expect(component.positionDetailsChanges()).toBeDefined();

      // Valid state
      fillValidJobForm(component);
      fixture.detectChanges();
      expect(component.allFormsValid()).toBe(true);
      expect(component.basicInfoChanges()).toBeDefined();
      expect(component.positionDetailsChanges()).toBeDefined();

      const publishableData = component.publishableJobData();
      expect(publishableData).toBeDefined();
      expect(publishableData?.state).toBe('PUBLISHED');

      const currentData = component.currentJobData();
      expect(currentData).toBeDefined();
      expect(currentData.state).toBe('DRAFT');
      expect(currentData.title).toBe('T');
    });
  });

  describe('Step Navigation and Build', () => {
    beforeEach(() => {
      mockPanelTemplates(component);
    });

    it('should disable/enable steps based on form validity', () => {
      component.basicInfoValid.set(false);
      component.positionDetailsValid.set(false);
      let steps = getPrivate(component).buildStepData();
      expect(steps.find(s => s.name.includes('positionDetails'))?.disabled).toBe(true);
      expect(steps.find(s => s.name.includes('summary'))?.disabled).toBe(true);
      expect(steps[0].buttonGroupNext?.[0].disabled).toBe(true);

      component.basicInfoValid.set(true);
      steps = getPrivate(component).buildStepData();
      expect(steps[0].buttonGroupNext?.[0].disabled).toBe(false);
    });

    it('should handle button clicks correctly', () => {
      const steps = getPrivate(component).buildStepData();
      steps[0].buttonGroupPrev?.[0].onClick();
      expect(location.back).toHaveBeenCalled();

      steps.forEach(step => {
        step.buttonGroupPrev?.forEach(btn => expect(() => btn.onClick()).not.toThrow());
        step.buttonGroupNext?.forEach(btn => expect(() => btn.onClick()).not.toThrow());
      });
    });

    it('should call confirm() when publish button clicked', () => {
      const confirmSpy = vi.fn();
      getPrivate(component).sendPublishDialog = () => ({ confirm: confirmSpy });
      component.basicInfoValid.set(true);
      component.positionDetailsValid.set(true);

      const steps = getPrivate(component).buildStepData();
      steps.find(s => s.name.includes('summary'))?.buttonGroupNext?.[0].onClick();
      expect(confirmSpy).toHaveBeenCalled();
    });
  });

  describe('Panel3 (Image Step)', () => {
    beforeEach(() => {
      mockAllPanelTemplates(component);
    });

    it('should enable/disable image step based on form validity', () => {
      component.basicInfoValid.set(false);
      component.positionDetailsValid.set(false);
      let steps = getPrivate(component).buildStepData();
      let imageStep = steps.find(s => s.name.includes('imageSelection'));
      expect(imageStep?.disabled).toBe(true);

      component.basicInfoValid.set(true);
      component.positionDetailsValid.set(true);
      steps = getPrivate(component).buildStepData();
      imageStep = steps.find(s => s.name.includes('imageSelection'));
      expect(imageStep?.disabled).toBe(false);
      expect(() => imageStep?.buttonGroupPrev?.[0].onClick()).not.toThrow();
      expect(() => imageStep?.buttonGroupNext?.[0].onClick()).not.toThrow();
    });
  });

  describe('Utility Functions', () => {
    it.each([
      { options: [{ value: 'x' }], search: 'y', expected: undefined, desc: 'return undefined when no match' },
      { options: [{ value: 'a' }, { value: 'b' }], search: 'b', expected: { value: 'b' }, desc: 'find matching option' },
    ])('should $desc', ({ options, search, expected }) => {
      const result = getPrivate(component).findDropdownOption(options, search);
      expect(result).toEqual(expected);
    });
  });
});
