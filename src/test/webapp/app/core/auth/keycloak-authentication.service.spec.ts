import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { IdpProvider, KeycloakAuthenticationService } from 'app/core/auth/keycloak-authentication.service';
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

class MockPublicKeyCredential {
  constructor(
    readonly rawId: ArrayBuffer,
    readonly response: unknown,
  ) {}
}

class MockAuthenticatorAssertionResponse {
  constructor(
    readonly clientDataJSON: ArrayBuffer,
    readonly authenticatorData: ArrayBuffer,
    readonly signature: ArrayBuffer,
    readonly userHandle: ArrayBuffer | null,
  ) {}
}

class MockAuthenticatorAttestationResponse {
  constructor(
    readonly clientDataJSON: ArrayBuffer,
    readonly attestationObject: ArrayBuffer,
  ) {}
}

function buffer(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function stubWebAuthn(credentials: { create?: ReturnType<typeof vi.fn>; get?: ReturnType<typeof vi.fn> }): void {
  vi.stubGlobal('PublicKeyCredential', MockPublicKeyCredential);
  vi.stubGlobal('AuthenticatorAssertionResponse', MockAuthenticatorAssertionResponse);
  vi.stubGlobal('AuthenticatorAttestationResponse', MockAuthenticatorAttestationResponse);
  vi.stubGlobal('navigator', {
    ...navigator,
    credentials,
  });
}

describe('KeycloakAuthenticationService', () => {
  let service: KeycloakAuthenticationService;
  let keycloakInstance: KeycloakMock;
  let fetchMock: ReturnType<typeof vi.fn>;
  let applicationConfigService: ApplicationConfigServiceMock;

  beforeEach(() => {
    vi.resetAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
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
    service['activeRealmKind'] = 'tum' as unknown as (typeof service)['activeRealmKind'];
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

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      expect(ensureFreshTokenSpy).toHaveBeenCalledTimes(1);

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
      expect(keycloakInstance.login).toHaveBeenCalledTimes(1);
    });

    it('should login with TUM provider without idpHint', async () => {
      const createKeycloakClientSpy = vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.TUM);

      expect(createKeycloakClientSpy).toHaveBeenCalledWith('tum');
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.not.objectContaining({ idpHint: expect.anything() }));
      expect(keycloakInstance.login).toHaveBeenCalledTimes(1);
    });

    it('should include redirectUri when provided', async () => {
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.Google, '/redirect');

      expect(keycloakInstance.login).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.stringContaining('/redirect') }),
      );
      expect(keycloakInstance.login).toHaveBeenCalledTimes(1);
    });

    it('should reject external redirect URIs on login', async () => {
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.Google, 'https://evil.com/phish');
      expect(keycloakInstance.login).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.not.stringContaining('evil.com') }),
      );
      expect(keycloakInstance.login).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.stringContaining(window.location.origin) }),
      );
    });

    it('should allow same-origin absolute redirect URIs on login', async () => {
      const sameOriginUri = window.location.origin + '/jobs';
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.Google, sameOriginUri);
      expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({ redirectUri: sameOriginUri }));
    });

    it('should reject domains that share the origin as a prefix', async () => {
      const maliciousUri = window.location.origin + '.evil.com/phish';
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.Google, maliciousUri);
      expect(keycloakInstance.login).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.not.stringContaining('evil.com') }),
      );
    });

    it('should handle login errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      keycloakInstance.login.mockRejectedValue(new Error('Login failed'));
      vi.spyOn(service as any, 'createKeycloakClient').mockReturnValue(keycloakInstance);

      await service.loginWithProvider(IdpProvider.Google);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('token refresh', () => {
    it('should refresh token when authenticated', async () => {
      keycloakInstance.authenticated = true;
      await service.ensureFreshToken();
      expect(keycloakInstance.updateToken).toHaveBeenCalledWith(20);
      expect(keycloakInstance.updateToken).toHaveBeenCalledTimes(1);
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

      expect(keycloakInstance.updateToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('window listeners', () => {
    it('should call ensureFreshToken when document becomes visible', () => {
      const ensureFreshTokenSpy = vi.spyOn(service, 'ensureFreshToken').mockResolvedValue();

      const originalHidden = (document as any).hidden;
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });

      (service as any).bindWindowListeners();

      document.dispatchEvent(new Event('visibilitychange'));

      expect(ensureFreshTokenSpy).toHaveBeenCalledTimes(1);

      if (originalHidden !== undefined) {
        Object.defineProperty(document, 'hidden', { value: originalHidden, configurable: true });
      }

      ensureFreshTokenSpy.mockRestore();
    });

    it('should call ensureFreshToken on window focus and online events', () => {
      const ensureFreshTokenSpy = vi.spyOn(service, 'ensureFreshToken').mockResolvedValue();

      (service as any).bindWindowListeners();

      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('online'));

      expect(ensureFreshTokenSpy).toHaveBeenCalledTimes(2);

      ensureFreshTokenSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should call keycloak logout when authenticated', async () => {
      keycloakInstance.authenticated = true;
      await service.logout();
      expect(keycloakInstance.logout).toHaveBeenCalledTimes(1);
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

    it('should use custom redirect URI when provided', async () => {
      keycloakInstance.authenticated = true;
      await service.logout('/custom-redirect');

      expect(keycloakInstance.logout).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.stringContaining('/custom-redirect') }),
      );
    });

    it('should reject external redirect URIs and fall back to origin', async () => {
      keycloakInstance.authenticated = true;
      await service.logout('https://external.com/redirect');

      // External URLs must not be passed to Keycloak to prevent open redirects
      expect(keycloakInstance.logout).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.not.stringContaining('external.com') }),
      );
      expect(keycloakInstance.logout).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUri: expect.stringContaining(window.location.origin) }),
      );
    });

    it('should allow same-origin absolute redirect URIs', async () => {
      keycloakInstance.authenticated = true;
      const sameOriginUri = window.location.origin + '/dashboard';
      await service.logout(sameOriginUri);

      expect(keycloakInstance.logout).toHaveBeenCalledWith(expect.objectContaining({ redirectUri: sameOriginUri }));
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

  describe('passkey credentials', () => {
    it('should authenticate with a discoverable passkey and send the user handle', async () => {
      const credentialsGet = vi
        .fn()
        .mockResolvedValue(
          new MockPublicKeyCredential(
            buffer(4, 5, 6),
            new MockAuthenticatorAssertionResponse(buffer(7), buffer(8), buffer(9), buffer(10, 11)),
          ),
        );
      stubWebAuthn({ get: credentialsGet });
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({ challenge: 'AQID', credentialId: 'legacy-allow-credential' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
        });
      const refreshSpy = vi.spyOn(service as any, 'refreshKeycloakSessionFromBrowser').mockResolvedValue(undefined);

      await service.loginWithPasskey();

      const credentialRequest = credentialsGet.mock.calls[0][0] as CredentialRequestOptions;
      expect(credentialRequest.publicKey?.userVerification).toBe('required');
      expect(credentialRequest.publicKey?.allowCredentials).toBeUndefined();
      expect(Array.from(new Uint8Array(credentialRequest.publicKey?.challenge as ArrayBuffer))).toEqual([1, 2, 3]);

      expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://mock-keycloak/realms/tumidpldap/passkey/mock-client/challenge', {
        credentials: 'include',
      });
      const authenticateRequest = fetchMock.mock.calls[1][1] as RequestInit;
      expect(fetchMock.mock.calls[1][0]).toBe('http://mock-keycloak/realms/tumidpldap/passkey/mock-client/authenticate');
      expect(authenticateRequest.method).toBe('POST');
      expect(authenticateRequest.credentials).toBe('include');
      expect(authenticateRequest.headers).toEqual({ 'Content-Type': 'application/json', Accept: 'application/json' });
      expect(JSON.parse(authenticateRequest.body as string)).toEqual({
        credentialId: 'BAUG',
        userHandle: 'Cgs',
        clientDataJSON: 'Bw',
        authenticatorData: 'CA',
        signature: 'CQ',
        challenge: 'AQID',
      });
      expect(refreshSpy).toHaveBeenCalledOnce();
    });

    it('should reject passkey authentication when the assertion has no user handle', async () => {
      const credentialsGet = vi
        .fn()
        .mockResolvedValue(
          new MockPublicKeyCredential(buffer(4, 5, 6), new MockAuthenticatorAssertionResponse(buffer(7), buffer(8), buffer(9), null)),
        );
      stubWebAuthn({ get: credentialsGet });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ challenge: 'AQID' }),
      });

      await expect(service.loginWithPasskey()).rejects.toThrow('Passkey did not return a user handle');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should register passkeys with the Keycloak subject as WebAuthn user id', async () => {
      keycloakInstance.authenticated = true;
      keycloakInstance.tokenParsed = {
        sub: 'subject-123',
        preferred_username: 'jane',
        name: 'Jane Doe',
      };
      applicationConfigService.keycloak!.relyingPartyId = 'apply.example.test';
      const credentialsCreate = vi
        .fn()
        .mockResolvedValue(new MockPublicKeyCredential(buffer(12), new MockAuthenticatorAttestationResponse(buffer(13), buffer(14))));
      stubWebAuthn({ create: credentialsCreate });
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({ challenge: 'AQID' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

      await service.registerPasskey();

      const credentialCreation = credentialsCreate.mock.calls[0][0] as CredentialCreationOptions;
      expect(Array.from(credentialCreation.publicKey?.user.id as Uint8Array)).toEqual(Array.from(new TextEncoder().encode('subject-123')));
      expect(credentialCreation.publicKey?.user.name).toBe('jane');
      expect(credentialCreation.publicKey?.user.displayName).toBe('Jane Doe');
      expect(credentialCreation.publicKey?.rp).toEqual({ name: 'TUM AET', id: 'apply.example.test' });
      expect(credentialCreation.publicKey?.authenticatorSelection).toEqual({
        residentKey: 'required',
        userVerification: 'required',
      });

      const saveRequest = fetchMock.mock.calls[1][1] as RequestInit;
      expect(fetchMock.mock.calls[1][0]).toBe('http://mock-keycloak/realms/tumidpldap/passkey/mock-client/save');
      expect(saveRequest.credentials).toBe('include');
      expect(saveRequest.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-token',
      });
      expect(JSON.parse(saveRequest.body as string)).toEqual({
        credentialId: 'DA',
        clientDataJSON: 'DQ',
        attestationObject: 'Dg',
        challenge: 'AQID',
      });
    });

    it('should reject passkey registration when the Keycloak subject exceeds the WebAuthn user id limit', async () => {
      keycloakInstance.authenticated = true;
      keycloakInstance.tokenParsed = {
        sub: 'a'.repeat(65),
        preferred_username: 'jane',
      };
      stubWebAuthn({ create: vi.fn() });

      await expect(service.registerPasskey()).rejects.toThrow('User id is too long for WebAuthn user.id');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should use the configured relying party id for passkey registration', () => {
      applicationConfigService.keycloak!.relyingPartyId = 'staging.apply.in.tum.de';

      expect(service['getPasskeyRelyingPartyId']()).toBe('staging.apply.in.tum.de');
    });

    it('should fall back to the current hostname when relying party id is not configured', () => {
      applicationConfigService.keycloak!.relyingPartyId = '   ';

      expect(service['getPasskeyRelyingPartyId']()).toBe(window.location.hostname);
    });

    it('should list passkeys from keycloak account credentials', async () => {
      keycloakInstance.authenticated = true;
      const credentialsPayload = [
        {
          type: 'password',
          userCredentialMetadatas: [{ credential: { id: 'password-1', name: 'Password' } }],
        },
        {
          type: 'webauthn-passwordless',
          userCredentialMetadatas: [
            { credential: { id: ' passkey-1 ', name: 'MacBook Pro', createdDate: 1_710_000_000_000 } },
            { credential: null },
          ],
        },
        {
          type: 'webauthn',
          userCredentialMetadatas: [{ credential: { id: 'passkey-2', userLabel: 'Backup key', createdDate: null } }],
        },
      ];
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(credentialsPayload),
      });

      await expect(service.listPasskeys()).resolves.toEqual([
        { id: 'passkey-1', label: 'MacBook Pro', createdDate: 1_710_000_000_000 },
        { id: 'passkey-2', label: 'Backup key' },
      ]);
      expect(fetchMock).toHaveBeenCalledWith('http://mock-keycloak/realms/tumidpldap/account/credentials', {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer mock-token',
        },
      });
    });

    it('should surface API errors when loading passkeys fails', async () => {
      keycloakInstance.authenticated = true;
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        json: vi.fn().mockResolvedValue({ error: 'temporarily unavailable' }),
      });

      await expect(service.listPasskeys()).rejects.toThrow('temporarily unavailable');
    });

    it('should remove a passkey via the encoded account credential endpoint', async () => {
      keycloakInstance.authenticated = true;
      fetchMock.mockResolvedValue({
        ok: true,
        status: 204,
        json: vi.fn().mockResolvedValue({}),
      });

      await service.removePasskey('passkey/with slash');

      expect(fetchMock).toHaveBeenCalledWith('http://mock-keycloak/realms/tumidpldap/account/credentials/passkey%2Fwith%20slash', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer mock-token',
        },
      });
    });
  });

  describe('token access', () => {
    it('should return token when keycloak is initialized', () => {
      keycloakInstance.token = 'test-token-123';
      expect(service.getToken()).toBe('test-token-123');
    });

    it('should return authentication status', () => {
      keycloakInstance.authenticated = true;
      expect(service.isLoggedIn()).toBe(true);

      keycloakInstance.authenticated = false;
      expect(service.isLoggedIn()).toBe(false);
    });
  });
});
