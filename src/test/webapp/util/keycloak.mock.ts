import { vi } from 'vitest';
import { Provider } from '@angular/core';

export type KeycloakMock = {
  authenticated: boolean;
  token: string;
  init: ReturnType<typeof vi.fn>;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  updateToken: ReturnType<typeof vi.fn>;
};

export function createKeycloakMock(): KeycloakMock {
  return {
    authenticated: false,
    token: 'mock-token',
    init: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    updateToken: vi.fn().mockResolvedValue(undefined),
  };
}

export function provideKeycloakMock(mock: KeycloakMock = createKeycloakMock(), provideToken: any = 'Keycloak'): Provider {
  return { provide: provideToken, useValue: mock };
}
