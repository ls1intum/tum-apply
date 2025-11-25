import { vi } from 'vitest';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { Provider, signal, WritableSignal } from '@angular/core';

export interface AuthOrchestratorServiceMock {
  email: WritableSignal<string>;
  firstName: WritableSignal<string>;
  lastName: WritableSignal<string>;
  nextStep: ReturnType<typeof vi.fn>;
  authSuccess: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  isBusy: any;
}

export function createAuthOrchestratorServiceMock(): AuthOrchestratorServiceMock {
  return {
    email: signal<string>('user@example.com'),
    firstName: signal<string>('Jane'),
    lastName: signal<string>('Doe'),
    nextStep: vi.fn(),
    authSuccess: vi.fn(),
    clearError: vi.fn(),
    setError: vi.fn(),
    isBusy: Object.assign(
      vi.fn(() => false),
      { set: vi.fn() },
    ),
  };
}

export function provideAuthOrchestratorServiceMock(mock: AuthOrchestratorServiceMock = createAuthOrchestratorServiceMock()): Provider {
  return { provide: AuthOrchestratorService, useValue: mock };
}
