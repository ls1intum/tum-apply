import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { of } from 'rxjs';

export type ApplicationResourceApiServiceMock = Pick<
  ApplicationResourceApiService,
  | 'createApplication'
  | 'getApplicationById'
  | 'updateApplication'
  | 'getDocumentDictionaryIds'
  | 'deleteApplication'
  | 'renameDocument'
  | 'uploadDocuments'
  | 'deleteDocumentFromApplication'
>;

export const createMockApplication = (applicationState: ApplicationForApplicantDTO.ApplicationStateEnum): ApplicationForApplicantDTO => ({
  applicationState: applicationState,
  applicationId: '456',
  job: {
    jobId: '123',
    fieldOfStudies: '',
    location: 'Garching',
    professorName: 'Prof. Dr. Abc',
    title: 'Sophisticated Studies',
  },
  applicant: {
    user: {
      firstName: 'Testus Maxima',
      email: 'test@gmail.com',
    },
  },
});

export function createApplicationResourceApiServiceMock(): ApplicationResourceApiServiceMock {
  return {
    createApplication: vi.fn().mockReturnValue(of(createMockApplication(ApplicationForApplicantDTO.ApplicationStateEnum.Saved))),
    getApplicationById: vi.fn().mockReturnValue(of(createMockApplication(ApplicationForApplicantDTO.ApplicationStateEnum.Saved))),
    updateApplication: vi.fn().mockReturnValue(of({})),
    getDocumentDictionaryIds: vi.fn().mockReturnValue(of({})),
    deleteApplication: vi.fn(),
    uploadDocuments: vi.fn().mockReturnValue(of([{ id: '1', name: 'Doc1', size: 1234 }])),
    deleteDocumentFromApplication: vi.fn().mockReturnValue(of(void 0)),
    renameDocument: vi.fn().mockReturnValue(of(void 0)),
  };
}

export function provideApplicationResourceApiServiceMock(
  mock: ApplicationResourceApiServiceMock = createApplicationResourceApiServiceMock(),
): Provider {
  return { provide: ApplicationResourceApiService, useValue: mock };
}
