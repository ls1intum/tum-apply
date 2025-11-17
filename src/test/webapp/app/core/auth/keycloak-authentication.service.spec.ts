
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
  it('should call loginWithProvider with redirectUri', async () => {
    await service.loginWithProvider(IdpProvider.Google, '/redirect');
    expect(keycloakInstance.login).toHaveBeenCalledWith(expect.objectContaining({
      redirectUri: expect.stringContaining('/redirect'),
      idpHint: 'google',
    }));
  });

  it('should call loginWithProvider with TUM provider and no idpHint', async () => {
    await service.loginWithProvider(IdpProvider.TUM);
    expect(keycloakInstance.login).toHaveBeenCalledWith(expect.not.objectContaining({ idpHint: expect.anything() }));
  });

  it('should call logout with redirectUri', async () => {
    keycloakInstance.authenticated = true;
    await service.logout('/bye');
    expect(keycloakInstance.logout).toHaveBeenCalledWith(expect.objectContaining({
      redirectUri: expect.stringContaining('/bye'),
    }));
  });

  it('should not call logout if not authenticated', async () => {
    keycloakInstance.authenticated = false;
    await service.logout();
    expect(keycloakInstance.logout).not.toHaveBeenCalled();
  });

  it('should handle error in ensureFreshToken and call logout', async () => {
    keycloakInstance.authenticated = true;
    keycloakInstance.updateToken.mockRejectedValueOnce(new Error('fail'));
    const logoutSpy = vi.spyOn(service, 'logout').mockResolvedValue();
    await expect(service.ensureFreshToken()).rejects.toThrow('fail');
    expect(logoutSpy).toHaveBeenCalled();
    logoutSpy.mockRestore();
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

  it('should build absolute and relative redirect URIs', () => {
    // @ts-ignore
    expect(service['buildRedirectUri']('http://foo')).toBe('http://foo');
    // @ts-ignore
    expect(service['buildRedirectUri']('/bar')).toBe(window.location.origin + '/bar');
    // @ts-ignore
    expect(service['buildRedirectUri']()).toBe(window.location.origin + '/');
  });
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

  it('should return token', () => {
    expect(service.getToken()).toBe('mock-token');
  });

  it('should return login state', () => {
    keycloakInstance.authenticated = true;
    expect(service.isLoggedIn()).toBe(true);
    keycloakInstance.authenticated = false;
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should call loginWithProvider', async () => {
    await service.loginWithProvider(IdpProvider.Google);
    expect(keycloakInstance.login).toHaveBeenCalled();
  });

  it('should call logout', async () => {
    keycloakInstance.authenticated = true;
    await service.logout();
    expect(keycloakInstance.logout).toHaveBeenCalled();
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
});
