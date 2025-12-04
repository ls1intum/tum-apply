import { computed, signal, WritableSignal } from '@angular/core';
import { vi } from 'vitest';
import { AccountService, User } from 'app/core/auth/account.service';

export type AccountServiceMock = Pick<AccountService, 'user' | 'loadedUser' | 'signedIn' | 'loaded' | 'hasAnyAuthority'> & {
  loadUser: ReturnType<typeof vi.fn>;
};

export let defaultUser: User = {
  id: 'id-2',
  name: 'User',
  email: 'user@test.com',
};

export function createAccountServiceMock(signedIn?: boolean, loaded?: boolean): AccountServiceMock {
  const userLocal: WritableSignal<User | undefined> = signal(defaultUser);
  return {
    user: userLocal,
    loadedUser: computed(() => (userLocal() ? userLocal() : undefined)),
    loaded: signal<boolean>(loaded ?? true),
    signedIn: signal<boolean>(signedIn ?? true),
    hasAnyAuthority: (roles: string[]) => {
      return false;
    },
    loadUser: vi.fn(),
  };
}

export function provideAccountServiceMock(mock = createAccountServiceMock()) {
  return { provide: AccountService, useValue: mock };
}
