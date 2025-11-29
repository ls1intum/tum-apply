// src/test/webapp/util/http-client.mock.ts
import { type Provider } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { HttpClient } from '@angular/common/http';

export interface HttpClientMock {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  head: ReturnType<typeof vi.fn>;
  options: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
}

export function createHttpClientMock(): HttpClientMock {
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
