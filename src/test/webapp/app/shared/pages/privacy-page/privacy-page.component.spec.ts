import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { PrivacyPageComponent } from 'app/shared/pages/privacy-page/privacy-page.component';
import { UserDataExportResourceApiService } from 'app/generated/api/api';

import { createToastServiceMock, provideToastServiceMock } from 'src/test/webapp/util/toast-service.mock';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { WritableSignal } from '@angular/core';
import { createAccountServiceMock, provideAccountServiceMock } from 'src/test/webapp/util/account.service.mock';

type ExportStatus = 'REQUESTED' | 'IN_CREATION' | 'EMAIL_SENT' | 'COMPLETED' | null;

type TestComponentAccess = {
  currentExportStatus: WritableSignal<ExportStatus>;
  exportButtonDisabled: () => boolean;
  tooltip: () => string | undefined;
  cooldownSeconds: WritableSignal<number>;
  currentLang: WritableSignal<string>;
};

describe('PrivacyPageComponent', () => {
  let fixture: ComponentFixture<PrivacyPageComponent>;
  let component: PrivacyPageComponent;
  let mockTranslate: TranslateService;
  let componentAccess: TestComponentAccess;
  let accountServiceMock: ReturnType<typeof createAccountServiceMock>;

  const mockToast = createToastServiceMock();
  const serviceMocks = {
    getDataExportStatus: vi.fn(),
    requestDataExport: vi.fn(),
  };

  beforeEach(async () => {
    mockToast.showErrorKey = vi.fn();
    mockToast.showInfoKey = vi.fn();
    serviceMocks.getDataExportStatus.mockReturnValue(of({ status: null, cooldownSeconds: 0 }));
    serviceMocks.requestDataExport.mockReturnValue(of({}));
    accountServiceMock = createAccountServiceMock();

    await TestBed.configureTestingModule({
      imports: [PrivacyPageComponent],
      providers: [
        { provide: UserDataExportResourceApiService, useValue: serviceMocks },
        provideAccountServiceMock(accountServiceMock),
        provideToastServiceMock(mockToast),
        provideTranslateMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPageComponent);
    component = fixture.componentInstance;
    mockTranslate = TestBed.inject(TranslateService);
    componentAccess = {
      currentExportStatus: component.currentExportStatus,
      exportButtonDisabled: component.exportButtonDisabled,
      tooltip: component.tooltip,
      cooldownSeconds: component.cooldownSeconds,
      currentLang: component.currentLang,
    };
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Export Functionality', () => {
    it('should request data export, set status, and show info toast', async () => {
      serviceMocks.getDataExportStatus.mockReturnValue(of({ status: 'IN_CREATION', cooldownSeconds: 0 }));

      await component.exportUserData();

      expect(serviceMocks.requestDataExport).toHaveBeenCalledTimes(1);
      expect(componentAccess.currentExportStatus()).toBe('IN_CREATION');
      expect(componentAccess.exportButtonDisabled()).toBe(true);
      expect(componentAccess.tooltip()).toBe('privacy.export.tooltip.inCreation');
      expect(mockToast.showInfoKey).toHaveBeenCalledWith('privacy.export.requested');
    });

    it('should no-op when button is disabled', async () => {
      serviceMocks.getDataExportStatus.mockReturnValue(of({ status: 'IN_CREATION', cooldownSeconds: 0 }));
      componentAccess.currentExportStatus.set('IN_CREATION');
      expect(componentAccess.currentExportStatus()).toBe('IN_CREATION');
      expect(componentAccess.exportButtonDisabled()).toBe(true);
      await component.exportUserData();
      expect(serviceMocks.requestDataExport).toHaveBeenCalledTimes(1);
    });

    it('should no-op when not signed in', async () => {
      const prevCalls = serviceMocks.getDataExportStatus.mock.calls.length;
      vi.spyOn(accountServiceMock, 'signedIn').mockReturnValue(false);

      await (component as any).refreshStatus();

      expect(serviceMocks.getDataExportStatus).toHaveBeenCalledTimes(prevCalls);
    });

    it('should show 409 toast on conflict', async () => {
      serviceMocks.requestDataExport.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));

      await component.exportUserData();

      expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed409');
      expect(componentAccess.currentExportStatus()).toBeNull();
    });

    it('should show 429 toast on rate limit', async () => {
      serviceMocks.requestDataExport.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 429 })));

      await component.exportUserData();

      expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed429');
      expect(componentAccess.currentExportStatus()).toBeNull();
    });

    it('should show generic toast on other HttpErrorResponse', async () => {
      serviceMocks.requestDataExport.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

      await component.exportUserData();

      expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed');
      expect(componentAccess.currentExportStatus()).toBeNull();
    });

    it('should show generic toast on non-Http error', async () => {
      serviceMocks.requestDataExport.mockReturnValue(throwError(() => new Error('boom')));

      await component.exportUserData();

      expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed');
      expect(componentAccess.currentExportStatus()).toBeNull();
    });

    it('should show requestFailed toast when exportUserData throws non-HTTP error', async () => {
      serviceMocks.requestDataExport.mockReturnValue(throwError(() => new Error('oops')));

      await component.exportUserData();

      expect(mockToast.showErrorKey).toHaveBeenCalledWith('privacy.export.requestFailed');
      expect(componentAccess.currentExportStatus()).toBeNull();
    });
  });

  describe('Tooltip Behavior', () => {
    it('should keep button enabled before request', () => {
      expect(componentAccess.exportButtonDisabled()).toBe(false);
    });

    it('should show notLoggedIn tooltip when user not signed in', () => {
      (accountServiceMock.signedIn as WritableSignal<boolean>).set(false);
      const instantSpy = vi.spyOn(mockTranslate, 'instant').mockReturnValue('not logged in');

      expect(componentAccess.exportButtonDisabled()).toBe(true);
      expect(componentAccess.tooltip()).toBe('not logged in');
      expect(instantSpy).toHaveBeenCalledWith('privacy.export.tooltip.notLoggedIn');
    });

    it('should show cooldown tooltip when disabled due to cooldown', () => {
      component.cooldownSeconds.set(86400); // 1 day in seconds
      expect(componentAccess.exportButtonDisabled()).toBe(true);
      expect(componentAccess.tooltip()).toBe('privacy.export.tooltip.cooldown');
    });

    it('should return undefined tooltip when button is enabled', () => {
      componentAccess.currentExportStatus.set(null);
      componentAccess.cooldownSeconds.set(0);
      expect(componentAccess.tooltip()).toBeUndefined();
    });

    it('should update tooltip on language change', () => {
      componentAccess.currentExportStatus.set('IN_CREATION');
      const instantSpy = vi.spyOn(mockTranslate, 'instant');
      instantSpy.mockReturnValue('inCreation tooltip');
      expect(componentAccess.tooltip()).toBe('inCreation tooltip');
      expect(instantSpy).toHaveBeenCalledWith('privacy.export.tooltip.inCreation');
      // Simulate language change by setting currentLang
      componentAccess.currentLang.set('de');
      // Call tooltip again to trigger re-computation
      expect(componentAccess.tooltip()).toBe('inCreation tooltip');
      // Should call instant again
      expect(instantSpy).toHaveBeenCalledTimes(2);
    });

    it('should pass the days parameter to translate for the cooldown tooltip', () => {
      const instantSpy = vi.spyOn(mockTranslate, 'instant').mockReturnValue('cooldown tooltip');
      componentAccess.cooldownSeconds.set(90000); // 25 hours in seconds
      expect(componentAccess.tooltip()).toBe('cooldown tooltip');
      expect(instantSpy).toHaveBeenCalledWith('privacy.export.tooltip.cooldown', { days: '2' });
    });

    it('should update currentLang when TranslateService emits onLangChange', () => {
      mockTranslate.use('de');
      expect(componentAccess.currentLang()).toBe('de');
    });

    it('should set cooldownSeconds to 0 when API returns explicit undefined cooldownSeconds', async () => {
      // API returns cooldownSeconds explicitly set to undefined
      serviceMocks.getDataExportStatus.mockReturnValue(of({ status: 'COMPLETED', cooldownSeconds: undefined } as any));
      (accountServiceMock.signedIn as WritableSignal<boolean>).set(true);

      await (component as any).refreshStatus();

      expect(componentAccess.currentExportStatus()).toBe('COMPLETED');
      expect(componentAccess.cooldownSeconds()).toBe(0);
    });
  });
});
