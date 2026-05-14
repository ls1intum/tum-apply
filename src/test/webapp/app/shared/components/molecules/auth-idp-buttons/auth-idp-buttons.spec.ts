import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { AuthIdpButtons } from 'app/shared/components/molecules/auth-idp-buttons/auth-idp-buttons';
import { IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import {
  AuthFacadeServiceMock,
  createAuthFacadeServiceMock,
  provideAuthFacadeServiceMock,
} from '../../../../../util/auth-facade.service.mock';
import { signal } from '@angular/core';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';

describe('AuthIdpButtons', () => {
  let authFacadeMock: AuthFacadeServiceMock;

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

    await TestBed.configureTestingModule({
      imports: [AuthIdpButtons],
      providers: [
        provideFontAwesomeTesting(),
        provideTranslateMock(),
        provideAuthFacadeServiceMock(authFacadeMock),
        { provide: AuthOrchestratorService, useValue: authOrchestratorMock },
      ],
    }).compileComponents();
  });

  it('should configure buttons vertically with labels at all viewport sizes', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    const config = component.idpButtons();

    expect(config.direction).toBe('vertical');
    expect(config.buttons).toHaveLength(2);

    const [appleButton, googleButton] = config.buttons;

    expect(appleButton.label).toBe('Apple');
    expect(appleButton.icon).toBe('apple');

    expect(googleButton.label).toBe('Google');
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
