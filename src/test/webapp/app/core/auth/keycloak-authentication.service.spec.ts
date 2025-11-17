
import { TestBed } from '@angular/core/testing';
import { KeycloakAuthenticationService, IdpProvider } from '../../../../../../src/main/webapp/app/core/auth/keycloak-authentication.service';
import { ApplicationConfigService } from '../../../../../../src/main/webapp/app/core/config/application-config.service';

// Mock Keycloak class
class MockKeycloak {
  authenticated = false;
  token = 'mock-token';
  init = vi.fn().mockResolvedValue(true);
  login = vi.fn().mockResolvedValue(undefined);
  logout = vi.fn().mockResolvedValue(undefined);
  updateToken = vi.fn().mockResolvedValue(undefined);
}

vi.mock('keycloak-js', () => ({
  default: function () {
    return new MockKeycloak();
  },
}));

// Mock ApplicationConfigService
class MockApplicationConfigService {
  keycloak = {
    url: 'http://mock-keycloak',
    realm: 'mock-realm',
    clientId: 'mock-client',
  };
}

describe('KeycloakAuthenticationService', () => {
  let service: KeycloakAuthenticationService;
  let keycloakInstance: MockKeycloak;

  beforeEach(() => {
    vi.resetAllMocks();
    keycloakInstance = new MockKeycloak();
    TestBed.configureTestingModule({
      providers: [
        KeycloakAuthenticationService,
        { provide: ApplicationConfigService, useClass: MockApplicationConfigService },
      ],
    });
    service = TestBed.inject(KeycloakAuthenticationService);
    // Setze das Mock-Objekt direkt
    // @ts-ignore
    service['keycloak'] = keycloakInstance;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize and authenticate', async () => {
    keycloakInstance.init.mockResolvedValue(true);
    const result = await service.init();
    expect(result).toBe(true);
    expect(keycloakInstance.init).toHaveBeenCalled();
  });

  it('should handle init when not authenticated', async () => {
    // @ts-ignore
    service['keycloak'] = undefined;
    keycloakInstance.init.mockResolvedValue(false);
    // @ts-ignore
    service['keycloak'] = keycloakInstance;
    const result = await service.init();
    expect(result).toBe(false);
  });

  it('should handle init error', async () => {
    // @ts-ignore
    service['keycloak'] = undefined;
    keycloakInstance.init.mockRejectedValue(new Error('Init failed'));
    // @ts-ignore
    service['keycloak'] = keycloakInstance;
    const result = await service.init();
    expect(result).toBe(false);
  });

  it('should return token', () => {
    expect(service.getToken()).toBe('mock-token');
  });

  it('should return undefined when keycloak not initialized', () => {
    // @ts-ignore
    service['keycloak'] = undefined;
    expect(service.getToken()).toBeUndefined();
  });

  it('should return login state', () => {
    keycloakInstance.authenticated = true;
    expect(service.isLoggedIn()).toBe(true);
    keycloakInstance.authenticated = false;
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should return false when keycloak not initialized', () => {
    // @ts-ignore
    service['keycloak'] = undefined;
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should call loginWithProvider', async () => {
    await service.loginWithProvider(IdpProvider.Google);
    expect(keycloakInstance.login).toHaveBeenCalled();
  });

  it('should call loginWithProvider with redirectUri', async () => {
    await service.loginWithProvider(IdpProvider.Google, '/redirect');
    expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({
      redirectUri: expect.stringContaining('/redirect'),
      idpHint: 'google',
    }));
  });

  it('should call loginWithProvider with Microsoft provider', async () => {
    await service.loginWithProvider(IdpProvider.Microsoft);
    expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({
      idpHint: 'microsoft',
    }));
  });

  it('should call loginWithProvider with Apple provider', async () => {
    await service.loginWithProvider(IdpProvider.Apple);
    expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({
      idpHint: 'apple',
    }));
  });

  it('should call loginWithProvider with TUM provider and no idpHint', async () => {
    await service.loginWithProvider(IdpProvider.TUM);
    expect(keycloakInstance.login).toHaveBeenCalledWith(expect.not.objectContaining({ idpHint: expect.anything() }));
  });

  it('should handle loginWithProvider error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    keycloakInstance.login.mockRejectedValue(new Error('Login failed'));
    await service.loginWithProvider(IdpProvider.Google);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should call logout with redirectUri', async () => {
    keycloakInstance.authenticated = true;
    await service.logout('/bye');
    expect(keycloakInstance.logout).toHaveBeenCalledWith(expect.objectContaining({
      redirectUri: expect.stringContaining('/bye'),
    }));
  });

  it('should call logout', async () => {
    keycloakInstance.authenticated = true;
    await service.logout();
    expect(keycloakInstance.logout).toHaveBeenCalled();
  });

  it('should not call logout if not authenticated', async () => {
    keycloakInstance.authenticated = false;
    await service.logout();
    expect(keycloakInstance.logout).not.toHaveBeenCalled();
  });

  it('should call ensureFreshToken if authenticated', async () => {
    keycloakInstance.authenticated = true;
    await service.ensureFreshToken();
    expect(keycloakInstance.updateToken).toHaveBeenCalledWith(20);
  });

  it('should not call ensureFreshToken if not authenticated', async () => {
    keycloakInstance.authenticated = false;
    await service.ensureFreshToken();
    expect(keycloakInstance.updateToken).not.toHaveBeenCalled();
  });

  it('should handle error in ensureFreshToken and call logout', async () => {
    keycloakInstance.authenticated = true;
    keycloakInstance.updateToken.mockRejectedValueOnce(new Error('fail'));
    const logoutSpy = vi.spyOn(service, 'logout').mockResolvedValue();
    await expect(service.ensureFreshToken()).rejects.toThrow('fail');
    expect(logoutSpy).toHaveBeenCalled();
    logoutSpy.mockRestore();
  });

  it('should not start new refresh if already in flight', async () => {
    keycloakInstance.authenticated = true;
    // @ts-ignore
    service['refreshInFlight'] = Promise.resolve();
    await service.ensureFreshToken();
    expect(keycloakInstance.updateToken).not.toHaveBeenCalled();
  });

  it('should start and stop token refresh scheduler', () => {
    // @ts-ignore
    service['refreshIntervalId'] = undefined;
    const setSpy = vi.spyOn(global, 'setInterval');
    // @ts-ignore
    service['startTokenRefreshScheduler']();
    expect(setSpy).toHaveBeenCalled();
    setSpy.mockRestore();

    const clearSpy = vi.spyOn(global, 'clearInterval');
    // @ts-ignore
    service['refreshIntervalId'] = 123;
    // @ts-ignore
    service['stopTokenRefreshScheduler']();
    expect(clearSpy).toHaveBeenCalledWith(123);
    clearSpy.mockRestore();
  });

  it('should not start scheduler if already running', () => {
    // @ts-ignore
    service['refreshIntervalId'] = 999;
    const setSpy = vi.spyOn(global, 'setInterval');
    // @ts-ignore
    service['startTokenRefreshScheduler']();
    expect(setSpy).not.toHaveBeenCalled();
    setSpy.mockRestore();
  });

  it('should build absolute and relative redirect URIs', () => {
    // @ts-ignore
    expect(service['buildRedirectUri']('http://foo')).toBe('http://foo');
    // @ts-ignore
    expect(service['buildRedirectUri']('/bar')).toBe(window.location.origin + '/bar');
    // @ts-ignore
    expect(service['buildRedirectUri']()).toBe(window.location.origin + '/');
  });

  it('should build absolute URI starting with https', () => {
    // @ts-ignore
    expect(service['buildRedirectUri']('https://secure.example.com')).toBe('https://secure.example.com');
  });

  it('should bind window listeners', () => {
    // @ts-ignore
    service['windowListenersActive'] = false;
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const windowAddEventListenerSpy = vi.spyOn(window, 'addEventListener');
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    expect(service['windowListenersActive']).toBe(true);
    expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowAddEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(windowAddEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    
    addEventListenerSpy.mockRestore();
    windowAddEventListenerSpy.mockRestore();
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

  it('should unbind window listeners', () => {
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
    
    expect(service['windowListenersActive']).toBe(false);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
    windowRemoveEventListenerSpy.mockRestore();
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

  it('should trigger ensureFreshToken on visibility change when document becomes visible', async () => {
    keycloakInstance.authenticated = true;
    // @ts-ignore
    service['windowListenersActive'] = false;
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    // Simulate document becoming visible
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    const ensureFreshTokenSpy = vi.spyOn(service, 'ensureFreshToken').mockResolvedValue();
    
    // @ts-ignore
    service['onVisibilityChange']?.();
    
    expect(ensureFreshTokenSpy).toHaveBeenCalled();
    ensureFreshTokenSpy.mockRestore();
  });

  it('should not trigger ensureFreshToken on visibility change when document is hidden', async () => {
    keycloakInstance.authenticated = true;
    // @ts-ignore
    service['windowListenersActive'] = false;
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    // Simulate document being hidden
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    const ensureFreshTokenSpy = vi.spyOn(service, 'ensureFreshToken').mockResolvedValue();
    
    // @ts-ignore
    service['onVisibilityChange']?.();
    
    expect(ensureFreshTokenSpy).not.toHaveBeenCalled();
    ensureFreshTokenSpy.mockRestore();
  });

  it('should trigger ensureFreshToken on window focus', async () => {
    keycloakInstance.authenticated = true;
    // @ts-ignore
    service['windowListenersActive'] = false;
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    const ensureFreshTokenSpy = vi.spyOn(service, 'ensureFreshToken').mockResolvedValue();
    
    // @ts-ignore
    service['onFocus']?.();
    
    expect(ensureFreshTokenSpy).toHaveBeenCalled();
    ensureFreshTokenSpy.mockRestore();
  });

  it('should trigger ensureFreshToken on online event', async () => {
    keycloakInstance.authenticated = true;
    // @ts-ignore
    service['windowListenersActive'] = false;
    
    // @ts-ignore
    service['bindWindowListeners']();
    
    const ensureFreshTokenSpy = vi.spyOn(service, 'ensureFreshToken').mockResolvedValue();
    
    // @ts-ignore
    service['onOnline']?.();
    
    expect(ensureFreshTokenSpy).toHaveBeenCalled();
    ensureFreshTokenSpy.mockRestore();
  });
});

