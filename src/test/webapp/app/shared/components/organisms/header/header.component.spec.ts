import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NavigationEnd } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';
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

  beforeEach(async () => {
    router = createRouterMock();
    accountService = createAccountServiceMock();
    authFacade = createAuthFacadeServiceMock();
    authDialog = createAuthDialogServiceMock();

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouterMock(router),
        provideAccountServiceMock(accountService),
        provideAuthFacadeServiceMock(authFacade),
        provideAuthDialogServiceMock(authDialog),
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
      const requestAnimationFrameSpy = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((callback: FrameRequestCallback): number => {
          callback(0);
          return 0;
        });

      component.setTheme('dark');

      expect(document.documentElement.classList.contains('tum-apply-dark-mode')).toBe(true);
      expect(localStorage.getItem('tumApplyTheme')).toBe('dark');
      expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
      expect(requestAnimationFrameSpy).toHaveBeenCalledOnce();
    });

    it('should disable dark mode and persist preference when currently dark', () => {
      document.documentElement.classList.add('tum-apply-dark-mode');
      const requestAnimationFrameSpy = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((callback: FrameRequestCallback): number => {
          callback(0);
          return 0;
        });

      component.setTheme('light');

      expect(document.documentElement.classList.contains('tum-apply-dark-mode')).toBe(false);
      expect(localStorage.getItem('tumApplyTheme')).toBe('light');
      expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
      expect(requestAnimationFrameSpy).toHaveBeenCalledOnce();
    });
  });
});
