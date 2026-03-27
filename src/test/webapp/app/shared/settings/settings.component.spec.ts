import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsComponent } from 'app/shared/settings/settings.component';
import { UserShortDTORolesEnum } from 'app/generated/model/user-short-dto';
import { createThemeServiceMock, provideThemeServiceMock, setupWindowMatchMediaMock } from '../../../util/theme.service.mock';
import { createTranslateServiceMock, provideTranslateMock } from '../../../util/translate.mock';
import { EmailSettingResourceApi } from 'app/generated/api/email-setting-resource-api';
import { createAccountServiceMock, provideAccountServiceMock } from '../../../util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock } from '../../../util/toast-service.mock';
import { UserDataExportResourceApi } from 'app/generated/api/user-data-export-resource-api';
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
        { provide: EmailSettingResourceApi, useValue: emailSettingServiceMock },
        { provide: UserDataExportResourceApi, useValue: userDataExportServiceMock },
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
        authorities: [UserShortDTORolesEnum.Professor],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      expect(component.role()).toBe(UserShortDTORolesEnum.Professor);
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
    it('should show general, notifications, personal-information and documents tabs for applicant', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test Applicant',
        email: 'applicant@test.com',
        authorities: [UserShortDTORolesEnum.Applicant],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      const tabs = component.tabs();

      expect(tabs).toHaveLength(4);
      expect(tabs[0].id).toBe('general');
      expect(tabs[1].id).toBe('notifications');
      expect(tabs[2].id).toBe('personal-information');
      expect(tabs[3].id).toBe('documents');
    });

    it('should show general and notifications tabs for professor (no personal-information)', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test Professor',
        email: 'professor@test.com',
        authorities: [UserShortDTORolesEnum.Professor],
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
        authorities: [UserShortDTORolesEnum.Admin],
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
        authorities: [UserShortDTORolesEnum.Applicant],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      const tabs = component.tabs();

      expect(tabs[0].translationKey).toBe('settings.tabs.general');
      expect(tabs[1].translationKey).toBe('settings.tabs.notifications');
      expect(tabs[2].translationKey).toBe('settings.tabs.personalInformation');
      expect(tabs[3].translationKey).toBe('settings.tabs.documents');
    });
  });

  // ===== ACTIVE TAB CHANGES =====
  describe('tab switching', () => {
    it('should change active tab', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test Applicant',
        email: 'applicant@test.com',
        authorities: [UserShortDTORolesEnum.Applicant],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      expect(component.activeTab()).toBe('general');

      component.onTabChange('notifications');
      expect(component.activeTab()).toBe('notifications');

      component.onTabChange('personal-information');
      expect(component.activeTab()).toBe('personal-information');

      component.onTabChange('documents');
      expect(component.activeTab()).toBe('documents');
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
        const component = TestBed.createComponent(SettingsComponent).componentInstance;

        // Case 1: Sync with system
        themeServiceMock.syncWithSystem.set(true);
        expect(component.selectedTheme().value).toBe('system');

        // Case 2: Specific theme
        themeServiceMock.syncWithSystem.set(false);
        themeServiceMock.theme.set('dark');
        expect(component.selectedTheme().value).toBe('dark');

        // Case 3: Fallback when the current theme is not in the available options
        component.themeOptions = [{ name: 'settings.appearance.options.light', value: 'light' }];
        themeServiceMock.theme.set('light');
        themeServiceMock.theme.set('dark');
        expect(component.selectedTheme().value).toBe('light');
      });
    });
  });

  describe('exportButtonDisabled()', () => {
    it('should disable the export button during cooldown or while an export is in progress', () => {
      const component = TestBed.createComponent(SettingsComponent).componentInstance;

      expect(component.exportButtonDisabled()).toBe(false);

      component.exportCooldownRemaining.set(10);
      expect(component.exportButtonDisabled()).toBe(true);

      component.exportCooldownRemaining.set(0);
      component.exportInProgress.set(true);
      expect(component.exportButtonDisabled()).toBe(true);
    });
  });

  describe('onTabChange()', () => {
    it('should keep the current tab when the requested tab does not exist', () => {
      accountServiceMock.user.set({
        id: 'u1',
        name: 'Test Applicant',
        email: 'applicant@test.com',
        authorities: [UserShortDTORolesEnum.Applicant],
      });

      const component = TestBed.createComponent(SettingsComponent).componentInstance;
      component.onTabChange('notifications');

      expect(component.activeTab()).toBe('notifications');

      component.onTabChange('invalid-tab');

      expect(component.activeTab()).toBe('notifications');
    });
  });
});
