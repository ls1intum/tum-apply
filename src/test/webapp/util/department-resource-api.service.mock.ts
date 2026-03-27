import { DepartmentResourceApi } from 'app/generated/api/department-resource-api';
import { Provider } from '@angular/core';
import { vi, Mock } from 'vitest';

export interface DepartmentResourceApiMock {
  createDepartment: Mock;
  deleteDepartment: Mock;
  getDepartmentById: Mock;
  getDepartments: Mock;
  getDepartmentsForAdmin: Mock;
  updateDepartment: Mock;
}

export function createDepartmentResourceApiMock(): DepartmentResourceApiMock {
  return {
    createDepartment: vi.fn(),
    deleteDepartment: vi.fn(),
    getDepartmentById: vi.fn(),
    getDepartments: vi.fn(),
    getDepartmentsForAdmin: vi.fn(),
    updateDepartment: vi.fn(),
  };
}

export function provideDepartmentResourceApiMock(
  mock: DepartmentResourceApiMock = createDepartmentResourceApiMock(),
): Provider {
  return { provide: DepartmentResourceApi, useValue: mock };
}
