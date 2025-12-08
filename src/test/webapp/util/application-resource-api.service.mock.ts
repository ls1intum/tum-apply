import { ApplicationResourceApiService } from 'app/generated/api/applicationResourceApi.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { ApplicationForApplicantDTO } from 'app/generated/model/applicationForApplicantDTO';
import { of } from 'rxjs';
import { ApplicationOverviewDTO } from 'app/generated/model/applicationOverviewDTO';

export type ApplicationResourceApiServiceMock = {
  createApplication: ReturnType<typeof vi.fn>;
  getApplicationById: ReturnType<typeof vi.fn>;
  getApplicationForDetailPage: ReturnType<typeof vi.fn>;
  updateApplication: ReturnType<typeof vi.fn>;
  withdrawApplication: ReturnType<typeof vi.fn>;
  getDocumentDictionaryIds: ReturnType<typeof vi.fn>;
  deleteApplication: ReturnType<typeof vi.fn>;
  getApplicationPages: ReturnType<typeof vi.fn>;
  renameDocument: ReturnType<typeof vi.fn>;
  uploadDocuments: ReturnType<typeof vi.fn>;
  deleteDocumentFromApplication: ReturnType<typeof vi.fn>;
};

export const createMockApplicationDTO = (
  applicationState: ApplicationForApplicantDTO.ApplicationStateEnum,
): ApplicationForApplicantDTO => ({
  applicationState: applicationState,
  applicationId: '456',
  job: {
    jobId: '123',
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
    getApplicationForDetailPage: vi.fn().mockReturnValue(of({})),
    updateApplication: vi.fn().mockReturnValue(of({})),
    withdrawApplication: vi.fn().mockReturnValue(of({})),
    getDocumentDictionaryIds: vi.fn().mockReturnValue(of({})),
    deleteApplication: vi.fn().mockReturnValue(of(void 0)),
    getApplicationPages: vi.fn().mockReturnValue(of({ content: mockApplicationOverviewPages, totalElements: 2 })),
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
