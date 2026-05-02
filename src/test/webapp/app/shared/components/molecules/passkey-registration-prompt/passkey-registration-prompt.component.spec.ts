import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountServiceMock, createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { AuthFacadeServiceMock, createAuthFacadeServiceMock, provideAuthFacadeServiceMock } from 'util/auth-facade.service.mock';
import {
  createKeycloakAuthenticationServiceMock,
  KeycloakAuthenticationServiceMock,
  provideKeycloakAuthenticationServiceMock,
} from 'util/keycloak.mock';
import { provideTranslateMock } from 'util/translate.mock';
import { PasskeyRegistrationPromptComponent } from 'app/shared/components/molecules/passkey-registration-prompt/passkey-registration-prompt.component';

describe('PasskeyRegistrationPromptComponent', () => {
  const promptPreferenceId = 'ui_pref_hide_passkey_prompt';

  let fixture: ComponentFixture<PasskeyRegistrationPromptComponent>;
  let component: PasskeyRegistrationPromptComponent;
  let accountServiceMock: AccountServiceMock;
  let authFacadeMock: AuthFacadeServiceMock;
  let keycloakAuthenticationServiceMock: KeycloakAuthenticationServiceMock;

  const createComponent = async (): Promise<void> => {
    fixture = TestBed.createComponent(PasskeyRegistrationPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    accountServiceMock = createAccountServiceMock(true);
    authFacadeMock = createAuthFacadeServiceMock();
    keycloakAuthenticationServiceMock = createKeycloakAuthenticationServiceMock();

    localStorage.removeItem(promptPreferenceId);

    await TestBed.configureTestingModule({
      imports: [PasskeyRegistrationPromptComponent],
      providers: [
        provideAccountServiceMock(accountServiceMock),
        provideAuthFacadeServiceMock(authFacadeMock),
        provideKeycloakAuthenticationServiceMock(keycloakAuthenticationServiceMock),
        provideTranslateMock(),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem(promptPreferenceId);
    vi.restoreAllMocks();
  });

  it('should show the prompt when user is logged in and has no passkeys', async () => {
    keycloakAuthenticationServiceMock.listPasskeys.mockResolvedValue([]);

    await createComponent();

    expect(keycloakAuthenticationServiceMock.listPasskeys).toHaveBeenCalledOnce();
    expect(component.visible()).toBe(true);
  });

  it('should keep the prompt hidden when passkeys are already configured', async () => {
    keycloakAuthenticationServiceMock.listPasskeys.mockResolvedValue([{ id: 'pk-1', label: 'Laptop' }]);

    await createComponent();

    expect(keycloakAuthenticationServiceMock.listPasskeys).toHaveBeenCalledOnce();
    expect(component.visible()).toBe(false);
  });

  it('should not evaluate prompt when hidden by stored preference', async () => {
    localStorage.setItem(promptPreferenceId, 'true');

    await createComponent();

    expect(keycloakAuthenticationServiceMock.listPasskeys).not.toHaveBeenCalled();
    expect(component.visible()).toBe(false);
  });

  it('should persist preference and close when neverAskAgain is enabled', async () => {
    await createComponent();
    component.neverAskAgain.set(true);

    component.close();

    expect(localStorage.getItem(promptPreferenceId)).toBe('true');
    expect(component.visible()).toBe(false);
  });

  it('should register passkey, hide prompt and reset busy state', async () => {
    await createComponent();

    await component.registerPasskey();

    expect(authFacadeMock.registerPasskey).toHaveBeenCalledOnce();
    expect(component.busy()).toBe(false);
    expect(component.visible()).toBe(false);
  });
});
