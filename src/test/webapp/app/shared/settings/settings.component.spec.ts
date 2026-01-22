import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsComponent } from 'app/shared/settings/settings.component';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { createThemeServiceMock, provideThemeServiceMock, setupWindowMatchMediaMock } from '../../../util/theme.service.mock';
import { createTranslateServiceMock, provideTranslateMock } from '../../../util/translate.mock';
import { EmailSettingResourceApiService } from 'app/generated/api/emailSettingResourceApi.service';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';
import { UserDataExportResourceApiService } from 'app/generated';
import { HttpHeaders } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('SettingsComponent', () => {
  let accountServiceMock: ReturnType<typeof createAccountServiceMock>;
  let translateMock: ReturnType<typeof createTranslateServiceMock>;
  let themeServiceMock: ReturnType<typeof createThemeServiceMock>;

  const emailSettingServiceMock = {
    getEmailSettings: vi.fn(),
    updateEmailSettings: vi.fn(),
  };

  const toastServiceMock = createToastServiceMock();

  const userDataExportServiceMock = {
    exportUserData: vi.fn(),
  };

  beforeEach(() => {
    setupWindowMatchMediaMock();

    class ResizeObserverMock {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    global.ResizeObserver = ResizeObserverMock;

    accountServiceMock = createAccountServiceMock();
    translateMock = createTranslateServiceMock();
    themeServiceMock = createThemeServiceMock();

    TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        provideAccountServiceMock(accountServiceMock),
        provideTranslateMock(translateMock),
        provideThemeServiceMock(themeServiceMock),
        provideToastServiceMock(toastServiceMock),
        provideFontAwesomeTesting(),
        { provide: EmailSettingResourceApiService, useValue: emailSettingServiceMock },
        { provide: UserDataExportResourceApiService, useValue: userDataExportServiceMock },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===== ROLE DERIVATION =====
  describe('role()', () => {
    it('should set role from AccountService authorities', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test User',
        email: 'user@test.com',
        authorities: [UserShortDTO.RolesEnum.Professor],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      expect(component.role()).toBe(UserShortDTO.RolesEnum.Professor);
    });

    it('should keep role undefined if no user is loaded', () => {
      accountServiceMock.user.set(undefined);

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      expect(component.role()).toBeUndefined();
    });

    it('should keep role undefined if authorities array is empty', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test User',
        email: 'user@test.com',
        authorities: [],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      expect(component.role()).toBeUndefined();
    });
  });

  // ===== TABS =====
  describe('tabs()', () => {
    it('should show general, notifications and personal-information tabs for applicant', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test Applicant',
        email: 'applicant@test.com',
        authorities: [UserShortDTO.RolesEnum.Applicant],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      const tabs = component.tabs();

      expect(tabs).toHaveLength(3);
      expect(tabs[0].id).toBe('general');
      expect(tabs[1].id).toBe('notifications');
      expect(tabs[2].id).toBe('personal-information');
    });

    it('should show general and notifications tabs for professor (no personal-information)', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test Professor',
        email: 'professor@test.com',
        authorities: [UserShortDTO.RolesEnum.Professor],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      const tabs = component.tabs();

      expect(tabs).toHaveLength(2);
      expect(tabs[0].id).toBe('general');
      expect(tabs[1].id).toBe('notifications');
      expect(tabs.find(tab => tab.id === 'personal-information')).toBeUndefined();
    });

    it('should show only general tab for admin (no notifications, no personal-information)', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test Admin',
        email: 'admin@test.com',
        authorities: [UserShortDTO.RolesEnum.Admin],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      const tabs = component.tabs();

      expect(tabs).toHaveLength(1);
      expect(tabs[0].id).toBe('general');
      expect(tabs.find(tab => tab.id === 'notifications')).toBeUndefined();
      expect(tabs.find(tab => tab.id === 'personal-information')).toBeUndefined();
    });

    it('should include correct translation keys for all tabs', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test Applicant',
        email: 'applicant@test.com',
        authorities: [UserShortDTO.RolesEnum.Applicant],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      const tabs = component.tabs();

      expect(tabs[0].translationKey).toBe('settings.tabs.general');
      expect(tabs[1].translationKey).toBe('settings.tabs.notifications');
      expect(tabs[2].translationKey).toBe('settings.tabs.personalInformation');
    });
  });

  // ===== ACTIVE TAB CHANGES =====
  describe('tab switching', () => {
    it('should change active tab', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test Applicant',
        email: 'applicant@test.com',
        authorities: [UserShortDTO.RolesEnum.Applicant],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      expect(component.activeTab()).toBe('general');

      component.onTabChange('notifications');
      expect(component.activeTab()).toBe('notifications');

      component.onTabChange('personal-information');
      expect(component.activeTab()).toBe('personal-information');
    });
  });

  // ===== EXPORT USER DATA =====
  describe('exportUserData()', () => {
    // ===== FAILURE / GUARD CASES =====
    describe('failure / guard cases', () => {
      it('should show error toast on export failure', async () => {
        userDataExportServiceMock.exportUserData.mockReturnValue(throwError(() => new Error('error')));

        const fixture = TestBed.createComponent(SettingsComponent);
        const component = fixture.componentInstance;

        await component.exportUserData();

        expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.privacy.export.failed');
      });

      it('should show error toast if export returns empty blob', async () => {
        const response = new (await import('@angular/common/http')).HttpResponse({ body: null });
        userDataExportServiceMock.exportUserData.mockReturnValue(of(response));

        const fixture = TestBed.createComponent(SettingsComponent);
        const component = fixture.componentInstance;

        await component.exportUserData();

        expect(toastServiceMock.showErrorKey).toHaveBeenCalledWith('settings.privacy.export.failed');
      });

      it('should not export if button is disabled', async () => {
        const fixture = TestBed.createComponent(SettingsComponent);
        const component = fixture.componentInstance;

        // Simulate disabled state (e.g. cooldown active)
        component.startExportCooldown(60);
        expect(component.exportButtonDisabled()).toBe(true);

        await component.exportUserData();

        expect(userDataExportServiceMock.exportUserData).not.toHaveBeenCalled();
      });
    });
  });

  // ===== EXPORT COOLDOWN TIMER =====
  describe('startExportCooldown()', () => {
    it('should handle cooldown timer correctly', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(SettingsComponent);
      const component = fixture.componentInstance;

      component.startExportCooldown(3);
      expect(component.exportCooldownRemaining()).toBe(3);

      vi.advanceTimersByTime(1000);
      expect(component.exportCooldownRemaining()).toBe(2);

      vi.advanceTimersByTime(1000);
      expect(component.exportCooldownRemaining()).toBe(1);

      vi.advanceTimersByTime(1000);
      expect(component.exportCooldownRemaining()).toBe(0);

      vi.useRealTimers();
    });

    it('should reset cooldown when starting new cooldown', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(SettingsComponent);
      const component = fixture.componentInstance;

      component.startExportCooldown(10);
      component.startExportCooldown(5);
      expect(component.exportCooldownRemaining()).toBe(5);

      // Ensure the previous cooldown was cleared (otherwise it would tick twice per second)
      vi.advanceTimersByTime(1000);
      expect(component.exportCooldownRemaining()).toBe(4);

      vi.useRealTimers();
    });
  });

  // ===== CLEANUP ON DESTROY =====
  describe('cleanup', () => {
    it('should stop cooldown on destroy', () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(SettingsComponent);
      const component = fixture.componentInstance;

      component.startExportCooldown(10);

      vi.advanceTimersByTime(1000);
      expect(component.exportCooldownRemaining()).toBe(9);

      fixture.destroy();

      vi.advanceTimersByTime(3000);
      expect(component.exportCooldownRemaining()).toBe(9);

      vi.useRealTimers();
    });
  });

  // ===== THEME =====
  describe('theme', () => {
    describe('onThemeChange()', () => {
      it('should set theme to system when system option selected', () => {
        const fixture = TestBed.createComponent(SettingsComponent);
        const component = fixture.componentInstance;

        component.onThemeChange({ name: 'System', value: 'system' });

        expect(themeServiceMock.setSyncWithSystem).toHaveBeenCalledWith(true);
      });

      it('should set specific theme when non-system option selected', () => {
        const fixture = TestBed.createComponent(SettingsComponent);
        const component = fixture.componentInstance;

        component.onThemeChange({ name: 'Dark', value: 'dark' });

        expect(themeServiceMock.setSyncWithSystem).toHaveBeenCalledWith(false);
        expect(themeServiceMock.setTheme).toHaveBeenCalledWith('dark');
      });
    });

    describe('selectedTheme()', () => {
      it('should compute selectedTheme correctly based on theme service state', () => {
        const fixture = TestBed.createComponent(SettingsComponent);
        const component = fixture.componentInstance;

        // Case 1: Sync with system
        themeServiceMock.syncWithSystem.set(true);
        fixture.detectChanges();
        expect(component.selectedTheme().value).toBe('system');

        // Case 2: Specific theme
        themeServiceMock.syncWithSystem.set(false);
        themeServiceMock.theme.set('dark');
        fixture.detectChanges();
        expect(component.selectedTheme().value).toBe('dark');

        // Case 3: Fallback (unknown theme)
        themeServiceMock.theme.set('unknown' as any);
        fixture.detectChanges();
        expect(component.selectedTheme().value).toBe('light');
      });
    });
  });
});
