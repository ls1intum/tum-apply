import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { Provider } from '@angular/core';
import { vi } from 'vitest';

export type JobResourceApiServiceMock = {
  getJobDetails: ReturnType<typeof vi.fn>;
  getAvailableJobs: ReturnType<typeof vi.fn>;
  getJobsForCurrentResearchGroup: ReturnType<typeof vi.fn>;
  getJobById: ReturnType<typeof vi.fn>;
  createJob: ReturnType<typeof vi.fn>;
  updateJob: ReturnType<typeof vi.fn>;
  deleteJob: ReturnType<typeof vi.fn>;
};

export function createJobResourceApiServiceMock(): JobResourceApiServiceMock {
  return {
    getJobDetails: vi.fn(),
    getAvailableJobs: vi.fn(),
    getJobsForCurrentResearchGroup: vi.fn(),
    getJobById: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
    deleteJob: vi.fn(),
  };
}

export function provideJobResourceApiServiceMock(mock: JobResourceApiServiceMock = createJobResourceApiServiceMock()): Provider {
  return { provide: JobResourceApiService, useValue: mock };
}
