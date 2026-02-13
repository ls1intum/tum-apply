import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { Provider } from '@angular/core';
import { vi, Mock } from 'vitest';

export interface ResearchGroupResourceApiServiceMock {
  activateResearchGroup: Mock;
  createEmployeeResearchGroupRequest: Mock;
  createProfessorResearchGroupRequest: Mock;
  createResearchGroupAsAdmin: Mock;
  denyResearchGroup: Mock;
  getAllResearchGroups: Mock;
  getDraftResearchGroups: Mock;
  getResearchGroup: Mock;
  getResearchGroupMembers: Mock;
  getResearchGroupMembersById: Mock;
  getResearchGroupProfessors: Mock;
  getResearchGroupsForAdmin: Mock;
  getResourceGroupDetails: Mock;
  removeMemberFromResearchGroup: Mock;
  updateResearchGroup: Mock;
  withdrawResearchGroup: Mock;
}

export function createResearchGroupResourceApiServiceMock(): ResearchGroupResourceApiServiceMock {
  return {
    activateResearchGroup: vi.fn(),
    createEmployeeResearchGroupRequest: vi.fn(),
    createProfessorResearchGroupRequest: vi.fn(),
    createResearchGroupAsAdmin: vi.fn(),
    denyResearchGroup: vi.fn(),
    getAllResearchGroups: vi.fn(),
    getDraftResearchGroups: vi.fn(),
    getResearchGroup: vi.fn(),
    getResearchGroupMembers: vi.fn(),
    getResearchGroupMembersById: vi.fn(),
    getResearchGroupProfessors: vi.fn(),
    getResearchGroupsForAdmin: vi.fn(),
    getResourceGroupDetails: vi.fn(),
    removeMemberFromResearchGroup: vi.fn(),
    updateResearchGroup: vi.fn(),
    withdrawResearchGroup: vi.fn(),
  };
}

export function provideResearchGroupResourceApiServiceMock(
  mock: ResearchGroupResourceApiServiceMock = createResearchGroupResourceApiServiceMock(),
): Provider {
  return { provide: ResearchGroupResourceApiService, useValue: mock };
}
