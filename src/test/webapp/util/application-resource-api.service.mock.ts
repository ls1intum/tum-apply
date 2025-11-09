import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { of } from 'rxjs';
import { ApplicationOverviewDTO } from 'app/generated/model/applicationOverviewDTO';

export type ApplicationResourceApiServiceMock = Pick<
  ApplicationResourceApiService,
  | 'createApplication'
  | 'getApplicationById'
  | 'updateApplication'
  | 'withdrawApplication'
  | 'getDocumentDictionaryIds'
  | 'deleteApplication'
  | 'getApplicationPages'
  | 'getApplicationPagesLength'
>;

export const createMockApplicationDTO = (
  applicationState: ApplicationForApplicantDTO.ApplicationStateEnum,
): ApplicationForApplicantDTO => ({
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

const createMockApplicationOverview = (overrides?: Partial<ApplicationOverviewDTO>): ApplicationOverviewDTO => ({
  applicationId: '123',
  jobTitle: 'Software Engineer',
  researchGroup: 'Research Group A',
  applicationState: 'SENT',
  timeSinceCreation: '2 days ago',
  ...overrides,
});

export const createMockApplicationOverviewPages = () => [
  createMockApplicationOverview({ applicationId: '1' }),
  createMockApplicationOverview({ applicationId: '2' }),
];

export function createApplicationResourceApiServiceMock(): ApplicationResourceApiServiceMock {
  const mockApplicationOverviewPages = createMockApplicationOverviewPages();
  return {
    createApplication: vi.fn().mockReturnValue(of(createMockApplicationDTO(ApplicationForApplicantDTO.ApplicationStateEnum.Saved))),
    getApplicationById: vi.fn().mockReturnValue(of(createMockApplicationDTO(ApplicationForApplicantDTO.ApplicationStateEnum.Saved))),
    updateApplication: vi.fn().mockReturnValue(of({})),
    withdrawApplication: vi.fn().mockReturnValue(of({})),
    getDocumentDictionaryIds: vi.fn().mockReturnValue(of({})),
    deleteApplication: vi.fn(),
    getApplicationPagesLength: vi.fn().mockReturnValue(of(mockApplicationOverviewPages.length)),
    getApplicationPages: vi.fn().mockReturnValue(of(mockApplicationOverviewPages)),
  };
}

export function provideApplicationResourceApiServiceMock(
  mock: ApplicationResourceApiServiceMock = createApplicationResourceApiServiceMock(),
): Provider {
  return { provide: ApplicationResourceApiService, useValue: mock };
}
