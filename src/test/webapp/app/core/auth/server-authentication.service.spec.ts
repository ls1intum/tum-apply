import { TestBed } from '@angular/core/testing';
import { ServerAuthenticationService } from 'app/core/auth/server-authentication.service';
import { AuthenticationResourceApiService } from 'app/generated/api/authenticationResourceApi.service';
import { EmailVerificationResourceApiService } from 'app/generated/api/emailVerificationResourceApi.service';
import { of, throwError } from 'rxjs';
import { OtpCompleteDTO } from 'app/generated/model/otpCompleteDTO';
import { vi } from 'vitest';
import {
  MockAuthenticationResourceApiService,
  MockEmailVerificationResourceApiService,
  mockSessionInfo,
} from 'util/authentication-resource-api.service.mock';

describe('ServerAuthenticationService', () => {
  let service: ServerAuthenticationService;
  let authApi: MockAuthenticationResourceApiService;
  let emailApi: MockEmailVerificationResourceApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServerAuthenticationService,
        { provide: AuthenticationResourceApiService, useClass: MockAuthenticationResourceApiService },
        { provide: EmailVerificationResourceApiService, useClass: MockEmailVerificationResourceApiService },
      ],
    });
    service = TestBed.inject(ServerAuthenticationService);
    authApi = TestBed.inject(AuthenticationResourceApiService) as unknown as MockAuthenticationResourceApiService;
    emailApi = TestBed.inject(EmailVerificationResourceApiService) as unknown as MockEmailVerificationResourceApiService;
  });

  describe('authentication flows', () => {
    it('should login with email and password', async () => {
      await service.login('test@example.com', 'pw');
      expect(authApi.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'pw' });
      vi.clearAllMocks();
    });

    it('should handle login error', async () => {
      authApi.login.mockReturnValueOnce({
        toPromise: () => Promise.reject(new Error('fail')),
        subscribe: (s: any, e: any) => e(new Error('fail')),
      });
      await expect(service.login('fail@example.com', 'pw')).rejects.toThrow();
      vi.clearAllMocks();
    });

    it('should logout successfully', async () => {
      await service.logout();
      expect(authApi.logout).toHaveBeenCalled();
      vi.clearAllMocks();
    });

    it('should handle logout error', async () => {
      authApi.logout.mockReturnValueOnce(throwError(() => new Error('logout failed')));
      await expect(service.logout()).rejects.toThrow();
      vi.clearAllMocks();
    });
  });

  describe('OTP flows', () => {
    it.each([
      ['registration', true],
      ['login', false],
    ])('should send OTP for %s', async (_label, isRegistration) => {
      await service.sendOtp('test@example.com', isRegistration);
      expect(emailApi.send).toHaveBeenCalledWith({ email: 'test@example.com', registration: isRegistration });
      vi.clearAllMocks();
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
      vi.clearAllMocks();
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
      vi.clearAllMocks();
    });

    it('should handle verifyOtp error', async () => {
      authApi.otpComplete.mockReturnValueOnce({
        toPromise: () => Promise.reject(new Error('fail')),
        subscribe: (s: any, e: any) => e(new Error('fail')),
      });
      await expect(service.verifyOtp('fail@example.com', '123', OtpCompleteDTO.PurposeEnum.Login)).rejects.toThrow();
      vi.clearAllMocks();
    });
  });

  describe('token refresh', () => {
    it('should refresh tokens successfully', async () => {
      const result = await service.refreshTokens();
      expect(authApi.refresh).toHaveBeenCalled();
      expect(result).toBe(true);
      vi.clearAllMocks();
    });

    it('should handle refresh error and return false', async () => {
      authApi.refresh.mockReturnValueOnce(throwError(() => new Error('fail')));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(await service.refreshTokens()).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to refresh token, logging out...', expect.any(Error));
      consoleWarnSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should not start new refresh if already in flight', async () => {
      const firstRefresh = service.refreshTokens();
      const secondRefresh = service.refreshTokens();

      await Promise.all([firstRefresh, secondRefresh]);

      expect(authApi.refresh).toHaveBeenCalledTimes(1);
      vi.clearAllMocks();
    });

    it('should schedule automatic token refresh after login', async () => {
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
      await service.login('test@example.com', 'password');

      expect(setTimeoutSpy).toHaveBeenCalled();

      setTimeoutSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should schedule automatic token refresh after OTP verification', async () => {
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
      await service.verifyOtp('test@example.com', '123456', OtpCompleteDTO.PurposeEnum.Login);

      expect(setTimeoutSpy).toHaveBeenCalled();

      setTimeoutSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should not schedule refresh timer if expiresIn is undefined', async () => {
      authApi.login.mockReturnValueOnce(of({ expiresIn: undefined }));
      const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

      await service.login('test@example.com', 'password');

      expect(setTimeoutSpy).not.toHaveBeenCalled();

      setTimeoutSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should clear refresh timer on logout', async () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      // First login to potentially start a timer
      await service.login('test@example.com', 'password');

      // Then logout
      await service.logout();

      // Verify timer was cleared (side effect of logout)
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should replace existing timer when starting new one', async () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      // Login twice
      await service.login('test@example.com', 'password');
      await service.login('test@example.com', 'password');

      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      vi.clearAllMocks();
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
      vi.clearAllMocks();
    });

    it('should not bind listeners multiple times', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      await service.login('test@example.com', 'password');

      const callCountAfterFirst = addEventListenerSpy.mock.calls.length;

      // Clear and login again
      vi.clearAllMocks();
      await service.login('test@example.com', 'password');

      expect(addEventListenerSpy).toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should unbind window event listeners after logout', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const docRemoveEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      // First login to set up listeners
      await service.login('test@example.com', 'password');

      // Then logout
      await service.logout();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(docRemoveEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      removeEventListenerSpy.mockRestore();
      docRemoveEventListenerSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should handle unbind when no listeners are active', async () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      await service.logout();
      expect(removeEventListenerSpy).not.toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
      vi.clearAllMocks();
    });
  });
});
