import { AuthFacadeService } from 'app/core/auth/auth-facade.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type AuthFacadeServiceMock = Pick<AuthFacadeService, 'requestOtp' | 'verifyOtp' | 'login' | 'logout'>;

export function createAuthFacadeServiceMock(): AuthFacadeServiceMock {
  return {
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  };
}

export function provideAuthFacadeServiceMock(mock: AuthFacadeServiceMock = createAuthFacadeServiceMock()): Provider {
  return { provide: AuthFacadeService, useValue: mock };
}
