import { SchoolResourceApi } from 'app/generated/api/school-resource-api';
import { Provider } from '@angular/core';
import { vi, Mock } from 'vitest';

export interface SchoolResourceApiMock {
  createSchool: Mock;
  getSchoolsForAdmin: Mock;
  updateSchool: Mock;
  deleteSchool: Mock;
  getAllSchools: Mock;
  getAllSchoolsWithDepartments: Mock;
  getSchoolById: Mock;
}

export function createSchoolResourceApiMock(): SchoolResourceApiMock {
  return {
    createSchool: vi.fn(),
    getSchoolsForAdmin: vi.fn(),
    updateSchool: vi.fn(),
    deleteSchool: vi.fn(),
    getAllSchools: vi.fn(),
    getAllSchoolsWithDepartments: vi.fn(),
    getSchoolById: vi.fn(),
  };
}

export function provideSchoolResourceApiMock(mock: SchoolResourceApiMock = createSchoolResourceApiMock()): Provider {
  return { provide: SchoolResourceApi, useValue: mock };
}
