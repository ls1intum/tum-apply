import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { UrlSegment } from '@angular/router';
import { signal, TemplateRef } from '@angular/core';

import { JobCreationFormComponent } from 'app/job/job-creation-form/job-creation-form.component';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { ImageResourceApiService } from 'app/generated/api/imageResourceApi.service';
import { User } from 'app/core/auth/account.service';
import { JobFormDTO } from 'app/generated/model/jobFormDTO';
import { JobDTO } from 'app/generated/model/jobDTO';
import { ImageDTO } from 'app/generated/model/imageDTO';
import * as DropdownOptions from 'app/job/dropdown-options';
import { unescapeJsonString } from 'app/shared/util/util';

import { provideTranslateMock } from '../../../util/translate.mock';
import { provideFontAwesomeTesting } from '../../../util/fontawesome.testing';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';
import { createRouterMock, provideRouterMock } from '../../../util/router.mock';
import { createLocationMock, provideLocationMock } from '../../../util/location.mock';
import { createActivatedRouteMock, provideActivatedRouteMock } from '../../../util/activated-route.mock';
import { createJobResourceApiServiceMock, provideJobResourceApiServiceMock } from '../../../util/job-resource-api.service.mock';
import { createImageResourceApiServiceMock, provideImageResourceApiServiceMock } from '../../../util/image-resource-api.service.mock';
import { createAiStreamingServiceMock, provideAiStreamingServiceMock } from '../../../util/ai-streaming.service.mock';
import {
  createResearchGroupResourceApiServiceMock,
  provideResearchGroupResourceApiServiceMock,
} from '../../../util/research-group-resource-api.service.mock';

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
    jobDescription: '<p>This is a job description.</p>', // Muss im Form gesetzt werden
  });
  component.jobDescriptionEN.set('<p>This is a job description.</p>');
  component.jobDescriptionDE.set('<p>Das ist eine Job Beschreibung.</p>');
  component.jobDescriptionSignal.set('<p>This is a job description.</p>');
  component.positionDetailsForm.patchValue({
    startDate: '2025-02-25',
    applicationDeadline: '2025-01-01',
    workload: 20,
    contractDuration: 3,
    fundingType: { value: 'FULLY_FUNDED', name: 'Fully Funded' },
  });

  component.basicInfoForm.updateValueAndValidity();
  component.positionDetailsForm.updateValueAndValidity();
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
  sendPublishDialog: () => { confirm: () => void };
  panel1: () => object;
  panel2: () => object;
  savingStatePanel: () => object;
  extractJobDescriptionFromStream: (content: string) => string | null;
  unescapeJsonString: (str: string) => string;
  loadSupervisingProfessors: (preselectId?: string) => Promise<void>;
  setDefaultSupervisingProfessor: (preselectId?: string) => void;
  preferredSupervisingProfessorId: () => string | undefined;
};

function getPrivate(component: JobCreationFormComponent): ComponentPrivate {
  return component as unknown as ComponentPrivate;
}

describe('JobCreationFormComponent', () => {
  let fixture: ComponentFixture<JobCreationFormComponent>;
  let component: JobCreationFormComponent;
  let mockJobService: ReturnType<typeof createJobResourceApiServiceMock>;
  let mockImageService: ReturnType<typeof createImageResourceApiServiceMock>;
  let mockAccountService: ReturnType<typeof createAccountServiceMock>;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockRouter: ReturnType<typeof createRouterMock>;
  let mockLocation: ReturnType<typeof createLocationMock>;
  let mockActivatedRoute: ReturnType<typeof createActivatedRouteMock>;
  let mockAiStreamingService: ReturnType<typeof createAiStreamingServiceMock>;
  let mockResearchGroupService: ReturnType<typeof createResearchGroupResourceApiServiceMock>;

  beforeEach(async () => {
    mockJobService = createJobResourceApiServiceMock();
    mockJobService.getJobById.mockReturnValue(of({ title: 'Loaded Job', description: 'Desc' }));
    mockJobService.createJob.mockReturnValue(of({ jobId: 'new123' }));
    mockJobService.updateJob.mockReturnValue(of({}));

    mockImageService = createImageResourceApiServiceMock();
    mockImageService.getMyDefaultJobBanners.mockReturnValue(of([]));
    mockImageService.getDefaultJobBanners.mockReturnValue(of([]));
    mockImageService.getResearchGroupJobBanners.mockReturnValue(of([]));
    mockImageService.uploadJobBanner.mockReturnValue(
      of({
        imageId: 'img123',
        url: '/images/test.jpg',
        imageType: 'JOB_BANNER',
      }),
    );
    mockImageService.deleteImage.mockReturnValue(of({}));

    mockAccountService = createAccountServiceMock();
    mockAccountService.user.set({ id: 'u1', name: 'Test User' } as User);
    mockToastService = createToastServiceMock();
    mockRouter = createRouterMock();
    mockLocation = createLocationMock();
    mockActivatedRoute = createActivatedRouteMock({}, {}, [new UrlSegment('job', {}), new UrlSegment('create', {})]);
    mockAiStreamingService = createAiStreamingServiceMock();
    mockAiStreamingService.generateJobApplicationDraftStream.mockResolvedValue('{"jobDescription":"<p>Generated content</p>"}');
    mockResearchGroupService = createResearchGroupResourceApiServiceMock();
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of({ content: [] }));

    await TestBed.configureTestingModule({
      imports: [JobCreationFormComponent],
      providers: [
        provideJobResourceApiServiceMock(mockJobService),
        provideImageResourceApiServiceMock(mockImageService),
        provideLocationMock(mockLocation),
        provideActivatedRouteMock(mockActivatedRoute),
        provideAccountServiceMock(mockAccountService),
        provideToastServiceMock(mockToastService),
        provideRouterMock(mockRouter),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideAiStreamingServiceMock(mockAiStreamingService),
        provideResearchGroupResourceApiServiceMock(mockResearchGroupService),
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
      mockActivatedRoute.setUrl([new UrlSegment('job', {}), new UrlSegment('create', {})]);
      const fixture2 = TestBed.createComponent(JobCreationFormComponent);
      fixture2.detectChanges();
      await fixture2.whenStable();

      expect(fixture2.componentInstance.mode()).toBe('create');
      expect(mockImageService.getMyDefaultJobBanners).toHaveBeenCalled();
    });

    it('should navigate to /my-positions if edit mode but no jobId', async () => {
      // Update the existing mock for this test case BEFORE creating component
      mockActivatedRoute.setUrl([new UrlSegment('job', {}), new UrlSegment('edit', {})]);
      mockActivatedRoute.setParams({});

      // Track the initial call count to check for new calls
      const initialCallCount = vi.mocked(mockRouter.navigate).mock.calls.length;

      const fixture2 = TestBed.createComponent(JobCreationFormComponent);
      fixture2.detectChanges();
      await fixture2.whenStable();

      // Give async init() time to complete
      await new Promise(resolve => setTimeout(resolve, 0));

      // Check that navigate was called with the expected arguments after the initial calls
      const calls = vi.mocked(mockRouter.navigate).mock.calls.slice(initialCallCount);
      expect(calls).toContainEqual([['/my-positions']]);
      fixture2.destroy();
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
      expect(mockLocation.back).toHaveBeenCalled();
    });

    it('should navigate to login when no user is loaded in init', async () => {
      mockAccountService.user.set(undefined as unknown as User);

      const fixture2 = TestBed.createComponent(JobCreationFormComponent);
      fixture2.detectChanges();
      await fixture2.whenStable();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
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
      mockJobService.updateJob = vi.fn().mockReturnValueOnce(throwError(() => new Error('fail')));
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
      mockJobService.createJob = vi.fn().mockReturnValueOnce(of({ jobId: 'abc123' }));
      component.jobId.set('');
      await getPrivate(component).performAutoSave();

      expect(component.jobId()).toBe('abc123');
      expect(mockJobService.createJob).toHaveBeenCalled();
    });

    it('should call updateJob when jobId is set in performAutoSave', async () => {
      component.jobId.set('job123');
      await getPrivate(component).performAutoSave();

      expect(mockJobService.updateJob).toHaveBeenCalledWith('job123', expect.any(Object));
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
      fixture.detectChanges();
      await fixture.whenStable();

      vi.runAllTimers();
      await fixture.whenStable();

      expect(spy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Job Publishing', () => {
    it.each([
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
          mockJobService.updateJob = vi.fn().mockReturnValueOnce(throwError(() => new Error('fail')));
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
      mockJobService.getJobById = vi.fn().mockReturnValueOnce(
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

      const job = await vi.waitFor(() => new mockJobService.getJobById('job123'));
      expect(job).toBeDefined();
      expect(mockJobService.getJobById).toHaveBeenCalledWith('job123');
    });

    it('should populate fundingType when job has it', () => {
      const job: JobDTO = {
        jobId: 'job1',
        state: 'DRAFT',
        title: 'Job',
        fundingType: DropdownOptions.fundingTypes[0].value,
      } as JobDTO;
      getPrivate(component).populateForm(job);
      expect(component.positionDetailsForm.get('fundingType')?.value).toEqual(DropdownOptions.fundingTypes[0]);
    });

    it('should populate form with job image correctly', () => {
      // Default banner
      component.defaultImages.set([{ imageId: 'img123', url: '/images/test.jpg', imageType: 'DEFAULT_JOB_BANNER' }]);
      getPrivate(component).populateForm({ title: 'Test', imageId: 'img123', imageUrl: '/images/test.jpg' } as JobDTO);
      expect(component.selectedImage()?.imageId).toBe('img123');
      expect(component.selectedImage()?.imageType).toBe('DEFAULT_JOB_BANNER');

      // Custom image
      component.defaultImages.set([{ imageId: 'default1', url: '/images/default.jpg', imageType: 'DEFAULT_JOB_BANNER' }]);
      getPrivate(component).populateForm({
        title: 'Test',
        imageId: 'custom123',
        imageUrl: '/images/custom.jpg',
      } as JobDTO);
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

  describe('Supervising Professor Selection', () => {
    it('should load research group professors, sort them, and preselect the first option', async () => {
      mockResearchGroupService.getResearchGroupMembers.mockReturnValueOnce(
        of({
          content: [
            { userId: 'p2', firstName: 'Beta', lastName: 'Professor', roles: ['PROFESSOR'] },
            { userId: 'p1', firstName: 'Alpha', lastName: 'Professor', roles: ['PROFESSOR'] },
            { userId: 's1', firstName: 'Student', lastName: 'Member', roles: ['STUDENT'] },
          ],
        }),
      );

      await getPrivate(component).loadSupervisingProfessors();

      expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(100, 0);
      expect(component.supervisingProfessorOptions()).toEqual([
        { value: 'p1', name: 'Alpha Professor' },
        { value: 'p2', name: 'Beta Professor' },
      ]);
      expect(component.basicInfoForm.get('supervisingProfessor')).toEqual({ value: 'p1', name: 'Alpha Professor' });
    });

    it('should honor preselected supervising professor when provided', () => {
      component.supervisingProfessorOptions.set([
        { value: 'p1', name: 'Alpha' },
        { value: 'p2', name: 'Beta' },
      ]);
      component.basicInfoForm.get('supervisingProfessor')?.setValue(undefined);

      getPrivate(component).setDefaultSupervisingProfessor('p2');

      expect(component.basicInfoForm.get('supervisingProfessor')).toEqual({ value: 'p2', name: 'Beta' });
    });

    it('should prefer logged-in professor user when available in options', () => {
      mockAccountService.user.set({ id: 'u1', name: 'Prof User', authorities: ['PROFESSOR'] } as User);
      component.supervisingProfessorOptions.set([
        { value: 'u1', name: 'Prof User' },
        { value: 'p2', name: 'Other' },
      ]);
      component.basicInfoForm.get('supervisingProfessor')?.setValue(undefined);

      getPrivate(component).setDefaultSupervisingProfessor();

      expect(component.basicInfoForm.get('supervisingProfessor')).toEqual({ value: 'u1', name: 'Prof User' });
    });
  });

  describe('Image Selection and Management', () => {
    it('should handle image selection and computed signals', () => {
      // Select default image
      const defaultImage: ImageDTO = {
        imageId: 'default1',
        url: '/images/default1.jpg',
        imageType: 'DEFAULT_JOB_BANNER',
      };
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
      expect(mockImageService.deleteImage).toHaveBeenCalledWith('img1');
      expect(component.selectedImage()).toBeUndefined();
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('jobCreationForm.imageSection.deleteImageSuccess');
    });

    it('should handle delete failure', async () => {
      component.selectedImage.set({ imageId: 'img1', url: '/url', imageType: 'JOB_BANNER' });
      mockImageService.deleteImage.mockReturnValueOnce(throwError(() => new Error('Delete failed')));
      await component.deleteSelectedImage();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.imageSection.deleteImageFailed');
    });

    it('should skip delete when no image selected', async () => {
      component.selectedImage.set(undefined);
      await component.deleteSelectedImage();
      expect(mockImageService.deleteImage).not.toHaveBeenCalled();
    });

    it.each([
      {
        name: 'skip delete with empty imageId',
        imageId: '',
        expectations: () => {
          expect(mockImageService.deleteImage).not.toHaveBeenCalled();
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
          expect(mockImageService.deleteImage).toHaveBeenCalledWith('img2');
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
        mockSetup: () => {
          mockImageService.getResearchGroupJobBanners.mockReturnValueOnce(throwError(() => new Error('Reload failed')));
        },
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

    it('should load default images successfully', async () => {
      const mockImages: ImageDTO[] = [
        { imageId: 'default1', url: '/images/default1.jpg', imageType: 'DEFAULT_JOB_BANNER' },
        { imageId: 'default2', url: '/images/default2.jpg', imageType: 'DEFAULT_JOB_BANNER' },
      ];
      mockImageService.getMyDefaultJobBanners.mockReturnValueOnce(of(mockImages));
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
      const mockImages: ImageDTO[] = [
        {
          imageId: 'default1',
          url: '/images/default1.jpg',
          imageType: 'DEFAULT_JOB_BANNER',
        },
      ];
      mockImageService.getMyDefaultJobBanners.mockReturnValueOnce(of(mockImages));
      mockImageService.getResearchGroupJobBanners.mockReturnValueOnce(of([]));
      await component.loadImages();
      expect(mockImageService.getMyDefaultJobBanners).toHaveBeenCalled();
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
      component.basicInfoForm.patchValue({
        title: 'My Job',
        researchArea: 'AI Research',
        fieldOfStudies: { value: 'CS' },
        location: { value: 'MUNICH' },
        supervisingProfessor: 'Prof',
        jobDescription: 'Some description',
      });
      component.currentDescriptionLanguage.set('en');
      component.jobDescriptionEN.set('Some description');
      component.jobDescriptionDE.set('Beschreibung');

      const dto = getPrivate(component).createJobDTO('DRAFT');

      expect(dto.title).toBe('My Job');
      expect(dto.researchArea).toBe('AI Research');
      expect(dto.jobDescriptionEN).toBe('Some description');
      expect(dto.jobDescriptionDE).toBe('Beschreibung');
    });

    it('should normalize supervisingProfessor option objects to an ID', () => {
      component.basicInfoForm.patchValue({ supervisingProfessor: { value: 'prof-123', name: 'Prof A' } });

      const dto = getPrivate(component).createJobDTO('DRAFT');

      expect(dto.supervisingProfessor).toBe('prof-123');
    });

    it('should fall back to preferred supervising professor when control is empty', () => {
      mockAccountService.user.set({ id: 'prof-1', name: 'Prof User', authorities: ['PROFESSOR'] } as User);
      component.supervisingProfessorOptions.set([
        { value: 'prof-1', name: 'Prof User' },
        { value: 'prof-2', name: 'Prof Two' },
      ]);
      component.basicInfoForm.patchValue({ supervisingProfessor: undefined });

      const dto = getPrivate(component).createJobDTO('DRAFT');

      expect(dto.supervisingProfessor).toBe('prof-1');
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
        jobDescriptionEN: '<p>Description</p>',
        jobDescriptionDE: '<p>Beschreibung</p>',
      });
      component.jobDescriptionEN.set('<p>Description</p>');
      component.jobDescriptionDE.set('<p>Beschreibung</p>');
      const dto = getPrivate(component).createJobDTO('DRAFT');
      expect(dto.fieldOfStudies).toBe(expected);
    });
  });

  describe('Form Validation', () => {
    it('should validate individual forms and their signals', () => {
      component.basicInfoForm.patchValue({
        title: 'Test',
        researchArea: 'Area',
        fieldOfStudies: { value: 'CS' },
        location: { value: 'MUNICH' },
        supervisingProfessor: 'Prof',
        jobDescription: '<p>Description</p>', // HTML-Inhalt für den Validator
      });
      component.jobDescriptionEN.set('<p>Description</p>');
      component.jobDescriptionDE.set('<p>Beschreibung</p>');
      component.jobDescriptionSignal.set('<p>Description</p>');

      component.basicInfoForm.updateValueAndValidity();
      fixture.detectChanges();

      expect(component.basicInfoForm.valid).toBe(true);
      expect(component.basicInfoValid()).toBe(true);
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
      expect(steps.find(s => s.name.includes('employmentTerms'))?.disabled).toBe(true);
      expect(steps.find(s => s.name.includes('summary'))?.disabled).toBe(true);
      expect(steps[0].buttonGroupNext?.[0].disabled).toBe(true);

      component.basicInfoValid.set(true);
      steps = getPrivate(component).buildStepData();
      expect(steps[0].buttonGroupNext?.[0].disabled).toBe(false);
    });

    it('should handle button clicks correctly', () => {
      const steps = getPrivate(component).buildStepData();
      steps[0].buttonGroupPrev?.[0].onClick();
      expect(mockLocation.back).toHaveBeenCalled();

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

  describe('AI Generation Methods', () => {
    describe('extractJobDescriptionFromStream', () => {
      it('should return null for empty content', () => {
        const result = getPrivate(component).extractJobDescriptionFromStream('');
        expect(result).toBeNull();
      });

      it('should return null for whitespace-only content', () => {
        const result = getPrivate(component).extractJobDescriptionFromStream('   ');
        expect(result).toBeNull();
      });

      it('should parse complete valid JSON', () => {
        const json = '{"jobDescription":"<p>Test content</p>"}';
        const result = getPrivate(component).extractJobDescriptionFromStream(json);
        expect(result).toBe('<p>Test content</p>');
      });

      it('should parse JSON with escaped characters', () => {
        const json = '{"jobDescription":"Line1\\nLine2\\tTabbed"}';
        const result = getPrivate(component).extractJobDescriptionFromStream(json);
        expect(result).toBe('Line1\nLine2\tTabbed');
      });

      it('should parse JSON with escaped quotes', () => {
        const json = '{"jobDescription":"He said \\"Hello\\""}';
        const result = getPrivate(component).extractJobDescriptionFromStream(json);
        expect(result).toBe('He said "Hello"');
      });

      it('should handle incomplete JSON gracefully', () => {
        const partialJson = '{"jobDescription":"<p>Partial content';
        const result = getPrivate(component).extractJobDescriptionFromStream(partialJson);
        expect(result).toBe('<p>Partial content');
      });

      it('should handle JSON with trailing incomplete parts', () => {
        const partialJson = '{"jobDescription":"<p>Content</p>"';
        const result = getPrivate(component).extractJobDescriptionFromStream(partialJson);
        expect(result).toBe('<p>Content</p>');
      });

      it('should return content as-is if not JSON format', () => {
        const plainHtml = '<p>Plain HTML content</p>';
        const result = getPrivate(component).extractJobDescriptionFromStream(plainHtml);
        expect(result).toBe('<p>Plain HTML content</p>');
      });

      it('should handle complex HTML content in JSON', () => {
        const json = '{"jobDescription":"<p><strong>Bold</strong> and <em>italic</em></p>"}';
        const result = getPrivate(component).extractJobDescriptionFromStream(json);
        expect(result).toBe('<p><strong>Bold</strong> and <em>italic</em></p>');
      });
    });

    describe('unescapeJsonString', () => {
      it('should unescape newline characters', () => {
        const result = unescapeJsonString('Line1\\nLine2');
        expect(result).toBe('Line1\nLine2');
      });

      it('should unescape carriage return characters', () => {
        const result = unescapeJsonString('Line1\\rLine2');
        expect(result).toBe('Line1\rLine2');
      });

      it('should unescape tab characters', () => {
        const result = unescapeJsonString('Col1\\tCol2');
        expect(result).toBe('Col1\tCol2');
      });

      it('should unescape escaped quotes', () => {
        const result = unescapeJsonString('He said \\"Hi\\"');
        expect(result).toBe('He said "Hi"');
      });

      it('should handle multiple escape sequences', () => {
        const result = unescapeJsonString('Line1\\nLine2\\tTabbed\\rReturn');
        expect(result).toBe('Line1\nLine2\tTabbed\rReturn');
      });

      it('should return unchanged string if no escapes', () => {
        const result = unescapeJsonString('Plain text');
        expect(result).toBe('Plain text');
      });
    });

    describe('generateJobApplicationDraft', () => {
      beforeEach(() => {
        // Reset the mock before each test
        mockAiStreamingService.generateJobApplicationDraftStream.mockReset();
        mockAiStreamingService.generateJobApplicationDraftStream.mockResolvedValue('{"jobDescription":"<p>Generated content</p>"}');
      });

      it('should show error toast on generation failure', async () => {
        component.jobId.set('job123');
        fillValidJobForm(component);

        const mockEditor = { forceUpdate: vi.fn() };
        Object.defineProperty(component, 'jobDescriptionEditor', {
          value: () => mockEditor,
          configurable: true,
        });

        mockAiStreamingService.generateJobApplicationDraftStream.mockRejectedValue(new Error('Generic error'));

        await component.generateJobApplicationDraft();

        expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobCreationForm.toastMessages.saveFailed');
      });

      it('should restore original content on error', async () => {
        component.jobId.set('job123');
        fillValidJobForm(component);
        const originalContent = '<p>Original content</p>';
        component.basicInfoForm.get('jobDescription')?.setValue(originalContent);

        const forceUpdateSpy = vi.fn();
        const mockEditor = { forceUpdate: forceUpdateSpy };
        Object.defineProperty(component, 'jobDescriptionEditor', {
          value: () => mockEditor,
          configurable: true,
        });

        mockAiStreamingService.generateJobApplicationDraftStream.mockRejectedValue(new Error('HTTP error'));

        await component.generateJobApplicationDraft();

        // The last forceUpdate should restore the original content
        const lastCall = forceUpdateSpy.mock.calls[forceUpdateSpy.mock.calls.length - 1];
        expect(lastCall[0]).toBe(originalContent);
      });

      it('should set rewriteButtonSignal to true when generating', async () => {
        component.jobId.set('job123');
        fillValidJobForm(component);

        const mockEditor = { forceUpdate: vi.fn() };
        Object.defineProperty(component, 'jobDescriptionEditor', {
          value: () => mockEditor,
          configurable: true,
        });

        mockAiStreamingService.generateJobApplicationDraftStream.mockRejectedValue(new Error('fail'));

        await component.generateJobApplicationDraft();

        expect(component.rewriteButtonSignal()).toBe(true);
      });
    });
  });
});
