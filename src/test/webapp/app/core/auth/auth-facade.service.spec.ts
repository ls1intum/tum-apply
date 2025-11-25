import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { ServerAuthenticationService } from 'app/core/auth/server-authentication.service';
import { KeycloakAuthenticationService, IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import { AccountService } from 'app/core/auth/account.service';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { DocumentCacheService } from 'app/service/document-cache.service';
import { vi } from 'vitest';

type SignalFn<T> = ((...args: any[]) => T) & { set: (value: T) => void; mockReturnValue: (value: T) => any };

class MockServerAuth {
  refreshTokens = vi.fn();
  login = vi.fn();
  sendOtp = vi.fn();
  verifyOtp = vi.fn();
  logout = vi.fn();
}
class MockKeycloakAuth {
  init = vi.fn();
  loginWithProvider = vi.fn();
  logout = vi.fn();
}
class MockAccountService {
  loaded: SignalFn<boolean> = Object.assign(
    vi.fn(() => false),
    { set: vi.fn() },
  );
  user: SignalFn<any> = Object.assign(
    vi.fn(() => undefined),
    { set: vi.fn() },
  );
  loadUser = vi.fn();
}
class MockAuthOrchestrator {
  email = vi.fn(() => 'user@example.com');
  firstName = vi.fn(() => 'Jane');
  lastName = vi.fn(() => 'Doe');
  nextStep = vi.fn();
  authSuccess = vi.fn();
  clearError = vi.fn();
  setError = vi.fn();
  isBusy: SignalFn<boolean> = Object.assign(
    vi.fn(() => false),
    { set: vi.fn() },
  );
}
class MockDocumentCache {
  clear = vi.fn();
}
class MockRouter {
  navigate = vi.fn();
}

function setup() {
  const server = new MockServerAuth();
  const keycloak = new MockKeycloakAuth();
  const account = new MockAccountService();
  const orchestrator = new MockAuthOrchestrator();
  const docCache = new MockDocumentCache();
  const router = new MockRouter();
  TestBed.configureTestingModule({
    providers: [
      AuthFacadeService,
      { provide: ServerAuthenticationService, useValue: server },
      { provide: KeycloakAuthenticationService, useValue: keycloak },
      { provide: AccountService, useValue: account },
      { provide: AuthOrchestratorService, useValue: orchestrator },
      { provide: DocumentCacheService, useValue: docCache },
      { provide: Router, useValue: router },
    ],
  });
  const facade = TestBed.inject(AuthFacadeService);

  return { facade, server, keycloak, account, orchestrator, docCache, router };
}

describe('AuthFacadeService', () => {
  it('initAuth server success', async () => {
    const { facade, server, account } = setup();
    server.refreshTokens.mockResolvedValue(true);
    account.loadUser.mockResolvedValue(undefined);
    const result = await facade.initAuth();
    expect(result).toBe(true);
    expect(server.refreshTokens).toHaveBeenCalled();
    expect(account.loadUser).toHaveBeenCalled();
    vi.clearAllMocks();
  });

  it('initAuth keycloak fallback success', async () => {
    const { facade, server, keycloak, account } = setup();
    server.refreshTokens.mockResolvedValue(false);
    keycloak.init.mockResolvedValue(true);
    account.loadUser.mockResolvedValue(undefined);
    const result = await facade.initAuth();
    expect(result).toBe(true);
    expect(keycloak.init).toHaveBeenCalled();
    vi.clearAllMocks();
  });

  it('initAuth none returns false', async () => {
    const { facade, server, keycloak } = setup();
    server.refreshTokens.mockResolvedValue(false);
    keycloak.init.mockResolvedValue(false);
    const result = await facade.initAuth();
    expect(result).toBe(false);
  });

  it('loginWithEmail success triggers nextStep and authSuccess', async () => {
    const { facade, server, account, orchestrator } = setup();
    server.login.mockResolvedValue(undefined);
    account.loadUser.mockResolvedValue(undefined);
    await facade.loginWithEmail('a@b.com', 'pw');
    expect(server.login).toHaveBeenCalledWith('a@b.com', 'pw');
    expect(account.loadUser).toHaveBeenCalled();
    expect(orchestrator.nextStep).toHaveBeenCalled();
    vi.clearAllMocks();
  });

  it('loginWithEmail error surfaces orchestrator error', async () => {
    const { facade, server, orchestrator } = setup();
    server.login.mockRejectedValue(new Error('bad'));
    await expect(facade.loginWithEmail('x@y', 'pw')).rejects.toThrow();
    expect(orchestrator.setError).toHaveBeenCalled();
    vi.clearAllMocks();
  });

  it('requestOtp success advances step', async () => {
    const { facade, server, orchestrator } = setup();
    server.sendOtp.mockResolvedValue(undefined);
    orchestrator.email = vi.fn(() => 'user@example.com');
    await facade.requestOtp(false);
    expect(server.sendOtp).toHaveBeenCalledWith('user@example.com', false);
    expect(orchestrator.nextStep).toHaveBeenCalledWith('otp');
    vi.clearAllMocks();
  });

  it('verifyOtp login path success', async () => {
    const { facade, server, account, orchestrator } = setup();
    server.verifyOtp.mockResolvedValue({ profileRequired: false });
    account.loadUser.mockResolvedValue(undefined);
    await facade.verifyOtp('123456', false);
    expect(server.verifyOtp).toHaveBeenCalled();
    expect(account.loadUser).toHaveBeenCalled();
    expect(orchestrator.authSuccess).toHaveBeenCalled();
    vi.clearAllMocks();
  });

  it('verifyOtp registration path with profile required advances step', async () => {
    const { facade, server, orchestrator, account } = setup();
    server.verifyOtp.mockResolvedValue({ profileRequired: true });
    account.loadUser.mockResolvedValue(undefined);
    orchestrator.firstName = vi.fn(() => 'Jane');
    orchestrator.lastName = vi.fn(() => 'Doe');
    await facade.verifyOtp('123456', true);
    expect(server.verifyOtp).toHaveBeenCalled();
    expect(orchestrator.nextStep).toHaveBeenCalled();
    vi.clearAllMocks();
  });

  it('loginWithProvider delegates to keycloak', async () => {
    const { facade, keycloak } = setup();
    keycloak.loginWithProvider.mockResolvedValue(undefined);
    await facade.loginWithProvider('google' as IdpProvider, '/home');
    expect(keycloak.loginWithProvider).toHaveBeenCalledWith('google', '/home');
    vi.clearAllMocks();
  });

  it('logout server path', async () => {
    const { facade, server, account, router, docCache } = setup();
    // simulate authenticated server user
    account.user.mockReturnValue({ authorities: ['PROFESSOR'] });
    account.loaded.mockReturnValue(true);
    // force authMethod
    facade['authMethod'] = 'server';
    await facade.logout();
    expect(docCache.clear).toHaveBeenCalled();
    expect(server.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/professor']);
    expect(account.user.set).toHaveBeenCalledWith(undefined);
    vi.clearAllMocks();
  });

  it('logout keycloak path', async () => {
    const { facade, keycloak, account, docCache } = setup();
    account.user.mockReturnValue({ authorities: ['ROLE_USER'] });
    facade['authMethod'] = 'keycloak';
    await facade.logout();
    expect(docCache.clear).toHaveBeenCalled();
    expect(keycloak.logout).toHaveBeenCalled();
    expect(account.user.set).toHaveBeenCalledWith(undefined);
    vi.clearAllMocks();
  });

  it('runAuthAction throws when busy', async () => {
    const { facade, orchestrator } = setup();
    orchestrator.isBusy = Object.assign(
      vi.fn(() => true),
      { set: vi.fn() },
    );
    await expect(facade.loginWithEmail('a', 'b')).rejects.toThrow('AuthOrchestrator is busy');
    vi.clearAllMocks();
  });
});
