import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

import { ResearchGroupMembersComponent } from 'app/usermanagement/research-group/research-group-members/research-group-members.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { AccountService } from 'app/core/auth/account.service';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PageResponseDTOUserShortDTO } from 'app/generated/model/pageResponseDTOUserShortDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideDialogServiceMock } from 'util/dialog.service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

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
        provideDialogServiceMock(),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
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

  it('should load members automatically via table lazy load on component init', () => {
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));
    fixture.detectChanges();
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 0);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1);
  });

  it('should initialize with default values', () => {
    expect(component.members()).toEqual([]);
    expect(component.pageNumber()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(component.total()).toBe(0);
  });

  it('should have correct columns configuration', () => {
    const columns = component.columns();
    const expectedColumns = [
      { field: 'name', header: 'researchGroup.members.tableColumns.name', width: '26rem' },
      { field: 'email', header: 'researchGroup.members.tableColumns.email', width: '26rem' },
      { field: 'role', header: 'researchGroup.members.tableColumns.role', width: '26rem' },
      { field: 'actions', header: '', width: '5rem' },
    ];

    expect(columns).toHaveLength(4);
    expectedColumns.forEach((expectedColumn, index) => {
      expect(columns[index]).toEqual(expect.objectContaining(expectedColumn));
    });
  });

  it('should assign templates to correct columns', () => {
    fixture.detectChanges();

    const columns = component.columns();
    const nameColumn = columns.find(c => c.field === 'name');
    const actionsColumn = columns.find(c => c.field === 'actions');

    expect(nameColumn?.template).toBeTruthy();
    expect(actionsColumn?.template).toBeTruthy();
    expect(columns.find(c => c.field === 'email')?.template).toBeUndefined();
    expect(columns.find(c => c.field === 'role')?.template).toBeUndefined();
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

  it('shows the no role text when roles is undefined or empty', () => {
    component.members.set([{ ...mockUserData, roles: undefined }]);
    let row = component.tableData()[0];
    expect(row.role).toBe('researchGroup.members.noRole');

    component.members.set([{ ...mockUserData, roles: [] }]);
    row = component.tableData()[0];
    expect(row.role).toBe('researchGroup.members.noRole');
  });

  it('should handle member with undefined userId when removing', async () => {
    const memberWithoutId = { ...mockUserData, userId: undefined };
    mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(of(void 0));
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    await component.removeMember(memberWithoutId);

    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith('');
    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should format role with proper capitalization', () => {
    const memberWithLowercaseRole = {
      ...mockUserData,
      roles: [UserShortDTO.RolesEnum.Professor],
    };
    component.members.set([memberWithLowercaseRole]);
    const row = component.tableData()[0];
    expect(row.role).toBe('Professor');
  });

  it('should open add members modal and reload members on close if added', () => {
    const mockRef = {
      onClose: of(true),
    } as DynamicDialogRef;
    const dialogService = TestBed.inject(DialogService);
    vi.spyOn(dialogService, 'open').mockReturnValue(mockRef);
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    fixture.detectChanges();

    component.openAddMembersModal();

    expect(dialogService.open).toHaveBeenCalled();
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(2);
  });

  it('should open add members modal and NOT reload members on close if NOT added', () => {
    const mockRef = {
      onClose: of(false),
    } as DynamicDialogRef;
    const dialogService = TestBed.inject(DialogService);
    vi.spyOn(dialogService, 'open').mockReturnValue(mockRef);
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    fixture.detectChanges();

    component.openAddMembersModal();

    expect(dialogService.open).toHaveBeenCalled();
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1);
  });
});
