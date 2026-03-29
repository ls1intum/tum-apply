import { Provider } from '@angular/core';
import { ApplicantResourceApi } from 'app/generated/api/applicant-resource-api';
import { of } from 'rxjs';
import { vi } from 'vitest';

export type ApplicantResourceApiMock = {
  getApplicantProfile: ReturnType<typeof vi.fn>;
  getApplicantProfileDocumentIds: ReturnType<typeof vi.fn>;
  getSubjectAreaSubscriptions: ReturnType<typeof vi.fn>;
  addSubjectAreaSubscription: ReturnType<typeof vi.fn>;
  removeSubjectAreaSubscription: ReturnType<typeof vi.fn>;
  updateApplicantProfile: ReturnType<typeof vi.fn>;
  updateApplicantPersonalInformation: ReturnType<typeof vi.fn>;
  updateApplicantDocumentSettings: ReturnType<typeof vi.fn>;
  uploadApplicantDocuments: ReturnType<typeof vi.fn>;
  uploadApplicantProfileDocuments: ReturnType<typeof vi.fn>;
  deleteApplicantProfileDocument: ReturnType<typeof vi.fn>;
  renameApplicantProfileDocument: ReturnType<typeof vi.fn>;
};

export function createApplicantResourceApiMock(): ApplicantResourceApiMock {
  return {
    getApplicantProfile: vi.fn().mockReturnValue(of({ user: {} })),
    getApplicantProfileDocumentIds: vi.fn().mockReturnValue(of({})),
    getSubjectAreaSubscriptions: vi.fn().mockReturnValue(of([])),
    addSubjectAreaSubscription: vi.fn().mockReturnValue(of(void 0)),
    removeSubjectAreaSubscription: vi.fn().mockReturnValue(of(void 0)),
    updateApplicantProfile: vi.fn().mockReturnValue(of({ user: {} })),
    updateApplicantPersonalInformation: vi.fn().mockReturnValue(of({ user: {} })),
    updateApplicantDocumentSettings: vi.fn().mockReturnValue(of({ user: {} })),
    uploadApplicantDocuments: vi.fn().mockReturnValue(of([{ id: '1', name: 'Doc1', size: 1234 }])),
    uploadApplicantProfileDocuments: vi.fn().mockReturnValue(of([{ id: '1', name: 'Doc1', size: 1234 }])),
    deleteApplicantProfileDocument: vi.fn().mockReturnValue(of(void 0)),
    renameApplicantProfileDocument: vi.fn().mockReturnValue(of(void 0)),
  };
}

export function provideApplicantResourceApiMock(mock: ApplicantResourceApiMock = createApplicantResourceApiMock()): Provider {
  return { provide: ApplicantResourceApi, useValue: mock };
}
