import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { authInterceptor } from 'app/core/interceptor/auth.interceptor';
import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { KeycloakAuthenticationService } from 'app/core/auth/keycloak-authentication.service';

/** Lets the promise-based refresh (from(...).switchMap(...)) settle before asserting the replayed request. */
const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

const unauthorized = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor', () => {
  const refreshSession = vi.fn();
  const logout = vi.fn();
  const getToken = vi.fn();
  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    refreshSession.mockReset();
    logout.mockReset().mockResolvedValue(undefined);
    getToken.mockReset().mockReturnValue(undefined);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthFacadeService, useValue: { refreshSession, logout } },
        { provide: KeycloakAuthenticationService, useValue: { getToken } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('should attach the Keycloak bearer token when one is present', () => {
    getToken.mockReturnValue('kc-token');
    http.get('/api/data').subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.headers.get('Authorization')).toBe('Bearer kc-token');
    req.flush({});
  });

  it('should refresh the session and replay the request once on a 401', async () => {
    refreshSession.mockResolvedValue(true);
    const onNext = vi.fn();
    http.get('/api/data').subscribe({ next: onNext });

    httpMock.expectOne('/api/data').flush('Unauthorized', unauthorized);
    await settle();

    expect(refreshSession).toHaveBeenCalledOnce();
    httpMock.expectOne('/api/data').flush({ ok: true });
    await settle();

    expect(logout).not.toHaveBeenCalled();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('should log out when the refresh fails on a 401', async () => {
    refreshSession.mockResolvedValue(false);
    http.get('/api/data').subscribe({ error: () => undefined });

    httpMock.expectOne('/api/data').flush('Unauthorized', unauthorized);
    await settle();

    expect(refreshSession).toHaveBeenCalledOnce();
    expect(logout).toHaveBeenCalledWith(true);
  });

  it('should log out when the replayed request still returns 401', async () => {
    refreshSession.mockResolvedValue(true);
    http.get('/api/data').subscribe({ error: () => undefined });

    httpMock.expectOne('/api/data').flush('Unauthorized', unauthorized);
    await settle();
    httpMock.expectOne('/api/data').flush('Unauthorized', unauthorized);
    await settle();

    expect(logout).toHaveBeenCalledWith(true);
  });

  it('should not refresh or retry a 401 from an auth endpoint', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });

    httpMock.expectOne('/api/auth/login').flush('Unauthorized', unauthorized);

    expect(refreshSession).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });
});
