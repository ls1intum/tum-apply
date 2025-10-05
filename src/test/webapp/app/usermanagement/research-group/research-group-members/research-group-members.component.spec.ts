import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ResearchGroupMembersComponent } from 'app/usermanagement/research-group/research-group-members/research-group-members.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PageResponseDTOUserShortDTO } from 'app/generated/model/pageResponseDTOUserShortDTO';
import { provideTranslateMock, createTranslateServiceMock } from '../../../../util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from '../../../../util/toast-service.mock';

describe('ResearchGroupMembersComponent', () => {
  let component: ResearchGroupMembersComponent;
  let fixture: ComponentFixture<ResearchGroupMembersComponent>;
  let mockResearchGroupService: {
    getResearchGroupMembers: ReturnType<typeof vi.fn>;
    removeMemberFromResearchGroup: ReturnType<typeof vi.fn>;
  };
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockTranslateService: ReturnType<typeof createTranslateServiceMock>;

  const mockUserData: UserShortDTO = {
    userId: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    roles: [UserShortDTO.RolesEnum.Professor],
  };

  const mockCurrentUser: UserShortDTO = {
    userId: 'current-user',
    firstName: 'Current',
    lastName: 'User',
    email: 'current.user@example.com',
    roles: [UserShortDTO.RolesEnum.Admin],
  };

  const mockPageResponse: PageResponseDTOUserShortDTO = {
    content: [mockUserData, mockCurrentUser],
    totalElements: 2,
  };

  beforeEach(async () => {
    mockResearchGroupService = {
      getResearchGroupMembers: vi.fn(),
      removeMemberFromResearchGroup: vi.fn(),
    };

    mockToastService = createToastServiceMock();
    mockTranslateService = createTranslateServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupMembersComponent],
      providers: [
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        { provide: AccountService, useValue: { userId: 'current-user' } },
        provideToastServiceMock(mockToastService),
        provideTranslateMock(mockTranslateService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupMembersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.members()).toEqual([]);
    expect(component.pageNumber()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(component.total()).toBe(0);
  });

  it('should have correct columns configuration', () => {
    // Trigger change detection to initialize view children
    fixture.detectChanges();

    const columns = component.columns();
    expect(columns).toHaveLength(4);
    expect(columns[0].field).toBe('name');
    expect(columns[0].header).toBe('researchGroup.members.tableColumns.name');
    expect(columns[1].field).toBe('email');
    expect(columns[2].field).toBe('role');
    expect(columns[3].field).toBe('actions');
  });

  it('should update page number and load members on table emit', () => {
    const event: TableLazyLoadEvent = {
      first: 20,
      rows: 10,
    };
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    component.loadOnTableEmit(event);

    expect(component.pageNumber()).toBe(2); // 20 / 10 = 2
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 2);
  });

  it('should handle undefined first and rows values in table emit', () => {
    const event: TableLazyLoadEvent = {};
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    component.loadOnTableEmit(event);

    expect(component.pageNumber()).toBe(0); // 0 / 10 = 0
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 0);
  });

  it('should load members successfully', async () => {
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    await component.loadMembers();

    expect(component.members()).toEqual(mockPageResponse.content);
    expect(component.total()).toBe(mockPageResponse.totalElements);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 0);
  });

  it('should handle empty response when loading members', async () => {
    const emptyResponse: PageResponseDTOUserShortDTO = {
      content: [],
      totalElements: 0,
    };
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(emptyResponse));

    await component.loadMembers();

    expect(component.members()).toEqual([]);
    expect(component.total()).toBe(0);
  });

  it('should handle undefined content and totalElements when loading members', async () => {
    const undefinedResponse: PageResponseDTOUserShortDTO = {};
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(undefinedResponse));

    await component.loadMembers();

    expect(component.members()).toEqual([]);
    expect(component.total()).toBe(0);
  });

  it('should handle error and show error toast when loading members fails', async () => {
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(throwError(() => new Error('API Error')));

    await component.loadMembers();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.loadFailed');
  });

  it('should remove member successfully', async () => {
    mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(of(void 0));
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    await component.removeMember(mockUserData);

    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith('user-1');
    expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.removeSuccess', {
      memberName: 'John Doe',
    });
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalled(); // Refresh call
  });

  it('should handle error and show error toast when removing member fails', async () => {
    mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

    await component.removeMember(mockUserData);

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.removeFailed', {
      memberName: 'John Doe',
    });
    expect(mockResearchGroupService.getResearchGroupMembers).not.toHaveBeenCalled(); // No refresh on error
  });

  it('should transform members data correctly in tableData computed', () => {
    component.members.set([mockUserData, mockCurrentUser]);

    const tableData = component.tableData();

    expect(tableData).toHaveLength(2);
    expect(tableData[0]).toEqual({
      ...mockUserData,
      name: 'John Doe',
      role: 'Professor',
      isCurrentUser: false,
    });
    expect(tableData[1]).toEqual({
      ...mockCurrentUser,
      name: 'Current User',
      role: 'Admin',
      isCurrentUser: true,
    });
  });

  it('should handle empty roles array', () => {
    const result = component['formatRoles']([]);
    expect(result).toBe('researchGroup.members.noRole');
  });

  it('should return true for current user', () => {
    const result = component['isCurrentUser'](mockCurrentUser);
    expect(result).toBe(true);
  });

  it('should return false for different user', () => {
    const result = component['isCurrentUser'](mockUserData);
    expect(result).toBe(false);
  });

  it('should handle complete workflow: load -> remove -> reload', async () => {
    // Initial load
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));
    await component.loadMembers();
    expect(component.members()).toHaveLength(2);

    // Remove member
    mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(of(void 0));
    const updatedResponse: PageResponseDTOUserShortDTO = {
      content: [mockCurrentUser],
      totalElements: 1,
    };
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(updatedResponse));

    await component.removeMember(mockUserData);

    expect(component.members()).toHaveLength(1);
    expect(component.total()).toBe(1);
  });

  it('should handle pagination correctly', () => {
    const event: TableLazyLoadEvent = {
      first: 30,
      rows: 15,
    };
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    component.loadOnTableEmit(event);

    expect(component.pageNumber()).toBe(2); // 30 / 15 = 2
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(15, 2);
  });
});
