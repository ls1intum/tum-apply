import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { provideTranslateMock } from 'util/translate.mock';
import ApplicationOverviewForApplicantComponent from '../../../../../main/webapp/app/application/application-overview-for-applicant/application-overview-for-applicant.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { of, throwError } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { provideRouter, Router } from '@angular/router';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { AccountServiceMock, createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import {
  ApplicationResourceApiMock,
  createApplicationResourceApiMock,
  createMockApplicationOverviewPages,
  provideApplicationResourceApiMock,
} from 'util/application-resource-api.service.mock';
import { createActivatedRouteMock, provideActivatedRouteMock } from 'util/activated-route.mock';

describe('ApplicationOverviewForApplicantComponent', () => {
  let accountService: AccountServiceMock;
  let applicationApi: ApplicationResourceApiMock;
  let toastService: ToastServiceMock;
  let router: Router;
  let fixture: ComponentFixture<ApplicationOverviewForApplicantComponent>;
  let comp: ApplicationOverviewForApplicantComponent;

  beforeEach(async () => {
    accountService = createAccountServiceMock();

    applicationApi = createApplicationResourceApiMock();

    toastService = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [ApplicationOverviewForApplicantComponent],
      providers: [
        provideAccountServiceMock(accountService),
        provideApplicationResourceApiMock(applicationApi),
        provideToastServiceMock(toastService),
        provideRouter([]),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideActivatedRouteMock(createActivatedRouteMock()),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);

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

  it('should initialize with default values', async () => {
    await comp.loadPage({ first: 0, rows: 10 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(comp.loading()).toBe(false);
    expect(comp.pageData()).toEqual(createMockApplicationOverviewPages());
    expect(comp.pageSize()).toBe(10);
    expect(comp.total()).toBe(2);
  });

  describe('loadPage', () => {
    const mockLazyLoadEvent: TableLazyLoadEvent = {
      first: 0,
      rows: 10,
    };

    it('should load page data successfully', async () => {
      await comp.loadPage(mockLazyLoadEvent);

      expect(comp.loading()).toBe(false);
      expect(comp.lastLazyLoadEvent()).toEqual(mockLazyLoadEvent);
      expect(applicationApi.getApplicationPages).toHaveBeenCalledWith(comp.pageSize(), 0, comp.sortBy(), comp.sortDirection());
      expect(comp.pageData()).toEqual(createMockApplicationOverviewPages());
    });

    it('should calculate page number from first and rows', async () => {
      const event: TableLazyLoadEvent = {
        first: 20,
        rows: 10,
      };
      applicationApi.getApplicationPages = vi.fn().mockReturnValue(of([]));

      await comp.loadPage(event);

      expect(applicationApi.getApplicationPages).toHaveBeenCalledWith(10, 2, comp.sortBy(), comp.sortDirection());
    });

    it('should use default values when first and rows are undefined', async () => {
      const event: TableLazyLoadEvent = {};
      applicationApi.getApplicationPages = vi.fn().mockReturnValue(of([]));

      await comp.loadPage(event);

      expect(applicationApi.getApplicationPages).toHaveBeenCalledWith(10, 0, 'createdAt', 'DESC');
    });

    it('should set loading to false after load completes', async () => {
      await comp.loadPage(mockLazyLoadEvent);

      expect(comp.loading()).toBe(false);
    });

    it('should handle error when loading page fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      applicationApi.getApplicationPages = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));

      await comp.loadPage(mockLazyLoadEvent);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load applications:', expect.any(Error));
      expect(comp.loading()).toBe(false);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('onViewApplication', () => {
    it('should navigate to application detail page', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      comp.onViewApplication('app-456');

      expect(navigateSpy).toHaveBeenCalledWith(['/application/detail/app-456']);
    });
  });

  describe('onUpdateApplication', () => {
    it('should navigate to application form with query params', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      comp.onUpdateApplication('app-789');

      expect(navigateSpy).toHaveBeenCalledWith(['/application/form'], {
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
      applicationApi.deleteApplication = vi.fn().mockReturnValue(of({}));

      comp.onDeleteApplication('app-delete');

      expect(applicationApi.deleteApplication).toHaveBeenCalledWith('app-delete');
      expect(toastService.showSuccess).toHaveBeenCalledWith({ detail: 'Application successfully deleted' });
      expect(loadPageSpy).toHaveBeenCalledWith(comp.lastLazyLoadEvent());
    });

    it('should show error toast when delete fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      applicationApi.deleteApplication = vi.fn().mockReturnValue(throwError(() => new Error('Delete failed')));

      comp.onDeleteApplication('app-delete');

      expect(toastService.showError).toHaveBeenCalledWith({ detail: 'Error deleting the application' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Delete failed', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should not reload page if lastLazyLoadEvent is undefined', async () => {
      comp.lastLazyLoadEvent.set(undefined);
      const loadPageSpy = vi.spyOn(comp, 'loadPage').mockResolvedValue();
      applicationApi.deleteApplication = vi.fn().mockReturnValue(of({}));

      comp.onDeleteApplication('app-delete');

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
      comp.onWithdrawApplication('app-withdraw');

      expect(applicationApi.withdrawApplication).toHaveBeenCalledWith('app-withdraw');
      expect(toastService.showSuccess).toHaveBeenCalledWith({ detail: 'Application successfully withdrawn' });
      expect(loadPageSpy).toHaveBeenCalledWith(comp.lastLazyLoadEvent());
    });

    it('should show error toast when withdraw fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      applicationApi.withdrawApplication = vi.fn().mockReturnValue(throwError(() => new Error('Withdraw failed')));

      comp.onWithdrawApplication('app-withdraw');

      expect(toastService.showError).toHaveBeenCalledWith({ detail: 'Error withdrawing the application' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Withdraw failed', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should not reload page if lastLazyLoadEvent is undefined', async () => {
      comp.lastLazyLoadEvent.set(undefined);
      const loadPageSpy = vi.spyOn(comp, 'loadPage').mockResolvedValue();

      comp.onWithdrawApplication('app-withdraw');

      expect(loadPageSpy).not.toHaveBeenCalled();
    });
  });

  describe('effect - applicantId update', () => {
    it('should reload total when user changes', async () => {
      accountService.user.set({ id: 'new-user-456', email: 'new@example.com', name: 'New User' });
      fixture.detectChanges();
      expect(comp['applicantId']()).toBe('new-user-456');
    });

    it('should handle undefined user', async () => {
      accountService.user.set(undefined);
      fixture.detectChanges();
      expect(comp['applicantId']()).toBe('');
    });
  });
});
