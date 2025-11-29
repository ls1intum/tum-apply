import { computed, signal, WritableSignal } from '@angular/core';
import { vi } from 'vitest';
import { AccountService, User } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';

export type AccountServiceMock = Pick<AccountService, 'user' | 'loadedUser' | 'signedIn' | 'loaded' | 'hasAnyAuthority'> & {
  loadUser: ReturnType<typeof vi.fn>;
  authorities: UserShortDTO.RolesEnum[];
  setAuthorities: (roles: UserShortDTO.RolesEnum[]) => void;
  updateUser: ReturnType<typeof vi.fn>;
  updatePassword: ReturnType<typeof vi.fn>;
};

export let defaultUser: User = {
  id: 'id-2',
  name: 'User',
  email: 'user@test.com',
};

export function createAccountServiceMock(signedIn?: boolean, loaded?: boolean): AccountServiceMock {
  const userLocal: WritableSignal<User | undefined> = signal(defaultUser);

  const normalizeRole = (role: string | UserShortDTO.RolesEnum): string => role.toString().toUpperCase();

  const mock: AccountServiceMock = {
    user: userLocal,
    loadedUser: computed(() => (userLocal() ? userLocal() : undefined)),
    loaded: signal<boolean>(loaded ?? true),
    signedIn: signal<boolean>(signedIn ?? true),
    authorities: [],
    hasAnyAuthority: (roles: string[]) => {
      if (!roles.length) {
        return false;
      }
      const normalizedAuthorities = mock.authorities.map(normalizeRole);
      const normalizedRequested = roles.map(role => role.toUpperCase());
      return normalizedRequested.some(role => normalizedAuthorities.includes(role));
    },
    loadUser: vi.fn(),
    setAuthorities: (roles: UserShortDTO.RolesEnum[]) => {
      mock.authorities = roles;
    },
    updateUser: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(undefined),
  };

  return mock;
}

export function provideAccountServiceMock(mock = createAccountServiceMock()) {
  return { provide: AccountService, useValue: mock };
}
