import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TableLazyLoadEvent } from 'primeng/table';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ManageUsersPageComponent } from 'app/usermanagement/manage-users/manage-users-page.component';
import { AccountService } from 'app/core/auth/account.service';
import { UserAdminResourceApi } from 'app/generated/api/user-admin-resource-api';
import { ResearchGroupResourceApi } from 'app/generated/api/research-group-resource-api';
import { AdminUserOverviewDTO } from 'app/generated/model/admin-user-overview-dto';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';

import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideTranslateMock, createTranslateServiceMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import {
  createUserAdminResourceApiMock,
  provideUserAdminResourceApiMock,
  UserAdminResourceApiMock,
} from 'util/user-admin-resource-api.service.mock';
import {
  createResearchGroupResourceApiMock,
  provideResearchGroupResourceApiMock,
  ResearchGroupResourceApiMock,
} from 'util/research-group-resource-api.service.mock';

describe('ManageUsersPageComponent', () => {
  let component: ManageUsersPageComponent;
  let fixture: ComponentFixture<ManageUsersPageComponent>;
  let mockUserAdminApi: UserAdminResourceApiMock;
  let mockResearchGroupApi: ResearchGroupResourceApiMock;
  let mockToastService: ToastServiceMock;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockAccountService: { loadedUser: ReturnType<typeof vi.fn> };

  const userAlice: AdminUserOverviewDTO = {
    userId: 'user-1',
    firstName: 'Alice',
    lastName: 'Anderson',
    email: 'alice@example.com',
    primaryRole: 'PROFESSOR',
    researchGroupName: 'AI Lab',
    researchGroupId: 'rg-1',
  };

  const userBob: AdminUserOverviewDTO = {
    userId: 'admin-id',
    firstName: 'Bob',
    lastName: 'Burton',
    email: 'bob@example.com',
    primaryRole: 'ADMIN',
  };

  const defaultPage = { content: [userAlice, userBob], totalElements: 2 };

  const defaultResearchGroupPage = {
    content: [
      { id: 'rg-1', researchGroup: 'AI Lab' },
      { id: 'rg-2', researchGroup: 'ML Lab' },
    ],
    totalElements: 2,
  };

  beforeEach(async () => {
    mockUserAdminApi = createUserAdminResourceApiMock();
    mockUserAdminApi.getAllUsers.mockReturnValue(of(defaultPage));
    mockUserAdminApi.deleteUser.mockReturnValue(of(undefined));

    mockResearchGroupApi = createResearchGroupResourceApiMock();
    mockResearchGroupApi.getResearchGroupsForAdmin.mockReturnValue(of(defaultResearchGroupPage));

    mockToastService = createToastServiceMock();
    mockRouter = { navigate: vi.fn().mockResolvedValue(true) };
    mockAccountService = {
      loadedUser: vi.fn().mockReturnValue({ id: 'admin-id', name: 'Bob Burton' }),
    };

    await TestBed.configureTestingModule({
      imports: [ManageUsersPageComponent],
      providers: [
        provideUserAdminResourceApiMock(mockUserAdminApi),
        provideResearchGroupResourceApiMock(mockResearchGroupApi),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(createTranslateServiceMock()),
        provideFontAwesomeTesting(),
        { provide: Router, useValue: mockRouter },
        { provide: AccountService, useValue: mockAccountService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageUsersPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load research group options on init', async () => {
      await Promise.resolve();
      await Promise.resolve();

      expect(mockResearchGroupApi.getResearchGroupsForAdmin).toHaveBeenCalledWith(1000, 0);
      const options = component.researchGroupOptions();
      expect(options).toEqual([
        { id: 'rg-1', name: 'AI Lab' },
        { id: 'rg-2', name: 'ML Lab' },
      ]);
    });

    it('should fall back to error toast when research group load fails', async () => {
      mockResearchGroupApi.getResearchGroupsForAdmin.mockReturnValue(throwError(() => new Error('boom')));

      const failingFixture = TestBed.createComponent(ManageUsersPageComponent);
      await Promise.resolve();
      await Promise.resolve();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('manageUsersPage.errors.loadFilters');
      failingFixture.destroy();
    });

    it('should load users on lazy load', async () => {
      await component.loadPage({ first: 0, rows: 10 } as TableLazyLoadEvent);

      expect(mockUserAdminApi.getAllUsers).toHaveBeenCalledWith(10, 0, 'lastActivityAt', 'DESC', undefined, undefined, undefined);
      expect(component.users()).toEqual([userAlice, userBob]);
      expect(component.totalRecords()).toBe(2);
    });

    it('should compute page index from first and rows on lazy load', async () => {
      await component.loadPage({ first: 40, rows: 20 } as TableLazyLoadEvent);

      expect(component.pageSize()).toBe(20);
      expect(component.page()).toBe(2);
      expect(mockUserAdminApi.getAllUsers).toHaveBeenCalledWith(20, 2, 'lastActivityAt', 'DESC', undefined, undefined, undefined);
    });

    it('should show error toast when loading users fails', async () => {
      mockUserAdminApi.getAllUsers.mockReturnValueOnce(throwError(() => new Error('fail')));

      await component.loadPage({ first: 0, rows: 10 } as TableLazyLoadEvent);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('manageUsersPage.errors.loadUsers');
    });
  });

  describe('Columns', () => {
    it('should expose User, Email, University ID, Role, Research Group, Last Activity, and Actions columns', () => {
      fixture.detectChanges();
      const columns = component.columns();
      const fields = columns.map(column => column.field);

      expect(fields).toEqual(['fullName', 'email', 'universityId', 'primaryRole', 'researchGroupName', 'lastActivityAt', 'actions']);
      expect(columns[0].header).toBe('manageUsersPage.tableColumn.user');
      expect(columns[1].header).toBe('manageUsersPage.tableColumn.email');
      expect(columns[2].header).toBe('manageUsersPage.tableColumn.universityId');
      expect(columns[3].header).toBe('manageUsersPage.tableColumn.role');
      expect(columns[4].header).toBe('manageUsersPage.tableColumn.researchGroup');
      expect(columns[5].header).toBe('manageUsersPage.tableColumn.lastActivity');
      expect(columns[6].header).toBe('');
    });
  });

  describe('Filters', () => {
    it('should set role filter and reload with the selected enum array', async () => {
      mockUserAdminApi.getAllUsers.mockClear();
      const change: FilterChange = {
        filterId: 'role',
        selectedValues: ['manageUsersPage.roles.PROFESSOR', 'manageUsersPage.roles.ADMIN'],
      };

      component.onFilterEmit(change);
      await Promise.resolve();

      expect(component.selectedRoleFilters()).toEqual(['PROFESSOR', 'ADMIN']);
      expect(component.page()).toBe(0);
      expect(mockUserAdminApi.getAllUsers).toHaveBeenCalledWith(
        10,
        0,
        'lastActivityAt',
        'DESC',
        ['PROFESSOR', 'ADMIN'],
        undefined,
        undefined,
      );
    });

    it('should map research-group names to ids on filter change', async () => {
      // Wait for research group load to complete first.
      await Promise.resolve();
      await Promise.resolve();
      mockUserAdminApi.getAllUsers.mockClear();

      const change: FilterChange = {
        filterId: 'researchGroup',
        selectedValues: ['AI Lab', 'ML Lab'],
      };

      component.onFilterEmit(change);
      await Promise.resolve();

      expect(component.selectedResearchGroupFilters()).toEqual(['rg-1', 'rg-2']);
      expect(mockUserAdminApi.getAllUsers).toHaveBeenCalledWith(
        10,
        0,
        'lastActivityAt',
        'DESC',
        undefined,
        ['rg-1', 'rg-2'],
        undefined,
      );
    });
  });

  describe('Search', () => {
    it('should reload on meaningful query change', async () => {
      mockUserAdminApi.getAllUsers.mockClear();

      component.onSearchEmit('alice');
      await Promise.resolve();

      expect(component.searchQuery()).toBe('alice');
      expect(component.page()).toBe(0);
      expect(mockUserAdminApi.getAllUsers).toHaveBeenCalledWith(
        10,
        0,
        'lastActivityAt',
        'DESC',
        undefined,
        undefined,
        'alice',
      );
    });

    it('should NOT reload when query is unchanged', async () => {
      component.searchQuery.set('same');
      mockUserAdminApi.getAllUsers.mockClear();

      component.onSearchEmit('same');
      await Promise.resolve();

      expect(mockUserAdminApi.getAllUsers).not.toHaveBeenCalled();
    });
  });

  describe('Actions', () => {
    it('should navigate to /manage-users/:userId on view', () => {
      component.onViewUser('user-1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/manage-users', 'user-1']);
    });

    it('should not navigate when view is called with empty id', () => {
      component.onViewUser('');
      component.onViewUser(undefined);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to /manage-users/create on Create button', () => {
      component.onCreateUser();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/manage-users/create']);
    });

    it('should navigate to /manage-users/create with mode=import on Import button', () => {
      component.onImport();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/manage-users/create'], { queryParams: { mode: 'import' } });
    });

    it('should request delete and open dialog for non-self row', () => {
      component.onRequestDelete(userAlice);

      expect(component.currentUserToDelete()).toBe(userAlice);
      expect(component.showDeleteDialog()).toBe(true);
      expect(mockToastService.showErrorKey).not.toHaveBeenCalled();
    });

    it('should disable delete on the current admin own row by toasting and skipping the dialog', () => {
      component.onRequestDelete(userBob);

      expect(component.currentUserToDelete()).toBeUndefined();
      expect(component.showDeleteDialog()).toBe(false);
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('manageUsersPage.errors.selfDelete');
    });

    it('should treat the current admin row as self', () => {
      expect(component.isSelf(userBob)).toBe(true);
      expect(component.isSelf(userAlice)).toBe(false);
    });

    it('should call deleteUser on confirmed delete', async () => {
      component.currentUserToDelete.set(userAlice);

      await component.onConfirmDelete();

      expect(mockUserAdminApi.deleteUser).toHaveBeenCalledWith('user-1');
      expect(mockToastService.showSuccess).toHaveBeenCalled();
      expect(component.currentUserToDelete()).toBeUndefined();
    });

    it('should not call deleteUser when no user is selected for deletion', async () => {
      component.currentUserToDelete.set(undefined);

      await component.onConfirmDelete();

      expect(mockUserAdminApi.deleteUser).not.toHaveBeenCalled();
    });

    it('should toast error when delete fails', async () => {
      mockUserAdminApi.deleteUser.mockReturnValueOnce(throwError(() => new Error('forbidden')));
      component.currentUserToDelete.set(userAlice);

      await component.onConfirmDelete();

      expect(mockToastService.showError).toHaveBeenCalled();
      expect(component.currentUserToDelete()).toBeUndefined();
    });
  });

  describe('Sort', () => {
    it('should reload with the new sort field and direction', async () => {
      mockUserAdminApi.getAllUsers.mockClear();

      component.onSortEmit({ field: 'lastName', direction: 'ASC' });
      await Promise.resolve();

      expect(component.sortBy()).toBe('lastName');
      expect(component.sortDirection()).toBe('ASC');
      expect(component.page()).toBe(0);
      expect(mockUserAdminApi.getAllUsers).toHaveBeenCalledWith(10, 0, 'lastName', 'ASC', undefined, undefined, undefined);
    });
  });

  describe('Display helpers', () => {
    it('should compute fullName from first and last name', () => {
      expect(component.fullName(userAlice)).toBe('Alice Anderson');
      expect(component.fullName({ userId: 'x' } as AdminUserOverviewDTO)).toBe('');
    });

    it('should map the row role to the matching translation key', () => {
      expect(component.roleLabelKey(userAlice)).toBe('manageUsersPage.roles.PROFESSOR');
      expect(component.roleLabelKey({ userId: 'x' } as AdminUserOverviewDTO)).toBe('');
    });
  });
});
