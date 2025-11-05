import { DialogService } from 'primeng/dynamicdialog';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type DialogServiceMock = Pick<DialogService, 'open'>;

export function createDialogServiceMock(): DialogServiceMock {
  return {
    open: vi.fn(),
  };
}

export function provideDialogServiceMock(mock: DialogServiceMock = createDialogServiceMock()): Provider {
  return { provide: DialogService, useValue: mock };
}
