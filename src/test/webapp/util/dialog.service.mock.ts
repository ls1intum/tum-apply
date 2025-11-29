import { DialogService } from 'primeng/dynamicdialog';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type DialogServiceMock = {
  open: ReturnType<typeof vi.fn>;
};

export function createDialogServiceMock(): DialogServiceMock {
  return {
    open: vi.fn(),
  };
}

export function provideDialogServiceMock(mock: DialogServiceMock = createDialogServiceMock()): Provider {
  return { provide: DialogService, useValue: mock };
}
