import { LocalStorageService } from 'app/service/localStorage.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type LocalStorageServiceMock = Pick<LocalStorageService, 'saveApplicationDraft' | 'loadApplicationDraft' | 'clearApplicationDraft'>;

export function createLocalStorageServiceMock(): LocalStorageServiceMock {
  return {
    saveApplicationDraft: vi.fn(),
    loadApplicationDraft: vi.fn(),
    clearApplicationDraft: vi.fn(),
  };
}

export function provideLocalStorageServiceMock(mock: LocalStorageServiceMock = createLocalStorageServiceMock()): Provider {
  return { provide: LocalStorageService, useValue: mock };
}
