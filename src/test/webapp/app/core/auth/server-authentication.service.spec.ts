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
  it('should handle login error', async () => {
    authApi.login.mockReturnValueOnce({
      toPromise: () => Promise.reject(new Error('fail')),
      subscribe: (s: any, e: any) => e(new Error('fail')),
    });
    await expect(service.login('fail@example.com', 'pw')).rejects.toThrow();
  });

  it('should handle verifyOtp error', async () => {
    authApi.otpComplete.mockReturnValueOnce({
      toPromise: () => Promise.reject(new Error('fail')),
      subscribe: (s: any, e: any) => e(new Error('fail')),
    });
    await expect(service.verifyOtp('fail@example.com', '123', OtpCompleteDTO.PurposeEnum.Login)).rejects.toThrow();
  });

  it('should handle refreshTokens error and return false', async () => {
    authApi.refresh.mockReturnValueOnce({
      toPromise: () => Promise.reject(new Error('fail')),
      subscribe: (s: any, e: any) => e(new Error('fail')),
    });
    const result = await service.refreshTokens();
    expect(result).toBe(false);
  });

  it('should start and stop token refresh timeout', () => {
    const setSpy = vi.spyOn(window, 'setTimeout');
    // @ts-ignore
    service['startTokenRefreshTimeout'](60);
    expect(setSpy).toHaveBeenCalled();
    setSpy.mockRestore();

    const clearSpy = vi.spyOn(window, 'clearTimeout');
    // @ts-ignore
    service['refreshTimerId'] = 123;
    // @ts-ignore
    service['stopTokenRefreshTimeout']();
    expect(clearSpy).toHaveBeenCalledWith(123);
    clearSpy.mockRestore();
  });

  it('should bind and unbind window listeners', () => {
    // @ts-ignore
    service['windowListenersActive'] = false;
    // @ts-ignore
    service['bindWindowListeners']();
    expect(service['windowListenersActive']).toBe(true);
    // @ts-ignore
    service['unbindWindowListeners']();
    expect(service['windowListenersActive']).toBe(false);
  });
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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should login with email and password', async () => {
    await service.login('test@example.com', 'pw');
    expect(authApi.login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'pw' });
  });

  it('should send OTP', async () => {
    await service.sendOtp('test@example.com', true);
    expect(emailApi.send).toHaveBeenCalledWith({ email: 'test@example.com', registration: true });
  });

  it('should verify OTP', async () => {
    const result = await service.verifyOtp('test@example.com', '123456', OtpCompleteDTO.PurposeEnum.Login);
    expect(authApi.otpComplete).toHaveBeenCalledWith({ email: 'test@example.com', code: '123456', profile: undefined, purpose: OtpCompleteDTO.PurposeEnum.Login });
    expect(result).toEqual(mockSessionInfo);
  });

  it('should logout and clear timer', async () => {
    // Set a fake timer
    // @ts-ignore
    service['refreshTimerId'] = 123;
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    await service.logout();
    expect(authApi.logout).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('should refresh tokens', async () => {
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
});
