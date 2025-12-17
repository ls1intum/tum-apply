import { DepartmentResourceApiService } from 'app/generated/api/departmentResourceApi.service';
import { Provider } from '@angular/core';
import { vi, Mock } from 'vitest';

export interface DepartmentResourceApiServiceMock {
  createDepartment: Mock;
  deleteDepartment: Mock;
  getDepartmentById: Mock;
  getDepartments: Mock;
  updateDepartment: Mock;
}

export function createDepartmentResourceApiServiceMock(): DepartmentResourceApiServiceMock {
  return {
    createDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
    getDepartmentById: vi.fn(),
    getDepartments: vi.fn(),
    updateDepartment: vi.fn(),
  };
}

export function provideDepartmentResourceApiServiceMock(
  mock: DepartmentResourceApiServiceMock = createDepartmentResourceApiServiceMock(),
): Provider {
  return { provide: DepartmentResourceApiService, useValue: mock };
}
