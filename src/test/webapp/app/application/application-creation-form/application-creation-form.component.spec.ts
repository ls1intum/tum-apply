import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Params, UrlSegment } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { createTranslateServiceMock, provideTranslateMock, TranslateServiceMock } from 'util/translate.mock';
import ApplicationCreationFormComponent from '../../../../../main/webapp/app/application/application-creation/application-creation-form/application-creation-form.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AccountService } from 'app/core/auth/account.service';
import { of, Subject, throwError } from 'rxjs';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateService } from '@ngx-translate/core';
import { SavingStates } from 'app/shared/constants/saving-states';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { HttpResponse } from '@angular/common/http';
import { ApplicationDetailDTO } from 'app/generated/model/applicationDetailDTO';
import { UpdateApplicationDTO } from 'app/generated/model/updateApplicationDTO';
import { UserDTO } from 'app/generated/model/userDTO';
import { ApplicantDTO } from 'app/generated/model/applicantDTO';
import { ApplicationCreationPage1Data } from 'app/application/application-creation/application-creation-page1/application-creation-page1.component';
import { ProgressStepperComponent } from 'app/shared/components/molecules/progress-stepper/progress-stepper.component';
import { AccountServiceMock, createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { createRouterMock, provideRouterMock, RouterMock } from 'util/router.mock';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { createLocationMock, provideLocationMock, LocationMock } from 'util/location.mock';
import { createAuthFacadeServiceMock, provideAuthFacadeServiceMock, AuthFacadeServiceMock } from 'util/auth-facade.service.mock';
import { createDialogServiceMock, provideDialogServiceMock, DialogServiceMock } from 'util/dialog.service.mock';
import {
  createAuthOrchestratorServiceMock,
  provideAuthOrchestratorServiceMock,
  AuthOrchestratorServiceMock,
} from 'util/auth-orchestrator.service.mock';
import { createLocalStorageServiceMock, provideLocalStorageServiceMock, LocalStorageServiceMock } from 'util/local-storage.service.mock';
import {
  createApplicationResourceApiServiceMock,
  provideApplicationResourceApiServiceMock,
  ApplicationResourceApiServiceMock,
  createMockApplicationDTO,
} from 'util/application-resource-api.service.mock';
import {
  createJobResourceApiServiceMock,
  provideJobResourceApiServiceMock,
  JobResourceApiServiceMock,
} from 'util/job-resource-api.service.mock';
import { ActivatedRouteMock, createActivatedRouteMock, provideActivatedRouteMock } from 'util/activated-route.mock';

function spyOnPrivate<T extends object>(obj: T, methodName: string) {
  return vi.spyOn(obj as any, methodName);
}

function mockReturnValuePrivate<R>(spy: MockInstance<(this: unknown, ...args: unknown[]) => unknown> | MockInstance<any>, mockValue: R) {
  return spy.mockReturnValue(mockValue as any);
}

type MockDialogRef = Pick<DynamicDialogRef, 'close'>;

function createMockDialogRef(): MockDialogRef {
  return {
    close: vi.fn(),
  };
}

function createProgressStepperMock(): ProgressStepperComponent {
  const mock = {
    goToStep: vi.fn(),
  };
  return mock as unknown as ProgressStepperComponent;
}

interface TestBedConfig {
  accountService: AccountServiceMock;
  applicationResourceApiService: ApplicationResourceApiServiceMock;
  router: RouterMock;
  location: LocationMock;
  toast: ToastServiceMock;
  authFacade: AuthFacadeServiceMock;
  activatedRoute: ActivatedRouteMock;
  dialogService: DialogServiceMock;
  authOrchestrator: AuthOrchestratorServiceMock;
  localStorageService: LocalStorageServiceMock;
  translateService: TranslateServiceMock;
  jobResourceService: JobResourceApiServiceMock;
}

async function configureTestBed(config: TestBedConfig) {
  return await TestBed.configureTestingModule({
    imports: [ApplicationCreationFormComponent],
    providers: [
      provideAccountServiceMock(config.accountService as any),
      provideApplicationResourceApiServiceMock(config.applicationResourceApiService),
      provideRouterMock(config.router),
      provideLocationMock(config.location),
      provideToastServiceMock(config.toast),
      provideAuthFacadeServiceMock(config.authFacade),
      provideActivatedRouteMock(config.activatedRoute),
      provideDialogServiceMock(config.dialogService),
      provideAuthOrchestratorServiceMock(config.authOrchestrator),
      provideLocalStorageServiceMock(config.localStorageService),
      provideJobResourceApiServiceMock(config.jobResourceService),
      provideTranslateMock(config.translateService),
      provideFontAwesomeTesting(),
    ],
  }).compileComponents();
}

function createValidPersonalInfoData(overrides?: Partial<ApplicationCreationPage1Data>): ApplicationCreationPage1Data {
  return {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    phoneNumber: '+1234567890',
    gender: undefined,
    nationality: undefined,
    dateOfBirth: '',
    website: '',
    linkedIn: '',
    street: '',
    city: '',
    country: undefined,
    postcode: '',
    ...overrides,
  };
}

describe('ApplicationForm', () => {
  let accountService: AccountServiceMock;
  let applicationResourceApiService: ApplicationResourceApiServiceMock;
  let toast: ToastServiceMock;
  let router: RouterMock;
  let location: LocationMock;
  let authFacade: AuthFacadeServiceMock;
  let dialogService: DialogServiceMock;
  let authOrchestrator: AuthOrchestratorServiceMock;
  let localStorageService: LocalStorageServiceMock;
  let translateService: TranslateServiceMock;
  let activatedRoute: ActivatedRouteMock;
  let jobResourceService: JobResourceApiServiceMock;

  let fixture: ComponentFixture<ApplicationCreationFormComponent>;
  let comp: ApplicationCreationFormComponent;
  beforeEach(async () => {
    accountService = createAccountServiceMock();

    applicationResourceApiService = createApplicationResourceApiServiceMock();

    toast = createToastServiceMock();
    router = createRouterMock();
    location = createLocationMock();
    authFacade = createAuthFacadeServiceMock();
    dialogService = createDialogServiceMock();
    dialogService.open = vi.fn().mockReturnValue(of({ close: vi.fn() }));

    authOrchestrator = createAuthOrchestratorServiceMock();
    authOrchestrator.email.set('email@email.com');
    authOrchestrator.firstName.set('firstname');
    authOrchestrator.lastName.set('lastname');

    localStorageService = createLocalStorageServiceMock();

    translateService = createTranslateServiceMock();

    jobResourceService = createJobResourceApiServiceMock();
    jobResourceService.getJobDetails = vi.fn().mockReturnValue({ title: 'Test Job' });

    activatedRoute = createActivatedRouteMock({}, { job: '123', application: '456' });

    await configureTestBed({
      accountService,
      applicationResourceApiService,
      router,
      location,
      toast,
      authFacade,
      activatedRoute,
      dialogService,
      authOrchestrator,
      localStorageService,
      translateService,
      jobResourceService,
    });
    fixture = TestBed.createComponent(ApplicationCreationFormComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create the component', () => {
    expect(comp).toBeTruthy();
  });

  it('should initialize jobId and applicationId from route', async () => {
    // wait for all async tasks to finish
    await fixture.whenStable();

    expect(comp.jobId()).toBe('123');
    expect(comp.applicationId()).toBe('456');
  });

  it('should call initPageCreateApplication when only jobId is provided in URL (no applicationId)', async () => {
    // Create new test setup without applicationId in URL

    TestBed.resetTestingModule();
    await configureTestBed({
      accountService,
      applicationResourceApiService,
      router,
      location,
      toast,
      authFacade,
      activatedRoute: createActivatedRouteMock({}, { job: '123' }),
      dialogService,
      authOrchestrator,
      localStorageService,
      translateService,
      jobResourceService,
    });

    const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
    const freshComp = freshFixture.componentInstance;

    const mockApp = {
      ...createMockApplicationDTO(ApplicationForApplicantDTO.ApplicationStateEnum.Saved),
      applicationId: 'new-app',
    };
    const initCreateSpy = vi.spyOn(freshComp, 'initPageCreateApplication').mockResolvedValue(mockApp);

    freshFixture.detectChanges();

    expect(initCreateSpy).toHaveBeenCalledWith('123');
    expect(freshComp.applicantId()).toBe('id-2'); // from accountService.user().id
  });

  it('should throw error when neither jobId nor applicationId is provided', async () => {
    TestBed.resetTestingModule();
    await configureTestBed({
      accountService,
      applicationResourceApiService,
      router,
      location,
      toast,
      authFacade,
      activatedRoute: createActivatedRouteMock({}, {}),
      dialogService,
      authOrchestrator,
      localStorageService,
      translateService,
      jobResourceService,
    });

    const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
    const freshComp = freshFixture.componentInstance;

    // Set up accountService to return a loaded user
    // This ensures the code tries to load from server and throws when no IDs provided
    accountService.loaded.set(true);
    accountService.user.set({ id: 'user-123', email: 'test@example.com', name: 'Test User' });

    // The error message will be the re-thrown message from the catch block
    await expect(freshComp.init()).rejects.toThrow(
      'Init failed with HTTP undefined undefined: Either job ID or application ID must be provided in the URL.',
    );

    // Also verify the error toast was shown
    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.loadFailed');
  });

  it('should call sendCreateApplicationData manually', async () => {
    const saveSpy = vi.spyOn(comp, 'sendCreateApplicationData').mockResolvedValue(true);

    await comp.sendCreateApplicationData('SAVED', false);

    expect(saveSpy).toHaveBeenCalled();
  });

  it('should show error if privacy is not accepted on send', () => {
    comp.additionalInfoForm.controls.privacyAccepted.setValue(false);
    comp.onConfirmSend();

    expect(toast.showErrorKey).toHaveBeenCalledWith('privacy.privacyConsent.toastError');
  });

  it('should show error if doctoral requirements are not accepted on send', () => {
    comp.additionalInfoForm.controls.privacyAccepted.setValue(true);
    comp.additionalInfoForm.controls.doctoralRequirementsAccepted.setValue(false);
    fixture.detectChanges();
    const sendSpy = vi.spyOn(comp, 'sendCreateApplicationData');

    comp.onConfirmSend();

    expect(toast.showErrorKey).toHaveBeenCalledWith('entity.applicationPage4.doctoralRequirements.toastError');
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('should send application if privacy accepted', async () => {
    comp.applicationId.set('456');
    comp.useLocalStorage.set(false);
    comp.additionalInfoForm.controls.privacyAccepted.setValue(true);
    comp.additionalInfoForm.controls.doctoralRequirementsAccepted.setValue(true);
    fixture.detectChanges();
    const sendSpy = vi.spyOn(comp, 'sendCreateApplicationData').mockResolvedValue(true);

    comp.onConfirmSend();

    // Wait for any async operations and promises to resolve
    await new Promise(resolve => setTimeout(resolve, 10));
    await fixture.whenStable();

    expect(sendSpy).toHaveBeenCalledWith('SENT', true);
  });

  describe('initPageForLocalStorage', () => {
    it('should load from local storage when unauthenticated', async () => {
      accountService.user.set(undefined);
      vi.mocked(localStorageService.loadApplicationDraft).mockReturnValue({
        applicationId: 'local-id',
        jobId: 'local-job',
        personalInfoData: createValidPersonalInfoData({
          email: 'local@example.com',
          firstName: 'Local',
          lastName: 'User',
        }),
        timestamp: new Date().toISOString(),
      });

      // recreate component
      fixture = TestBed.createComponent(ApplicationCreationFormComponent);
      comp = fixture.componentInstance;
      fixture.detectChanges();

      await fixture.whenStable();

      expect(comp.useLocalStorage()).toBe(true);
      expect(comp.applicationId()).toBe('local-id');
      expect(comp.personalInfoData().email).toBe('local@example.com');
    });

    it('should show error message when jobId is null in initPageForLocalStorageCase', async () => {
      const showErrorSpy = spyOnPrivate(comp, 'showInitErrorMessage');

      comp.initPageForLocalStorageCase(null);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.useLocalStorage()).toBe(true);
      expect(showErrorSpy).toHaveBeenCalledWith('entity.toast.applyFlow.missingJobIdUnauthenticated');
      expect(comp.jobId()).not.toBe(null); // jobId should NOT be set
    });

    // Additional test with empty string to be thorough
    it('should load data when jobId is empty string in initPageForLocalStorageCase', async () => {
      const loadDataSpy = spyOnPrivate(comp, 'loadPersonalInfoDataFromLocalStorage');

      comp.initPageForLocalStorageCase('');

      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 10));
      await fixture.whenStable();

      expect(comp.useLocalStorage()).toBe(true);
      expect(comp.jobId()).toBe('');
      expect(loadDataSpy).toHaveBeenCalledWith('');
    });

    // Test the if branch for completeness (if not already tested)
    it('should load data when jobId is provided in initPageForLocalStorageCase', async () => {
      const loadDataSpy = spyOnPrivate(comp, 'loadPersonalInfoDataFromLocalStorage');

      comp.initPageForLocalStorageCase('job-123');

      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.useLocalStorage()).toBe(true);
      expect(comp.jobId()).toBe('job-123');
      expect(loadDataSpy).toHaveBeenCalledWith('job-123');
      expect(comp.applicationState()).toBe('SAVED');
    });

    it('should set title when jobDetails are fetched with title in initPageForLocalStorageCase', async () => {
      const loadDataSpy = spyOnPrivate(comp, 'loadPersonalInfoDataFromLocalStorage');
      const mockJobDetails = { title: 'Senior Software Engineer' };

      jobResourceService.getJobDetails = vi.fn().mockReturnValue(of(mockJobDetails));

      comp.initPageForLocalStorageCase('job-456');

      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 50));
      await fixture.whenStable();

      expect(comp.useLocalStorage()).toBe(true);
      expect(comp.jobId()).toBe('job-456');
      expect(loadDataSpy).toHaveBeenCalledWith('job-456');
      expect(comp.applicationState()).toBe('SAVED');
      expect(comp.title()).toBe('Senior Software Engineer');
      expect(jobResourceService.getJobDetails).toHaveBeenCalledWith('job-456');
    });

    it('should handle missing title in jobDetails in initPageForLocalStorageCase', async () => {
      const loadDataSpy = spyOnPrivate(comp, 'loadPersonalInfoDataFromLocalStorage');
      const mockJobDetails = {}; // No title property

      // Reset title to empty string
      comp.title = signal('');

      jobResourceService.getJobDetails = vi.fn().mockReturnValue(of(mockJobDetails));

      comp.initPageForLocalStorageCase('job-789');

      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 50));
      await fixture.whenStable();

      expect(comp.useLocalStorage()).toBe(true);
      expect(comp.jobId()).toBe('job-789');
      expect(loadDataSpy).toHaveBeenCalledWith('job-789');
      expect(comp.applicationState()).toBe('SAVED');
      expect(comp.title()).toBe(''); // Title should remain empty since jobDetails has no title
      expect(jobResourceService.getJobDetails).toHaveBeenCalledWith('job-789');
    });

    it('should handle error when fetching jobDetails in initPageForLocalStorageCase', async () => {
      const loadDataSpy = spyOnPrivate(comp, 'loadPersonalInfoDataFromLocalStorage');

      jobResourceService.getJobDetails = vi.fn().mockReturnValue(throwError(() => new Error('Job fetch failed')));

      comp.initPageForLocalStorageCase('job-error');

      fixture.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 50));
      await fixture.whenStable();

      expect(comp.useLocalStorage()).toBe(true);
      expect(comp.jobId()).toBe('job-error');
      expect(loadDataSpy).toHaveBeenCalledWith('job-error');
      expect(comp.applicationState()).toBe('SAVED');
      // Error should be silently caught (no toast shown for non-critical operation)
      expect(jobResourceService.getJobDetails).toHaveBeenCalledWith('job-error');
    });
  });

  it('should set savingstate to SAVING onValueChanged', () => {
    comp.onValueChanged();
    expect(comp.savingState()).toBe(SavingStates.SAVING);
  });

  describe('saveToLocalStorage', () => {
    it('should save application draft to localStorage and return true on success', () => {
      // Set up component state
      comp.personalInfoData.set({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        dateOfBirth: '',
        city: '',
        linkedIn: '',
        postcode: '',
        street: '',
        website: '',
      });
      comp.applicationId.set('app-123');
      comp.jobId.set('job-456');

      const result = comp['saveToLocalStorage']();

      // Should call saveApplicationDraft with correct data
      expect(localStorageService.saveApplicationDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          personalInfoData: expect.any(Object),
          applicationId: 'app-123',
          jobId: 'job-456',
          timestamp: expect.any(String),
        }),
      );

      // Should NOT show error toast
      expect(toast.showErrorKey).not.toHaveBeenCalled();

      // Should return true
      expect(result).toBe(true);
    });

    it('should show error toast and return false when saveApplicationDraft throws an error', () => {
      // Set up component state
      comp.personalInfoData.set({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phoneNumber: '+9876543210',
        city: '',
        dateOfBirth: '',
        linkedIn: '',
        postcode: '',
        street: '',
        website: '',
      });
      comp.applicationId.set('app-789');
      comp.jobId.set('job-999');

      // Mock saveApplicationDraft to throw an error
      localStorageService.saveApplicationDraft = vi.fn().mockImplementation(() => {
        throw new Error('LocalStorage quota exceeded');
      });

      const result = comp['saveToLocalStorage']();

      // Should attempt to save
      expect(localStorageService.saveApplicationDraft).toHaveBeenCalled();

      // Should show error toast
      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.saveFailed');

      // Should return false
      expect(result).toBe(false);
    });

    it('should include timestamp in ISO format', () => {
      comp.personalInfoData.set(createValidPersonalInfoData({}));
      comp.applicationId.set('app-test');
      comp.jobId.set('job-test');

      const beforeTime = new Date().toISOString();
      comp['saveToLocalStorage']();
      const afterTime = new Date().toISOString();

      // Get the timestamp that was passed to saveApplicationDraft
      const callArgs = vi.mocked(localStorageService.saveApplicationDraft).mock.calls[0][0];
      const timestamp = callArgs.timestamp;

      // Timestamp should be a valid ISO string between before and after
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(timestamp >= beforeTime).toBe(true);
      expect(timestamp <= afterTime).toBe(true);
    });

    it('should save with empty strings when signals are empty', () => {
      comp.personalInfoData.set(createValidPersonalInfoData({}));
      comp.applicationId.set('');
      comp.jobId.set('');

      const result = comp['saveToLocalStorage']();

      expect(localStorageService.saveApplicationDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: '',
          jobId: '',
        }),
      );

      expect(result).toBe(true);
    });
  });

  // Tests for sendCreateApplicationData method

  describe('sendCreateApplicationData', () => {
    it('should show error and return false when applicationId is empty string', async () => {
      comp.applicationId.set('');

      const result = await comp.sendCreateApplicationData('SAVED', false);

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.errorApplicationId');
      expect(applicationResourceApiService.updateApplication).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should show error and return false when useLocalStorage is true', async () => {
      comp.applicationId.set('app-123');
      comp.useLocalStorage.set(true);

      const result = await comp.sendCreateApplicationData('SAVED', false);

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.authRequired');
      expect(applicationResourceApiService.updateApplication).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should update application, clear localStorage, show success toast and navigate when rerouteToOtherPage is true', async () => {
      comp.applicationId.set('app-456');
      comp.useLocalStorage.set(false);

      // Mock mapPagesToDTO
      const mockUpdateDTO = { applicationId: 'app-456', applicationState: 'SENT' };
      spyOnPrivate(comp, 'mapPagesToDTO').mockReturnValue(mockUpdateDTO);

      // Mock clearLocalStorage
      const clearLocalStorageSpy = spyOnPrivate(comp, 'clearLocalStorage').mockImplementation(() => {});

      // Mock updateApplication to return success
      applicationResourceApiService.updateApplication = vi.fn().mockReturnValue(
        of(
          new HttpResponse({
            body: {},
            status: 200,
          }),
        ),
      );

      const result = await comp.sendCreateApplicationData('SENT', true);

      expect(applicationResourceApiService.updateApplication).toHaveBeenCalledWith(mockUpdateDTO);
      expect(clearLocalStorageSpy).toHaveBeenCalled();
      expect(toast.showSuccessKey).toHaveBeenCalledWith('entity.toast.applyFlow.submitted');
      expect(router.navigate).toHaveBeenCalledWith(['/application/overview']);
      expect(result).toBe(true);
    });

    it('should update application, clear localStorage but NOT show success toast or navigate when rerouteToOtherPage is false', async () => {
      comp.applicationId.set('app-789');
      comp.useLocalStorage.set(false);

      // Mock mapPagesToDTO
      const mockUpdateDTO = { applicationId: 'app-789', applicationState: 'SAVED' };
      spyOnPrivate(comp, 'mapPagesToDTO').mockReturnValue(mockUpdateDTO);

      // Mock clearLocalStorage
      const clearLocalStorageSpy = spyOnPrivate(comp, 'clearLocalStorage').mockImplementation(() => {});

      // Mock updateApplication to return success
      applicationResourceApiService.updateApplication = vi.fn().mockReturnValue(
        of(
          new HttpResponse({
            body: {},
            status: 200,
          }),
        ),
      );

      const result = await comp.sendCreateApplicationData('SAVED', false);

      expect(applicationResourceApiService.updateApplication).toHaveBeenCalledWith(mockUpdateDTO);
      expect(clearLocalStorageSpy).toHaveBeenCalled();
      expect(toast.showSuccessKey).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should show error toast and return false when updateApplication throws an error', async () => {
      comp.applicationId.set('app-error');
      comp.useLocalStorage.set(false);

      // Mock mapPagesToDTO
      const mockUpdateDTO = { applicationId: 'app-error', applicationState: 'SAVED' };
      spyOnPrivate(comp, 'mapPagesToDTO').mockReturnValue(mockUpdateDTO);

      // Mock clearLocalStorage
      const clearLocalStorageSpy = spyOnPrivate(comp, 'clearLocalStorage').mockImplementation(() => {});

      // Mock updateApplication to throw an error
      applicationResourceApiService.updateApplication = vi.fn().mockReturnValue(throwError(() => new Error('Network error')));

      const result = await comp.sendCreateApplicationData('SAVED', false);

      expect(applicationResourceApiService.updateApplication).toHaveBeenCalledWith(mockUpdateDTO);
      expect(clearLocalStorageSpy).not.toHaveBeenCalled(); // Should NOT clear on error
      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.saveFailed');
      expect(result).toBe(false);
    });

    it('should handle SENT state correctly', async () => {
      comp.applicationId.set('app-submit');
      comp.useLocalStorage.set(false);

      // Mock mapPagesToDTO
      spyOnPrivate(comp, 'mapPagesToDTO').mockReturnValue({ applicationState: 'SENT' });
      spyOnPrivate(comp, 'clearLocalStorage').mockImplementation(() => {});

      applicationResourceApiService.updateApplication = vi.fn().mockReturnValue(
        of(
          new HttpResponse({
            body: {},
            status: 200,
          }),
        ),
      );

      const result = await comp.sendCreateApplicationData('SENT', false);

      expect(comp['mapPagesToDTO']).toHaveBeenCalledWith('SENT');
      expect(result).toBe(true);
    });

    it('should call accountService.loadUser once when state is SENT', async () => {
      comp.applicationId.set('app-123');
      comp.useLocalStorage.set(false);

      // Mock mapPagesToDTO
      spyOnPrivate(comp, 'mapPagesToDTO').mockReturnValue({ applicationState: 'SENT' });
      spyOnPrivate(comp, 'clearLocalStorage').mockImplementation(() => {});

      // Mock updateApplication to return success
      applicationResourceApiService.updateApplication = vi.fn().mockReturnValue(
        of(
          new HttpResponse({
            body: {},
            status: 200,
          }),
        ),
      );

      // Mock accountService.loadUser
      accountService.loadUser = vi.fn().mockResolvedValue(undefined);

      const result = await comp.sendCreateApplicationData('SENT', false);

      expect(accountService.loadUser).toHaveBeenCalledOnce();
      expect(result).toBe(true);
    });

    it('should NOT call accountService.loadUser when state is SAVED', async () => {
      comp.applicationId.set('app-456');
      comp.useLocalStorage.set(false);

      // Mock mapPagesToDTO
      spyOnPrivate(comp, 'mapPagesToDTO').mockReturnValue({ applicationState: 'SAVED' });
      spyOnPrivate(comp, 'clearLocalStorage').mockImplementation(() => {});

      // Mock updateApplication to return success
      applicationResourceApiService.updateApplication = vi.fn().mockReturnValue(
        of(
          new HttpResponse({
            body: {},
            status: 200,
          }),
        ),
      );

      // Mock accountService.loadUser
      accountService.loadUser = vi.fn().mockResolvedValue(undefined);

      const result = await comp.sendCreateApplicationData('SAVED', false);

      expect(accountService.loadUser).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  // Tests for private methods using type casting

  describe('mapPagesToDTO', () => {
    beforeEach(() => {
      // Set up component data
      comp.personalInfoData.set({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        gender: { value: 'male', name: 'Male' },
        nationality: { value: 'US', name: 'United States' },
        dateOfBirth: '1990-01-01',
        website: 'https://example.com',
        linkedIn: 'https://linkedin.com/in/johndoe',
        street: '123 Main St',
        city: 'New York',
        country: { value: 'US', name: 'United States' },
        postcode: '10001',
      });
      comp.educationData.set({
        bachelorDegreeName: 'Computer Science',
        bachelorDegreeUniversity: 'MIT',
        bachelorGrade: '3.8',
        //bachelorGradeLowerLimit: '4',
        //bachelorGradeUpperLimit: '1',
        masterDegreeName: 'Software Engineering',
        masterDegreeUniversity: 'Stanford',
        masterGrade: '3.9',
        //masterGradeLowerLimit: '4',
        //masterGradeUpperLimit: '1',
      });

      comp.applicationDetailsData.set({
        motivation: '<p>I am passionate about software</p>',
        skills: '<p>Java, TypeScript, Angular</p>',
        desiredStartDate: '2025-06-01',
        experiences: '<p>Built multiple apps</p>',
      });

      comp.applicationId.set('app-123');
      comp.applicantId.set('user-456');
    });

    it('should return UpdateApplicationDTO with all fields when state is provided', () => {
      const result = comp['mapPagesToDTO']('SENT') as UpdateApplicationDTO;

      expect(result.applicationId).toBe('app-123');
      expect(result.applicationState).toBe('SENT');
      expect(result.applicant?.user.userId).toBe('user-456');
      expect(result.applicant?.user.email).toBe('john@example.com');
      expect(result.applicant?.user.firstName).toBe('John');
      expect(result.applicant?.user.lastName).toBe('Doe');
      expect(result.applicant?.user.phoneNumber).toBe('+1234567890');
      expect(result.applicant?.city).toBe('New York');
      expect(result.applicant?.country).toBe('US');
      expect(result.applicant?.street).toBe('123 Main St');
      expect(result.applicant?.postalCode).toBe('10001');
      expect(result.motivation).toBe('<p>I am passionate about software</p>');
      expect(result.specialSkills).toBe('<p>Java, TypeScript, Angular</p>');
      expect(result.desiredDate).toBe('2025-06-01');
      expect(result.projects).toBe('<p>Built multiple apps</p>');
    });

    it('should return ApplicationDetailDTO without address fields when state is undefined', () => {
      comp.applicationState.set('SAVED');
      const result = comp['mapPagesToDTO'](undefined);

      expect(result.applicationId).toBe('app-123');
      expect(result.applicationState).toBe('SAVED');
      expect(result.applicant?.user.userId).toBe('user-456');
      expect(result.applicant?.user.email).toBe('john@example.com');
      // Should NOT have firstName, lastName, phoneNumber, city, country, etc.
      expect((result.applicant?.user as UserDTO).firstName).toBeUndefined();
      expect((result.applicant as ApplicantDTO).city).toBeUndefined();
    });

    it('should handle SAVED state', () => {
      const result = comp['mapPagesToDTO']('SAVED');
      expect(result.applicationState).toBe('SAVED');
    });

    it('should handle SENT state', () => {
      const result = comp['mapPagesToDTO']('SENT');
      expect(result.applicationState).toBe('SENT');
    });
  });

  describe('openOtpAndWaitForLogin', () => {
    it('should show error and return when email is empty', async () => {
      await comp['openOtpAndWaitForLogin']('', 'John', 'Doe');

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.invalidEmail');
      expect(authFacade.requestOtp).not.toHaveBeenCalled();
    });

    it('should show error and return when email is whitespace only', async () => {
      await comp['openOtpAndWaitForLogin']('   ', 'John', 'Doe');

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.invalidEmail');
      expect(authFacade.requestOtp).not.toHaveBeenCalled();
    });

    it('should show error and return when firstName is empty', async () => {
      await comp['openOtpAndWaitForLogin']('test@example.com', '', 'Doe');

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.invalidFirstName');
      expect(authFacade.requestOtp).not.toHaveBeenCalled();
    });

    it('should show error and return when firstName is whitespace only', async () => {
      await comp['openOtpAndWaitForLogin']('test@example.com', '   ', 'Doe');

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.invalidFirstName');
      expect(authFacade.requestOtp).not.toHaveBeenCalled();
    });

    it('should show error and return when lastName is empty', async () => {
      await comp['openOtpAndWaitForLogin']('test@example.com', 'John', '');

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.invalidLastName');
      expect(authFacade.requestOtp).not.toHaveBeenCalled();
    });

    it('should show error and return when lastName is whitespace only', async () => {
      await comp['openOtpAndWaitForLogin']('test@example.com', 'John', '   ');

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.invalidLastName');
      expect(authFacade.requestOtp).not.toHaveBeenCalled();
    });

    it('should trim email, firstName and lastName, set them in authOrchestrator, request OTP and open dialog', async () => {
      accountService.user.set({ id: 'user-123', email: 'test@example.com', name: 'John Doe' });

      authFacade.requestOtp = vi.fn().mockResolvedValue(undefined);

      // Mock dialog - return a mock ref object that won't actually render
      const mockDialogRef = { close: vi.fn() };
      mockReturnValuePrivate(vi.spyOn(dialogService, 'open'), mockDialogRef);

      // Use fake timers to prevent infinite waiting
      vi.useFakeTimers();

      comp['openOtpAndWaitForLogin']('  test@example.com  ', '  John  ', '  Doe  ');

      // Let the promise settle (requestOtp will resolve and dialog will open)
      vi.advanceTimersByTime(100);
      await Promise.resolve();

      // Verify the setup was done correctly (trimming and setting values)
      expect(authOrchestrator.email()).toBe('test@example.com');
      expect(authOrchestrator.firstName()).toBe('John');
      expect(authOrchestrator.lastName()).toBe('Doe');
      expect(authFacade.requestOtp).toHaveBeenCalledWith(true);

      // Clean up
      vi.useRealTimers();
    });

    it('should reject with timeout error when user does not log in within MAX_OTP_WAIT_TIME_MS', async () => {
      // Set up signals properly
      accountService.loaded.set(false);
      accountService.user.set(undefined);

      // Mock requestOtp
      authFacade.requestOtp = vi.fn().mockResolvedValue(undefined);

      // Mock dialog - return a mock ref object that won't actually render
      const closeDialogSpy = vi.fn();
      const mockDialogRef = createMockDialogRef();
      mockReturnValuePrivate(vi.spyOn(dialogService, 'open'), mockDialogRef);

      // Use fake timers
      vi.useFakeTimers();

      // Call the method under test
      const promise = comp['openOtpAndWaitForLogin']('test@example.com', 'John', 'Doe');

      // Let the promise settle (requestOtp will resolve)
      // The interval will be set up but won't trigger logged-in check
      vi.advanceTimersByTime(100);
      await Promise.resolve();

      // Verify requestOtp was called
      expect(authFacade.requestOtp).toHaveBeenCalledWith(true);

      // Now advance timers past the timeout
      // MAX_OTP_WAIT_TIME_MS is 600_000 (10 minutes)
      // The interval polls every 250ms, so we need to advance enough for the timeout check to trigger
      // We advance 601 seconds (601,000ms) to be past the 600,000ms timeout
      vi.advanceTimersByTime(601_000);

      // Allow microtasks to process so the rejection can be caught
      await Promise.resolve();

      // Now assert the promise was rejected with the timeout error
      await expect(promise).rejects.toThrow('OTP verification timeout. Please try again.');

      // Clean up
      vi.useRealTimers();
    });

    it('should successfully resolve, close dialog and clear interval when user logs in', async () => {
      accountService.loaded.set(true);
      accountService.user.set(undefined);

      authFacade.requestOtp = vi.fn().mockResolvedValue(undefined);

      const mockDialogRef = createMockDialogRef();
      mockReturnValuePrivate(vi.spyOn(dialogService, 'open'), mockDialogRef);

      vi.useFakeTimers();

      const promise = comp['openOtpAndWaitForLogin']('test@example.com', 'John', 'Doe');

      vi.advanceTimersByTime(100);
      await Promise.resolve();

      expect(authFacade.requestOtp).toHaveBeenCalledWith(true);

      // Simulate user login before timeout
      accountService.user.set({ id: 'new-user-123', email: 'test@example.com', name: 'John Doe' });

      vi.advanceTimersByTime(601_000);
      await Promise.resolve();

      await expect(promise).resolves.toBeUndefined();

      vi.useRealTimers();
    });
  });

  describe('migrateDraftIfNeeded', () => {
    it('should return early when useLocalStorage is false', async () => {
      comp.useLocalStorage.set(false);

      const initPageSpy = spyOnPrivate(comp, 'initPageCreateApplication');

      await comp['migrateDraftIfNeeded']();

      expect(initPageSpy).not.toHaveBeenCalled();
    });

    it('should return early when jobId is empty', async () => {
      comp.useLocalStorage.set(true);
      comp.jobId.set('');

      const initPageSpy = spyOnPrivate(comp, 'initPageCreateApplication');

      await comp['migrateDraftIfNeeded']();

      expect(initPageSpy).not.toHaveBeenCalled();
    });

    it('should migrate draft successfully when conditions are met', async () => {
      comp.useLocalStorage.set(true);
      comp.jobId.set('job-789');
      comp.applicationState.set('SAVED');

      const initPageSpy = spyOnPrivate(comp, 'initPageCreateApplication').mockResolvedValue(
        createMockApplicationDTO(ApplicationForApplicantDTO.ApplicationStateEnum.Saved),
      );
      const sendDataSpy = spyOnPrivate(comp, 'sendCreateApplicationData').mockResolvedValue(true);

      await comp['migrateDraftIfNeeded']();

      expect(initPageSpy).toHaveBeenCalledWith('job-789');
      expect(comp.useLocalStorage()).toBe(false);
      expect(comp.applicationId()).toBe('456');
      expect(comp.savingState()).toBe(SavingStates.SAVING);
      expect(sendDataSpy).toHaveBeenCalledWith('SAVED', false);
    });

    it('should show error toast when migration fails', async () => {
      comp.useLocalStorage.set(true);
      comp.jobId.set('job-error');

      spyOnPrivate(comp, 'initPageCreateApplication').mockRejectedValue(new Error('Migration failed'));

      await comp['migrateDraftIfNeeded']();

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.migrationFailed');
    });

    it('should keep previous applicationId if new one is undefined', async () => {
      comp.useLocalStorage.set(true);
      comp.jobId.set('job-789');
      comp.applicationId.set('old-app-id');

      const mockApplication = {
        ...createMockApplicationDTO(ApplicationForApplicantDTO.ApplicationStateEnum.Saved),
        applicationId: undefined,
      };

      spyOnPrivate(comp, 'initPageCreateApplication').mockResolvedValue(mockApplication);
      spyOnPrivate(comp, 'sendCreateApplicationData').mockResolvedValue(true);

      await comp['migrateDraftIfNeeded']();

      expect(comp.applicationId()).toBe('old-app-id');
    });
  });

  describe('handleNextFromStep1', () => {
    it('should return early when applicantId is already set', () => {
      comp.applicantId.set('existing-user-123');

      const openOtpSpy = spyOnPrivate(comp, 'openOtpAndWaitForLogin');

      comp['handleNextFromStep1']();

      expect(openOtpSpy).not.toHaveBeenCalled();
    });

    it('should call openOtpAndWaitForLogin with correct parameters when applicantId is not set', async () => {
      comp.applicantId.set('');
      comp.personalInfoData.set(
        createValidPersonalInfoData({
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        }),
      );

      const openOtpSpy = spyOnPrivate(comp, 'openOtpAndWaitForLogin').mockResolvedValue(undefined);

      accountService.user.set({ id: 'new-user-456', email: 'test@example.com', name: 'Jane Smith' });

      const progressStepperMock = {
        goToStep: vi.fn(),
      };
      mockReturnValuePrivate(vi.spyOn(comp, 'progressStepper'), progressStepperMock);

      comp['handleNextFromStep1']();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(openOtpSpy).toHaveBeenCalledWith('test@example.com', 'Jane', 'Smith');
    });

    it('should show error toast when openOtpAndWaitForLogin fails', async () => {
      comp.applicantId.set('');
      comp.personalInfoData.set(
        createValidPersonalInfoData({
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        }),
      );

      spyOnPrivate(comp, 'openOtpAndWaitForLogin').mockRejectedValue(new Error('OTP failed'));

      comp['handleNextFromStep1']();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.otpVerificationFailed');
    });

    it('should set applicantId to empty string when loadedUser().id is undefined (nullish coalescing operator)', async () => {
      comp.applicantId.set('');
      comp.personalInfoData.set(
        createValidPersonalInfoData({
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        }),
      );

      const openOtpSpy = spyOnPrivate(comp, 'openOtpAndWaitForLogin').mockResolvedValue(undefined);
      const migrateDraftSpy = spyOnPrivate(comp, 'migrateDraftIfNeeded').mockResolvedValue(undefined);

      // Set up loadedUser to return undefined id (simulating the ?? '' fallback case)
      accountService.user.set({ id: undefined as any, email: 'test@example.com', name: 'Jane Smith' });

      const progressStepperMock = {
        goToStep: vi.fn(),
      };
      mockReturnValuePrivate(vi.spyOn(comp, 'progressStepper'), progressStepperMock);

      comp['handleNextFromStep1']();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should call openOtpAndWaitForLogin
      expect(openOtpSpy).toHaveBeenCalledWith('test@example.com', 'Jane', 'Smith');

      // Should set applicantId to empty string when id is undefined (nullish coalescing fallback)
      expect(comp.applicantId()).toBe('');

      // Should still call migrateDraftIfNeeded
      expect(migrateDraftSpy).toHaveBeenCalled();

      // Should still navigate to step 2
      expect(progressStepperMock.goToStep).toHaveBeenCalledWith(2);
    });

    it('should set applicantId to empty string when loadedUser is null (nullish coalescing operator)', async () => {
      comp.applicantId.set('');
      comp.personalInfoData.set(
        createValidPersonalInfoData({
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        }),
      );

      const openOtpSpy = spyOnPrivate(comp, 'openOtpAndWaitForLogin').mockResolvedValue(undefined);
      const migrateDraftSpy = spyOnPrivate(comp, 'migrateDraftIfNeeded').mockResolvedValue(undefined);

      // Set up loadedUser to return null/undefined (simulating the ?? '' fallback case)
      accountService.user.set(undefined);

      const progressStepperMock = {
        goToStep: vi.fn(),
      };
      mockReturnValuePrivate(vi.spyOn(comp, 'progressStepper'), progressStepperMock);

      comp['handleNextFromStep1']();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should call openOtpAndWaitForLogin
      expect(openOtpSpy).toHaveBeenCalledWith('test@example.com', 'Jane', 'Smith');

      // Should set applicantId to empty string when loadedUser is null/undefined (nullish coalescing fallback)
      expect(comp.applicantId()).toBe('');

      // Should still call migrateDraftIfNeeded
      expect(migrateDraftSpy).toHaveBeenCalled();

      // Should still navigate to step 2
      expect(progressStepperMock.goToStep).toHaveBeenCalledWith(2);
    });

    it('should set applicantId to user id when loadedUser().id has a value', async () => {
      comp.applicantId.set('');
      comp.personalInfoData.set(
        createValidPersonalInfoData({
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        }),
      );

      const openOtpSpy = spyOnPrivate(comp, 'openOtpAndWaitForLogin').mockResolvedValue(undefined);
      const migrateDraftSpy = spyOnPrivate(comp, 'migrateDraftIfNeeded').mockResolvedValue(undefined);

      // Set up loadedUser with a valid id
      accountService.user.set({ id: 'valid-user-789', email: 'test@example.com', name: 'Jane Smith' });

      const progressStepperMock = createProgressStepperMock();

      vi.spyOn(comp, 'progressStepper').mockReturnValue(progressStepperMock);

      comp['handleNextFromStep1']();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should call openOtpAndWaitForLogin
      expect(openOtpSpy).toHaveBeenCalledWith('test@example.com', 'Jane', 'Smith');

      // Should set applicantId to the user id (not empty string)
      expect(comp.applicantId()).toBe('valid-user-789');

      // Should still call migrateDraftIfNeeded
      expect(migrateDraftSpy).toHaveBeenCalled();

      // Should still navigate to step 2
      expect(progressStepperMock.goToStep).toHaveBeenCalledWith(2);
    });
  });

  describe('step onClick handlers', () => {
    beforeEach(() => {
      // Set up valid state so steps are created
      comp.personalInfoDataValid.set(true);
      comp.educationDataValid.set(true);
      comp.applicationDetailsDataValid.set(true);
      comp.applicantId.set('user-123');
      fixture.detectChanges();
    });

    describe('personalInfo step buttons', () => {
      it('should call performAutomaticSave and location.back when back button is clicked', async () => {
        const performSaveSpy = spyOnPrivate(comp, 'performAutomaticSave').mockResolvedValue(undefined);

        const steps = comp.stepData();
        const personalInfoStep = steps[0]; // First step
        const backButton = personalInfoStep.buttonGroupPrev[0];

        backButton.onClick();

        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(performSaveSpy).toHaveBeenCalled();
        expect(location.back).toHaveBeenCalled();
      });

      it('should call handleNextFromStep1 when next button is clicked', () => {
        const handleNextSpy = spyOnPrivate(comp, 'handleNextFromStep1').mockImplementation(() => {});

        const steps = comp.stepData();
        const personalInfoStep = steps[0];
        const nextButton = personalInfoStep.buttonGroupNext[0];

        nextButton.onClick();

        expect(handleNextSpy).toHaveBeenCalled();
      });
    });

    describe('education step buttons', () => {
      it('should call updateDocumentInformation when prev button is clicked', () => {
        // Creating a fresh component to ensure computed runs with spy in place
        const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
        const freshComp = freshFixture.componentInstance;
        freshComp.personalInfoDataValid.set(true);
        freshComp.educationDataValid.set(true);
        freshComp.applicationDetailsDataValid.set(true);
        freshComp.applicantId.set('user-123');

        // Spy on the fresh component
        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => {});

        freshFixture.detectChanges();

        const steps = freshComp.stepData();
        const educationStep = steps[1]; // Second step
        const prevButton = educationStep.buttonGroupPrev[0];

        prevButton.onClick();

        expect(freshSpy).toHaveBeenCalled();
      });

      it('should call updateDocumentInformation when next button is clicked', () => {
        // Create a fresh component
        const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
        const freshComp = freshFixture.componentInstance;
        freshComp.personalInfoDataValid.set(true);
        freshComp.educationDataValid.set(true);
        freshComp.applicationDetailsDataValid.set(true);
        freshComp.applicantId.set('user-123');

        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => {});

        freshFixture.detectChanges();

        const steps = freshComp.stepData();
        const educationStep = steps[1];
        const nextButton = educationStep.buttonGroupNext[0];

        nextButton.onClick();

        expect(freshSpy).toHaveBeenCalled();
      });
    });
    describe('applicationDetails step buttons', () => {
      it('should call updateDocumentInformation when prev button is clicked', () => {
        const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
        const freshComp = freshFixture.componentInstance;
        freshComp.personalInfoDataValid.set(true);
        freshComp.educationDataValid.set(true);
        freshComp.applicationDetailsDataValid.set(true);
        freshComp.applicantId.set('user-123');

        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => {});

        freshFixture.detectChanges();

        const steps = freshComp.stepData();
        const applicationDetailsStep = steps[2]; // Third step
        const prevButton = applicationDetailsStep.buttonGroupPrev[0];

        prevButton.onClick();

        expect(freshSpy).toHaveBeenCalled();
      });

      it('should call updateDocumentInformation when next button is clicked', () => {
        const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
        const freshComp = freshFixture.componentInstance;
        freshComp.personalInfoDataValid.set(true);
        freshComp.educationDataValid.set(true);
        freshComp.applicationDetailsDataValid.set(true);
        freshComp.applicantId.set('user-123');

        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => {});

        freshFixture.detectChanges();

        const steps = freshComp.stepData();
        const applicationDetailsStep = steps[2];
        const nextButton = applicationDetailsStep.buttonGroupNext[0];

        nextButton.onClick();

        expect(freshSpy).toHaveBeenCalled();
      });
    });
    describe('summary step buttons', () => {
      it('should call updateDocumentInformation when prev button is clicked', () => {
        const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
        const freshComp = freshFixture.componentInstance;
        freshComp.personalInfoDataValid.set(true);
        freshComp.educationDataValid.set(true);
        freshComp.applicationDetailsDataValid.set(true);
        freshComp.applicantId.set('user-123');

        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => {});

        freshFixture.detectChanges();

        const steps = freshComp.stepData();
        const summaryStep = steps[3]; // Fourth step
        const prevButton = summaryStep.buttonGroupPrev[0];

        prevButton.onClick();

        expect(freshSpy).toHaveBeenCalled();
      });

      it('should call sendConfirmDialog confirm when send button is clicked', () => {
        const confirmDialogMock = { confirm: vi.fn() };
        mockReturnValuePrivate(vi.spyOn(comp, 'sendConfirmDialog'), confirmDialogMock);

        // Re-trigger computed after spy is set up
        fixture.detectChanges();

        const steps = comp.stepData();
        const summaryStep = steps[3];
        const sendButton = summaryStep.buttonGroupNext[0];

        sendButton.onClick();

        expect(confirmDialogMock.confirm).toHaveBeenCalled();
      });
    });

    describe('step disabled states', () => {
      it('should disable education step when personalInfoDataValid is false', () => {
        comp.personalInfoDataValid.set(false);
        fixture.detectChanges();

        const steps = comp.stepData();
        const educationStep = steps[1];

        expect(educationStep.disabled).toBe(true);
      });

      it('should disable education step when applicantId is empty', () => {
        comp.applicantId.set('');
        fixture.detectChanges();

        const steps = comp.stepData();
        const educationStep = steps[1];

        expect(educationStep.disabled).toBe(true);
      });

      it('should disable applicationDetails step when personalInfoAndEducationDataValid is false', () => {
        comp.personalInfoDataValid.set(false);
        fixture.detectChanges();

        const steps = comp.stepData();
        const applicationDetailsStep = steps[2];

        expect(applicationDetailsStep.disabled).toBe(true);
      });

      it('should disable summary step when allDataValid is false', () => {
        comp.applicationDetailsDataValid.set(false);
        fixture.detectChanges();

        const steps = comp.stepData();
        const summaryStep = steps[3];

        expect(summaryStep.disabled).toBe(true);
      });
    });

    describe('button disabled states', () => {
      it('should disable personalInfo next button when personalInfoDataValid is false', () => {
        comp.personalInfoDataValid.set(false);
        fixture.detectChanges();

        const steps = comp.stepData();
        const personalInfoStep = steps[0];
        const nextButton = personalInfoStep.buttonGroupNext[0];

        expect(nextButton.disabled).toBe(true);
      });

      it('should disable education next button when educationDataValid is false', () => {
        comp.educationDataValid.set(false);
        fixture.detectChanges();

        const steps = comp.stepData();
        const educationStep = steps[1];
        const nextButton = educationStep.buttonGroupNext[0];

        expect(nextButton.disabled).toBe(true);
      });

      it('should disable applicationDetails next button when applicationDetailsDataValid is false', () => {
        comp.applicationDetailsDataValid.set(false);
        fixture.detectChanges();

        const steps = comp.stepData();
        const applicationDetailsStep = steps[2];
        const nextButton = applicationDetailsStep.buttonGroupNext[0];

        expect(nextButton.disabled).toBe(true);
      });

      it('should disable summary send button when allPagesValid is false', () => {
        comp.personalInfoDataValid.set(false);
        fixture.detectChanges();

        const steps = comp.stepData();
        const summaryStep = steps[3];
        const sendButton = summaryStep.buttonGroupNext[0];

        expect(sendButton.disabled).toBe(true);
      });
    });

    describe('button changePanel property', () => {
      it('should set changePanel to false for personalInfo next button when applicantId is empty', () => {
        comp.applicantId.set('');
        fixture.detectChanges();

        const steps = comp.stepData();
        const personalInfoStep = steps[0];
        const nextButton = personalInfoStep.buttonGroupNext[0];

        expect(nextButton.changePanel).toBe(false);
      });

      it('should set changePanel to true for personalInfo next button when applicantId is set', () => {
        comp.applicantId.set('user-123');
        fixture.detectChanges();

        const steps = comp.stepData();
        const personalInfoStep = steps[0];
        const nextButton = personalInfoStep.buttonGroupNext[0];

        expect(nextButton.changePanel).toBe(true);
      });
    });
  });

  describe('savingBadgeCalculatedClass', () => {
    it('should return class with saved_color when savingState is SAVED', () => {
      comp.savingState.set(SavingStates.SAVED);

      const result = comp.savingBadgeCalculatedClass();

      expect(result).toBe('flex flex-wrap justify-around content-center gap-1 saved_color');
    });

    it('should return class with failed_color when savingState is FAILED', () => {
      comp.savingState.set(SavingStates.FAILED);

      const result = comp.savingBadgeCalculatedClass();

      expect(result).toBe('flex flex-wrap justify-around content-center gap-1 failed_color');
    });

    it('should return class with saving_color when savingState is SAVING', () => {
      comp.savingState.set(SavingStates.SAVING);

      const result = comp.savingBadgeCalculatedClass();

      expect(result).toBe('flex flex-wrap justify-around content-center gap-1 saving_color');
    });

    it('should return class with saving_color for any other savingState value', () => {
      // Test with a value that's not SAVED or FAILED
      comp.savingState.set('SAVING');

      const result = comp.savingBadgeCalculatedClass();

      expect(result).toBe('flex flex-wrap justify-around content-center gap-1 saving_color');
    });
  });

  describe('allPagesValid computed property', () => {
    it('should return false when personalInfoDataValid is false', async () => {
      // First check fails - short circuits
      comp.personalInfoDataValid.set(false);
      comp.educationDataValid.set(true);
      comp.applicationDetailsDataValid.set(true);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.allPagesValid()).toBe(false);
    });

    it('should return false when personalInfoDataValid is true but educationDataValid is false', async () => {
      // First check passes, second check fails
      comp.personalInfoDataValid.set(true);
      comp.educationDataValid.set(false);
      comp.applicationDetailsDataValid.set(true);

      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.allPagesValid()).toBe(false);
    });

    it('should return false when personalInfo and education are valid but applicationDetails is invalid', async () => {
      // First two checks pass, third check fails
      comp.personalInfoDataValid.set(true);
      comp.educationDataValid.set(true);
      comp.applicationDetailsDataValid.set(false);

      fixture.detectChanges();
      await fixture.whenStable();
      expect(comp.allPagesValid()).toBe(false);
    });

    it('should return true when all three validation signals are true', async () => {
      // All checks pass
      comp.educationDataValid.set(true);
      comp.personalInfoDataValid.set(true);
      comp.applicationDetailsDataValid.set(true);
      expect(comp.allPagesValid()).toBe(true);
    });
  });

  describe('data validity callbacks', () => {
    it('should set educationDataValid to true when onEducationDataValidityChanged is called with true', () => {
      comp.onEducationDataValidityChanged(true);
      expect(comp.educationDataValid()).toBe(true);
    });

    it('should set educationDataValid to false when onEducationDataValidityChanged is called with false', () => {
      comp.onEducationDataValidityChanged(false);
      expect(comp.educationDataValid()).toBe(false);
    });

    it('should set applicationDetailsDataValid to true when onApplicationDetailsDataValidityChanged is called with true', () => {
      comp.onApplicationDetailsDataValidityChanged(true);
      expect(comp.applicationDetailsDataValid()).toBe(true);
    });

    it('should set applicationDetailsDataValid to false when onApplicationDetailsDataValidityChanged is called with false', () => {
      comp.onApplicationDetailsDataValidityChanged(false);
      expect(comp.applicationDetailsDataValid()).toBe(false);
    });
  });

  describe('performAutomaticSave', () => {
    it('should do nothing when savingState is not SAVING', async () => {
      comp.savingState.set(SavingStates.SAVED); // Not SAVING

      const saveToLocalStorageSpy = spyOnPrivate(comp, 'saveToLocalStorage');
      const sendCreateApplicationDataSpy = vi.spyOn(comp, 'sendCreateApplicationData');

      await comp.performAutomaticSave();

      fixture.detectChanges();
      await fixture.whenStable();

      // Should not call any save methods
      expect(saveToLocalStorageSpy).not.toHaveBeenCalled();
      expect(sendCreateApplicationDataSpy).not.toHaveBeenCalled();
      // State should remain unchanged
      expect(comp.savingState()).toBe(SavingStates.SAVED);
    });

    it('should save to localStorage and set state to SAVED when useLocalStorage is true and save succeeds', async () => {
      comp.savingState.set(SavingStates.SAVING);
      comp.useLocalStorage.set(true);

      const saveToLocalStorageSpy = spyOnPrivate(comp, 'saveToLocalStorage').mockReturnValue(true);

      await comp.performAutomaticSave();

      fixture.detectChanges();
      await fixture.whenStable();

      expect(saveToLocalStorageSpy).toHaveBeenCalled();
      expect(comp.savingState()).toBe(SavingStates.SAVED);
    });

    it('should save to localStorage and set state to FAILED when useLocalStorage is true and save fails', async () => {
      comp.savingState.set(SavingStates.SAVING);
      comp.useLocalStorage.set(true);

      const saveToLocalStorageSpy = spyOnPrivate(comp, 'saveToLocalStorage').mockReturnValue(false);

      await comp.performAutomaticSave();

      fixture.detectChanges();
      await fixture.whenStable();

      expect(saveToLocalStorageSpy).toHaveBeenCalled();
      expect(comp.savingState()).toBe(SavingStates.FAILED);
    });

    it('should save to server and set state to SAVED when useLocalStorage is false and save succeeds', async () => {
      comp.savingState.set(SavingStates.SAVING);
      comp.useLocalStorage.set(false);
      comp.applicationState.set('SAVED'); // Example application state

      const sendCreateApplicationDataSpy = vi.spyOn(comp, 'sendCreateApplicationData').mockResolvedValue(true);

      await comp.performAutomaticSave();

      fixture.detectChanges();
      await fixture.whenStable();

      expect(sendCreateApplicationDataSpy).toHaveBeenCalledWith('SAVED', false);
      expect(comp.savingState()).toBe(SavingStates.SAVED);
    });

    it('should save to server and set state to FAILED when useLocalStorage is false and save fails', async () => {
      comp.savingState.set(SavingStates.SAVING);
      comp.useLocalStorage.set(false);
      comp.applicationState.set('SAVED');

      const sendCreateApplicationDataSpy = vi.spyOn(comp, 'sendCreateApplicationData').mockResolvedValue(false);

      await comp.performAutomaticSave();

      fixture.detectChanges();
      await fixture.whenStable();

      expect(sendCreateApplicationDataSpy).toHaveBeenCalledWith('SAVED', false);
      expect(comp.savingState()).toBe(SavingStates.FAILED);
    });
  });

  describe('initPageCreateApplication', () => {
    it('should create application, set applicationId, navigate with query params and return application when state is SAVED', async () => {
      const result = await comp.initPageCreateApplication('123');

      fixture.detectChanges();
      await fixture.whenStable();

      // Should create application
      expect(applicationResourceApiService.createApplication).toHaveBeenCalledWith('123');

      // Should set applicationId
      expect(comp.applicationId()).toBe('456');

      // Should navigate with query params
      const injectedRoute = TestBed.inject(ActivatedRoute);
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: injectedRoute,
        queryParams: { job: '123', application: '456' },
        queryParamsHandling: 'merge',
      });

      // Should NOT show error toast
      expect(toast.showErrorKey).not.toHaveBeenCalled();

      // Should return the application
      expect(result).toEqual(createMockApplicationDTO(ApplicationForApplicantDTO.ApplicationStateEnum.Saved));
    });

    it('should show error toast, navigate to detail page and throw error when application state is not SAVED', async () => {
      const mockApplication = createMockApplicationDTO(ApplicationDetailDTO.ApplicationStateEnum.Sent);

      // Reconfigure the existing mock
      applicationResourceApiService.createApplication = vi.fn().mockReturnValue(of(mockApplication));
      await expect(comp.initPageCreateApplication('job-456')).rejects.toThrow('Application is not editable.');

      fixture.detectChanges();
      await fixture.whenStable();

      expect(applicationResourceApiService.createApplication).toHaveBeenCalledWith('job-456');
      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.notEditable');
      expect(router.navigate).toHaveBeenCalledWith(['/application/detail', '456']);
    });

    it('should handle application with undefined applicationId', async () => {
      // Reconfigure the existing mock
      let mockApplication = {
        ...createMockApplicationDTO(ApplicationForApplicantDTO.ApplicationStateEnum.Saved),
        applicationId: undefined,
      };
      applicationResourceApiService.createApplication = vi.fn().mockReturnValue(of(mockApplication));

      const result = await comp.initPageCreateApplication('job-456');

      fixture.detectChanges();
      await fixture.whenStable();
      expect(comp.applicationId()).toBe('');

      // Should navigate with undefined application in query params
      const injectedRoute = TestBed.inject(ActivatedRoute);
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: injectedRoute,
        queryParams: { job: 'job-456', application: undefined },
        queryParamsHandling: 'merge',
      });

      expect(result).toEqual(mockApplication);
    });

    it('should handle SAVED state as non-editable', async () => {
      applicationResourceApiService.createApplication = vi
        .fn()
        .mockReturnValue(of(createMockApplicationDTO(ApplicationDetailDTO.ApplicationStateEnum.Sent)));

      await expect(comp.initPageCreateApplication('job-456')).rejects.toThrow('Application is not editable.');

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.notEditable');
      expect(router.navigate).toHaveBeenCalledWith(['/application/detail', '456']);
    });
  });

  describe('initPageLoadExistingApplication', () => {
    it('should load application and return it when application state is SAVED', async () => {
      applicationResourceApiService.getApplicationById = vi
        .fn()
        .mockReturnValue(of(createMockApplicationDTO(ApplicationForApplicantDTO.ApplicationStateEnum.Saved)));

      const result = await comp.initPageLoadExistingApplication('existing-app-123');

      fixture.detectChanges();
      await fixture.whenStable();
      expect(applicationResourceApiService.getApplicationById).toHaveBeenCalledWith('existing-app-123');
      expect(comp.applicationId()).toBe('existing-app-123');
      expect(toast.showErrorKey).not.toHaveBeenCalled();
      // Should NOT navigate away
      expect(router.navigate).not.toHaveBeenCalled();
      expect(result).toEqual(createMockApplicationDTO(ApplicationForApplicantDTO.ApplicationStateEnum.Saved));
    });

    it('should show error toast, navigate to detail page and throw error when application state is not SAVED', async () => {
      const mockApplication = createMockApplicationDTO(ApplicationDetailDTO.ApplicationStateEnum.Sent);

      applicationResourceApiService.getApplicationById = vi.fn().mockReturnValue(of(mockApplication));

      // Should throw an error
      await expect(comp.initPageLoadExistingApplication('existing-app-456')).rejects.toThrow('Application is not editable.');

      fixture.detectChanges();
      await fixture.whenStable();

      expect(applicationResourceApiService.getApplicationById).toHaveBeenCalledWith('existing-app-456');
      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.notEditable');
      expect(router.navigate).toHaveBeenCalledWith(['/application/detail', 'existing-app-456']);
      expect(comp.applicationId()).not.toBe('existing-app-456');
    });

    it('should handle REJECTED application state as not editable', async () => {
      const mockApplication = createMockApplicationDTO(ApplicationDetailDTO.ApplicationStateEnum.Rejected);

      applicationResourceApiService.getApplicationById = vi.fn().mockReturnValue(of(mockApplication));

      await expect(comp.initPageLoadExistingApplication('456')).rejects.toThrow('Application is not editable.');

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.notEditable');
      expect(router.navigate).toHaveBeenCalledWith(['/application/detail', '456']);
    });
  });

  describe('updateDocumentInformation', () => {
    it('should return early when useLocalStorage is true (if block)', () => {
      comp.useLocalStorage.set(true);
      comp.applicationId.set('app-123');

      const getDocumentDictionaryIdsSpy = vi.spyOn(applicationResourceApiService, 'getDocumentDictionaryIds');
      getDocumentDictionaryIdsSpy.mockClear();

      comp.updateDocumentInformation();

      // Should NOT call getDocumentDictionaryIds when using local storage
      expect(getDocumentDictionaryIdsSpy).not.toHaveBeenCalled();

      // documentIds should remain empty
      expect(comp.documentIds()).toStrictEqual({});
    });

    it('should fetch document ids when useLocalStorage is false', async () => {
      comp.useLocalStorage.set(false);
      comp.applicationId.set('app-456');

      const mockDocumentIds = { documentId1: 'doc-1', documentId2: 'doc-2' };
      applicationResourceApiService.getDocumentDictionaryIds = vi.fn().mockReturnValue(of(mockDocumentIds));

      comp.updateDocumentInformation();

      // Wait for async operation to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should call getDocumentDictionaryIds
      expect(applicationResourceApiService.getDocumentDictionaryIds).toHaveBeenCalledWith('app-456');

      // Should set documentIds
      expect(comp.documentIds()).toEqual(mockDocumentIds);
    });

    it('should show error toast when getDocumentDictionaryIds fails', async () => {
      comp.useLocalStorage.set(false);
      comp.applicationId.set('app-error');

      applicationResourceApiService.getDocumentDictionaryIds = vi.fn().mockReturnValue(throwError(() => new Error('Network error')));

      comp.updateDocumentInformation();

      // Wait for async operation and error handling to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should show error toast
      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.fetchDocumentIdsFailed');

      // documentIds should remain undefined
      expect(comp.documentIds()).toStrictEqual({});
    });

    it('should not call API and not set documentIds when useLocalStorage is true (covers if condition)', async () => {
      comp.useLocalStorage.set(true);
      comp.applicationId.set('app-any-id');

      const getDocumentSpy = vi.spyOn(applicationResourceApiService, 'getDocumentDictionaryIds');
      const errorSpy = vi.spyOn(toast, 'showErrorKey');
      getDocumentSpy.mockClear();

      comp.updateDocumentInformation();

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify the if block was executed (early return)
      expect(getDocumentSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(comp.documentIds()).toStrictEqual({});
    });
  });

  describe('clearLocalStorage', () => {
    it('should call localStorageService.clearApplicationDraft with applicationId and jobId', () => {
      comp.applicationId.set('app-123');
      comp.jobId.set('job-456');

      comp['clearLocalStorage']();

      // Should call clearApplicationDraft with correct parameters
      expect(localStorageService.clearApplicationDraft).toHaveBeenCalledWith('app-123', 'job-456');
    });

    it('should call clearApplicationDraft with empty strings when applicationId and jobId are empty', () => {
      comp.applicationId.set('');
      comp.jobId.set('');

      comp['clearLocalStorage']();

      // Should call clearApplicationDraft with empty strings
      expect(localStorageService.clearApplicationDraft).toHaveBeenCalledWith('', '');
    });

    it('should pass the current signal values to clearApplicationDraft', () => {
      comp.applicationId.set('existing-app-789');
      comp.jobId.set('job-999');

      comp['clearLocalStorage']();

      // Should call with the current signal values
      expect(localStorageService.clearApplicationDraft).toHaveBeenCalledWith('existing-app-789', 'job-999');
      expect(localStorageService.clearApplicationDraft).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadPersonalInfoDataFromLocalStorage', () => {
    it('should load and set personal info data when draft exists', () => {
      const mockDraft = {
        applicationId: 'app-draft-123',
        jobId: 'job-draft-456',
        personalInfoData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          dateOfBirth: '1990-01-01',
          city: 'New York',
          linkedIn: 'https://linkedin.com/in/johndoe',
          postcode: '10001',
          street: '123 Main St',
          website: 'https://example.com',
        },
        timestamp: new Date().toISOString(),
      };

      localStorageService.loadApplicationDraft = vi.fn().mockReturnValue(mockDraft);

      comp['loadPersonalInfoDataFromLocalStorage']('job-draft-456');

      // Should call loadApplicationDraft with undefined applicantId and jobId
      expect(localStorageService.loadApplicationDraft).toHaveBeenCalledWith(undefined, 'job-draft-456');

      // Should set personalInfoData signal
      expect(comp.personalInfoData()).toEqual(mockDraft.personalInfoData);

      // Should set applicationId signal
      expect(comp.applicationId()).toBe('app-draft-123');

      // Should set jobId signal
      expect(comp.jobId()).toBe('job-draft-456');
    });

    it('should not set any data when draft is null/undefined', () => {
      const initialPersonalInfoData = comp.personalInfoData();
      const initialApplicationId = comp.applicationId();
      const initialJobId = comp.jobId();

      localStorageService.loadApplicationDraft = vi.fn().mockReturnValue(null);

      comp['loadPersonalInfoDataFromLocalStorage']('job-456');

      // Should NOT change any signals
      expect(comp.personalInfoData()).toEqual(initialPersonalInfoData);
      expect(comp.applicationId()).toBe(initialApplicationId);
      expect(comp.jobId()).toBe(initialJobId);
    });

    it('should show error toast and throw error when loadApplicationDraft throws (catch block)', async () => {
      const mockError = new Error('LocalStorage access denied');
      localStorageService.loadApplicationDraft = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      // Call the method - it should queue error handling via queueMicrotask
      comp['loadPersonalInfoDataFromLocalStorage']('job-456');

      // Wait for queueMicrotask to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should show error toast
      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.loadFailed');
    });

    it('should call loadApplicationDraft with correct parameters', () => {
      const mockDraft = {
        applicationId: 'app-123',
        jobId: 'job-789',
        personalInfoData: {},
        timestamp: new Date().toISOString(),
      };

      localStorageService.loadApplicationDraft = vi.fn().mockReturnValue(mockDraft);

      comp['loadPersonalInfoDataFromLocalStorage']('job-789');

      // Should pass undefined as applicantId and jobId parameter
      expect(localStorageService.loadApplicationDraft).toHaveBeenCalledWith(undefined, 'job-789');
      expect(localStorageService.loadApplicationDraft).toHaveBeenCalledTimes(1);
    });

    it('should handle error message formatting in catch block', async () => {
      const errorMessage = 'Storage quota exceeded';
      const mockError = new Error(errorMessage);
      localStorageService.loadApplicationDraft = vi.fn().mockImplementation(() => {
        throw mockError;
      });

      comp['loadPersonalInfoDataFromLocalStorage']('job-456');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify the error toast was called (the error message is included in the thrown error)
      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.loadFailed');
    });

    it('should not modify signals when error occurs in catch block', async () => {
      const initialPersonalInfoData = comp.personalInfoData();
      const initialApplicationId = comp.applicationId();
      const initialJobId = comp.jobId();

      localStorageService.loadApplicationDraft = vi.fn().mockImplementation(() => {
        throw new Error('Failed to load');
      });

      comp['loadPersonalInfoDataFromLocalStorage']('job-456');

      await new Promise(resolve => setTimeout(resolve, 10));

      // Signals should remain unchanged
      expect(comp.personalInfoData()).toEqual(initialPersonalInfoData);
      expect(comp.applicationId()).toBe(initialApplicationId);
      expect(comp.jobId()).toBe(initialJobId);
    });
  });
});
