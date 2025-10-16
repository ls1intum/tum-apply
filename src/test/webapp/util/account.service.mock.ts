import { signal, WritableSignal } from '@angular/core';
import { AccountService, User } from 'app/core/auth/account.service';
import { vi } from 'vitest';

export function createAccountServiceMock() {
  const loadedUserSignal: WritableSignal<User | undefined> = signal({
    id: 'u1',
    name: 'User',
    email: 'user@test.com',
  });

  return {
    loadedUser: () => loadedUserSignal(),
    setLoadedUser: (user?: User) => loadedUserSignal.set(user),
    getAuthenticationState: vi.fn(),
    authenticate: vi.fn(),
  } as unknown as AccountService & { setLoadedUser: (user?: User) => void };
}

export function provideAccountServiceMock(mock = createAccountServiceMock()) {
  return { provide: AccountService, useValue: mock };
}
