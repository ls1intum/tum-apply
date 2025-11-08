import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { of } from 'rxjs';

export type ApplicationResourceApiServiceMock = Pick<
  ApplicationResourceApiService,
  'createApplication' | 'getApplicationById' | 'updateApplication' | 'getDocumentDictionaryIds' | 'deleteApplication'
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
  };
}

export function provideApplicationResourceApiServiceMock(
  mock: ApplicationResourceApiServiceMock = createApplicationResourceApiServiceMock(),
): Provider {
  return { provide: ApplicationResourceApiService, useValue: mock };
}
