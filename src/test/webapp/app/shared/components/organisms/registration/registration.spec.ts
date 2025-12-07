import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Registration } from 'app/shared/components/organisms/registration/registration';
import { provideTranslateMock } from 'util/translate.mock';
import { createAuthFacadeServiceMock, provideAuthFacadeServiceMock } from 'util/auth-facade.service.mock';
import {
  AuthOrchestratorServiceMock,
  createAuthOrchestratorServiceMock,
  provideAuthOrchestratorServiceMock,
} from 'util/auth-orchestrator.service.mock';
import { createAccountServiceMock } from 'util/account.service.mock';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from '../../../../../util/toast-service.mock';
import {
  ApplicationConfigServiceMock,
  createApplicationConfigServiceMock,
  provideApplicationConfigServiceMock,
} from '../../../../../util/application-config.service.mock';
import { Login } from 'app/shared/components/organisms/login/login';
import { provideFontAwesomeTesting } from '../../../../../util/fontawesome.testing';
import { provideDynamicDialogConfigMock } from '../../../../../util/dynamicdialogref.mock';
import { createHttpClientMock, HttpClientMock, provideHttpClientMock } from '../../../../../util/http-client.mock';
import { provideAccountServiceMock } from '../../../../../util/account.service.mock';

describe('Registration Component', () => {
  let fixture: ComponentFixture<Registration>;
  let component: Registration;

  let authFacade: ReturnType<typeof createAuthFacadeServiceMock>;
  let accountService: ReturnType<typeof createAccountServiceMock>;
  let authOrchestrator: AuthOrchestratorServiceMock;
  let toastService: ToastServiceMock;
  let applicationConfigService: ApplicationConfigServiceMock;
  let httpClientService: HttpClientMock;

  beforeEach(async () => {
    authFacade = createAuthFacadeServiceMock();
    accountService = createAccountServiceMock();
    authOrchestrator = createAuthOrchestratorServiceMock();
    toastService = createToastServiceMock();
    applicationConfigService = createApplicationConfigServiceMock();
    httpClientService = createHttpClientMock();

    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideAuthFacadeServiceMock(authFacade),
        provideToastServiceMock(toastService),
        provideTranslateMock(),
        provideAuthOrchestratorServiceMock(authOrchestrator),
        provideFontAwesomeTesting(),
        provideDynamicDialogConfigMock(),
        provideApplicationConfigServiceMock(applicationConfigService),
        provideHttpClientMock(httpClientService),
        provideAccountServiceMock(accountService),
      ],
    });

    fixture = TestBed.createComponent(Registration);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('sendOtp', () => {
    it('should return false for empty email', async () => {
      const res = await component.sendOtp('   ');
      expect(res).toBe(false);
    });

    it('should normalize email, set orchestrator email and request OTP', async () => {
      const email = '  test@example.com  ';
      const requestOtpSpy = vi.spyOn(authFacade, 'requestOtp').mockResolvedValue(undefined);

      const res = await component.sendOtp(email);

      expect(res).toBe(true);
      expect(authOrchestrator.email()).toBe('test@example.com');
      expect(requestOtpSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('setProfile', () => {
    it('should call accountService.updateUser and advance step on success', async () => {
      const updateSpy = vi.spyOn(accountService, 'updateUser').mockResolvedValue(undefined);
      const nextStepSpy = vi.spyOn(authOrchestrator, 'nextStep');

      await component.setProfile('John', 'Doe');

      expect(updateSpy).toHaveBeenCalledWith('John', 'Doe');
      expect(nextStepSpy).toHaveBeenCalledOnce();
    });

    it('should set orchestrator error on failure', async () => {
      vi.spyOn(accountService, 'updateUser').mockRejectedValue(new Error('fail'));
      const setErrorSpy = vi.spyOn(authOrchestrator, 'setError');
      const nextStepSpy = vi.spyOn(authOrchestrator, 'nextStep');
      await component.setProfile('John', 'Doe');

      expect(setErrorSpy).toHaveBeenCalledWith({
        summary: 'auth.common.toast.updateProfileFailed.summary',
        detail: 'auth.common.toast.updateProfileFailed.detail',
      });
      expect(nextStepSpy).not.toHaveBeenCalled();
    });
  });

  describe('setPassword', () => {
    it('should call accountService.updatePassword and advance step on success', async () => {
      component.passwordForm.controls['password'].setValue('secret123');
      const updateSpy = vi.spyOn(accountService, 'updatePassword').mockResolvedValue(undefined);
      const nextStepSpy = vi.spyOn(authOrchestrator, 'nextStep');

      await component.setPassword();

      expect(updateSpy).toHaveBeenCalledWith('secret123');
      expect(nextStepSpy).toHaveBeenCalledOnce();
    });

    it('should set orchestrator error on failure', async () => {
      component.passwordForm.controls['password'].setValue('secret123');
      vi.spyOn(accountService, 'updatePassword').mockRejectedValue(new Error('fail'));
      const setErrorSpy = vi.spyOn(authOrchestrator, 'setError');
      const nextStepSpy = vi.spyOn(authOrchestrator, 'nextStep');

      await component.setPassword();

      expect(setErrorSpy).toHaveBeenCalledWith({
        summary: 'auth.common.toast.updatePasswordFailed.summary',
        detail: 'auth.common.toast.updatePasswordFailed.detail',
      });
      expect(nextStepSpy).not.toHaveBeenCalled();
    });
  });

  describe('navigation', () => {
    it('onBack should call orchestrator.previousStep', () => {
      const prevSpy = vi.spyOn(authOrchestrator, 'previousStep');
      component.onBack();
      expect(prevSpy).toHaveBeenCalledOnce();
    });

    it('onSkip should call orchestrator.nextStep', () => {
      const nextSpy = vi.spyOn(authOrchestrator, 'nextStep');
      component.onSkip();
      expect(nextSpy).toHaveBeenCalledOnce();
    });
  });
});
