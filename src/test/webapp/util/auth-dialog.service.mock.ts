import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { AuthDialogService } from 'app/core/auth/auth-dialog.service';

export type AuthDialogServiceMock = {
  open: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
};

export function createAuthDialogServiceMock(): AuthDialogServiceMock {
  return {
    open: vi.fn(),
    close: vi.fn(),
  };
}

export function provideAuthDialogServiceMock(mock: AuthDialogServiceMock): Provider {
  return {
    provide: AuthDialogService,
    useValue: mock,
  };
}
