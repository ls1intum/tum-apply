import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableLazyLoadEvent } from 'primeng/table';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of, throwError } from 'rxjs';

import { ResearchGroupMembersComponent } from 'app/usermanagement/research-group/research-group-members/research-group-members.component';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PageResponseDTOUserShortDTO } from 'app/generated/model/pageResponseDTOUserShortDTO';
import { ResearchGroupDTO } from 'app/generated/model/researchGroupDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'util/toast-service.mock';
import { provideDialogServiceMock } from 'util/dialog.service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createAccountServiceMock, provideAccountServiceMock } from 'util/account.service.mock';
import { ActivatedRouteMock, createActivatedRouteMock, provideActivatedRouteMock } from 'util/activated-route.mock';
import { createRouterMock, provideRouterMock, RouterMock } from 'util/router.mock';
import {
  createResearchGroupResourceApiServiceMock,
  provideResearchGroupResourceApiServiceMock,
  ResearchGroupResourceApiServiceMock,
} from 'util/research-group-resource-api.service.mock';

describe('ResearchGroupMembersComponent', () => {
  let component: ResearchGroupMembersComponent;
  let fixture: ComponentFixture<ResearchGroupMembersComponent>;
  let mockResearchGroupService: ResearchGroupResourceApiServiceMock;
  let mockToastService: ReturnType<typeof createToastServiceMock>;
  let mockAccountService: ReturnType<typeof createAccountServiceMock>;
  let mockActivatedRoute: ActivatedRouteMock;
  let mockRouter: RouterMock;

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
    mockResearchGroupService = createResearchGroupResourceApiServiceMock();
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of({ content: [], totalElements: 0 }));
    mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of({ content: [], totalElements: 0 }));
    mockActivatedRoute = createActivatedRouteMock();
    mockToastService = createToastServiceMock();
    mockAccountService = createAccountServiceMock();
    mockAccountService.user.set({ id: 'current-user', name: 'Current User', email: 'test@test.com', authorities: [] });
    mockRouter = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupMembersComponent],
      providers: [
        provideResearchGroupResourceApiServiceMock(mockResearchGroupService),
        provideAccountServiceMock(mockAccountService),
        provideDialogServiceMock(),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideActivatedRouteMock(mockActivatedRoute),
        provideRouterMock(mockRouter),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupMembersComponent);
    component = fixture.componentInstance;
    vi.clearAllMocks();
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
  });

  it('should load members by ID if route param is present', () => {
    const groupId = '123';
    mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of(mockPageResponse));

    mockActivatedRoute.setParams({ id: groupId });
    fixture.detectChanges();

    expect(mockResearchGroupService.getResearchGroupMembersById).toHaveBeenCalledWith(groupId, 10, 0);
  });

  it('should load members by ID if query param is present', () => {
    const groupId = '456';
    mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of(mockPageResponse));

    mockActivatedRoute.setQueryParams({ researchGroupId: groupId });

    // Trigger the subscription to re-evaluate
    mockActivatedRoute.setParams({});
    fixture.detectChanges();

    expect(mockResearchGroupService.getResearchGroupMembersById).toHaveBeenCalledWith(groupId, 10, 0);
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
  });

  it('should handle undefined first and rows values in table emit with fallback to defaults', () => {
    const event: TableLazyLoadEvent = {};
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    component.loadOnTableEmit(event);

    expect(component.pageNumber()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 0);
  });

  it('should load members successfully', async () => {
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    await component.loadMembers();

    expect(component.members()).toEqual(mockPageResponse.content);
    expect(component.total()).toBe(mockPageResponse.totalElements);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 0);
  });

  it('should handle empty or undefined response when loading members', async () => {
    const emptyResponse: PageResponseDTOUserShortDTO = {};
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(emptyResponse));

    await component.loadMembers();

    expect(component.members()).toEqual([]);
    expect(component.total()).toBe(0);
  });

  it('should handle error and show error toast when loading members fails', async () => {
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(throwError(() => new Error('API Error')));

    await component.loadMembers();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.loadFailed');
    expect(mockToastService.showErrorKey).toHaveBeenCalledTimes(1);
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
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledWith(10, 0);
    expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1);
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
      userId: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      roles: [UserShortDTO.RolesEnum.Professor],
      name: 'John Doe',
      role: 'Professor',
      isCurrentUser: false,
      canRemove: true,
    });
    expect(tableData[1]).toEqual({
      userId: 'current-user',
      firstName: 'Current',
      lastName: 'User',
      roles: [UserShortDTO.RolesEnum.Admin],
      name: 'Current User',
      role: 'Admin',
      isCurrentUser: true,
      canRemove: false,
    });
  });

  it('shows the no role text when roles is undefined or empty', () => {
    component.members.set([{ userId: 'user-1', firstName: 'John', lastName: 'Doe', roles: undefined }]);
    let row = component.tableData()[0];
    expect(row.role).toBe('researchGroup.members.noRole');

    component.members.set([{ userId: 'user-1', firstName: 'John', lastName: 'Doe', roles: [] }]);
    row = component.tableData()[0];
    expect(row.role).toBe('researchGroup.members.noRole');
  });

  it('should handle member with undefined userId when removing', async () => {
    const memberWithoutId: UserShortDTO = {
      userId: undefined,
      firstName: 'John',
      lastName: 'Doe',
      roles: [UserShortDTO.RolesEnum.Professor],
    };
    mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(of(void 0));
    mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));

    await component.removeMember(memberWithoutId);

    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith('');
    expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should format role with proper capitalization', () => {
    const memberWithLowercaseRole: UserShortDTO = {
      userId: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      roles: [UserShortDTO.RolesEnum.Professor],
    };
    component.members.set([memberWithLowercaseRole]);
    const row = component.tableData()[0];
    expect(row.role).toBe('Professor');
  });

  describe('openAddMembersModal', () => {
    let dialogService: DialogService;

    beforeEach(() => {
      dialogService = TestBed.inject(DialogService);
      mockResearchGroupService.getResearchGroupMembers.mockReturnValue(of(mockPageResponse));
      fixture.detectChanges();
      vi.clearAllMocks();
    });

    it('should open add members modal and reload members on close if added', () => {
      const mockRef = {
        onClose: of(true),
      } as DynamicDialogRef;
      vi.spyOn(dialogService, 'open').mockReturnValue(mockRef);

      component.openAddMembersModal();

      expect(dialogService.open).toHaveBeenCalled();
      expect(mockResearchGroupService.getResearchGroupMembers).toHaveBeenCalledTimes(1);
    });

    it('should open add members modal and NOT reload members on close if NOT added', () => {
      const mockRef = {
        onClose: of(false),
      } as DynamicDialogRef;
      vi.spyOn(dialogService, 'open').mockReturnValue(mockRef);

      component.openAddMembersModal();

      expect(dialogService.open).toHaveBeenCalled();
      expect(mockResearchGroupService.getResearchGroupMembers).not.toHaveBeenCalled();
    });
  });

  it('should prevent employee from removing a professor', () => {
    mockAccountService.user.update(user => {
      if (!user) {
        return user;
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        authorities: [UserShortDTO.RolesEnum.Employee],
      };
    });
    const professorMember: UserShortDTO = {
      userId: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      roles: [UserShortDTO.RolesEnum.Professor],
    };
    component.members.set([professorMember]);

    const row = component.tableData()[0];

    expect(row.canRemove).toBe(false);
  });

  it('should not allow employee to remove members', () => {
    mockAccountService.user.update(user => {
      if (!user) {
        return user;
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        authorities: [UserShortDTO.RolesEnum.Employee],
      };
    });
    const studentMember: UserShortDTO = { userId: 'user-1', firstName: 'John', lastName: 'Doe', roles: [UserShortDTO.RolesEnum.Employee] };
    component.members.set([studentMember]);

    const row = component.tableData()[0];

    expect(row.canRemove).toBe(false);
  });

  it('should navigate back to admin view', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/research-group/admin-view']);
  });

  it('should load and set the research group name', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(of({ name: 'AI Lab' } as ResearchGroupDTO));

    await component['loadResearchGroupName']('group-1');

    expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledWith('group-1');
    expect(component.researchGroupName()).toBe('AI Lab');
  });

  it('should clear research group name when loading fails', async () => {
    mockResearchGroupService.getResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));
    component.researchGroupName.set('Existing Name');

    await component['loadResearchGroupName']('group-2');

    expect(mockResearchGroupService.getResearchGroup).toHaveBeenCalledWith('group-2');
    expect(component.researchGroupName()).toBeUndefined();
  });

  it('should mark employee as true when user has Employee role', () => {
    mockAccountService.user.update(user => {
      if (!user) {
        return user;
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        authorities: [UserShortDTO.RolesEnum.Employee],
      };
    });

    expect(component.isEmployee()).toBe(true);
  });

  it('should mark employee as false when user lacks Employee role', () => {
    mockAccountService.user.update(user => {
      if (!user) {
        return user;
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        authorities: [UserShortDTO.RolesEnum.Professor],
      };
    });

    expect(component.isEmployee()).toBe(false);
  });

  it('should mark employee as false when authorities are undefined', () => {
    mockAccountService.user.set(undefined);

    expect(component.isEmployee()).toBe(false);
  });
});
