import { Provider } from '@angular/core';
import { ApplicantResourceApiService } from 'app/generated/api/applicantResourceApi.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

export type ApplicantResourceApiServiceMock = {
  getApplicantProfile: ReturnType<typeof vi.fn>;
  getApplicantProfileDocumentIds: ReturnType<typeof vi.fn>;
  updateApplicantProfile: ReturnType<typeof vi.fn>;
  updateApplicantPersonalInformation: ReturnType<typeof vi.fn>;
  updateApplicantDocumentSettings: ReturnType<typeof vi.fn>;
  uploadApplicantDocuments: ReturnType<typeof vi.fn>;
  uploadApplicantProfileDocuments: ReturnType<typeof vi.fn>;
  deleteApplicantProfileDocument: ReturnType<typeof vi.fn>;
  renameApplicantProfileDocument: ReturnType<typeof vi.fn>;
};

export function createApplicantResourceApiServiceMock(): ApplicantResourceApiServiceMock {
  return {
    getApplicantProfile: vi.fn().mockReturnValue(of({ user: {} })),
    getApplicantProfileDocumentIds: vi.fn().mockReturnValue(of({})),
    updateApplicantProfile: vi.fn().mockReturnValue(of({ user: {} })),
    updateApplicantPersonalInformation: vi.fn().mockReturnValue(of({ user: {} })),
    updateApplicantDocumentSettings: vi.fn().mockReturnValue(of({ user: {} })),
    uploadApplicantDocuments: vi.fn().mockReturnValue(of([{ id: '1', name: 'Doc1', size: 1234 }])),
    uploadApplicantProfileDocuments: vi.fn().mockReturnValue(of([{ id: '1', name: 'Doc1', size: 1234 }])),
    deleteApplicantProfileDocument: vi.fn().mockReturnValue(of(void 0)),
    renameApplicantProfileDocument: vi.fn().mockReturnValue(of(void 0)),
  };
}

export function provideApplicantResourceApiServiceMock(
  mock: ApplicantResourceApiServiceMock = createApplicantResourceApiServiceMock(),
): Provider {
  return { provide: ApplicantResourceApiService, useValue: mock };
}
