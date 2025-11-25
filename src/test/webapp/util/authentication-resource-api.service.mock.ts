import { of } from 'rxjs';
import { vi } from 'vitest';

// Shared mock session info for tests
export const mockSessionInfo = { expiresIn: 60 };

export class MockAuthenticationResourceApiService {
  login = vi.fn().mockReturnValue(of(mockSessionInfo));
  otpComplete = vi.fn().mockReturnValue(of(mockSessionInfo));
  logout = vi.fn().mockReturnValue(of(undefined));
  refresh = vi.fn().mockReturnValue(of(mockSessionInfo));
}

export class MockEmailVerificationResourceApiService {
  send = vi.fn().mockReturnValue(of(undefined));
}
