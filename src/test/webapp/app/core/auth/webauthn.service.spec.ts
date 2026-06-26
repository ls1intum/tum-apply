import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WebAuthnService } from 'app/core/auth/webauthn.service';

/** Resolves pending microtasks so the service's awaited steps run before we assert the next HTTP call. */
const tick = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0));

function bytes(values: number[]): ArrayBuffer {
  return new Uint8Array(values).buffer;
}

describe('WebAuthnService', () => {
  let service: WebAuthnService;
  let httpMock: HttpTestingController;
  let credentialsCreate: ReturnType<typeof vi.fn>;
  let credentialsGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(WebAuthnService);
    httpMock = TestBed.inject(HttpTestingController);

    credentialsCreate = vi.fn();
    credentialsGet = vi.fn();
    // The service guards on a secure context with WebAuthn support before calling navigator.credentials.
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    (window as unknown as { PublicKeyCredential: unknown }).PublicKeyCredential = function (): void {};
    Object.defineProperty(navigator, 'credentials', {
      value: { create: credentialsCreate, get: credentialsGet },
      configurable: true,
    });
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('runs the registration ceremony and posts a base64url-encoded credential', async () => {
    credentialsCreate.mockResolvedValue({
      id: 'cred-id',
      rawId: bytes([7, 8]),
      type: 'public-key',
      authenticatorAttachment: 'platform',
      response: {
        attestationObject: bytes([9]),
        clientDataJSON: bytes([10]),
        getTransports: () => ['internal'],
      },
      getClientExtensionResults: () => ({}),
    });

    const promise = service.register('My MacBook');

    const optionsReq = httpMock.expectOne('/webauthn/register/options');
    expect(optionsReq.request.method).toBe('POST');
    expect(optionsReq.request.withCredentials).toBe(true);
    optionsReq.flush({
      challenge: 'AQID', // [1,2,3]
      rp: { id: 'localhost', name: 'TUM Apply' },
      user: { id: 'BAUG', name: 'applicant', displayName: 'Applicant' }, // [4,5,6]
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      excludeCredentials: [{ id: 'AQID', type: 'public-key' }],
    });

    await tick();

    // navigator.credentials.create received the challenge/user.id decoded to ArrayBuffers.
    const creationOptions = credentialsCreate.mock.calls[0][0].publicKey;
    expect(Array.from(new Uint8Array(creationOptions.challenge))).toEqual([1, 2, 3]);
    expect(Array.from(new Uint8Array(creationOptions.user.id))).toEqual([4, 5, 6]);
    expect(Array.from(new Uint8Array(creationOptions.excludeCredentials[0].id))).toEqual([1, 2, 3]);

    const finishReq = httpMock.expectOne('/webauthn/register');
    expect(finishReq.request.method).toBe('POST');
    expect(finishReq.request.withCredentials).toBe(true);
    expect(finishReq.request.body).toEqual({
      publicKey: {
        credential: {
          id: 'cred-id',
          rawId: 'Bwg', // base64url([7,8])
          response: {
            attestationObject: 'CQ', // base64url([9])
            clientDataJSON: 'Cg', // base64url([10])
            transports: ['internal'],
          },
          type: 'public-key',
          clientExtensionResults: {},
          authenticatorAttachment: 'platform',
        },
        label: 'My MacBook',
      },
    });
    finishReq.flush({});

    await expect(promise).resolves.toBeUndefined();
  });

  it('runs the authentication ceremony and posts the assertion to /login/webauthn', async () => {
    credentialsGet.mockResolvedValue({
      id: 'cred-id',
      rawId: bytes([7, 8]),
      type: 'public-key',
      authenticatorAttachment: 'platform',
      response: {
        authenticatorData: bytes([11]),
        clientDataJSON: bytes([12]),
        signature: bytes([13]),
        userHandle: bytes([14]),
      },
      getClientExtensionResults: () => ({}),
    });

    const promise = service.authenticate();

    const optionsReq = httpMock.expectOne('/webauthn/authenticate/options');
    expect(optionsReq.request.method).toBe('POST');
    optionsReq.flush({ challenge: 'AQID', allowCredentials: [{ id: 'BAUG', type: 'public-key' }], timeout: 300000 });

    await tick();

    const requestOptions = credentialsGet.mock.calls[0][0].publicKey;
    expect(Array.from(new Uint8Array(requestOptions.challenge))).toEqual([1, 2, 3]);
    expect(Array.from(new Uint8Array(requestOptions.allowCredentials[0].id))).toEqual([4, 5, 6]);

    const loginReq = httpMock.expectOne('/login/webauthn');
    expect(loginReq.request.method).toBe('POST');
    expect(loginReq.request.withCredentials).toBe(true);
    expect(loginReq.request.body).toEqual({
      id: 'cred-id',
      rawId: 'Bwg',
      response: {
        authenticatorData: 'Cw', // [11]
        clientDataJSON: 'DA', // [12]
        signature: 'DQ', // [13]
        userHandle: 'Dg', // [14]
      },
      type: 'public-key',
      clientExtensionResults: {},
      authenticatorAttachment: 'platform',
    });
    loginReq.flush({});

    await expect(promise).resolves.toBeUndefined();
  });

  it('lists and removes passkeys via the management endpoints', async () => {
    const listPromise = service.list();
    const listReq = httpMock.expectOne('/api/auth/webauthn/passkeys');
    expect(listReq.request.method).toBe('GET');
    expect(listReq.request.withCredentials).toBe(true);
    listReq.flush([{ id: 'p1', label: 'Phone', createdDate: 1 }]);
    await expect(listPromise).resolves.toEqual([{ id: 'p1', label: 'Phone', createdDate: 1 }]);

    const removePromise = service.remove('cred/with+special=');
    const removeReq = httpMock.expectOne(r => r.url === '/api/auth/webauthn/passkeys/cred%2Fwith%2Bspecial%3D');
    expect(removeReq.request.method).toBe('DELETE');
    removeReq.flush(null);
    await expect(removePromise).resolves.toBeUndefined();
  });

  it('rejects the ceremony in an insecure / unsupported context', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });

    await expect(service.register('x')).rejects.toThrow();
    await expect(service.authenticate()).rejects.toThrow();
    httpMock.expectNone('/webauthn/register/options');
    httpMock.expectNone('/webauthn/authenticate/options');
  });
});
