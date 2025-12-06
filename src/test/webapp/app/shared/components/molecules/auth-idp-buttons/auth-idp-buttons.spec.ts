import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { AuthIdpButtons } from 'app/shared/components/molecules/auth-idp-buttons/auth-idp-buttons';
import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import {
  AuthFacadeServiceMock,
  createAuthFacadeServiceMock,
  provideAuthFacadeServiceMock,
} from '../../../../../util/auth-facade.service.mock';

describe('AuthIdpButtons', () => {
  let authFacadeMock: AuthFacadeServiceMock;
  let breakpointObserverMock: { observe: ReturnType<typeof vi.fn> };

  function createComponent() {
    const fixture = TestBed.createComponent(AuthIdpButtons);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    authFacadeMock = createAuthFacadeServiceMock();

    breakpointObserverMock = {
      observe: vi.fn(() =>
        of({
          breakpoints: {
            [Breakpoints.XSmall]: false,
            [Breakpoints.Small]: false,
          },
          matches: false,
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AuthIdpButtons],
      providers: [
        provideFontAwesomeTesting(),
        provideAuthFacadeServiceMock(authFacadeMock),
        {
          provide: BreakpointObserver,
          useValue: breakpointObserverMock,
        },
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
    expect(config.direction).toBe('vertical');
    expect(config.fullWidth).toBe(true);
    expect(config.buttons).toHaveLength(2);

    const [appleButton, googleButton] = config.buttons;

    expect(appleButton.label).toBe('Apple');
    expect(appleButton.icon).toBe('apple');
    expect(appleButton.variant).toBe('outlined');
    expect(appleButton.fullWidth).toBe(true);

    expect(googleButton.label).toBe('Google');
    expect(googleButton.icon).toBe('google');
    expect(googleButton.variant).toBe('outlined');
    expect(googleButton.fullWidth).toBe(true);
  });

  it('should configure buttons as icon-only and horizontal on small screens', () => {
    breakpointObserverMock.observe.mockReturnValue(
      of({
        breakpoints: {
          [Breakpoints.XSmall]: true,
          [Breakpoints.Small]: true,
        },
        matches: true,
      }),
    );

    const fixture = createComponent();
    const component = fixture.componentInstance;

    const config = component.idpButtons();

    expect(component.onlyIcons()).toBe(true);
    expect(config.direction).toBe('horizontal');
    expect(config.fullWidth).toBe(true);
    expect(config.buttons).toHaveLength(2);

    const [appleButton, googleButton] = config.buttons;

    expect(appleButton.label).toBeUndefined();
    expect(appleButton.icon).toBe('apple');
    expect(appleButton.variant).toBe('text');

    expect(googleButton.label).toBeUndefined();
    expect(googleButton.icon).toBe('google');
    expect(googleButton.variant).toBe('text');
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

    expect(authFacadeMock.loginWithProvider).toHaveBeenNthCalledWith(1, IdpProvider.Apple, origin);
    expect(authFacadeMock.loginWithProvider).toHaveBeenLastCalledWith(IdpProvider.Google, origin);
  });
});
