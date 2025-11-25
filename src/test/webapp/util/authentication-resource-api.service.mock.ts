import { Provider } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthenticationResourceApiService } from 'app/generated/api/authenticationResourceApi.service';
import { EmailVerificationResourceApiService } from 'app/generated/api/emailVerificationResourceApi.service';

// Shared mock session info for tests
export const mockSessionInfo = { expiresIn: 60 };

export type AuthenticationResourceApiServiceMock = Pick<
  AuthenticationResourceApiService,
  'login' | 'otpComplete' | 'logout' | 'refresh'
> & {
  login: ReturnType<typeof vi.fn>;
  otpComplete: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  refresh: ReturnType<typeof vi.fn>;
};

export function createAuthenticationResourceApiServiceMock(): AuthenticationResourceApiServiceMock {
  return {
    login: vi.fn().mockReturnValue(of(mockSessionInfo)),
    otpComplete: vi.fn().mockReturnValue(of(mockSessionInfo)),
    logout: vi.fn().mockReturnValue(of(undefined)),
    refresh: vi.fn().mockReturnValue(of(mockSessionInfo)),
  };
}

export function provideAuthenticationResourceApiServiceMock(
  mock: AuthenticationResourceApiServiceMock = createAuthenticationResourceApiServiceMock(),
): Provider {
  return { provide: AuthenticationResourceApiService, useValue: mock };
}

export type EmailVerificationResourceApiServiceMock = Pick<EmailVerificationResourceApiService, 'send'> & {
  send: ReturnType<typeof vi.fn>;
};

export function createEmailVerificationResourceApiServiceMock(): EmailVerificationResourceApiServiceMock {
  return {
    send: vi.fn().mockReturnValue(of(undefined)),
  };
}

export function provideEmailVerificationResourceApiServiceMock(
  mock: EmailVerificationResourceApiServiceMock = createEmailVerificationResourceApiServiceMock(),
): Provider {
  return { provide: EmailVerificationResourceApiService, useValue: mock };
}
