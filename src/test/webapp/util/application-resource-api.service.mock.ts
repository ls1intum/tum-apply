import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { of } from 'rxjs';
import { ApplicationOverviewDTO } from 'app/generated/model/applicationOverviewDTO';

export interface ApplicationResourceApiServiceMock {
  createApplication: (jobId: string) => unknown;
  getApplicationById: (applicationId: string) => unknown;
  updateApplication: (...args: unknown[]) => unknown;
  withdrawApplication: (applicationId: string) => unknown;
  getDocumentDictionaryIds: (applicationId: string) => unknown;
  deleteApplication: (applicationId: string) => unknown;
  getApplicationPages: (...args: unknown[]) => unknown;
  uploadDocuments: (...args: unknown[]) => unknown;
  deleteDocumentFromApplication: (documentDictionaryId: string) => unknown;
  renameDocument: (...args: unknown[]) => unknown;
  getApplicationForDetailPage: (applicationId: string) => unknown;
}

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
    deleteApplication: vi.fn().mockReturnValue(of(void 0)),
    getApplicationPages: vi.fn().mockReturnValue(of({ content: mockApplicationOverviewPages, totalElements: 2 })),
    uploadDocuments: vi.fn().mockReturnValue(of([{ id: '1', name: 'Doc1', size: 1234 }])),
    deleteDocumentFromApplication: vi.fn().mockReturnValue(of(void 0)),
    renameDocument: vi.fn().mockReturnValue(of(void 0)),
    getApplicationForDetailPage: vi.fn().mockReturnValue(
      of({
        applicationId: 'APP_DEFAULT',
        applicationState: 'SENT',
        jobId: 'JOB_DEFAULT',
        researchGroup: '',
        supervisingProfessorName: '',
      }),
    ),
  };
}

export function provideApplicationResourceApiServiceMock(
  mock: ApplicationResourceApiServiceMock = createApplicationResourceApiServiceMock(),
): Provider {
  return { provide: ApplicationResourceApiService, useValue: mock };
}
