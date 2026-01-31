import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationEnd } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import { User } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';

import { HeaderComponent } from 'app/shared/components/organisms/header/header.component';
import { createRouterMock, provideRouterMock, RouterMock } from 'util/router.mock';
import { AccountServiceMock, createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { AuthFacadeServiceMock, createAuthFacadeServiceMock, provideAuthFacadeServiceMock } from 'util/auth-facade.service.mock';
import {
  AuthDialogServiceMock,
  createAuthDialogServiceMock,
  provideAuthDialogServiceMock,
} from '../../../../../util/auth-dialog.service.mock';
import { setupWindowMatchMediaMock, createThemeServiceMock, provideThemeServiceMock, ThemeServiceMock } from 'util/theme.service.mock';

type HeaderComponentTestInstance = Omit<HeaderComponent, 'routeAuthorities' | 'isProfessorPage'> & {
  routeAuthorities: () => UserShortDTO.RolesEnum[] | string[];
  isProfessorPage: () => boolean;
};

type AuthDialogOpenArgs = {
  mode: 'login';
  onSuccess: () => void;
};

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponentTestInstance;

  let router: RouterMock;
  let accountService: AccountServiceMock;
  let authFacade: AuthFacadeServiceMock;
  let authDialog: AuthDialogServiceMock;
  let translate: TranslateService;
  let themeService: ThemeServiceMock;

  beforeEach(async () => {
    setupWindowMatchMediaMock();

    router = createRouterMock();
    accountService = createAccountServiceMock();
    authFacade = createAuthFacadeServiceMock();
    authDialog = createAuthDialogServiceMock();
    themeService = createThemeServiceMock();

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouterMock(router),
        provideAccountServiceMock(accountService),
        provideAuthFacadeServiceMock(authFacade),
        provideAuthDialogServiceMock(authDialog),
        provideThemeServiceMock(themeService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance as HeaderComponentTestInstance;
    fixture.detectChanges();

    translate = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('navigateToHome', () => {
    it('should navigate to professor landing page when user is professor', () => {
      accountService.setAuthorities(['PROFESSOR']);

      component.navigateToHome();

      expect(router.navigate).toHaveBeenCalledWith(['/professor']);
    });

    it('should navigate to professor landing page when on professor URL and not applicant', () => {
      router.url = '/professor';
      accountService.setAuthorities([]);

      component.navigateToHome();

      expect(router.navigate).toHaveBeenCalledWith(['/professor']);
    });

    it('should navigate to applicant landing page when not professor and not on professor URL', () => {
      router.url = '/';

      component.navigateToHome();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('isProfessorPage', () => {
    it('should consider page as professor page when account has PROFESSOR authority', () => {
      accountService.setAuthorities(['PROFESSOR']);

      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance as HeaderComponentTestInstance;
      fixture.detectChanges();

      expect(component.isProfessorPage()).toBe(true);
    });

    it('should consider page as professor page when URL is /professor and user is not APPLICANT', () => {
      router.url = '/professor';
      accountService.setAuthorities([]);

      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance as HeaderComponentTestInstance;
      fixture.detectChanges();

      expect(component.isProfessorPage()).toBe(true);
    });

    it('should consider page as professor page when route authorities contain Professor role', () => {
      router.url = '/some-other-route';
      accountService.setAuthorities([]);
      router.routerState.snapshot.root.data = {
        authorities: [UserShortDTO.RolesEnum.Professor],
      };

      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance as HeaderComponentTestInstance;
      fixture.detectChanges();

      expect(component.isProfessorPage()).toBe(true);
    });

    it('should consider page as professor page when nested route snapshot contains Professor role (initial snapshot)', () => {
      router.url = '/some-nested-route';
      accountService.setAuthorities([]);

      (
        router.routerState.snapshot.root as {
          firstChild: unknown;
          data: Record<string, unknown>;
        }
      ).firstChild = {
        firstChild: {
          firstChild: null,
          data: { authorities: [UserShortDTO.RolesEnum.Professor] },
        },
        data: {},
      };

      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance as HeaderComponentTestInstance;
      fixture.detectChanges();

      expect(component.isProfessorPage()).toBe(true);
    });

    it('should update isProfessorPage when NavigationEnd occurs and nested child has authorities', () => {
      router.url = '/some-other-route';
      accountService.setAuthorities([]);

      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance as HeaderComponentTestInstance;
      fixture.detectChanges();

      (
        router.routerState.snapshot.root as {
          firstChild: unknown;
          data: Record<string, unknown>;
        }
      ).firstChild = {
        firstChild: {
          firstChild: null,
          data: { authorities: [UserShortDTO.RolesEnum.Professor] },
        },
        data: {},
      };

      router.events.next(new NavigationEnd(1, '/some-other-route', '/some-other-route'));
      fixture.detectChanges();

      expect(component.isProfessorPage()).toBe(true);
    });
  });

  describe('navigateToSettings', () => {
    it('should navigate to settings page', () => {
      component.navigateToSettings();

      expect(router.navigate).toHaveBeenCalledWith(['/settings']);
    });
  });

  describe('toggleProfileMenu', () => {
    it('should call profileMenu toggle method with event', () => {
      accountService.user.set({ id: '1', email: 'test@example.com', name: 'testuser' } satisfies User);
      fixture.detectChanges();

      const mockEvent = new MouseEvent('click');
      const menuComponent = component.profileMenu();
      const toggleSpy = vi.spyOn(menuComponent!, 'toggle');

      component.toggleProfileMenu(mockEvent);

      expect(toggleSpy).toHaveBeenCalledWith(mockEvent);
    });

    it('should not throw error when profileMenu is undefined and should not change isProfileMenuOpen', () => {
      component.isProfileMenuOpen.set(false);
      const mockEvent = new MouseEvent('click');

      vi.spyOn(component as any, 'profileMenu').mockReturnValue(undefined);

      expect(() => component.toggleProfileMenu(mockEvent)).not.toThrow();
      expect(component.isProfileMenuOpen()).toBe(false);
    });

    it('should reflect menu visibility changes in isProfileMenuOpen (simulating visibleChange)', () => {
      component.isProfileMenuOpen.set(false);

      component.isProfileMenuOpen.set(true);
      expect(component.isProfileMenuOpen()).toBe(true);

      component.isProfileMenuOpen.set(false);
      expect(component.isProfileMenuOpen()).toBe(false);
    });
  });

  describe('profileMenuItems', () => {
    it('should return empty array when user is not authenticated', () => {
      accountService.user.set(undefined);
      fixture.detectChanges();

      const menuItems = component.profileMenuItems();

      expect(menuItems).toEqual([]);
    });

    it('should return settings and logout menu items when user is authenticated', () => {
      accountService.user.set({ id: '1', email: 'test@example.com', name: 'testuser' } satisfies User);
      fixture.detectChanges();

      const menuItems = component.profileMenuItems();

      expect(menuItems).toHaveLength(2);
      expect(menuItems[0]).toMatchObject({
        label: 'header.settings',
        icon: 'gear',
        severity: 'primary',
      });
      expect(menuItems[1]).toMatchObject({
        label: 'header.logout',
        icon: 'right-from-bracket',
        severity: 'danger',
      });
    });

    it('should trigger navigateToSettings when settings menu item command is executed', () => {
      accountService.user.set({ id: '1', email: 'test@example.com', name: 'testuser' } satisfies User);
      const navigateSpy = vi.spyOn(component, 'navigateToSettings');
      fixture.detectChanges();

      const menuItems = component.profileMenuItems();
      const settingsItem = menuItems[0];
      settingsItem?.command?.();

      expect(navigateSpy).toHaveBeenCalledOnce();
    });

    it('should trigger logout when logout menu item command is executed', () => {
      accountService.user.set({ id: '1', email: 'test@example.com', name: 'testuser' } satisfies User);
      const logoutSpy = vi.spyOn(component, 'logout');
      fixture.detectChanges();

      const menuItems = component.profileMenuItems();
      const logoutItem = menuItems[1];
      logoutItem?.command?.();

      expect(logoutSpy).toHaveBeenCalledOnce();
    });

    it('should reactively update when language changes', () => {
      accountService.user.set({ id: '1', email: 'test@example.com', name: 'testuser' } satisfies User);
      fixture.detectChanges();

      const menuItemsBefore = component.profileMenuItems();
      expect(menuItemsBefore).toHaveLength(2);

      // Trigger language change
      translate.use('de');
      fixture.detectChanges();

      const menuItemsAfter = component.profileMenuItems();
      expect(menuItemsAfter).toHaveLength(2);
      // Menu items should still have the same structure
      expect(menuItemsAfter[0]?.label).toBe('header.settings');
      expect(menuItemsAfter[1]?.label).toBe('header.logout');
    });
  });

  describe('login & logout', () => {
    it('should open login dialog when login is called on applicant page', () => {
      component.isProfessorPage = () => false;

      component.login();

      expect(authDialog.open).toHaveBeenCalledTimes(1);
      const args = authDialog.open.mock.calls[0]?.[0] as AuthDialogOpenArgs;
      expect(args.mode).toBe('login');
      expect(authFacade.loginWithProvider).not.toHaveBeenCalled();
    });

    it('should perform TUM SSO login when login is called on professor page', () => {
      component.isProfessorPage = () => true;
      router.url = '/professor';

      component.login();

      expect(authDialog.open).not.toHaveBeenCalled();
      expect(authFacade.loginWithProvider).toHaveBeenCalledTimes(1);
      expect(authFacade.loginWithProvider).toHaveBeenCalledWith(IdpProvider.TUM, '/professor');
    });

    it('should call authDialogService.open in openLoginDialog', () => {
      component.openLoginDialog();

      expect(authDialog.open).toHaveBeenCalledTimes(1);
      const args = authDialog.open.mock.calls[0]?.[0] as AuthDialogOpenArgs;
      expect(args.mode).toBe('login');
    });

    it('should call loginWithProvider with TUM and current URL in onTUMSSOLogin', async () => {
      router.url = '/some-url';

      await component.onTUMSSOLogin();

      expect(authFacade.loginWithProvider).toHaveBeenCalledTimes(1);
      expect(authFacade.loginWithProvider).toHaveBeenCalledWith(IdpProvider.TUM, '/some-url');
    });

    it('should call logout on authFacadeService when logout is called', () => {
      component.logout();

      expect(authFacade.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('language handling', () => {
    it('should change language when supported language is toggled', () => {
      const useSpy = vi.spyOn(translate, 'use');
      const firstLanguage = component.languages[0];

      component.toggleLanguage(firstLanguage);

      expect(useSpy).toHaveBeenCalledTimes(1);
      expect(useSpy).toHaveBeenCalledWith(firstLanguage.toLowerCase());
    });

    it('should warn when unsupported language is toggled', () => {
      const useSpy = vi.spyOn(translate, 'use');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      component.toggleLanguage('XX');

      expect(useSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain('Unsupported language: XX');
    });

    it('should default to EN for currentLanguage when translateService has no current lang', () => {
      vi.spyOn(translate, 'getCurrentLang').mockReturnValue('');
      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance as HeaderComponentTestInstance;
      fixture.detectChanges();

      expect(component.currentLanguage()).toBe('EN');
    });
  });

  describe('layout & state exposure', () => {
    it('should expose isDarkMode signal without throwing', () => {
      const darkMode = component.isDarkMode();
      expect(typeof darkMode).toBe('boolean');
    });

    it('should default to an empty array for routeAuthorities when route data is missing authorities', () => {
      router.routerState.snapshot.root.data = {};
      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance as HeaderComponentTestInstance;
      fixture.detectChanges();

      expect(component.routeAuthorities()).toEqual([]);

      router.events.next(new NavigationEnd(1, '/', '/'));
      fixture.detectChanges();
      expect(component.routeAuthorities()).toEqual([]);
    });
  });

  describe('theme handling', () => {
    beforeEach(() => {
      document.documentElement.classList.remove('tum-apply-dark-mode', 'theme-switching');
      localStorage.clear();
    });

    it('should enable dark mode and persist preference when currently light', () => {
      component.themeService.setTheme('dark');

      expect(themeService.setTheme).toHaveBeenCalledWith('dark');
      expect(themeService.theme()).toBe('dark');
    });

    it('should disable dark mode and persist preference when currently dark', () => {
      themeService.theme.set('dark');

      component.themeService.setTheme('light');

      expect(themeService.setTheme).toHaveBeenCalledWith('light');
      expect(themeService.theme()).toBe('light');
    });
  });
});
