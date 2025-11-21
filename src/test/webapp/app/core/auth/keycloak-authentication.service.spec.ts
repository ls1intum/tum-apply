import { TestBed } from '@angular/core/testing';
import {
  KeycloakAuthenticationService,
  IdpProvider,
} from '../../../../../../src/main/webapp/app/core/auth/keycloak-authentication.service';
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
      providers: [KeycloakAuthenticationService, { provide: ApplicationConfigService, useClass: MockApplicationConfigService }],
    });
    service = TestBed.inject(KeycloakAuthenticationService);
    // Setze das Mock-Objekt direkt
    // @ts-ignore
    service['keycloak'] = keycloakInstance;
  });

  describe('initialization', () => {
    it('should initialize successfully when authenticated', async () => {
      keycloakInstance.init.mockResolvedValue(true);
      const result = await service.init();
      expect(result).toBe(true);
      expect(keycloakInstance.init).toHaveBeenCalled();
    });

    it('should handle non-authenticated init', async () => {
      // @ts-ignore
      service['keycloak'] = undefined;
      keycloakInstance.init.mockResolvedValue(false);
      // @ts-ignore
      service['keycloak'] = keycloakInstance;
      expect(await service.init()).toBe(false);
    });

    it('should return undefined/false when keycloak not initialized', () => {
      // @ts-ignore
      service['keycloak'] = undefined;
      expect(service.getToken()).toBeUndefined();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('login with providers', () => {
    it.each([
      [IdpProvider.Google, 'google'],
      [IdpProvider.Microsoft, 'microsoft'],
      [IdpProvider.Apple, 'apple'],
    ])('should login with %s provider using idpHint %s', async (provider, hint) => {
      await service.loginWithProvider(provider);
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({ idpHint: hint }));
    });

    it('should login with TUM provider without idpHint', async () => {
      await service.loginWithProvider(IdpProvider.TUM);
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.not.objectContaining({ idpHint: expect.anything() }));
    });

    it('should include redirectUri when provided', async () => {
      await service.loginWithProvider(IdpProvider.Google, '/redirect');
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({ redirectUri: expect.stringContaining('/redirect') }));
    });

    it('should handle login errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      keycloakInstance.login.mockRejectedValue(new Error('Login failed'));
      await service.loginWithProvider(IdpProvider.Google);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('token refresh', () => {
    it('should refresh token when authenticated', async () => {
      keycloakInstance.authenticated = true;
      await service.ensureFreshToken();
      expect(keycloakInstance.updateToken).toHaveBeenCalledWith(20);
    });

    it('should manage refresh scheduler lifecycle', () => {
      const setSpy = vi.spyOn(global, 'setInterval');
      const clearSpy = vi.spyOn(global, 'clearInterval');

      // @ts-ignore
      service['refreshIntervalId'] = undefined;
      // @ts-ignore
      service['startTokenRefreshScheduler']();
      expect(setSpy).toHaveBeenCalled();

      // @ts-ignore
      service['refreshIntervalId'] = 123;
      // @ts-ignore
      service['stopTokenRefreshScheduler']();
      expect(clearSpy).toHaveBeenCalledWith(123);

      setSpy.mockRestore();
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
  });

  describe('window listeners', () => {
    it('should bind and unbind listeners correctly', () => {
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
      service['unbindWindowListeners']();
      expect(service['windowListenersActive']).toBe(false);
      expect(rmDocSpy).toHaveBeenCalled();
      expect(rmWinSpy).toHaveBeenCalled();

      [addDocSpy, addWinSpy, rmDocSpy, rmWinSpy].forEach(spy => spy.mockRestore());
    });

    it('should trigger token refresh on visibility change', async () => {
      keycloakInstance.authenticated = true;
      // @ts-ignore
      service['windowListenersActive'] = false;
      // @ts-ignore
      service['bindWindowListeners']();

      Object.defineProperty(document, 'hidden', { value: false, writable: true });
      const ensureFreshTokenSpy = vi.spyOn(service, 'ensureFreshToken').mockResolvedValue();
      // @ts-ignore
      service['onVisibilityChange']?.();
      expect(ensureFreshTokenSpy).toHaveBeenCalled();
      ensureFreshTokenSpy.mockRestore();
    });
  });
});
