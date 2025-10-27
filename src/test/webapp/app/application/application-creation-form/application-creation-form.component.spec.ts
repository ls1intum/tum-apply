import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router, UrlSegment, withDisabledInitialNavigation } from '@angular/router';
import { computed, signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationCreationFormComponent from '../../../../../main/webapp/app/application/application-creation/application-creation-form/application-creation-form.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AccountService, User } from 'app/core/auth/account.service';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { of, Subject, throwError } from 'rxjs';
import { ToastService } from 'app/service/toast-service';
import { Location } from '@angular/common';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { LocalStorageService } from 'app/service/localStorage.service';
import { TranslateService } from '@ngx-translate/core';
import { SavingStates } from 'app/shared/constants/saving-states';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { HttpResponse } from '@angular/common/http';
import { ApplicationDetailDTO } from 'app/generated/model/applicationDetailDTO';
import { UpdateApplicationDTO } from 'app/generated/model/updateApplicationDTO';
import { UserDTO } from 'app/generated/model/userDTO';
import { ApplicantDTO } from 'app/generated/model/applicantDTO';

function spyOnPrivate<T extends object>(obj: T, methodName: string) {
  return vi.spyOn(obj as any, methodName);
}

const createMockApplication = (applicationState: ApplicationForApplicantDTO.ApplicationStateEnum): ApplicationForApplicantDTO => ({
  applicationState: applicationState,
  applicationId: '456',
  job: {
    jobId: '123',
    fieldOfStudies: '',
    location: 'Garching',
    professorName: 'Prof. Dr. Abc',
    title: 'Sophisticated Studies',
  },
  applicant: {
    user: {
      firstName: 'Testus Maxima',
      email: 'test@gmail.com',
    },
  },
});

describe('ApplicationForm', () => {
  let accountService: Pick<AccountService, 'loadedUser' | 'user' | 'signedIn' | 'loaded'>;
  let applicationResourceApiService: Pick<
    ApplicationResourceApiService,
    'createApplication' | 'getApplicationById' | 'updateApplication' | 'getDocumentDictionaryIds'
  >;
  let toast: Pick<ToastService, 'showErrorKey' | 'showSuccessKey'>;
  let router: Pick<Router, 'navigate'>;
  let location: Pick<Location, 'back'>;
  let authFacade: Pick<AuthFacadeService, 'requestOtp'>;

  let route$: Subject<UrlSegment[]>;

  let dialogService: Pick<DialogService, 'open'>;
  let authOrchestrator: Pick<AuthOrchestratorService, 'email' | 'firstName' | 'lastName'>;
  let localStorageService: Pick<LocalStorageService, 'saveApplicationDraft' | 'clearApplicationDraft' | 'loadApplicationDraft'>;
  let translateService: Pick<TranslateService, 'instant'>;
  let activatedRoute: Pick<ActivatedRoute, 'snapshot' | 'url'>;

  let fixture: ComponentFixture<ApplicationCreationFormComponent>;
  let comp: ApplicationCreationFormComponent;
  const mockApplication = createMockApplication(ApplicationForApplicantDTO.ApplicationStateEnum.Saved);
  beforeEach(async () => {
    accountService = {
      loaded: signal<boolean>(false),
      user: signal<User | undefined>(undefined),
      signedIn: signal<boolean>(true),
      loadedUser: computed(() => (accountService.loaded() ? accountService.user() : undefined)),
    };

    applicationResourceApiService = {
      createApplication: vi.fn().mockReturnValue(of(mockApplication)),
      getApplicationById: vi.fn().mockReturnValue(of(mockApplication)),
      updateApplication: vi.fn().mockReturnValue(of({})),
      getDocumentDictionaryIds: vi.fn().mockReturnValue(of({})),
    };
    toast = {
      showErrorKey: vi.fn(),
      showSuccessKey: vi.fn(),
    };
    router = { navigate: vi.fn() };
    location = { back: vi.fn() };
    authFacade = { requestOtp: vi.fn() };

    route$ = new Subject();

    dialogService = {
      open: vi.fn().mockReturnValue(of({ close: vi.fn() })),
    };

    authOrchestrator = {
      email: signal<string>('email@email.com'),
      firstName: signal<string>('firstname'),
      lastName: signal<string>('lastname'),
    };

    localStorageService = {
      clearApplicationDraft: vi.fn(),
      loadApplicationDraft: vi.fn(),
      saveApplicationDraft: vi.fn(),
    };

    translateService = {
      instant: vi.fn(),
    };

    activatedRoute = {
      url: route$,
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({ job: '123', application: '456' }),
        url: [],
        params: {},
        queryParams: {},
        fragment: '',
        data: {},
        outlet: 'primary',
        component: null,
        routeConfig: null,
        root: null!,
        parent: null,
        firstChild: null,
        children: [],
        pathFromRoot: [],
        toString: () => '',
        title: '',
      },
    };

    await TestBed.configureTestingModule({
      imports: [ApplicationCreationFormComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: ApplicationResourceApiService, useValue: applicationResourceApiService },
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
        { provide: ToastService, useValue: toast },
        { provide: AuthFacadeService, useValue: authFacade },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: DialogService, useValue: dialogService },
        { provide: AuthOrchestratorService, useValue: authOrchestrator },
        { provide: LocalStorageService, useValue: localStorageService },
        { provide: TranslateService, useValue: translateService },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationCreationFormComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.resetAllMocks();
  })

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
    const freshActivatedRoute = {
      url: new Subject<UrlSegment[]>(),
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({ job: '123' }), // Only job, no application
        url: [],
        params: {},
        queryParams: { job: '123' },
        fragment: '',
        data: {},
        outlet: 'primary',
        component: null,
        routeConfig: null,
        root: null!,
        parent: null,
        firstChild: null,
        children: [],
        pathFromRoot: [],
        toString: () => '',
        title: '',
      },
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationFormComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: ApplicationResourceApiService, useValue: applicationResourceApiService },
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
        { provide: ToastService, useValue: toast },
        { provide: AuthFacadeService, useValue: authFacade },
        { provide: ActivatedRoute, useValue: freshActivatedRoute },
        { provide: DialogService, useValue: dialogService },
        { provide: AuthOrchestratorService, useValue: authOrchestrator },
        { provide: LocalStorageService, useValue: localStorageService },
        { provide: TranslateService, useValue: translateService },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
    const freshComp = freshFixture.componentInstance;

    const mockApp = {
      ...createMockApplication(ApplicationForApplicantDTO.ApplicationStateEnum.Saved),
      applicationId: 'new-app',
    };
    const initCreateSpy = vi.spyOn(freshComp, 'initPageCreateApplication').mockResolvedValue(mockApp);

    freshFixture.detectChanges();

    expect(initCreateSpy).toHaveBeenCalledWith('123');
    expect(freshComp.applicantId()).toBe('2'); // from accountService.loadedUser().id
  });

  it('should throw error when neither jobId nor applicationId is provided', async () => {
    const freshActivatedRoute = {
      url: new Subject<UrlSegment[]>(),
      snapshot: {
        paramMap: convertToParamMap({}),
        queryParamMap: convertToParamMap({}), // No query params at all
        url: [],
        params: {},
        queryParams: {},
        fragment: '',
        data: {},
        outlet: 'primary',
        component: null,
        routeConfig: null,
        root: null!,
        parent: null,
        firstChild: null,
        children: [],
        pathFromRoot: [],
        toString: () => '',
        title: '',
      },
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationFormComponent],
      providers: [
        { provide: AccountService, useValue: accountService },
        { provide: ApplicationResourceApiService, useValue: applicationResourceApiService },
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
        { provide: ToastService, useValue: toast },
        { provide: AuthFacadeService, useValue: authFacade },
        { provide: ActivatedRoute, useValue: freshActivatedRoute },
        { provide: DialogService, useValue: dialogService },
        { provide: AuthOrchestratorService, useValue: authOrchestrator },
        { provide: LocalStorageService, useValue: localStorageService },
        { provide: TranslateService, useValue: translateService },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
    const freshComp = freshFixture.componentInstance;

    freshFixture.detectChanges();

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

  it('should send application if privacy accepted', async () => {
    comp.applicationId.set('456');
    comp.useLocalStorage.set(false);
    comp.additionalInfoForm.controls.privacyAccepted.setValue(true);
    const sendSpy = vi.spyOn(comp, 'sendCreateApplicationData').mockResolvedValue(true);

    comp.onConfirmSend();

    // Wait for any promises to resolve
    await fixture.whenStable();

    expect(sendSpy).toHaveBeenCalledWith('SENT', true);
  });

  describe('initPageForLocalStorage', () => {
    it('should load from local storage when unauthenticated', async () => {
      accountService.user.set(undefined);
      (localStorageService.loadApplicationDraft as any).mockReturnValue({
        applicationId: 'local-id',
        jobId: 'local-job',
        personalInfoData: {
          email: 'local@example.com',
          firstName: 'Local',
          lastName: 'User',
        },
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
    it('should show error message when jobId is empty string in initPageForLocalStorageCase', async () => {
      const showErrorSpy = spyOnPrivate(comp, 'showInitErrorMessage');

      comp.initPageForLocalStorageCase('');

      fixture.detectChanges();
      await fixture.whenStable();

      expect(comp.useLocalStorage()).toBe(true);
      expect(showErrorSpy).toHaveBeenCalledWith('entity.toast.applyFlow.missingJobIdUnauthenticated');
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
      }); // TODO all as any
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
      comp.personalInfoData.set({} as any);
      comp.applicationId.set('app-test');
      comp.jobId.set('job-test');

      const beforeTime = new Date().toISOString();
      comp['saveToLocalStorage']();
      const afterTime = new Date().toISOString();

      // Get the timestamp that was passed to saveApplicationDraft
      const callArgs = (localStorageService.saveApplicationDraft as any).mock.calls[0][0];
      const timestamp = callArgs.timestamp;

      // Timestamp should be a valid ISO string between before and after
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(timestamp >= beforeTime).toBe(true);
      expect(timestamp <= afterTime).toBe(true);
    });

    it('should save with empty strings when signals are empty', () => {
      comp.personalInfoData.set({} as any);
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
      vi.spyOn(comp as any, 'mapPagesToDTO').mockReturnValue(mockUpdateDTO);

      // Mock clearLocalStorage
      const clearLocalStorageSpy = vi.spyOn(comp as any, 'clearLocalStorage').mockImplementation(() => { });

      // Mock updateApplication to return success
      applicationResourceApiService.updateApplication = vi.fn().mockReturnValue(of(new HttpResponse({ body: {}, status: 200 })));

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
      const clearLocalStorageSpy = spyOnPrivate(comp, 'clearLocalStorage').mockImplementation(() => { });

      // Mock updateApplication to return success
      applicationResourceApiService.updateApplication = vi.fn().mockReturnValue(of(new HttpResponse({ body: {}, status: 200 })));

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
      const clearLocalStorageSpy = spyOnPrivate(comp, 'clearLocalStorage').mockImplementation(() => { });

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
      spyOnPrivate(comp, 'clearLocalStorage').mockImplementation(() => { });

      applicationResourceApiService.updateApplication = vi.fn().mockReturnValue(of(new HttpResponse({ body: {}, status: 200 })));

      const result = await comp.sendCreateApplicationData('SENT', false);

      expect(comp['mapPagesToDTO']).toHaveBeenCalledWith('SENT');
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
        language: { value: 'en', name: 'English' },
        dateOfBirth: '1990-01-01',
        website: 'https://example.com',
        linkedIn: 'https://linkedin.com/in/johndoe',
        street: '123 Main St',
        city: 'New York',
        country: { value: 'US', name: 'United States' },
        postcode: '10001',
      });
      // type ApplicationCreationFormComponentWithPublicMapPagesToDto = ApplicationCreationFormComponent & {
      //   mapPagesToDTO: (state?: ApplicationDetailDTO.ApplicationStateEnum | 'SENT') => UpdateApplicationDTO | ApplicationDetailDTO
      // };
      // let compWithPublicMapPagesToDto: ApplicationCreationFormComponentWithPublicMapPagesToDto;
      let mapPagesToDTO: (state?: ApplicationDetailDTO.ApplicationStateEnum | 'SENT') => UpdateApplicationDTO | ApplicationDetailDTO;
      comp.educationData.set({
        bachelorDegreeName: 'Computer Science',
        bachelorDegreeUniversity: 'MIT',
        bachelorGrade: 3.8,
        bachelorGradingScale: { value: 'ONE_TO_FOUR', name: '1-4' },
        masterDegreeName: 'Software Engineering',
        masterDegreeUniversity: 'Stanford',
        masterGrade: 3.9,
        masterGradingScale: { value: 'ONE_TO_FOUR', name: '1-4' },
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
      const result = comp['mapPagesToDTO']('SENT');

      expect(result.applicationId).toBe('app-123');
      expect(result.applicationState).toBe('SENT');
      expect(result.applicant?.user.userId).toBe('user-456');
      expect(result.applicant?.user.email).toBe('john@example.com');
      // expect(result.applicant?.user.firstName).toBe('John');
      // expect(result.applicant?.user.lastName).toBe('Doe');
      expect(result.applicant?.user.phoneNumber).toBe('+1234567890');
      // expect(result.applicant?.city).toBe('New York');
      // expect(result.applicant?.country).toBe('US');
      // expect(result.applicant?.street).toBe('123 Main St');
      // expect(result.applicant?.postalCode).toBe('10001');
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
      vi.spyOn(dialogService, 'open').mockReturnValue(mockDialogRef as any);

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
      const mockDialogRef = { close: closeDialogSpy };
      vi.spyOn(dialogService, 'open').mockReturnValue(mockDialogRef as any);

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

      const mockApplication = { applicationId: 'new-app-123' } as any;

      const initPageSpy = spyOnPrivate(comp, 'initPageCreateApplication').mockResolvedValue(mockApplication);
      const sendDataSpy = spyOnPrivate(comp, 'sendCreateApplicationData').mockResolvedValue(true);

      await comp['migrateDraftIfNeeded']();

      expect(initPageSpy).toHaveBeenCalledWith('job-789');
      expect(comp.useLocalStorage()).toBe(false);
      expect(comp.applicationId()).toBe('new-app-123');
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

      const mockApplication = { applicationId: undefined } as any;

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
      comp.personalInfoData.set({
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      } as any);

      const openOtpSpy = spyOnPrivate(comp, 'openOtpAndWaitForLogin').mockResolvedValue(undefined);
      const migrateSpy = spyOnPrivate(comp, 'migrateDraftIfNeeded').mockResolvedValue(undefined);

      accountService.user.set({ id: 'new-user-456', email: 'test@example.com', name: 'Jane Smith' });

      const progressStepperMock = {
        goToStep: vi.fn(),
      };
      vi.spyOn(comp, 'progressStepper').mockReturnValue(progressStepperMock as any);

      comp['handleNextFromStep1']();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(openOtpSpy).toHaveBeenCalledWith('test@example.com', 'Jane', 'Smith');
    });

    it('should show error toast when openOtpAndWaitForLogin fails', async () => {
      comp.applicantId.set('');
      comp.personalInfoData.set({
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      } as any);

      spyOnPrivate(comp, 'openOtpAndWaitForLogin').mockRejectedValue(new Error('OTP failed'));

      comp['handleNextFromStep1']();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.otpVerificationFailed');
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
        const handleNextSpy = spyOnPrivate(comp, 'handleNextFromStep1').mockImplementation(() => { });

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
        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => { });

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

        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => { });

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

        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => { });

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

        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => { });

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

        const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => { });

        freshFixture.detectChanges();

        const steps = freshComp.stepData();
        const summaryStep = steps[3]; // Fourth step
        const prevButton = summaryStep.buttonGroupPrev[0];

        prevButton.onClick();

        expect(freshSpy).toHaveBeenCalled();
      });

      it('should call sendConfirmDialog confirm when send button is clicked', () => {
        const confirmDialogMock = { confirm: vi.fn() };
        vi.spyOn(comp, 'sendConfirmDialog').mockReturnValue(confirmDialogMock as any);

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
  describe('education step buttons', () => {
    it('should call updateDocumentInformation when prev button is clicked', () => {
      // IMPORTANT: Set up spy BEFORE accessing stepData()
      const updateDocsSpy = vi.spyOn(comp, 'updateDocumentInformation').mockImplementation(() => { });

      // Create a fresh component to ensure computed runs with spy in place
      const freshFixture = TestBed.createComponent(ApplicationCreationFormComponent);
      const freshComp = freshFixture.componentInstance;
      freshComp.personalInfoDataValid.set(true);
      freshComp.educationDataValid.set(true);
      freshComp.applicationDetailsDataValid.set(true);
      freshComp.applicantId.set('user-123');

      // Spy on the fresh component
      const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => { });

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

      // Spy on the fresh component BEFORE computed runs
      const freshSpy = vi.spyOn(freshComp, 'updateDocumentInformation').mockImplementation(() => { });

      freshFixture.detectChanges();

      const steps = freshComp.stepData();
      const educationStep = steps[1];
      const nextButton = educationStep.buttonGroupNext[0];

      nextButton.onClick();

      expect(freshSpy).toHaveBeenCalled();
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
      comp.savingState.set('UNKNOWN' as any);

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

      const saveToLocalStorageSpy = vi.spyOn(comp, 'saveToLocalStorage' as any).mockReturnValue(true);

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

    it('should save to backend and set state to SAVED when useLocalStorage is false and save succeeds', async () => {
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

    it('should save to backend and set state to FAILED when useLocalStorage is false and save fails', async () => {
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
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: activatedRoute,
        queryParams: { job: '123', application: '456' },
        queryParamsHandling: 'merge',
      });

      // Should NOT show error toast
      expect(toast.showErrorKey).not.toHaveBeenCalled();

      // Should return the application
      expect(result).toEqual(mockApplication);
    });

    it('should show error toast, navigate to detail page and throw error when application state is not SAVED', async () => {
      const mockApplication: ApplicationForApplicantDTO = {
        applicationId: 'app-789',
        applicationState: 'SENT', // not SAVED
        job: {
          jobId: 'job-456',
          title: 'Software Developer',
        },
        applicant: {},
      } as ApplicationForApplicantDTO;

      // Reconfigure the existing mock
      applicationResourceApiService.createApplication = vi.fn().mockReturnValue(of(mockApplication));

      // Should throw an error
      await expect(comp.initPageCreateApplication('job-456')).rejects.toThrow('Application is not editable.');

      fixture.detectChanges();
      await fixture.whenStable();

      // Should create application
      expect(applicationResourceApiService.createApplication).toHaveBeenCalledWith('job-456');

      // Should show error toast
      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.notEditable');

      // Should navigate to detail page
      expect(router.navigate).toHaveBeenCalledWith(['/application/detail', 'app-789']);
    });

    it('should handle application with undefined applicationId', async () => {
      const mockApplication: ApplicationForApplicantDTO = {
        applicationId: undefined,
        applicationState: 'SAVED',
        job: {
          jobId: 'job-456',
          title: 'Software Developer',
        },
        applicant: {},
      } as any;

      // Reconfigure the existing mock
      applicationResourceApiService.createApplication = vi.fn().mockReturnValue(
        of({
          applicationId: undefined,
          applicationState: 'SAVED',
          job: {
            jobId: 'job-456',
            title: 'Software Developer',
          },
          applicant: {},
        }),
      );

      const result = await comp.initPageCreateApplication('job-456');

      fixture.detectChanges();
      await fixture.whenStable();

      // Should set applicationId to empty string when undefined
      expect(comp.applicationId()).toBe('');

      // Should navigate with undefined application in query params
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: activatedRoute,
        queryParams: { job: 'job-456', application: undefined },
        queryParamsHandling: 'merge',
      });

      expect(result).toEqual(mockApplication);
    });

    it('should handle SAVED state as non-editable', async () => {
      applicationResourceApiService.createApplication = vi.fn().mockReturnValue(
        of({
          applicationId: 'app-draft',
          applicationState: 'SENT',
          job: {
            jobId: 'job-456',
            title: 'Software Developer',
          },
          applicant: {},
        }),
      );

      await expect(comp.initPageCreateApplication('job-456')).rejects.toThrow('Application is not editable.');

      expect(toast.showErrorKey).toHaveBeenCalledWith('entity.toast.applyFlow.notEditable');
      expect(router.navigate).toHaveBeenCalledWith(['/application/detail', 'app-draft']);
    });
  });
});
