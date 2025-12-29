import { SchoolResourceApiService } from 'app/generated/api/schoolResourceApi.service';
import { Provider } from '@angular/core';
import { vi, Mock } from 'vitest';

export interface SchoolResourceApiServiceMock {
  createSchool: Mock;
  getAllSchools: Mock;
  getAllSchoolsWithDepartments: Mock;
  getSchoolById: Mock;
}

export function createSchoolResourceApiServiceMock(): SchoolResourceApiServiceMock {
  return {
    createSchool: vi.fn(),
    getAllSchools: vi.fn(),
    getAllSchoolsWithDepartments: vi.fn(),
    getSchoolById: vi.fn(),
  };
}

export function provideSchoolResourceApiServiceMock(mock: SchoolResourceApiServiceMock = createSchoolResourceApiServiceMock()): Provider {
  return { provide: SchoolResourceApiService, useValue: mock };
}
