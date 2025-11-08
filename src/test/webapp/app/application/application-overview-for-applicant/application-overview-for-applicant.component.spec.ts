import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { computed, signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationOverviewForApplicantComponent from '../../../../../main/webapp/app/application/application-overview-for-applicant/application-overview-for-applicant.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { ApplicationOverviewDTO } from 'app/generated/model/applicationOverviewDTO';
import { of, throwError } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { AccountService } from 'app/core/auth/account.service';
import { createRouterMock, provideRouterMock, RouterMock } from 'util/router.mock';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';

const createMockApplicationOverview = (overrides?: Partial<ApplicationOverviewDTO>): ApplicationOverviewDTO => ({
  applicationId: '123',
  jobTitle: 'Software Engineer',
  researchGroup: 'Research Group A',
  applicationState: 'SENT',
  timeSinceCreation: '2 days ago',
  ...overrides,
});

describe('ApplicationOverviewForApplicantComponent', () => {
  let accountService: Pick<AccountService, 'loadedUser' | 'user' | 'loaded'>;
  let applicationService: Pick<
    ApplicationResourceApiService,
    'getApplicationPages' | 'getApplicationPagesLength' | 'deleteApplication' | 'withdrawApplication'
  >;
  let toastService: ToastServiceMock;
  let router: RouterMock;
  let fixture: ComponentFixture<ApplicationOverviewForApplicantComponent>;
  let comp: ApplicationOverviewForApplicantComponent;

  beforeEach(async () => {
    accountService = {
      loaded: signal(true),
      user: signal({ id: 'user-123', email: 'test@example.com', name: 'Test User' }),
      loadedUser: computed(() => (accountService.loaded() ? accountService.user() : undefined)),
    };

    applicationService = {
      getApplicationPages: vi.fn().mockReturnValue(of([])),
      getApplicationPagesLength: vi.fn().mockReturnValue(of(0)),
      deleteApplication: vi.fn().mockReturnValue(of({})),
      withdrawApplication: vi.fn().mockReturnValue(of({})),
    };

    toastService = createToastServiceMock();

    router = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [ApplicationOverviewForApplicantComponent],
      providers: [
        { provide: AccountService, useValue: accountService }, // TODO move to AccountServiceMock when ApplicationCreationForm Tests are merged
        { provide: ApplicationResourceApiService, useValue: applicationService }, // TODO move to ApplicationResourceMock when ApplicationCreationForm Tests are merged
        provideToastServiceMock(toastService),
        provideRouterMock(router),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationOverviewForApplicantComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create the component', () => {
    expect(comp).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(comp.loading()).toBe(false);
    expect(comp.pageData()).toEqual([]);
    expect(comp.pageSize()).toBe(10);
    expect(comp.total()).toBe(0);
  });

  it('should set applicantId from accountService on construction', () => {
    expect(applicationService.getApplicationPagesLength).toHaveBeenCalledWith('user-123');
  });

  describe('loadTotal', () => {
    it('should load total application count successfully', async () => {
      applicationService.getApplicationPagesLength = vi.fn().mockReturnValue(of(42));

      await comp.loadTotal();

      expect(comp.total()).toBe(42);
      expect(applicationService.getApplicationPagesLength).toHaveBeenCalledWith('user-123');
    });

    it('should handle error when loading total fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      applicationService.getApplicationPagesLength = vi.fn().mockReturnValue(throwError(() => new Error('Failed to load')));

      await comp.loadTotal();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load total application count', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('loadPage', () => {
    const mockLazyLoadEvent: TableLazyLoadEvent = {
      first: 0,
      rows: 10,
    };

    it('should load page data successfully', async () => {
      const mockData = [createMockApplicationOverview({ applicationId: '1' }), createMockApplicationOverview({ applicationId: '2' })];
      applicationService.getApplicationPages = vi.fn().mockReturnValue(of(mockData));

      await comp.loadPage(mockLazyLoadEvent);

      expect(comp.loading()).toBe(false);
      expect(comp.lastLazyLoadEvent()).toEqual(mockLazyLoadEvent);
      expect(applicationService.getApplicationPages).toHaveBeenCalledWith(10, 0);

      // Wait for setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(comp.pageData()).toEqual(mockData);
    });

    it('should calculate page number from first and rows', async () => {
      const event: TableLazyLoadEvent = {
        first: 20,
        rows: 10,
      };
      applicationService.getApplicationPages = vi.fn().mockReturnValue(of([]));

      await comp.loadPage(event);

      expect(applicationService.getApplicationPages).toHaveBeenCalledWith(10, 2);
    });

    it('should use default values when first and rows are undefined', async () => {
      const event: TableLazyLoadEvent = {};
      applicationService.getApplicationPages = vi.fn().mockReturnValue(of([]));

      await comp.loadPage(event);

      expect(applicationService.getApplicationPages).toHaveBeenCalledWith(10, 0);
    });

    it('should set loading to false after load completes', async () => {
      const mockData = [createMockApplicationOverview()];
      applicationService.getApplicationPages = vi.fn().mockReturnValue(of(mockData));

      await comp.loadPage(mockLazyLoadEvent);

      expect(comp.loading()).toBe(false);
    });

    it('should handle error when loading page fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      applicationService.getApplicationPages = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));

      await comp.loadPage(mockLazyLoadEvent);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load applications:', expect.any(Error));
      expect(comp.loading()).toBe(false);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('onViewApplication', () => {
    it('should navigate to application detail page', () => {
      comp.onViewApplication('app-456');

      expect(router.navigate).toHaveBeenCalledWith(['/application/detail/app-456']);
    });
  });

  describe('onUpdateApplication', () => {
    it('should navigate to application form with query params', () => {
      comp.onUpdateApplication('app-789');

      expect(router.navigate).toHaveBeenCalledWith(['/application/form'], {
        queryParams: {
          application: 'app-789',
        },
      });
    });
  });

  describe('onDeleteApplication', () => {
    beforeEach(() => {
      comp.lastLazyLoadEvent.set({
        first: 0,
        rows: 10,
      });
    });

    it('should delete application and show success toast', async () => {
      const loadPageSpy = vi.spyOn(comp, 'loadPage').mockResolvedValue();
      applicationService.deleteApplication = vi.fn().mockReturnValue(of({}));

      comp.onDeleteApplication('app-delete');

      // Wait for observable to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(applicationService.deleteApplication).toHaveBeenCalledWith('app-delete');
      expect(toastService.showSuccess).toHaveBeenCalledWith({ detail: 'Application successfully deleted' });
      expect(loadPageSpy).toHaveBeenCalledWith(comp.lastLazyLoadEvent());
    });

    it('should show error toast when delete fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      applicationService.deleteApplication = vi.fn().mockReturnValue(throwError(() => new Error('Delete failed')));

      comp.onDeleteApplication('app-delete');

      // Wait for observable to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(toastService.showError).toHaveBeenCalledWith({ detail: 'Error deleting the application' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Delete failed', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should not reload page if lastLazyLoadEvent is undefined', async () => {
      comp.lastLazyLoadEvent.set(undefined);
      const loadPageSpy = vi.spyOn(comp, 'loadPage').mockResolvedValue();
      applicationService.deleteApplication = vi.fn().mockReturnValue(of({}));

      comp.onDeleteApplication('app-delete');

      // Wait for observable to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(loadPageSpy).not.toHaveBeenCalled();
    });
  });

  describe('onWithdrawApplication', () => {
    beforeEach(() => {
      comp.lastLazyLoadEvent.set({
        first: 0,
        rows: 10,
      });
    });

    it('should withdraw application and show success toast', async () => {
      const loadPageSpy = vi.spyOn(comp, 'loadPage').mockResolvedValue();
      applicationService.withdrawApplication = vi.fn().mockReturnValue(of({}));

      comp.onWithdrawApplication('app-withdraw');

      // Wait for observable to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(applicationService.withdrawApplication).toHaveBeenCalledWith('app-withdraw');
      expect(toastService.showSuccess).toHaveBeenCalledWith({ detail: 'Application successfully withdrawn' });
      expect(loadPageSpy).toHaveBeenCalledWith(comp.lastLazyLoadEvent());
    });

    it('should show error toast when withdraw fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      applicationService.withdrawApplication = vi.fn().mockReturnValue(throwError(() => new Error('Withdraw failed')));

      comp.onWithdrawApplication('app-withdraw');

      // Wait for observable to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(toastService.showError).toHaveBeenCalledWith({ detail: 'Error withdrawing the application' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Withdraw failed', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should not reload page if lastLazyLoadEvent is undefined', async () => {
      comp.lastLazyLoadEvent.set(undefined);
      const loadPageSpy = vi.spyOn(comp, 'loadPage').mockResolvedValue();
      applicationService.withdrawApplication = vi.fn().mockReturnValue(of({}));

      comp.onWithdrawApplication('app-withdraw');

      // Wait for observable to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(loadPageSpy).not.toHaveBeenCalled();
    });
  });

  describe('effect - applicantId update', () => {
    it('should reload total when user changes', async () => {
      const loadTotalSpy = vi.spyOn(comp, 'loadTotal').mockResolvedValue();
      accountService.user.set({ id: 'new-user-456', email: 'new@example.com', name: 'New User' });
      fixture.detectChanges();
      expect(loadTotalSpy).toHaveBeenCalled();
      expect(comp['applicantId']()).toBe('new-user-456');
    });

    it('should handle undefined user', async () => {
      const loadTotalSpy = vi.spyOn(comp, 'loadTotal').mockResolvedValue();

      accountService.user.set(undefined);

      fixture.detectChanges();

      expect(loadTotalSpy).toHaveBeenCalled();
    });
  });
});
