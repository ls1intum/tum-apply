import { Provider } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthenticationResourceApi } from 'app/generated/api/authentication-resource-api';
import { EmailVerificationResourceApi } from 'app/generated/api/email-verification-resource-api';

export const mockSessionInfo = { expiresIn: 60 };

export type AuthenticationResourceApiMock = Pick<
  AuthenticationResourceApi,
  'login' | 'otpComplete' | 'logout' | 'refresh'
> & {
  login: ReturnType<typeof vi.fn>;
  otpComplete: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
};

export function createAuthenticationResourceApiMock(): AuthenticationResourceApiMock {
  return {
    login: vi.fn().mockReturnValue(of(mockSessionInfo)),
    otpComplete: vi.fn().mockReturnValue(of(mockSessionInfo)),
    logout: vi.fn().mockReturnValue(of(undefined)),
    refresh: vi.fn().mockReturnValue(of(mockSessionInfo)),
  };
}

export function provideAuthenticationResourceApiMock(
  mock: AuthenticationResourceApiMock = createAuthenticationResourceApiMock(),
): Provider {
  return { provide: AuthenticationResourceApi, useValue: mock };
}

export type EmailVerificationResourceApiMock = Pick<EmailVerificationResourceApi, 'send'> & {
  send: ReturnType<typeof vi.fn>;
};

export function createEmailVerificationResourceApiMock(): EmailVerificationResourceApiMock {
  return {
    send: vi.fn().mockReturnValue(of(undefined)),
  };
}

export function provideEmailVerificationResourceApiMock(
  mock: EmailVerificationResourceApiMock = createEmailVerificationResourceApiMock(),
): Provider {
  return { provide: EmailVerificationResourceApi, useValue: mock };
}
