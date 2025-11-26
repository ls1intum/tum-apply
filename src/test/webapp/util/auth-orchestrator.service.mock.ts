import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { Provider, signal, WritableSignal } from '@angular/core';

export interface AuthOrchestratorServiceMock {
  email: WritableSignal<string>;
  firstName: WritableSignal<string>;
  lastName: WritableSignal<string>;

  cooldownSecondsSignal: WritableSignal<number>;
  isBusySignal: WritableSignal<boolean>;
  errorSignal: WritableSignal<unknown | null>;

  cooldownSeconds(): number;
  isBusy(): boolean;
  error(): unknown | null;
  clearError(): void;
}

export function createAuthOrchestratorServiceMock(): AuthOrchestratorServiceMock {
  const email = signal<string>('');
  const firstName = signal<string>('');
  const lastName = signal<string>('');

  const cooldownSecondsSignal = signal<number>(0);
  const isBusySignal = signal<boolean>(false);
  const errorSignal = signal<unknown | null>(null);

  return {
    email,
    firstName,
    lastName,

    cooldownSecondsSignal,
    isBusySignal,
    errorSignal,

    cooldownSeconds: () => cooldownSecondsSignal(),
    isBusy: () => isBusySignal(),
    error: () => errorSignal(),
    clearError: () => errorSignal.set(null),
  };
}

export function provideAuthOrchestratorServiceMock(mock: AuthOrchestratorServiceMock = createAuthOrchestratorServiceMock()): Provider {
  return { provide: AuthOrchestratorService, useValue: mock };
}
