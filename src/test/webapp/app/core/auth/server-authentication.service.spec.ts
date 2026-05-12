import { TestBed } from '@angular/core/testing';
import { ServerAuthenticationService } from 'app/core/auth/server-authentication.service';
import { of, throwError } from 'rxjs';
import { OtpCompleteDTOPurposeEnum } from 'app/generated/model/otp-complete-dto';
import { vi } from 'vitest';
import {
  AuthenticationResourceApiMock,
  createAuthenticationResourceApiMock,
  createEmailVerificationResourceApiMock,
  EmailVerificationResourceApiMock,
  mockSessionInfo,
  provideAuthenticationResourceApiMock,
  provideEmailVerificationResourceApiMock,
} from 'util/authentication-resource-api.service.mock';
import { createToastServiceMock, provideToastServiceMock, ToastServiceMock } from '../../../util/toast-service.mock';
import { createTranslateServiceMock, provideTranslateMock, TranslateServiceMock } from '../../../util/translate.mock';

describe('ServerAuthenticationService', () => {
  let service: ServerAuthenticationService;
  let authApi: AuthenticationResourceApiMock;
  let emailApi: EmailVerificationResourceApiMock;
  let toastService: ToastServiceMock;
  let translateService: TranslateServiceMock;

  beforeEach(() => {
    authApi = createAuthenticationResourceApiMock();
    emailApi = createEmailVerificationResourceApiMock();
    toastService = createToastServiceMock();
    translateService = createTranslateServiceMock();

    TestBed.configureTestingModule({
      providers: [
        ServerAuthenticationService,
        provideAuthenticationResourceApiMock(authApi),
        provideEmailVerificationResourceApiMock(emailApi),
        provideToastServiceMock(toastService),
        provideTranslateMock(translateService),
      ],
    });
    service = TestBed.inject(ServerAuthenticationService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication flows', () => {
    it('should login with email and password', async () => {
      await service.login('test@example.com', 'pw');
      expect(authApi.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'pw' });
    });

    it('should handle login error', async () => {
      authApi.login.mockReturnValueOnce({
        toPromise: () => Promise.reject(new Error('fail')),
        subscribe: (s: any, e: any) => e(new Error('fail')),
      });
      await expect(service.login('fail@example.com', 'pw')).rejects.toThrow();
    });

    it('should logout successfully', async () => {
      await service.logout();
      expect(authApi.logout).toHaveBeenCalledOnce();
    });

    it('should handle logout error', async () => {
      authApi.logout.mockReturnValueOnce(throwError(() => new Error('logout failed')));
      await expect(service.logout()).rejects.toThrow();
    });
  });

  describe('OTP flows', () => {
    it.each([
      ['registration', true],
      ['login', false],
    ])('should send OTP for %s', async (_label, isRegistration) => {
      await service.sendOtp('test@example.com', isRegistration);
      expect(emailApi.send).toHaveBeenCalledWith({ email: 'test@example.com', registration: isRegistration });
    });

    it('should verify OTP for login', async () => {
      const result = await service.verifyOtp('test@example.com', '123456', OtpCompleteDTOPurposeEnum.Login);
      expect(authApi.otpComplete).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '123456',
        profile: undefined,
        purpose: OtpCompleteDTOPurposeEnum.Login,
      });
      expect(result).toEqual(mockSessionInfo);
    });

    it('should verify OTP for registration with profile', async () => {
      const profile = { firstName: 'Test', lastName: 'User' };
      const result = await service.verifyOtp('test@example.com', '123456', OtpCompleteDTOPurposeEnum.Register, profile);
      expect(authApi.otpComplete).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '123456',
        profile,
        purpose: OtpCompleteDTOPurposeEnum.Register,
      });
      expect(result).toEqual(mockSessionInfo);
    });

    it('should handle verifyOtp error', async () => {
      authApi.otpComplete.mockReturnValueOnce({
        toPromise: () => Promise.reject(new Error('fail')),
        subscribe: (s: any, e: any) => e(new Error('fail')),
      });
      await expect(service.verifyOtp('fail@example.com', '123', OtpCompleteDTOPurposeEnum.Login)).rejects.toThrow();
    });
  });

  describe('token refresh', () => {
    it('should refresh tokens successfully', async () => {
      const result = await service.refreshTokens();
      expect(result).toBe(true);
    });

    it('should handle refresh error and return false', async () => {
      authApi.refresh.mockReturnValueOnce(throwError(() => new Error('fail')));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(await service.refreshTokens()).toBe(false);
      consoleWarnSpy.mockRestore();
    });

    it('should treat authenticated=false response as no session without warning', async () => {
      authApi.refresh.mockReturnValueOnce(of({ authenticated: false, expiresIn: 0, refreshExpiresIn: 0 }));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
      expect(await service.refreshTokens(true)).toBe(false);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(setTimeoutSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
      setTimeoutSpy.mockRestore();
    });

    it('should not start new refresh if already in flight', async () => {
      const firstRefresh = service.refreshTokens();
      const secondRefresh = service.refreshTokens();
      await Promise.all([firstRefresh, secondRefresh]);
      expect(authApi.refresh).toHaveBeenCalledOnce();
    });

    it('should schedule automatic token refresh after login or OTP verification', async () => {
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
      await service.login('test@example.com', 'password');
      expect(setTimeoutSpy).toHaveBeenCalledOnce();

      setTimeoutSpy.mockClear();
      await service.verifyOtp('test@example.com', '123456', OtpCompleteDTOPurposeEnum.Login);
      expect(setTimeoutSpy).toHaveBeenCalledOnce();

      setTimeoutSpy.mockRestore();
    });

    it('should not schedule refresh timer if expiresIn is undefined', async () => {
      authApi.login.mockReturnValueOnce(of({ expiresIn: undefined }));
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
      await service.login('test@example.com', 'password');
      expect(setTimeoutSpy).not.toHaveBeenCalled();
      setTimeoutSpy.mockRestore();
    });

    it('should clear refresh timer on logout', async () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      await service.login('test@example.com', 'password');
      await service.logout();
      expect(clearTimeoutSpy).toHaveBeenCalledOnce();
      clearTimeoutSpy.mockRestore();
    });

    it('should replace existing timer when starting new one', async () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      await service.login('test@example.com', 'password');
      await service.login('test@example.com', 'password');
      expect(clearTimeoutSpy).toHaveBeenCalledOnce();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('session management side effects', () => {
    it('should bind/unbind window event listeners on login/logout', async () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const docAddSpy = vi.spyOn(document, 'addEventListener');
      const docRemoveSpy = vi.spyOn(document, 'removeEventListener');

      await service.login('test@example.com', 'password');

      expect(addSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(docAddSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      await service.logout();

      expect(removeSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(docRemoveSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
      docAddSpy.mockRestore();
      docRemoveSpy.mockRestore();
    });

    it('should not unbind when no listeners are active', async () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      await service.logout();
      expect(removeSpy).not.toHaveBeenCalled();
      removeSpy.mockRestore();
    });
  });
});
