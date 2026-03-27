import { computed, signal, WritableSignal } from '@angular/core';
import { vi } from 'vitest';
import { AccountService, User } from 'app/core/auth/account.service';
import { UserShortDTO, UserShortDTORolesEnum } from 'app/generated/models/user-short-dto';

export type AccountServiceMock = Pick<
  AccountService,
  'user' | 'loadedUser' | 'signedIn' | 'loaded' | 'hasAnyAuthority' | 'userId' | 'userAuthorities'
> & {
  loadUser: ReturnType<typeof vi.fn>;
  authorities: UserShortDTORolesEnum[];
  setAuthorities: (roles: UserShortDTORolesEnum[]) => void;
  updateUser: ReturnType<typeof vi.fn>;
  updatePassword: ReturnType<typeof vi.fn>;
};

export let defaultUser: User = {
  id: 'id-2',
  name: 'User',
  email: 'user@test.com',
  authorities: [],
};

export function createAccountServiceMock(signedIn?: boolean, loaded?: boolean): AccountServiceMock {
  const userLocal: WritableSignal<User | undefined> = signal(defaultUser);

  const normalizeRole = (role: string | UserShortDTORolesEnum): string => role.toString().toUpperCase();

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
    setAuthorities: (roles: UserShortDTORolesEnum[]) => {
      mock.authorities = roles;
    },
    updateUser: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    get userId(): string | undefined {
      return userLocal()?.id;
    },
    get userAuthorities(): string[] | undefined {
      return userLocal()?.authorities;
    },
  };

  return mock;
}

export function provideAccountServiceMock(mock = createAccountServiceMock()) {
  return { provide: AccountService, useValue: mock };
}
