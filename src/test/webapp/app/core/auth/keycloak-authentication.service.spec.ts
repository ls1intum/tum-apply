import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { IdpProvider, KeycloakAuthenticationService } from 'app/core/auth/keycloak-authentication.service';
import { KeycloakRealmKind } from 'app/core/auth/keycloak-authentication.utils';
import { createKeycloakMock, KeycloakMock, provideKeycloakMock } from 'util/keycloak.mock';
import {
  ApplicationConfigServiceMock,
  createApplicationConfigServiceMock,
  provideApplicationConfigServiceMock,
} from 'util/application-config.service.mock';
import { MessageService } from 'primeng/api';
import { provideTranslateMock } from 'util/translate.mock';

vi.mock('keycloak-js', () => ({
  default: function () {
    return createKeycloakMock();
  },
}));

describe('KeycloakAuthenticationService', () => {
  let service: KeycloakAuthenticationService;
  let keycloakInstance: KeycloakMock;
  let applicationConfigService: ApplicationConfigServiceMock;

  beforeEach(() => {
    vi.resetAllMocks();
    keycloakInstance = createKeycloakMock();
    applicationConfigService = createApplicationConfigServiceMock();
    TestBed.configureTestingModule({
      providers: [
        KeycloakAuthenticationService,
        provideApplicationConfigServiceMock(applicationConfigService),
        provideKeycloakMock(keycloakInstance),
        { provide: MessageService, useValue: { add: vi.fn() } },
        provideTranslateMock(),
      ],
    });
    service = TestBed.inject(KeycloakAuthenticationService);
    service['keycloak'] = keycloakInstance as unknown as (typeof service)['keycloak'];
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully when authenticated', async () => {
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);
      keycloakInstance.init.mockResolvedValue(true);

      const result = await service.init();

      expect(result).toBe(true);
      expect(keycloakInstance.init).toHaveBeenCalledTimes(1);
      expect(keycloakInstance.init).toHaveBeenCalledWith(expect.objectContaining({ silentCheckSsoFallback: false }));
    });

    it('should handle non-authenticated init', async () => {
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);
      keycloakInstance.init.mockResolvedValue(false);

      const result = await runSilently(() => service.init());

      expect(result).toBe(false);
      expect(keycloakInstance.init).toHaveBeenCalledTimes(2);
    });

    it('should return undefined/false when keycloak not initialized', () => {
      service['keycloak'] = undefined as unknown as (typeof service)['keycloak'];
      expect(service.getToken()).toBeUndefined();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should handle init error and return false', async () => {
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);
      keycloakInstance.init.mockRejectedValue(new Error('Init failed'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.init();

      expect(result).toBe(false);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should start token refresh scheduler after successful authenticated init and schedule refresh', async () => {
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);
      keycloakInstance.authenticated = true;
      keycloakInstance.init.mockResolvedValue(true);
      const ensureFreshTokenSpy = vi.spyOn(service, 'ensureFreshToken').mockResolvedValue();

      const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation((handler: TimerHandler): ReturnType<typeof setInterval> => {
        if (typeof handler === 'function') {
          handler(); // invoke immediately to cover the callback body
        }
        // return a dummy interval id
        return 123 as unknown as ReturnType<typeof setInterval>;
      });

      await service.init();

      expect(setIntervalSpy).toHaveBeenCalledOnce();
      expect(ensureFreshTokenSpy).toHaveBeenCalledOnce();

      setIntervalSpy.mockRestore();
      ensureFreshTokenSpy.mockRestore();
    });
  });

  describe('login with providers', () => {
    it.each([
      [IdpProvider.Google, 'google'],
      [IdpProvider.Microsoft, 'microsoft'],
      [IdpProvider.Apple, 'apple'],
    ])('should login with %s provider using idpHint %s', async (provider, hint) => {
      const createKeycloakClientSpy = vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(provider);

      expect(createKeycloakClientSpy).toHaveBeenCalledWith('external');
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({ idpHint: hint }));
      expect(keycloakInstance.login).toHaveBeenCalledOnce();
    });

    it('should login with TUM provider without idpHint', async () => {
      const createKeycloakClientSpy = vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.TUM);

      expect(createKeycloakClientSpy).toHaveBeenCalledWith('tum');
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.not.objectContaining({ idpHint: expect.anything() }));
      expect(keycloakInstance.login).toHaveBeenCalledOnce();
    });

    it('should include redirectUri when provided', async () => {
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.Google, '/redirect');

      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({ redirectUri: expect.stringContaining('/redirect') }));
      expect(keycloakInstance.login).toHaveBeenCalledOnce();
    });

    it.each([
      { label: 'external evil URI', uri: 'https://evil.com/phish', shouldNotContain: 'evil.com' },
      { label: 'origin-prefix domain', uri: window.location.origin + '.evil.com/phish', shouldNotContain: 'evil.com' },
    ])('should reject $label and fall back to origin', async ({ uri, shouldNotContain }) => {
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.Google, uri);
      expect(keycloakInstance.login).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.not.stringContaining(shouldNotContain) }),
      );
      expect(keycloakInstance.login).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.stringContaining(window.location.origin) }),
      );
    });

    it('should allow same-origin absolute redirect URIs', async () => {
      const sameOriginUri = window.location.origin + '/jobs';
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.Google, sameOriginUri);
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({ redirectUri: sameOriginUri }));
    });

    it('should handle login errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      keycloakInstance.login.mockRejectedValue(new Error('Login failed'));
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.Google);
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('token refresh', () => {
    it('should refresh token when authenticated', async () => {
      keycloakInstance.authenticated = true;
      await service.ensureFreshToken();
      expect(keycloakInstance.updateToken).toHaveBeenCalledWith(20);
      expect(keycloakInstance.updateToken).toHaveBeenCalledOnce();
    });

    it('should not refresh token when not authenticated', async () => {
      keycloakInstance.authenticated = false;
      await service.ensureFreshToken();
      expect(keycloakInstance.updateToken).not.toHaveBeenCalled();
    });

    it('should handle token refresh errors gracefully', async () => {
      keycloakInstance.authenticated = true;
      keycloakInstance.updateToken.mockRejectedValue(new Error('Token refresh failed'));
      const consoleErrorSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const logoutSpy = vi.spyOn(service, 'logout').mockResolvedValue();

      await expect(service.ensureFreshToken()).rejects.toThrow('Token refresh failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh token, logging out...', expect.any(Error));
      expect(logoutSpy).toHaveBeenCalledOnce();
      consoleErrorSpy.mockRestore();
      logoutSpy.mockRestore();
    });

    it('should not start new refresh if already in flight', async () => {
      keycloakInstance.authenticated = true;
      const firstRefresh = service.ensureFreshToken();
      const secondRefresh = service.ensureFreshToken();

      await Promise.all([firstRefresh, secondRefresh]);

      expect(keycloakInstance.updateToken).toHaveBeenCalledOnce();
    });
  });

  it('should call ensureFreshToken on visibility/focus/online events', () => {
    const ensureFreshTokenSpy = vi.spyOn(service, 'ensureFreshToken').mockResolvedValue();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });

    (service as unknown as { bindWindowListeners(): void }).bindWindowListeners();

    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));

    expect(ensureFreshTokenSpy).toHaveBeenCalledTimes(3);
    ensureFreshTokenSpy.mockRestore();
  });

  describe('logout', () => {
    it('should call keycloak logout when authenticated', async () => {
      keycloakInstance.authenticated = true;
      await service.logout();
      expect(keycloakInstance.logout).toHaveBeenCalledOnce();
    });

    it('should not call keycloak logout when not authenticated', async () => {
      keycloakInstance.authenticated = false;
      await service.logout();
      expect(keycloakInstance.logout).not.toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      keycloakInstance.authenticated = true;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      keycloakInstance.logout.mockRejectedValue(new Error('Logout failed'));

      await expect(service.logout()).rejects.toThrow('Logout failed');

      consoleErrorSpy.mockRestore();
    });

    it.each([
      { label: 'custom relative URI', uri: '/custom-redirect', shouldContain: '/custom-redirect' },
      {
        label: 'same-origin absolute URI',
        uri: window.location.origin + '/dashboard',
        shouldContain: window.location.origin + '/dashboard',
      },
    ])('should accept $label as redirect', async ({ uri, shouldContain }) => {
      keycloakInstance.authenticated = true;
      await service.logout(uri);

      expect(keycloakInstance.logout).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.stringContaining(shouldContain) }),
      );
    });

    it('should reject external redirect URIs and fall back to origin', async () => {
      keycloakInstance.authenticated = true;
      await service.logout('https://external.com/redirect');

      expect(keycloakInstance.logout).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.not.stringContaining('external.com') }),
      );
    });

    it('should stop token refresh scheduler on logout', async () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      keycloakInstance.authenticated = true;

      await service.init();

      await service.logout();

      expect(clearIntervalSpy).toHaveBeenCalledOnce();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('passkey delegation', () => {
    it('should delegate passkey login and redirect', async () => {
      const passkeyManager = { loginWithPasskey: vi.fn().mockResolvedValue(undefined) } as any;
      vi.spyOn(service as any, 'getPasskeyManager').mockReturnValue(passkeyManager);
      const refreshSpy = vi.spyOn(service as any, 'refreshKeycloakSessionFromBrowser').mockResolvedValue(undefined);
      const redirectSpy = vi.spyOn(service as any, 'redirectAfterPasskeyLogin').mockImplementation(() => {});

      await service.loginWithPasskey(KeycloakRealmKind.External, '/after-login');

      expect(passkeyManager.loginWithPasskey).toHaveBeenCalledWith(KeycloakRealmKind.External);
      expect(refreshSpy).toHaveBeenCalledWith(KeycloakRealmKind.External);
      expect(redirectSpy).toHaveBeenCalledWith('/after-login');
    });

    it('should delegate passkey registration', async () => {
      const passkeyManager = { registerPasskey: vi.fn().mockResolvedValue(undefined) } as any;
      vi.spyOn(service as any, 'getPasskeyManager').mockReturnValue(passkeyManager);

      await service.registerPasskey();

      expect(passkeyManager.registerPasskey).toHaveBeenCalledOnce();
    });

    it('should delegate passkey listing', async () => {
      const passkeyManager = { listPasskeys: vi.fn().mockResolvedValue([{ id: 'passkey-1' }]) } as any;
      vi.spyOn(service as any, 'getPasskeyManager').mockReturnValue(passkeyManager);

      await expect(service.listPasskeys()).resolves.toEqual([{ id: 'passkey-1' }]);

      expect(passkeyManager.listPasskeys).toHaveBeenCalledOnce();
    });

    it('should delegate passkey removal', async () => {
      const passkeyManager = { removePasskey: vi.fn().mockResolvedValue(undefined) } as any;
      vi.spyOn(service as any, 'getPasskeyManager').mockReturnValue(passkeyManager);

      await service.removePasskey('passkey-1');

      expect(passkeyManager.removePasskey).toHaveBeenCalledWith('passkey-1');
    });
  });

  describe('token access', () => {
    it('should return token and authentication status', () => {
      keycloakInstance.token = 'test-token-123';
      keycloakInstance.authenticated = true;
      expect(service.getToken()).toBe('test-token-123');
      expect(service.isLoggedIn()).toBe(true);

      keycloakInstance.authenticated = false;
      expect(service.isLoggedIn()).toBe(false);
    });
  });
});
