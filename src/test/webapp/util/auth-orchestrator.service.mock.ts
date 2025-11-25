import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { Provider, signal, WritableSignal } from '@angular/core';

export interface AuthOrchestratorServiceMock {
  email: WritableSignal<string>;
  firstName: WritableSignal<string>;
  lastName: WritableSignal<string>;
}

export function createAuthOrchestratorServiceMock(): AuthOrchestratorServiceMock {
  return {
    email: signal<string>(''),
    firstName: signal<string>(''),
    lastName: signal<string>(''),
  };
}

export function provideAuthOrchestratorServiceMock(mock: AuthOrchestratorServiceMock = createAuthOrchestratorServiceMock()): Provider {
  return { provide: AuthOrchestratorService, useValue: mock };
}
