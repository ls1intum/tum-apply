import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ResearchGroupMembersComponent } from 'app/usermanagement/research-group/research-group-members/research-group-members.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PageResponseDTOUserShortDTO } from 'app/generated/model/pageResponseDTOUserShortDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';

describe('ResearchGroupMembersComponent', () => {
  let component: ResearchGroupMembersComponent;
  let fixture: ComponentFixture<ResearchGroupMembersComponent>;
  let mockResearchGroupService: {
    getResearchGroupMembers: ReturnType<typeof vi.fn>;
    removeMemberFromResearchGroup: ReturnType<typeof vi.fn>;
  };
  let mockToastService: ReturnType<typeof createToastServiceMock>;

  const mockUserData: UserShortDTO = {
    userId: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    roles: [UserShortDTO.RolesEnum.Professor],
  };

  const mockCurrentUser: UserShortDTO = {
    userId: 'current-user',
    firstName: 'Current',
    lastName: 'User',
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

    await TestBed.configureTestingModule({
      imports: [ResearchGroupMembersComponent],
      providers: [
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        { provide: AccountService, useValue: { userId: 'current-user' } },
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupMembersComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
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
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1);
  });

  it('should handle undefined first and rows values in table emit with fallback to defaults', () => {
    const event: TableLazyLoadEvent = {};
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    component.loadOnTableEmit(event);

    expect(component.pageNumber()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 0);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1);
  });

  it('should load members successfully', async () => {
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    await component.loadMembers();

    expect(component.members()).toEqual(mockPageResponse.content);
    expect(component.total()).toBe(mockPageResponse.totalElements);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 0);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1);
  });

  it('should handle empty or undefined response when loading members', async () => {
    const emptyResponse: PageResponseDTOUserShortDTO = {};
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(emptyResponse));

    await component.loadMembers();

    expect(component.members()).toEqual([]);
    expect(component.total()).toBe(0);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1);
  });

  it('should handle error and show error toast when loading members fails', async () => {
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(throwError(() => new Error('API Error')));

    await component.loadMembers();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.loadFailed');
    expect(mockToastService.showErrorKey).toHaveBeenCalledTimes(1);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1);
  });

  it('should remove member successfully', async () => {
    mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(of(void 0));
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    await component.removeMember(mockUserData);

    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith('user-1');
    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledTimes(1);
    expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.removeSuccess', {
      memberName: 'John Doe',
    });
    expect(mockToastService.showSuccessKey).toHaveBeenCalledTimes(1);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1); // Refresh call
  });

  it('should handle error and show error toast when removing member fails', async () => {
    mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

    await component.removeMember(mockUserData);

    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith('user-1');
    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledTimes(1);
    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.removeFailed', {
      memberName: 'John Doe',
    });
    expect(mockToastService.showErrorKey).toHaveBeenCalledTimes(1);
    expect(mockResearchGroupService.getResearchGroupMembers).not.toHaveBeenCalled(); // No refresh on error
  });

  it('should transform members data correctly in tableData computed and identify current user', () => {
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

  it('shows the no role text when roles array is empty', () => {
    component.members.set([{ ...mockUserData, roles: [] }]);
    const row = component.tableData()[0];
    expect(row.role).toBe('researchGroup.members.noRole');
  });
});
