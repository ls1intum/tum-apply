import { vi } from 'vitest';
import { Provider } from '@angular/core';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';

export type UserResourceApiServiceMock = {
  getCurrentUser: ReturnType<typeof vi.fn>;
  updateUserName: ReturnType<typeof vi.fn>;
  updatePassword: ReturnType<typeof vi.fn>;
};

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
