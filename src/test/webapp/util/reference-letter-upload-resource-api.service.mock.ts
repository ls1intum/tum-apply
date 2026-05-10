import { Provider } from '@angular/core';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { ReferenceLetterUploadResourceApi } from 'app/generated/api/reference-letter-upload-resource-api';
import { ReferenceLetterContextDTO } from 'app/generated/model/reference-letter-context-dto';
import { ReferenceRequestDTO, ReferenceRequestDTOStatusEnum } from 'app/generated/model/reference-request-dto';

export type ReferenceLetterUploadResourceApiMock = {
  getContext: ReturnType<typeof vi.fn>;
  upload: ReturnType<typeof vi.fn>;
};

export const createMockContext = (overrides: Partial<ReferenceLetterContextDTO> = {}): ReferenceLetterContextDTO =>
  Object.assign(
    {
      applicantFirstName: 'Sample',
      applicantLastName: 'Applicant',
      jobTitle: 'PhD Position',
      researchGroupName: 'Research Group A',
      status: ReferenceRequestDTOStatusEnum.Requested,
    },
    overrides,
  );

export function createReferenceLetterUploadResourceApiMock(
  initialContext: ReferenceLetterContextDTO = createMockContext(),
): ReferenceLetterUploadResourceApiMock {
  const submitted: ReferenceRequestDTO = {
    referenceRequestId: 'submitted-id',
    title: 'Prof. Dr.',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    status: ReferenceRequestDTOStatusEnum.Submitted,
    documentId: 'document-id',
  };
  return {
    getContext: vi.fn().mockReturnValue(of(initialContext)),
    upload: vi.fn().mockReturnValue(of(submitted)),
  };
}

export function provideReferenceLetterUploadResourceApiMock(
  mock: ReferenceLetterUploadResourceApiMock = createReferenceLetterUploadResourceApiMock(),
): Provider {
  return { provide: ReferenceLetterUploadResourceApi, useValue: mock };
}
