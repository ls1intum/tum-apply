import { vi } from 'vitest';
import { Provider } from '@angular/core';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';

export type UserResourceApiServiceMock = Pick<UserResourceApiService, 'getCurrentUser' | 'updateUserName' | 'updatePassword'>;

export function createUserResourceApiServiceMock(): UserResourceApiServiceMock {
  return {
    getCurrentUser: vi.fn(),
    updateUserName: vi.fn(),
    updatePassword: vi.fn(),
  };
}

export function provideUserResourceApiServiceMock(mock: UserResourceApiServiceMock = createUserResourceApiServiceMock()): Provider {
  return { provide: UserResourceApiService, useValue: mock };
}
