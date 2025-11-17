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

  it('should verify OTP with registration purpose and profile', async () => {
    const profile = { firstName: 'Test', lastName: 'User' };
    const result = await service.verifyOtp('test@example.com', '123456', OtpCompleteDTO.PurposeEnum.Register, profile);
    expect(authApi.otpComplete).toHaveBeenCalledWith({ 
      email: 'test@example.com', 
      code: '123456', 
      profile, 
      purpose: OtpCompleteDTO.PurposeEnum.Register 
    });
    expect(result).toEqual(mockSessionInfo);
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
    
    clearSpy.mockRestore();
    setSpy.mockRestore();
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

  it('should not bind window listeners if already active', () => {
    // @ts-ignore
    service['windowListenersActive'] = true;
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    expect(addEventListenerSpy).not.toHaveBeenCalled();
    addEventListenerSpy.mockRestore();
  });

  it('should bind all window listeners when activated', () => {
    // @ts-ignore
    service['windowListenersActive'] = false;
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const windowAddEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowAddEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(windowAddEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    
    addEventListenerSpy.mockRestore();
    windowAddEventListenerSpy.mockRestore();
  });

  it('should not unbind window listeners if not active', () => {
    // @ts-ignore
    service['windowListenersActive'] = false;
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    // @ts-ignore
    service['unbindWindowListeners']();
    
    expect(removeEventListenerSpy).not.toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });

  it('should unbind all window listeners when deactivated', () => {
    // @ts-ignore
    service['windowListenersActive'] = true;
    // @ts-ignore
    service['onVisibilityChange'] = () => {};
    // @ts-ignore
    service['onFocus'] = () => {};
    // @ts-ignore
    service['onOnline'] = () => {};
    
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const windowRemoveEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    // @ts-ignore
    service['unbindWindowListeners']();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
    windowRemoveEventListenerSpy.mockRestore();
  });

  it('should trigger refreshTokens on visibility change when document becomes visible', async () => {
    // @ts-ignore
    service['windowListenersActive'] = false;
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    // Simulate document becoming visible
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    const refreshTokensSpy = vi.spyOn(service, 'refreshTokens').mockResolvedValue(true);
    
    // @ts-ignore
    service['onVisibilityChange']?.();
    
    expect(refreshTokensSpy).toHaveBeenCalled();
    refreshTokensSpy.mockRestore();
  });

  it('should not trigger refreshTokens on visibility change when document is hidden', async () => {
    // @ts-ignore
    service['windowListenersActive'] = false;
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    // Simulate document being hidden
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    const refreshTokensSpy = vi.spyOn(service, 'refreshTokens').mockResolvedValue(true);
    
    // @ts-ignore
    service['onVisibilityChange']?.();
    
    expect(refreshTokensSpy).not.toHaveBeenCalled();
    refreshTokensSpy.mockRestore();
  });

  it('should trigger refreshTokens on window focus', async () => {
    // @ts-ignore
    service['windowListenersActive'] = false;
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    const refreshTokensSpy = vi.spyOn(service, 'refreshTokens').mockResolvedValue(true);
    
    // @ts-ignore
    service['onFocus']?.();
    
    expect(refreshTokensSpy).toHaveBeenCalled();
    refreshTokensSpy.mockRestore();
  });

  it('should trigger refreshTokens on online event', async () => {
    // @ts-ignore
    service['windowListenersActive'] = false;
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    const refreshTokensSpy = vi.spyOn(service, 'refreshTokens').mockResolvedValue(true);
    
    // @ts-ignore
    service['onOnline']?.();
    
    expect(refreshTokensSpy).toHaveBeenCalled();
    refreshTokensSpy.mockRestore();
  });

  it('should send OTP for registration', async () => {
    await service.sendOtp('register@example.com', true);
    expect(emailApi.send).toHaveBeenCalledWith({ email: 'register@example.com', registration: true });
  });

  it('should send OTP for login', async () => {
    await service.sendOtp('login@example.com', false);
    expect(emailApi.send).toHaveBeenCalledWith({ email: 'login@example.com', registration: false });
  });
});
