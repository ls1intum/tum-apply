import { vi } from 'vitest';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { Provider, signal, WritableSignal, computed } from '@angular/core';

export interface AuthOrchestratorServiceMock {
  email: WritableSignal<string>;
  firstName: WritableSignal<string>;
  lastName: WritableSignal<string>;
  nextStep: ReturnType<typeof vi.fn>;
  authSuccess: ReturnType<typeof vi.fn>;
  clearError: () => void;
  setError: (msg: string | null) => void;
  isBusy: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  cooldownSeconds: WritableSignal<number>;
}

export function createAuthOrchestratorServiceMock(): AuthOrchestratorServiceMock {
  const isBusy = signal(false);
  const error = signal<string | null>(null);
  const cooldownSeconds = signal(0);

  return {
    email: signal<string>('user@example.com'),
    firstName: signal<string>('Jane'),
    lastName: signal<string>('Doe'),
    nextStep: vi.fn(),
    authSuccess: vi.fn(),
    clearError: () => error.set(null),
    setError: (msg: string | null) => error.set(msg),
    isBusy,
    error,
    cooldownSeconds,
  };
}

export function provideAuthOrchestratorServiceMock(mock: AuthOrchestratorServiceMock = createAuthOrchestratorServiceMock()): Provider {
  return { provide: AuthOrchestratorService, useValue: mock };
}
