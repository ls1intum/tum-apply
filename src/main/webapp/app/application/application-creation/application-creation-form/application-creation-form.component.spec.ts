import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of } from 'rxjs';
import { ApplicationResourceService } from 'app/generated';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faCalendar,
  faCaretLeft,
  faCaretRight,
  faChevronDown,
  faChevronUp,
  faEnvelope,
  faPaperPlane,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { ToastService } from 'app/service/toast-service';

import ApplicationCreationFormComponent from './application-creation-form.component';

class MockApplicationResourceService {
  getApplicationById = jest.fn().mockReturnValue(
    of({
      applicationId: 'test-app-id',
      job: { jobId: '123', title: 'Test Job' },
      applicationState: 'SAVED',
      applicant: {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          birthday: '1990-01-01',
          website: '',
          linkedinUrl: '',
          gender: 'MALE',
          nationality: 'US',
          selectedLanguage: 'EN',
        },
        street: '123 Main St',
        city: 'Test City',
        country: 'Test Country',
        postalCode: '12345',
        bachelorDegreeName: 'Computer Science',
        bachelorUniversity: 'Test University',
        bachelorGrade: '3.5',
        masterDegreeName: 'Software Engineering',
        masterUniversity: 'Test Graduate School',
        masterGrade: '3.8',
      },
      motivation: 'Test motivation',
      specialSkills: 'Test skills',
      desiredDate: '2024-01-01',
      projects: [],
    }),
  );

  createApplication = jest.fn().mockReturnValue(
    of({
      applicationId: 'test-app-id',
      job: { jobId: '123', title: 'Test Job' },
      applicationState: 'SAVED',
    }),
  );

  getDocumentDictionaryIds = jest.fn().mockReturnValue(of({}));
  updateApplication = jest.fn().mockReturnValue(of({}));
  deleteApplication = jest.fn().mockReturnValue(of({}));
}

class MockAccountService {
  loadedUser = jest.fn().mockReturnValue({ id: 'test-user-id' });
}

class MockToastService {
  showSuccess = jest.fn();
  showError = jest.fn();
  showInfo = jest.fn();
  showWarn = jest.fn();
}

class MockRouter {
  navigate = jest.fn().mockResolvedValue(true);
}

class MockLocation {
  back = jest.fn();
}

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

jest.useFakeTimers();

describe('ApplicationCreationFormComponent', () => {
  let component: ApplicationCreationFormComponent;
  let fixture: ComponentFixture<ApplicationCreationFormComponent>;
  let mockApplicationResourceService: MockApplicationResourceService;
  let mockAccountService: MockAccountService;
  let mockToastService: MockToastService;
  let mockRouter: MockRouter;

  describe('Create mode with authenticated user', () => {
    beforeEach(async () => {
      jest.clearAllTimers();
      mockApplicationResourceService = new MockApplicationResourceService();
      mockAccountService = new MockAccountService();
      mockToastService = new MockToastService();
      mockRouter = new MockRouter();

      await TestBed.configureTestingModule({
        imports: [ApplicationCreationFormComponent, TranslateModule.forRoot()],
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: {
                  get: jest.fn().mockImplementation((key: string) => {
                    if (key === 'job') return '123';
                    if (key === 'application') return null;
                    return null;
                  }),
                },
              },
            },
          },
          {
            provide: ApplicationResourceService,
            useValue: mockApplicationResourceService,
          },
          {
            provide: AccountService,
            useValue: mockAccountService,
          },
          {
            provide: ToastService,
            useValue: mockToastService,
          },
          {
            provide: Router,
            useValue: mockRouter,
          },
          {
            provide: Location,
            useClass: MockLocation,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ApplicationCreationFormComponent);
      component = fixture.componentInstance;

      const library = TestBed.inject(FaIconLibrary);
      library.addIcons(
        faEnvelope,
        faChevronDown,
        faChevronUp,
        faCalendar,
        faCaretLeft,
        faCaretRight,
        faArrowRight,
        faArrowLeft,
        faSave,
        faPaperPlane,
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
      mockLocalStorage.getItem.mockClear();
      mockLocalStorage.setItem.mockClear();
      mockLocalStorage.removeItem.mockClear();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with job ID from query params', () => {
      expect(component.jobId()).toBe('123');
    });

    it('should set applicant ID from account service', () => {
      expect(component.applicantId()).toBe('test-user-id');
    });

    it('should create new application when jobId is provided', () => {
      expect(mockApplicationResourceService.createApplication).toHaveBeenCalledWith('123');
      expect(component.applicationId()).toBe('test-app-id');
    });

    it('should not use local storage for authenticated users', () => {
      expect(component.useLocalStorage()).toBe(false);
    });

    it('should have correct initial saving state', () => {
      expect(component.savingState()).toBe('SAVED');
    });

    it('should initialize page validity signals as false', () => {
      expect(component.page1Valid()).toBe(false);
      expect(component.page2Valid()).toBe(false);
      expect(component.page3Valid()).toBe(false);
    });

    it('should compute allPagesValid correctly', () => {
      expect(component.allPagesValid()).toBe(false);

      component.page1Valid.set(true);
      component.page2Valid.set(true);
      component.page3Valid.set(true);

      expect(component.allPagesValid()).toBe(true);
    });

    it('should update saving state on value change', () => {
      component.onValueChanged();
      expect(component.savingState()).toBe('SAVING');
    });

    it('should update page validity when called', () => {
      component.onPage1ValidityChanged(true);
      expect(component.page1Valid()).toBe(true);

      component.onPage2ValidityChanged(true);
      expect(component.page2Valid()).toBe(true);

      component.onPage3ValidityChanged(true);
      expect(component.page3Valid()).toBe(true);
    });
  });

  describe('Edit mode with existing application', () => {
    beforeEach(async () => {
      jest.clearAllTimers();
      mockApplicationResourceService = new MockApplicationResourceService();
      mockAccountService = new MockAccountService();
      mockToastService = new MockToastService();
      mockRouter = new MockRouter();

      await TestBed.configureTestingModule({
        imports: [ApplicationCreationFormComponent, TranslateModule.forRoot()],
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: {
                  get: jest.fn().mockImplementation((key: string) => {
                    if (key === 'job') return '123';
                    if (key === 'application') return 'existing-app-id';
                    return null;
                  }),
                },
              },
            },
          },
          {
            provide: ApplicationResourceService,
            useValue: mockApplicationResourceService,
          },
          {
            provide: AccountService,
            useValue: mockAccountService,
          },
          {
            provide: ToastService,
            useValue: mockToastService,
          },
          {
            provide: Router,
            useValue: mockRouter,
          },
          {
            provide: Location,
            useClass: MockLocation,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ApplicationCreationFormComponent);
      component = fixture.componentInstance;

      const library = TestBed.inject(FaIconLibrary);
      library.addIcons(
        faEnvelope,
        faChevronDown,
        faChevronUp,
        faCalendar,
        faCaretLeft,
        faCaretRight,
        faArrowRight,
        faArrowLeft,
        faSave,
        faPaperPlane,
      );
    });

    it('should load existing application when application ID is provided', () => {
      expect(mockApplicationResourceService.getApplicationById).toHaveBeenCalledWith('existing-app-id');
      expect(component.applicationId()).toBe('existing-app-id');
    });
  });

  describe('Unauthenticated user with localStorage', () => {
    beforeEach(async () => {
      jest.clearAllTimers();
      mockApplicationResourceService = new MockApplicationResourceService();
      mockAccountService = new MockAccountService();
      mockAccountService.loadedUser.mockReturnValue(null); // Simulate unauthenticated user
      mockToastService = new MockToastService();
      mockRouter = new MockRouter();

      await TestBed.configureTestingModule({
        imports: [ApplicationCreationFormComponent, TranslateModule.forRoot()],
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: {
                  get: jest.fn().mockImplementation((key: string) => {
                    if (key === 'job') return '123';
                    if (key === 'application') return null;
                    return null;
                  }),
                },
              },
            },
          },
          {
            provide: ApplicationResourceService,
            useValue: mockApplicationResourceService,
          },
          {
            provide: AccountService,
            useValue: mockAccountService,
          },
          {
            provide: ToastService,
            useValue: mockToastService,
          },
          {
            provide: Router,
            useValue: mockRouter,
          },
          {
            provide: Location,
            useClass: MockLocation,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ApplicationCreationFormComponent);
      component = fixture.componentInstance;

      const library = TestBed.inject(FaIconLibrary);
      library.addIcons(
        faEnvelope,
        faChevronDown,
        faChevronUp,
        faCalendar,
        faCaretLeft,
        faCaretRight,
        faArrowRight,
        faArrowLeft,
        faSave,
        faPaperPlane,
      );
    });

    it('should use local storage for unauthenticated users', () => {
      expect(component.useLocalStorage()).toBe(true);
      expect(component.applicantId()).toBe('');
    });

    it('should not create application on server for unauthenticated users', () => {
      expect(mockApplicationResourceService.createApplication).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    beforeEach(async () => {
      jest.clearAllTimers();
      mockApplicationResourceService = new MockApplicationResourceService();
      mockAccountService = new MockAccountService();
      mockToastService = new MockToastService();
      mockRouter = new MockRouter();

      await TestBed.configureTestingModule({
        imports: [ApplicationCreationFormComponent, TranslateModule.forRoot()],
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: {
                  get: jest.fn().mockImplementation(() => {
                    return null; // No job or application ID
                  }),
                },
              },
            },
          },
          {
            provide: ApplicationResourceService,
            useValue: mockApplicationResourceService,
          },
          {
            provide: AccountService,
            useValue: mockAccountService,
          },
          {
            provide: ToastService,
            useValue: mockToastService,
          },
          {
            provide: Router,
            useValue: mockRouter,
          },
          {
            provide: Location,
            useClass: MockLocation,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ApplicationCreationFormComponent);
      component = fixture.componentInstance;

      const library = TestBed.inject(FaIconLibrary);
      library.addIcons(
        faEnvelope,
        faChevronDown,
        faChevronUp,
        faCalendar,
        faCaretLeft,
        faCaretRight,
        faArrowRight,
        faArrowLeft,
        faSave,
        faPaperPlane,
      );
    });

    it('should show error when no job ID or application ID is provided', fakeAsync(() => {
      fixture.detectChanges();

      tick(100);

      expect(mockToastService.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'Either job ID or application ID must be provided in the URL.',
      });
    }));

    it('should show error for unauthenticated user without job ID', fakeAsync(() => {
      // Mock unauthenticated user
      mockAccountService.loadedUser.mockReturnValue(null);

      fixture.detectChanges();

      tick(100);

      expect(mockToastService.showError).toHaveBeenCalledWith({
        summary: 'Error',
        detail: 'Either job ID or application ID must be provided in the URL.',
      });
    }));
  });
});
