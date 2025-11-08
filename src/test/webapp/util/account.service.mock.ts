import { computed, signal, WritableSignal } from '@angular/core';
import { AccountService, User } from 'app/core/auth/account.service';

export type AccountServiceMock = Pick<AccountService, 'user' | 'loadedUser' | 'signedIn' | 'loaded'>;

export let defaultUser: User = {
  id: 'u1',
  name: 'User',
  email: 'user@test.com',
};

export function createAccountServiceMock(user?: User, signedIn?: boolean, loaded?: boolean): AccountServiceMock {
  // Use defaultUser only if no arguments are passed, not when undefined is explicitly passed
  const userValue = arguments.length === 0 ? defaultUser : user;
  const userLocal: WritableSignal<User | undefined> = signal(userValue);

  return {
    user: userLocal,
    loadedUser: computed(() => (userLocal() ? userLocal() : undefined)),
    loaded: signal<boolean>(loaded ?? true),
    signedIn: signal<boolean>(signedIn ?? true),
  };
}

export function provideAccountServiceMock(mock = createAccountServiceMock()) {
  return { provide: AccountService, useValue: mock };
}
