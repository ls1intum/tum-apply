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
  cooldownSeconds: WritableSignal<number>;
  mode: WritableSignal<AuthFlowMode>;
  loginStep: WritableSignal<LoginStep>;
  registerStep: WritableSignal<RegisterStep>;
  registerProgress: WritableSignal<number>;
  totalRegisterSteps: number;
  error: WritableSignal<string | null>;
  nextStep: ReturnType<typeof vi.fn>;
  authSuccess: ReturnType<typeof vi.fn>;
  clearError: ReturnType<typeof vi.fn>;
  setError: ReturnType<typeof vi.fn>;
  open: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  previousStep: ReturnType<typeof vi.fn>;
  switchToRegister: ReturnType<typeof vi.fn>;
}

export function createAuthOrchestratorServiceMock(): AuthOrchestratorServiceMock {
  const isOpenSignal = signal<boolean>(true);
  const errorSignal = signal<string | null>(null);

  const openMock = vi.fn(() => {
    isOpenSignal.set(true);
  });

  const closeMock = vi.fn(() => {
    isOpenSignal.set(false);
  });

  const clearErrorMock = vi.fn(() => {
    errorSignal.set(null);
  });

  const setErrorMock = vi.fn((message: string) => {
    errorSignal.set(message);
  });

  return {
    email: signal<string>('user@example.com'),
    firstName: signal<string>('Jane'),
    lastName: signal<string>('Doe'),
    isBusy: signal<boolean>(false),
    isOpen: isOpenSignal,
    cooldownSeconds: signal<number>(0),
    mode: signal<AuthFlowMode>('login'),
    loginStep: signal<LoginStep>('email'),
    registerStep: signal<RegisterStep>('email'),
    registerProgress: signal<number>(1),
    totalRegisterSteps: 3,
    error: errorSignal,
    nextStep: vi.fn(),
    authSuccess: vi.fn(),
    clearError: clearErrorMock,
    setError: setErrorMock,
    open: openMock,
    close: closeMock,
    previousStep: vi.fn(),
    switchToRegister: vi.fn(),
  };
}

export function provideAuthOrchestratorServiceMock(mock: AuthOrchestratorServiceMock = createAuthOrchestratorServiceMock()): Provider {
  return { provide: AuthOrchestratorService, useValue: mock };
}
