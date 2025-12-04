import { TestBed } from '@angular/core/testing';

import { AccountServiceMock, createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { ServerAuthenticationService } from 'app/core/auth/server-authentication.service';
import { IdpProvider, KeycloakAuthenticationService } from 'app/core/auth/keycloak-authentication.service';
import { DocumentCacheService } from 'app/service/document-cache.service';
import { createKeycloakMock, provideKeycloakMock } from 'util/keycloak.mock';
import { vi } from 'vitest';
import { provideMessageServiceMock } from 'util/message-service.mock';
import { provideTranslateMock } from 'util/translate.mock';
import {
  AuthOrchestratorServiceMock,
  createAuthOrchestratorServiceMock,
  provideAuthOrchestratorServiceMock,
} from '../../../util/auth-orchestrator.service.mock';
import { createRouterMock, provideRouterMock, RouterMock } from '../../../util/router.mock';

function setup() {
  const server = { refreshTokens: vi.fn(), login: vi.fn(), sendOtp: vi.fn(), verifyOtp: vi.fn(), logout: vi.fn() };
  const keycloak = Object.assign(createKeycloakMock(), {
    init: vi.fn(),
    loginWithProvider: vi.fn(),
    logout: vi.fn(),
  });
  const account: AccountServiceMock = createAccountServiceMock();
  vi.spyOn(account.user, 'set');
  const orchestrator: AuthOrchestratorServiceMock = createAuthOrchestratorServiceMock();
  const docCache = { clear: vi.fn() };
  const router: RouterMock = createRouterMock();

  TestBed.configureTestingModule({
    providers: [
      AuthFacadeService,
      { provide: ServerAuthenticationService, useValue: server },
      { provide: DocumentCacheService, useValue: docCache },
      provideKeycloakMock(keycloak, KeycloakAuthenticationService),
      provideAccountServiceMock(account),
      provideAuthOrchestratorServiceMock(orchestrator),
      provideRouterMock(router),
      provideMessageServiceMock(),
      provideTranslateMock(),
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
    expect(server.refreshTokens).toHaveBeenCalledTimes(1);
    expect(account.loadUser).toHaveBeenCalledTimes(1);
  });

  it('initAuth keycloak fallback success', async () => {
    const { facade, server, keycloak, account } = setup();
    server.refreshTokens.mockResolvedValue(false);
    keycloak.init.mockResolvedValue(true);
    account.loadUser.mockResolvedValue(undefined);
    const result = await facade.initAuth();
    expect(result).toBe(true);
    expect(keycloak.init).toHaveBeenCalledTimes(1);
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
    expect(account.loadUser).toHaveBeenCalledTimes(1);
    expect(orchestrator.nextStep).toHaveBeenCalledTimes(1);
  });

  it('loginWithEmail error surfaces orchestrator error', async () => {
    const { facade, server, orchestrator } = setup();
    const setErrorSpy = vi.spyOn(orchestrator, 'setError');
    server.login.mockRejectedValue(new Error('bad'));
    await expect(facade.loginWithEmail('x@y', 'pw')).rejects.toThrow();
    expect(setErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('requestOtp success advances step', async () => {
    const { facade, server, orchestrator } = setup();
    server.sendOtp.mockResolvedValue(undefined);
    orchestrator.email.set('user@example.com');
    await facade.requestOtp(false);
    expect(server.sendOtp).toHaveBeenCalledWith('user@example.com', false);
    expect(orchestrator.nextStep).toHaveBeenCalledWith('otp');
    expect(server.sendOtp).toHaveBeenCalledTimes(1);
    expect(orchestrator.nextStep).toHaveBeenCalledTimes(1);
  });

  it('verifyOtp login path success', async () => {
    const { facade, server, account, orchestrator } = setup();
    server.verifyOtp.mockResolvedValue({ profileRequired: false });
    account.loadUser.mockResolvedValue(undefined);
    await facade.verifyOtp('123456', false);
    expect(server.verifyOtp).toHaveBeenCalledTimes(1);
    expect(account.loadUser).toHaveBeenCalledTimes(1);
    expect(orchestrator.authSuccess).toHaveBeenCalledTimes(2);
  });

  it('verifyOtp registration path with profile required advances step', async () => {
    const { facade, server, orchestrator, account } = setup();
    server.verifyOtp.mockResolvedValue({ profileRequired: true });
    account.loadUser.mockResolvedValue(undefined);
    orchestrator.firstName.set('Jane');
    orchestrator.lastName.set('Doe');
    await facade.verifyOtp('123456', true);
    expect(server.verifyOtp).toHaveBeenCalledTimes(1);
    expect(orchestrator.nextStep).toHaveBeenCalledTimes(1);
  });

  it('loginWithProvider delegates to keycloak', async () => {
    const { facade, keycloak } = setup();
    keycloak.loginWithProvider.mockResolvedValue(undefined);
    await facade.loginWithProvider('google' as IdpProvider, '/home');
    expect(keycloak.loginWithProvider).toHaveBeenCalledWith('google', '/home');
    expect(keycloak.loginWithProvider).toHaveBeenCalledTimes(1);
  });

  it('logout server path', async () => {
    const { facade, server, account, router, docCache } = setup();
    (facade as any).authMethod = 'server';
    account.user.set({ id: 'id-2', name: 'User', email: 'user@test.com', authorities: ['PROFESSOR'] });
    account.loaded.set(true);
    account.loaded.set(true);
    await facade.logout();
    expect(docCache.clear).toHaveBeenCalledTimes(1);
    expect(server.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/professor']);
    expect(account.user.set).toHaveBeenCalledWith(undefined);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(account.user.set).toHaveBeenCalledTimes(2);
  });

  it('logout keycloak path', async () => {
    const { facade, keycloak, account, docCache } = setup();
    (facade as any).authMethod = 'keycloak';
    account.user.set({ id: 'id-2', name: 'User', email: 'user@test.com', authorities: ['ROLE_USER'] });
    await facade.logout();
    expect(docCache.clear).toHaveBeenCalledTimes(1);
    expect(keycloak.logout).toHaveBeenCalledTimes(1);
    expect(account.user.set).toHaveBeenCalledWith(undefined);
    expect(account.user.set).toHaveBeenCalledTimes(2);
  });

  it('runAuthAction throws when busy', async () => {
    const { facade, orchestrator } = setup();
    orchestrator.isBusy.set(true);
    await expect(facade.loginWithEmail('a', 'b')).rejects.toThrow('AuthOrchestrator is busy');
  });
});
