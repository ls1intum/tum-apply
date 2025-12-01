import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { ResearchGroupAddMembersComponent } from 'app/usermanagement/research-group/research-group-add-members/research-group-add-members.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';
import { UserDTO } from 'app/generated/model/userDTO';
import { PageResponseDTOUserShortDTO } from 'app/generated/model/pageResponseDTOUserShortDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import {
  createDynamicDialogRefMock,
  DynamicDialogRefMock,
  provideDynamicDialogConfigMock,
  provideDynamicDialogRefMock,
} from 'util/dynamicdialogref.mock';

describe('ResearchGroupAddMembersComponent', () => {
  let component: ResearchGroupAddMembersComponent;
  let fixture: ComponentFixture<ResearchGroupAddMembersComponent>;
  let mockUserService: {
    getAvailableUsersForResearchGroup: ReturnType<typeof vi.fn>;
  };
  let mockResearchGroupService: {
    addMembersToResearchGroup: ReturnType<typeof vi.fn>;
  };
  let mockDialogRef: DynamicDialogRefMock;
  let mockDialogConfig: DynamicDialogConfig;
  let mockToastService: ToastServiceMock;

  const mockUser1: UserDTO = {
    userId: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };

  const mockUser2: UserDTO = {
    userId: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
  };

  const mockPageResponse: PageResponseDTOUserShortDTO = {
    content: [mockUser1, mockUser2],
    totalElements: 2,
  };

  beforeEach(async () => {
    mockUserService = {
      getAvailableUsersForResearchGroup: vi.fn().mockReturnValue(of({ content: [], totalElements: 0 })),
    };

    mockResearchGroupService = {
      addMembersToResearchGroup: vi.fn(),
    };

    mockDialogRef = createDynamicDialogRefMock();

    mockDialogConfig = {
      data: {
        researchGroupId: 'research-group-1',
      },
    };

    mockToastService = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupAddMembersComponent],
      providers: [
        { provide: UserResourceApiService, useValue: mockUserService },
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        provideDynamicDialogRefMock(mockDialogRef),
        provideDynamicDialogConfigMock(mockDialogConfig),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupAddMembersComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.totalRecords()).toBe(0);
    expect(component.page()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(component.users()).toEqual([]);
    expect(component.searchQuery()).toBe('');
    expect(component.selectedUserCount()).toBe(0);
  });

  it('should load available users on component init', () => {
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 0, undefined);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
    expect(component.users()).toEqual([]);
    expect(component.totalRecords()).toBe(0);
  });

  it('should compute researchGroupId from dialog config data', () => {
    expect(component.researchGroupId()).toBe('research-group-1');
  });

  it('should handle undefined researchGroupId in dialog config', () => {
    mockDialogConfig.data = undefined;
    expect(component.researchGroupId()).toBeUndefined();
  });

  it('should load available users successfully', async () => {
    vi.clearAllMocks();
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

    await component.loadAvailableUsers();

    expect(component.users()).toEqual(mockPageResponse.content);
    expect(component.totalRecords()).toBe(mockPageResponse.totalElements);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 0, undefined);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should load available users with search query', async () => {
    vi.clearAllMocks();
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

    await component.loadAvailableUsers('john');

    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 0, 'john');
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should handle empty or undefined response when loading users', async () => {
    vi.clearAllMocks();
    const emptyResponse: PageResponseDTOUserShortDTO = {};
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(emptyResponse));

    await component.loadAvailableUsers();

    expect(component.users()).toEqual([]);
    expect(component.totalRecords()).toBe(0);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should handle error and show error toast when loading users fails', async () => {
    vi.clearAllMocks();
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

    await component.loadAvailableUsers();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.loadUsersFailed');
    expect(mockToastService.showErrorKey).toHaveBeenCalledTimes(1);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should reset page to 0 and load users when search query changes', async () => {
    component.page.set(2);
    component.searchQuery.set('old-query');
    vi.clearAllMocks();
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

    component.onSearch('new-query');
    await Promise.resolve(); // Wait for async operation

    expect(component.page()).toBe(0);
    expect(component.searchQuery()).toBe('new-query');
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 0, 'new-query');
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should not reload users when search query is the same', () => {
    component.searchQuery.set('same-query');
    vi.clearAllMocks();
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

    component.onSearch('same-query');

    expect(mockUserService.getAvailableUsersForResearchGroup).not.toHaveBeenCalled();
  });

  it('should update page and pageSize and load users on page change', async () => {
    vi.clearAllMocks();
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

    component.onPageChange({ first: 20, rows: 10 });
    await Promise.resolve(); // Wait for async operation

    expect(component.page()).toBe(2); // 20 / 10 = 2
    expect(component.pageSize()).toBe(10);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 2, undefined);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should handle undefined first and rows in page change event', async () => {
    vi.clearAllMocks();
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

    component.onPageChange({});
    await Promise.resolve();

    expect(component.page()).toBe(0);
    expect(component.pageSize()).toBe(10); // Unchanged
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 0, undefined);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should update pageSize when rows is provided in page change event', async () => {
    vi.clearAllMocks();
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

    component.onPageChange({ first: 0, rows: 25 });
    await Promise.resolve();

    expect(component.pageSize()).toBe(25);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(25, 0, undefined);
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should load users with current search query on page change', async () => {
    component.searchQuery.set('test-search');
    vi.clearAllMocks();
    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

    component.onPageChange({ first: 10, rows: 10 });
    await Promise.resolve();

    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 1, 'test-search');
    expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should toggle user selection - add user', () => {
    component.toggleUserSelection(mockUser1);

    expect(component.selectedUserCount()).toBe(1);
    expect(component.isUserSelected(mockUser1)).toBe(true);
  });

  it('should toggle user selection - remove user', () => {
    component.toggleUserSelection(mockUser1);
    expect(component.selectedUserCount()).toBe(1);

    component.toggleUserSelection(mockUser1);
    expect(component.selectedUserCount()).toBe(0);
    expect(component.isUserSelected(mockUser1)).toBe(false);
  });

  it('should handle multiple user selections', () => {
    component.toggleUserSelection(mockUser1);
    component.toggleUserSelection(mockUser2);

    expect(component.selectedUserCount()).toBe(2);
    expect(component.isUserSelected(mockUser1)).toBe(true);
    expect(component.isUserSelected(mockUser2)).toBe(true);
  });

  it('should show error toast when toggling user with undefined userId', () => {
    const userWithoutId: UserDTO = { ...mockUser1, userId: undefined };

    component.toggleUserSelection(userWithoutId);

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.invalidUser');
    expect(mockToastService.showErrorKey).toHaveBeenCalledTimes(1);
    expect(component.selectedUserCount()).toBe(0);
  });

  it('should return false for isUserSelected when user has no userId', () => {
    const userWithoutId: UserDTO = { ...mockUser1, userId: undefined };

    expect(component.isUserSelected(userWithoutId)).toBe(false);
  });

  it('should return false for isUserSelected when user is not selected', () => {
    expect(component.isUserSelected(mockUser1)).toBe(false);
  });

  it('should close dialog on cancel', () => {
    component.onCancel();

    expect(mockDialogRef.close).toHaveBeenCalledWith();
    expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
  });

  it('should not add members when no users are selected', async () => {
    await component.onAddMembers();

    expect(mockResearchGroupService.addMembersToResearchGroup).not.toHaveBeenCalled();
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should add members successfully and close dialog with true', async () => {
    component.toggleUserSelection(mockUser1);
    component.toggleUserSelection(mockUser2);
    mockResearchGroupService.addMembersToResearchGroup.mockReturnValue(of(void 0));

    await component.onAddMembers();

    expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledWith({
      userIds: ['user-1', 'user-2'],
      researchGroupId: 'research-group-1',
    });
    expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledTimes(1);
    expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.addMembersSuccess');
    expect(mockToastService.showSuccessKey).toHaveBeenCalledTimes(1);
    expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
  });

  it('should handle error and show error toast when adding members fails', async () => {
    component.toggleUserSelection(mockUser1);
    mockResearchGroupService.addMembersToResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

    await component.onAddMembers();

    expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledWith({
      userIds: ['user-1'],
      researchGroupId: 'research-group-1',
    });
    expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledTimes(1);
    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.addMembersFailed');
    expect(mockToastService.showErrorKey).toHaveBeenCalledTimes(1);
    expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
  });

  it('should add members with undefined researchGroupId', async () => {
    mockDialogConfig.data = undefined;
    component.toggleUserSelection(mockUser1);
    mockResearchGroupService.addMembersToResearchGroup.mockReturnValue(of(void 0));

    await component.onAddMembers();

    expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledWith({
      userIds: ['user-1'],
      researchGroupId: undefined,
    });
    expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledTimes(1);
  });

  it('should maintain selection state across page changes', async () => {
    component.toggleUserSelection(mockUser1);
    expect(component.selectedUserCount()).toBe(1);

    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));
    component.onPageChange({ first: 10, rows: 10 });
    await Promise.resolve();

    // Selection should persist
    expect(component.selectedUserCount()).toBe(1);
    expect(component.isUserSelected(mockUser1)).toBe(true);
  });

  it('should maintain selection state across search queries', async () => {
    component.toggleUserSelection(mockUser1);
    component.toggleUserSelection(mockUser2);
    expect(component.selectedUserCount()).toBe(2);

    mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));
    component.onSearch('new-search');
    await Promise.resolve();

    // Selection should persist
    expect(component.selectedUserCount()).toBe(2);
    expect(component.isUserSelected(mockUser1)).toBe(true);
    expect(component.isUserSelected(mockUser2)).toBe(true);
  });
});
