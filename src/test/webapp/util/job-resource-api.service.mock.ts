import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type JobResourceApiServiceMock = Pick<
  JobResourceApiService,
  'getJobDetails' | 'getAvailableJobs' | 'getJobsByProfessor' | 'getJobById' | 'createJob' | 'updateJob' | 'deleteJob'
>;

export function createJobResourceApiServiceMock(): JobResourceApiServiceMock {
  return {
    getJobDetails: vi.fn(),
    getAvailableJobs: vi.fn(),
    getJobsByProfessor: vi.fn(),
    getJobById: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    deleteJob: vi.fn(),
  };
}

export function provideJobResourceApiServiceMock(mock: JobResourceApiServiceMock = createJobResourceApiServiceMock()): Provider {
  return { provide: JobResourceApiService, useValue: mock };
}
