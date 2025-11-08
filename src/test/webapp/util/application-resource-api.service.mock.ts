import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type ApplicationResourceApiServiceMock = Pick<
  ApplicationResourceApiService,
  'createApplication' | 'getApplicationById' | 'updateApplication' | 'getDocumentDictionaryIds' | 'deleteApplication'
>;

export function createApplicationResourceApiServiceMock(): ApplicationResourceApiServiceMock {
  return {
    createApplication: vi.fn(),
    getApplicationById: vi.fn(),
    updateApplication: vi.fn(),
    getDocumentDictionaryIds: vi.fn(),
    deleteApplication: vi.fn(),
  };
}

export function provideApplicationResourceApiServiceMock(
  mock: ApplicationResourceApiServiceMock = createApplicationResourceApiServiceMock(),
): Provider {
  return { provide: ApplicationResourceApiService, useValue: mock };
}
