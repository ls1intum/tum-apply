import { TestBed } from '@angular/core/testing';
import { ServerAuthenticationService } from 'app/core/auth/server-authentication.service';
import { of, throwError } from 'rxjs';
import { OtpCompleteDTO } from 'app/generated/model/otpCompleteDTO';
import { vi } from 'vitest';
import {
  AuthenticationResourceApiServiceMock,
  EmailVerificationResourceApiServiceMock,
  createAuthenticationResourceApiServiceMock,
  createEmailVerificationResourceApiServiceMock,
  provideAuthenticationResourceApiServiceMock,
  provideEmailVerificationResourceApiServiceMock,
  mockSessionInfo,
} from 'util/authentication-resource-api.service.mock';

describe('ServerAuthenticationService', () => {
  let service: ServerAuthenticationService;
  let authApi: AuthenticationResourceApiServiceMock;
  let emailApi: EmailVerificationResourceApiServiceMock;

  beforeEach(() => {
    authApi = createAuthenticationResourceApiServiceMock();
    emailApi = createEmailVerificationResourceApiServiceMock();

    TestBed.configureTestingModule({
      providers: [
        ServerAuthenticationService,
        provideAuthenticationResourceApiServiceMock(authApi),
        provideEmailVerificationResourceApiServiceMock(emailApi),
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
      expect(authApi.logout).toHaveBeenCalled();
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
      const result = await service.verifyOtp('test@example.com', '123456', OtpCompleteDTO.PurposeEnum.Login);
      expect(authApi.otpComplete).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '123456',
        profile: undefined,
        purpose: OtpCompleteDTO.PurposeEnum.Login,
      });
      expect(result).toEqual(mockSessionInfo);
    });

    it('should verify OTP for registration with profile', async () => {
      const profile = { firstName: 'Test', lastName: 'User' };
      const result = await service.verifyOtp('test@example.com', '123456', OtpCompleteDTO.PurposeEnum.Register, profile);
      expect(authApi.otpComplete).toHaveBeenCalledWith({
        email: 'test@example.com',
        code: '123456',
        profile,
        purpose: OtpCompleteDTO.PurposeEnum.Register,
      });
      expect(result).toEqual(mockSessionInfo);
    });

    it('should handle verifyOtp error', async () => {
      authApi.otpComplete.mockReturnValueOnce({
        toPromise: () => Promise.reject(new Error('fail')),
        subscribe: (s: any, e: any) => e(new Error('fail')),
      });
      await expect(service.verifyOtp('fail@example.com', '123', OtpCompleteDTO.PurposeEnum.Login)).rejects.toThrow();
    });
  });

  describe('token refresh', () => {
    it('should refresh tokens successfully', async () => {
      const result = await service.refreshTokens();
      expect(authApi.refresh).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle refresh error and return false', async () => {
      authApi.refresh.mockReturnValueOnce(throwError(() => new Error('fail')));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(await service.refreshTokens()).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to refresh token, logging out...', expect.any(Error));
      consoleWarnSpy.mockRestore();
    });

    it('should not start new refresh if already in flight', async () => {
      const firstRefresh = service.refreshTokens();
      const secondRefresh = service.refreshTokens();
      await Promise.all([firstRefresh, secondRefresh]);
      expect(authApi.refresh).toHaveBeenCalledTimes(1);
    });

    it('should schedule automatic token refresh after login', async () => {
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
      await service.login('test@example.com', 'password');
      expect(setTimeoutSpy).toHaveBeenCalled();
      setTimeoutSpy.mockRestore();
    });

    it('should schedule automatic token refresh after OTP verification', async () => {
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
      await service.verifyOtp('test@example.com', '123456', OtpCompleteDTO.PurposeEnum.Login);
      expect(setTimeoutSpy).toHaveBeenCalled();
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
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should replace existing timer when starting new one', async () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
      await service.login('test@example.com', 'password');
      await service.login('test@example.com', 'password');
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('session management side effects', () => {
    it('should bind window event listeners after login', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const docAddEventListenerSpy = vi.spyOn(document, 'addEventListener');

      await service.login('test@example.com', 'password');

      expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(docAddEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      addEventListenerSpy.mockRestore();
      docAddEventListenerSpy.mockRestore();
    });

    it('should not bind listeners multiple times', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      await service.login('test@example.com', 'password');
      vi.clearAllMocks();
      await service.login('test@example.com', 'password');
      expect(addEventListenerSpy).toHaveBeenCalled();
      addEventListenerSpy.mockRestore();
    });

    it('should unbind window event listeners after logout', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const docRemoveEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      await service.login('test@example.com', 'password');
      await service.logout();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(docRemoveEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      removeEventListenerSpy.mockRestore();
      docRemoveEventListenerSpy.mockRestore();
    });

    it('should handle unbind when no listeners are active', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      await service.logout();
      expect(removeEventListenerSpy).not.toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
    });
  });
});
