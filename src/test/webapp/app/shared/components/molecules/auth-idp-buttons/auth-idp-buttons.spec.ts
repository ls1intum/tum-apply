import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AuthIdpButtons } from 'app/shared/components/molecules/auth-idp-buttons/auth-idp-buttons';
import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import {
  AuthFacadeServiceMock,
  createAuthFacadeServiceMock,
  provideAuthFacadeServiceMock,
} from '../../../../../util/auth-facade.service.mock';
import {
  BreakpointObserverMock,
  createBreakpointObserverMock,
  provideBreakpointObserverMock,
} from '../../../../../util/breakpoint-observer.mock';
import { signal } from '@angular/core';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';

describe('AuthIdpButtons', () => {
  let authFacadeMock: AuthFacadeServiceMock;
  let breakpointObserverMock: BreakpointObserverMock;

  // Mock Orchestrator with just the signal we need
  const authOrchestratorMock = {
    redirectUri: signal<string | null>(null),
    showSocialLogin: signal<boolean>(false),
  } as unknown as AuthOrchestratorService;

  function createComponent() {
    const fixture = TestBed.createComponent(AuthIdpButtons);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    authFacadeMock = createAuthFacadeServiceMock();
    breakpointObserverMock = createBreakpointObserverMock();

    await TestBed.configureTestingModule({
      imports: [AuthIdpButtons],
      providers: [
        provideFontAwesomeTesting(),
        provideAuthFacadeServiceMock(authFacadeMock),
        provideBreakpointObserverMock(breakpointObserverMock),
        { provide: AuthOrchestratorService, useValue: authOrchestratorMock },
      ],
    }).compileComponents();
  });

  it('should create component', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
  });

  it('should configure buttons vertically with labels on large screens', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const config = component.idpButtons();

    expect(component.onlyIcons()).toBe(false);

    expect(config.buttons).toHaveLength(2);

    const [appleButton, googleButton] = config.buttons;

    expect(appleButton.label).toBe('Apple');
    expect(appleButton.icon).toBe('apple');

    expect(googleButton.label).toBe('Google');
    expect(googleButton.icon).toBe('google');
  });

  it('should configure buttons as icon-only and horizontal on small screens', () => {
    breakpointObserverMock = createBreakpointObserverMock({
      matches: true,
      breakpoints: {
        [Breakpoints.XSmall]: true,
        [Breakpoints.Small]: true,
      },
    });

    TestBed.overrideProvider(BreakpointObserver, { useValue: breakpointObserverMock });

    const fixture = createComponent();
    const component = fixture.componentInstance;

    const config = component.idpButtons();

    expect(component.onlyIcons()).toBe(true);

    expect(config.buttons).toHaveLength(2);

    const [appleButton, googleButton] = config.buttons;

    expect(appleButton.label).toBeUndefined();
    expect(appleButton.icon).toBe('apple');

    expect(googleButton.label).toBeUndefined();
    expect(googleButton.icon).toBe('google');
  });

  it('should call authFacadeService.loginWithProvider for Apple and Google with current origin', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const origin = window.location.origin;
    const config = component.idpButtons();

    expect(config.buttons).toHaveLength(2);

    const [appleButton, googleButton] = config.buttons;

    appleButton.onClick();
    googleButton.onClick();

    expect(authFacadeMock.loginWithProvider).toHaveBeenNthCalledWith(1, IdpProvider.Apple, origin, false);
    expect(authFacadeMock.loginWithProvider).toHaveBeenLastCalledWith(IdpProvider.Google, origin, false);
  });
});
