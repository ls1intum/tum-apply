import { TestBed } from '@angular/core/testing';
import { provideRouterMock, createRouterMock, RouterMock } from 'util/router.mock';
import {
  provideAuthOrchestratorServiceMock,
  createAuthOrchestratorServiceMock,
  AuthOrchestratorServiceMock,
} from 'util/auth-orchestrator.service.mock';
import { provideAccountServiceMock, createAccountServiceMock, AccountServiceMock } from 'util/account.service.mock';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { ServerAuthenticationService } from 'app/core/auth/server-authentication.service';
import { KeycloakAuthenticationService, IdpProvider } from 'app/core/auth/keycloak-authentication.service';
import { DocumentCacheService } from 'app/service/document-cache.service';
import { vi } from 'vitest';

function setup() {
  const server = { refreshTokens: vi.fn(), login: vi.fn(), sendOtp: vi.fn(), verifyOtp: vi.fn(), logout: vi.fn() };
  const keycloak = { init: vi.fn(), loginWithProvider: vi.fn(), logout: vi.fn() };
  const account: AccountServiceMock = createAccountServiceMock();
  // Spy on user.set for logout tests
  vi.spyOn(account.user, 'set');
  const orchestrator: AuthOrchestratorServiceMock = createAuthOrchestratorServiceMock();
  const docCache = { clear: vi.fn() };
  const router: RouterMock = createRouterMock();

  TestBed.configureTestingModule({
    providers: [
      AuthFacadeService,
      { provide: ServerAuthenticationService, useValue: server },
      { provide: KeycloakAuthenticationService, useValue: keycloak },
      { provide: DocumentCacheService, useValue: docCache },
      provideAccountServiceMock(account),
      provideAuthOrchestratorServiceMock(orchestrator),
      provideRouterMock(router),
    ],
  });
  const facade = TestBed.inject(AuthFacadeService);
  return { facade, server, keycloak, account, orchestrator, docCache, router };
}

describe('AuthFacadeService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initAuth server success', async () => {
    const { facade, server, account } = setup();
    server.refreshTokens.mockResolvedValue(true);
    account.loadUser.mockResolvedValue(undefined);
    const result = await facade.initAuth();
    expect(result).toBe(true);
    expect(server.refreshTokens).toHaveBeenCalled();
    expect(account.loadUser).toHaveBeenCalled();
  });

  it('initAuth keycloak fallback success', async () => {
    const { facade, server, keycloak, account } = setup();
    server.refreshTokens.mockResolvedValue(false);
    keycloak.init.mockResolvedValue(true);
    account.loadUser.mockResolvedValue(undefined);
    const result = await facade.initAuth();
    expect(result).toBe(true);
    expect(keycloak.init).toHaveBeenCalled();
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
  });

  it('loginWithEmail error surfaces orchestrator error', async () => {
    const { facade, server, orchestrator } = setup();
    server.login.mockRejectedValue(new Error('bad'));
    await expect(facade.loginWithEmail('x@y', 'pw')).rejects.toThrow();
    expect(orchestrator.setError).toHaveBeenCalled();
  });

  it('requestOtp success advances step', async () => {
    const { facade, server, orchestrator } = setup();
    server.sendOtp.mockResolvedValue(undefined);
    orchestrator.email.set('user@example.com');
    await facade.requestOtp(false);
    expect(server.sendOtp).toHaveBeenCalledWith('user@example.com', false);
    expect(orchestrator.nextStep).toHaveBeenCalledWith('otp');
  });

  it('verifyOtp login path success', async () => {
    const { facade, server, account, orchestrator } = setup();
    server.verifyOtp.mockResolvedValue({ profileRequired: false });
    account.loadUser.mockResolvedValue(undefined);
    await facade.verifyOtp('123456', false);
    expect(server.verifyOtp).toHaveBeenCalled();
    expect(account.loadUser).toHaveBeenCalled();
    expect(orchestrator.authSuccess).toHaveBeenCalled();
  });

  it('verifyOtp registration path with profile required advances step', async () => {
    const { facade, server, orchestrator, account } = setup();
    server.verifyOtp.mockResolvedValue({ profileRequired: true });
    account.loadUser.mockResolvedValue(undefined);
    orchestrator.firstName.set('Jane');
    orchestrator.lastName.set('Doe');
    await facade.verifyOtp('123456', true);
    expect(server.verifyOtp).toHaveBeenCalled();
    expect(orchestrator.nextStep).toHaveBeenCalled();
  });

  it('loginWithProvider delegates to keycloak', async () => {
    const { facade, keycloak } = setup();
    keycloak.loginWithProvider.mockResolvedValue(undefined);
    await facade.loginWithProvider('google' as IdpProvider, '/home');
    expect(keycloak.loginWithProvider).toHaveBeenCalledWith('google', '/home');
  });

  it('logout server path', async () => {
    const { facade, server, account, router, docCache } = setup();
    (facade as any).authMethod = 'server';
    account.user.set({ id: 'id-2', name: 'User', email: 'user@test.com', authorities: ['PROFESSOR'] });
    account.loaded.set(true);
    account.loaded.set(true);
    await facade.logout();
    expect(docCache.clear).toHaveBeenCalled();
    expect(server.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/professor']);
    expect(account.user.set).toHaveBeenCalledWith(undefined);
  });

  it('logout keycloak path', async () => {
    const { facade, keycloak, account, docCache } = setup();
    (facade as any).authMethod = 'keycloak';
    account.user.set({ id: 'id-2', name: 'User', email: 'user@test.com', authorities: ['ROLE_USER'] });
    await facade.logout();
    expect(docCache.clear).toHaveBeenCalled();
    expect(keycloak.logout).toHaveBeenCalled();
    expect(account.user.set).toHaveBeenCalledWith(undefined);
  });

  it('runAuthAction throws when busy', async () => {
    const { facade, orchestrator } = setup();
    orchestrator.isBusy = Object.assign(
      vi.fn(() => true),
      { set: vi.fn() },
    );
    await expect(facade.loginWithEmail('a', 'b')).rejects.toThrow('AuthOrchestrator is busy');
  });
});
