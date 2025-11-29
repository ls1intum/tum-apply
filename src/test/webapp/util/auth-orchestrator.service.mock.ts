import { vi } from 'vitest';
import { AuthOrchestratorService } from 'app/core/auth/auth-orchestrator.service';
import { Provider, signal, WritableSignal } from '@angular/core';
import { AuthFlowMode, LoginStep, RegisterStep } from 'app/core/auth/models/auth.model';

export interface AuthOrchestratorServiceMock {
  email: WritableSignal<string>;
  firstName: WritableSignal<string>;
  lastName: WritableSignal<string>;
  isBusy: WritableSignal<boolean>;
  isOpen: WritableSignal<boolean>;
  mode: WritableSignal<AuthFlowMode>;
  loginStep: WritableSignal<LoginStep>;
  registerStep: WritableSignal<RegisterStep>;
  nextStep: ReturnType<typeof vi.fn>;
  authSuccess: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  open: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

export function createAuthOrchestratorServiceMock(): AuthOrchestratorServiceMock {
  const isOpenSignal = signal<boolean>(true);

  const openMock = vi.fn(() => {
    isOpenSignal.set(true);
  });

  const closeMock = vi.fn(() => {
    isOpenSignal.set(false);
  });

  return {
    email: signal<string>('user@example.com'),
    firstName: signal<string>('Jane'),
    lastName: signal<string>('Doe'),
    isBusy: signal<boolean>(false),
    isOpen: isOpenSignal,
    mode: signal<AuthFlowMode>('login'),
    loginStep: signal<LoginStep>('email'),
    registerStep: signal<RegisterStep>('email'),
    nextStep: vi.fn(),
    authSuccess: vi.fn(),
    clearError: vi.fn(),
    setError: vi.fn(),
    open: openMock,
    close: closeMock,
  };
}

export function provideAuthOrchestratorServiceMock(mock: AuthOrchestratorServiceMock = createAuthOrchestratorServiceMock()): Provider {
  return { provide: AuthOrchestratorService, useValue: mock };
}
