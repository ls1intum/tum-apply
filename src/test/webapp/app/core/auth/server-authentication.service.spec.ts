import { TestBed } from '@angular/core/testing';
import { ServerAuthenticationService } from '../../../../../../src/main/webapp/app/core/auth/server-authentication.service';
import { AuthenticationResourceApiService } from '../../../../../../src/main/webapp/app/generated/api/authenticationResourceApi.service';
import { EmailVerificationResourceApiService } from '../../../../../../src/main/webapp/app/generated/api/emailVerificationResourceApi.service';
import { of } from 'rxjs';
import { OtpCompleteDTO } from '../../../../../../src/main/webapp/app/generated/model/otpCompleteDTO';

// Mock DTOs
const mockSessionInfo = { expiresIn: 60 };

// Mock Services
class MockAuthenticationResourceApiService {
  login = vi.fn().mockReturnValue(of(mockSessionInfo));
  otpComplete = vi.fn().mockReturnValue(of(mockSessionInfo));
  logout = vi.fn().mockReturnValue(of(undefined));
  refresh = vi.fn().mockReturnValue(of(mockSessionInfo));
}
class MockEmailVerificationResourceApiService {
  send = vi.fn().mockReturnValue(of(undefined));
}

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
    authApi = TestBed.inject(AuthenticationResourceApiService) as any;
    emailApi = TestBed.inject(EmailVerificationResourceApiService) as any;
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

    it('should logout and clear timer', async () => {
      // @ts-ignore
      service['refreshTimerId'] = 123;
      const clearSpy = vi.spyOn(window, 'clearTimeout');
      await service.logout();
      expect(authApi.logout).toHaveBeenCalled();
      expect(clearSpy).toHaveBeenCalled();
      clearSpy.mockRestore();
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

    it('should not call refresh again if already in flight', async () => {
      // @ts-ignore
      service['refreshInFlight'] = Promise.resolve(true);
      const result = await service.refreshTokens();
      expect(authApi.refresh).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle refresh error and return false', async () => {
      authApi.refresh.mockReturnValueOnce({
        toPromise: () => Promise.reject(new Error('fail')),
        subscribe: (s: any, e: any) => e(new Error('fail')),
      });
      expect(await service.refreshTokens()).toBe(false);
    });

    it('should manage timeout lifecycle', () => {
      const setSpy = vi.spyOn(window, 'setTimeout');
      const clearSpy = vi.spyOn(window, 'clearTimeout');

      // @ts-ignore
      service['startTokenRefreshTimeout'](60);
      expect(setSpy).toHaveBeenCalled();

      // @ts-ignore
      service['refreshTimerId'] = 123;
      // @ts-ignore
      service['stopTokenRefreshTimeout']();
      expect(clearSpy).toHaveBeenCalledWith(123);

      [setSpy, clearSpy].forEach(spy => spy.mockRestore());
    });

    it('should not start timeout if expiresIn is undefined', () => {
      const setSpy = vi.spyOn(window, 'setTimeout');
      // @ts-ignore
      service['startTokenRefreshTimeout'](undefined);
      expect(setSpy).not.toHaveBeenCalled();
      setSpy.mockRestore();
    });

    it('should clear existing timer before starting new one', () => {
      // @ts-ignore
      service['refreshTimerId'] = 999;
      const clearSpy = vi.spyOn(window, 'clearTimeout');
      const setSpy = vi.spyOn(window, 'setTimeout');

      // @ts-ignore
      service['startTokenRefreshTimeout'](60);

      expect(clearSpy).toHaveBeenCalledWith(999);
      expect(setSpy).toHaveBeenCalled();

      [clearSpy, setSpy].forEach(spy => spy.mockRestore());
    });
  });

  describe('window listeners', () => {
    it('should bind and unbind listeners', () => {
      const addDocSpy = vi.spyOn(document, 'addEventListener');
      const addWinSpy = vi.spyOn(window, 'addEventListener');
      const rmDocSpy = vi.spyOn(document, 'removeEventListener');
      const rmWinSpy = vi.spyOn(window, 'removeEventListener');

      // @ts-ignore
      service['windowListenersActive'] = false;
      // @ts-ignore
      service['bindWindowListeners']();
      expect(service['windowListenersActive']).toBe(true);
      expect(addDocSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(addWinSpy).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(addWinSpy).toHaveBeenCalledWith('online', expect.any(Function));

      // @ts-ignore
      service['onVisibilityChange'] = () => {};
      // @ts-ignore
      service['onFocus'] = () => {};
      // @ts-ignore
      service['onOnline'] = () => {};
      // @ts-ignore
      service['unbindWindowListeners']();
      expect(service['windowListenersActive']).toBe(false);
      expect(rmDocSpy).toHaveBeenCalled();
      expect(rmWinSpy).toHaveBeenCalled();

      [addDocSpy, addWinSpy, rmDocSpy, rmWinSpy].forEach(spy => spy.mockRestore());
    });

    it('should not bind if already active', () => {
      // @ts-ignore
      service['windowListenersActive'] = true;
      const addSpy = vi.spyOn(document, 'addEventListener');
      // @ts-ignore
      service['bindWindowListeners']();
      expect(addSpy).not.toHaveBeenCalled();
      addSpy.mockRestore();
    });

    it('should not unbind if not active', () => {
      // @ts-ignore
      service['windowListenersActive'] = false;
      const rmSpy = vi.spyOn(document, 'removeEventListener');
      // @ts-ignore
      service['unbindWindowListeners']();
      expect(rmSpy).not.toHaveBeenCalled();
      rmSpy.mockRestore();
    });

    it.each([
      [
        'visibility change (visible)',
        'onVisibilityChange',
        () => Object.defineProperty(document, 'hidden', { value: false, writable: true }),
      ],
      ['window focus', 'onFocus', () => {}],
      ['online event', 'onOnline', () => {}],
    ])('should trigger refreshTokens on %s', async (_label, handler, setup) => {
      // @ts-ignore
      service['windowListenersActive'] = false;
      // @ts-ignore
      service['bindWindowListeners']();
      setup();
      const refreshSpy = vi.spyOn(service, 'refreshTokens').mockResolvedValue(true);
      // @ts-ignore
      service[handler]?.();
      expect(refreshSpy).toHaveBeenCalled();
      refreshSpy.mockRestore();
    });

    it('should not trigger refreshTokens when document is hidden', async () => {
      // @ts-ignore
      service['windowListenersActive'] = false;
      // @ts-ignore
      service['bindWindowListeners']();
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      const refreshSpy = vi.spyOn(service, 'refreshTokens').mockResolvedValue(true);
      // @ts-ignore
      service['onVisibilityChange']?.();
      expect(refreshSpy).not.toHaveBeenCalled();
      refreshSpy.mockRestore();
    });
  });
});
