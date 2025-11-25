import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

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

/**
 * Mock implementation for DynamicDialogConfig
 */
export function createDynamicDialogConfigMock(data: Partial<DynamicDialogConfig['data']> = {}): DynamicDialogConfig {
  return {
    data,
  } as DynamicDialogConfig;
}

export function provideDynamicDialogConfigMock(mock: DynamicDialogConfig = createDynamicDialogConfigMock()): Provider {
  return { provide: DynamicDialogConfig, useValue: mock };
}
