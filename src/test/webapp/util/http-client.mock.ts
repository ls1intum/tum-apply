// src/test/webapp/util/http-client.mock.ts
import { type Provider } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { HttpClient } from '@angular/common/http';

export function createHttpClientMock(): Pick<HttpClient, 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'request'> {
  return {
    get: vi.fn().mockReturnValue(of({})),
    post: vi.fn().mockReturnValue(of({})),
    put: vi.fn().mockReturnValue(of({})),
    patch: vi.fn().mockReturnValue(of({})),
    delete: vi.fn().mockReturnValue(of({})),
    head: vi.fn().mockReturnValue(of({})),
    options: vi.fn().mockReturnValue(of({})),
    request: vi.fn().mockReturnValue(of({})),
  };
}

export function provideHttpClientMock(mock: ReturnType<typeof createHttpClientMock> = createHttpClientMock()): Provider {
  return { provide: HttpClient, useValue: mock };
}
