import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { KeycloakAuthenticationService, IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import { ApplicationConfigService } from 'app/core/config/application-config.service';

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
    service['keycloak'] = keycloakInstance as unknown as (typeof service)['keycloak'];
  });

  describe('initialization', () => {
    it('should initialize successfully when authenticated', async () => {
      keycloakInstance.init.mockResolvedValue(true);
      const result = await service.init();
      expect(result).toBe(true);
      expect(keycloakInstance.init).toHaveBeenCalled();
      vi.clearAllMocks();
    });

    it('should handle non-authenticated init', async () => {
      keycloakInstance.authenticated = false;
      keycloakInstance.init.mockResolvedValue(false);
      const result = await service.init();
      expect(result).toBe(false);
      expect(keycloakInstance.init).toHaveBeenCalled();
      vi.clearAllMocks();
    });

    it('should return undefined/false when keycloak not initialized', () => {
      service['keycloak'] = undefined as unknown as (typeof service)['keycloak'];
      expect(service.getToken()).toBeUndefined();
      expect(service.isLoggedIn()).toBe(false);
      vi.clearAllMocks();
    });

    it('should handle init error and return false', async () => {
      keycloakInstance.init.mockRejectedValue(new Error('Init failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.init();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('🔁 Keycloak init failed:', expect.any(Error));
      consoleErrorSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should start token refresh scheduler after successful authenticated init', async () => {
      keycloakInstance.authenticated = true;
      keycloakInstance.init.mockResolvedValue(true);
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      await service.init();

      expect(setIntervalSpy).toHaveBeenCalled();
      setIntervalSpy.mockRestore();
      vi.clearAllMocks();
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
      vi.clearAllMocks();
    });

    it('should login with TUM provider without idpHint', async () => {
      await service.loginWithProvider(IdpProvider.TUM);
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.not.objectContaining({ idpHint: expect.anything() }));
      vi.clearAllMocks();
    });

    it('should include redirectUri when provided', async () => {
      await service.loginWithProvider(IdpProvider.Google, '/redirect');
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({ redirectUri: expect.stringContaining('/redirect') }));
      vi.clearAllMocks();
    });

    it('should handle login errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      keycloakInstance.login.mockRejectedValue(new Error('Login failed'));
      await service.loginWithProvider(IdpProvider.Google);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
      vi.clearAllMocks();
    });
  });

  describe('token refresh', () => {
    it('should refresh token when authenticated', async () => {
      keycloakInstance.authenticated = true;
      await service.ensureFreshToken();
      expect(keycloakInstance.updateToken).toHaveBeenCalledWith(20);
      vi.clearAllMocks();
    });

    it('should not refresh token when not authenticated', async () => {
      keycloakInstance.authenticated = false;
      await service.ensureFreshToken();
      expect(keycloakInstance.updateToken).not.toHaveBeenCalled();
      vi.clearAllMocks();
    });

    it('should handle token refresh errors gracefully', async () => {
      keycloakInstance.authenticated = true;
      keycloakInstance.updateToken.mockRejectedValue(new Error('Token refresh failed'));
      const consoleErrorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const logoutSpy = vi.spyOn(service, 'logout').mockResolvedValue();

      await expect(service.ensureFreshToken()).rejects.toThrow('Token refresh failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh token, logging out...', expect.any(Error));
      expect(logoutSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
      logoutSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should not start new refresh if already in flight', async () => {
      keycloakInstance.authenticated = true;
      const firstRefresh = service.ensureFreshToken();
      const secondRefresh = service.ensureFreshToken();

      await Promise.all([firstRefresh, secondRefresh]);

      // Should only call updateToken once
      expect(keycloakInstance.updateToken).toHaveBeenCalledTimes(1);
      vi.clearAllMocks();
    });
  });

  describe('logout', () => {
    it('should call keycloak logout when authenticated', async () => {
      keycloakInstance.authenticated = true;
      await service.logout();
      expect(keycloakInstance.logout).toHaveBeenCalled();
      vi.clearAllMocks();
    });

    it('should not call keycloak logout when not authenticated', async () => {
      keycloakInstance.authenticated = false;
      await service.logout();
      expect(keycloakInstance.logout).not.toHaveBeenCalled();
      vi.clearAllMocks();
    });

    it('should handle logout errors gracefully', async () => {
      keycloakInstance.authenticated = true;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      keycloakInstance.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(service.logout()).rejects.toThrow('Logout failed');

      consoleErrorSpy.mockRestore();
      vi.clearAllMocks();
    });

    it('should use custom redirect URI when provided', async () => {
      keycloakInstance.authenticated = true;
      await service.logout('/custom-redirect');

      expect(keycloakInstance.logout).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.stringContaining('/custom-redirect') }),
      );
      vi.clearAllMocks();
    });

    it('should handle absolute redirect URIs', async () => {
      keycloakInstance.authenticated = true;
      await service.logout('https://external.com/redirect');

      expect(keycloakInstance.logout).toHaveBeenCalledWith(expect.objectContaining({ redirectUri: 'https://external.com/redirect' }));
      vi.clearAllMocks();
    });

    it('should stop token refresh scheduler on logout', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      keycloakInstance.authenticated = true;

      // First login to start scheduler
      await service.init();

      // Then logout
      await service.logout();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
      vi.clearAllMocks();
    });
  });

  describe('token access', () => {
    it('should return token when keycloak is initialized', () => {
      keycloakInstance.token = 'test-token-123';
      expect(service.getToken()).toBe('test-token-123');
      vi.clearAllMocks();
    });

    it('should return authentication status', () => {
      keycloakInstance.authenticated = true;
      expect(service.isLoggedIn()).toBe(true);

      keycloakInstance.authenticated = false;
      expect(service.isLoggedIn()).toBe(false);
      vi.clearAllMocks();
    });
  });
});
