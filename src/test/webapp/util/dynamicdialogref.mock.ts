import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

export type DynamicDialogRefMock = Pick<DynamicDialogRef, 'close' | 'onClose'>;
export function createDynamicDialogRefMock(): DynamicDialogRefMock {
  return {
    close: vi.fn(),
    onClose: new Subject<any>(),
  };
}

export function provideDynamicDialogRefMock(mock: DynamicDialogRefMock = createDynamicDialogRefMock()): Provider {
  return { provide: DynamicDialogRef, useValue: mock };
}
