import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Observable } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HttpErrorResponse } from '@angular/common/http';

import { ResearchGroupAddMembersComponent } from 'app/usermanagement/research-group/research-group-add-members/research-group-add-members.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { UserResourceApiService } from 'app/generated/api/userResourceApi.service';
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
import { KeycloakUserDTO } from 'app/generated';
import { provideHttpClientMock } from 'util/http-client.mock';

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

  const mockUser1: KeycloakUserDTO = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
  };

  const mockUser2: KeycloakUserDTO = {
    id: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    username: 'janesmith',
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
        provideHttpClientMock(),
        provideDynamicDialogRefMock(mockDialogRef),
        provideDynamicDialogConfigMock(mockDialogConfig),
        provideToastServiceMock(mockToastService),
        provideTranslateMock(),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupAddMembersComponent);
    component = fixture.componentInstance;
    const componentWithMocks = component as unknown as { USE_MOCK_USERS: boolean };
    componentWithMocks.USE_MOCK_USERS = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
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
  });

  describe('Load users', () => {
    it('should not call userService on init when there is no search query', () => {
      expect(mockUserService.getAvailableUsersForResearchGroup).not.toHaveBeenCalled();
      expect(component.users()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
    });

    it('should load available users successfully when a search query is provided', async () => {
      vi.clearAllMocks();
      mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

      await component.loadAvailableUsers('john');

      expect(component.users()).toEqual(mockPageResponse.content);
      expect(component.totalRecords()).toBe(mockPageResponse.totalElements);
      expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 0, 'john');
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

      await component.loadAvailableUsers('john');

      expect(component.users()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
      expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
    });

    it('should handle error and show error toast when loading users fails', async () => {
      vi.clearAllMocks();
      mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

      await component.loadAvailableUsers('john');

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

    it('should clear users when given an empty query and users exist', async () => {
      component.users.set([mockUser1]);
      component.totalRecords.set(1);
      vi.clearAllMocks();

      await component.loadAvailableUsers();

      expect(component.users()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
      expect(mockUserService.getAvailableUsersForResearchGroup).not.toHaveBeenCalled();
    });

    it('should not load users for short search queries (< MIN_SEARCH_LENGTH)', async () => {
      vi.clearAllMocks();
      mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

      await component.loadAvailableUsers('ab');

      expect(mockUserService.getAvailableUsersForResearchGroup).not.toHaveBeenCalled();
      expect(component.users()).toEqual([]);
    });

    it('should clear existing loader timeout when starting a new load', async () => {
      vi.spyOn(window, 'clearTimeout');
      // simulate an existing pending timeout
      component['loaderTimeout'] = 123;

      vi.clearAllMocks();
      mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));

      await component.loadAvailableUsers('abc');

      expect(window.clearTimeout).toHaveBeenCalledWith(123);
      // loaderTimeout should be set again and cleared by finally block, so it's not null
      expect(component.users()).toEqual(mockPageResponse.content);
    });

    it('should ignore stale requests and only apply the latest result', async () => {
      vi.clearAllMocks();

      let firstSubscriber: { next: (value: PageResponseDTOUserShortDTO) => void; complete: () => void } | undefined;
      const first$ = new Observable<PageResponseDTOUserShortDTO>(sub => {
        firstSubscriber = sub;
      });

      let secondSubscriber: { next: (value: PageResponseDTOUserShortDTO) => void; complete: () => void } | undefined;
      const second$ = new Observable<PageResponseDTOUserShortDTO>(sub => {
        secondSubscriber = sub;
      });

      mockUserService.getAvailableUsersForResearchGroup.mockReturnValueOnce(first$).mockReturnValueOnce(second$);

      // start first request (older)
      const p1 = component.loadAvailableUsers('wag');
      // start second request (newer)
      const p2 = component.loadAvailableUsers('wagne');

      // complete second request first (newer arrives earlier)
      if (secondSubscriber) {
        secondSubscriber.next({ content: [mockUser2], totalElements: 1 });
        secondSubscriber.complete();
      }
      await p2; // wait for the newer request to be applied

      expect(component.users()).toEqual([mockUser2]);

      // now complete the first request (older arrives later) - should be ignored
      if (firstSubscriber) {
        firstSubscriber.next({ content: [mockUser1], totalElements: 1 });
        firstSubscriber.complete();
      }
      await p1; // wait for the older request to finish (it should have no effect)

      expect(component.users()).toEqual([mockUser2]);
      expect(mockToastService.showErrorKey).not.toHaveBeenCalled();
    });

    it('should not display error toast when stale request errors and a newer response succeeds', async () => {
      vi.clearAllMocks();

      let firstSubscriber: { error: (err: Error) => void } | undefined;
      const first$ = new Observable<PageResponseDTOUserShortDTO>(sub => {
        firstSubscriber = sub;
      });

      let secondSubscriber: { next: (value: PageResponseDTOUserShortDTO) => void; complete: () => void } | undefined;
      const second$ = new Observable<PageResponseDTOUserShortDTO>(sub => {
        secondSubscriber = sub;
      });

      mockUserService.getAvailableUsersForResearchGroup.mockReturnValueOnce(first$).mockReturnValueOnce(second$);

      // start first request (older)
      const p1 = component.loadAvailableUsers('wag');
      // start second request (newer)
      const p2 = component.loadAvailableUsers('wagne');

      // complete second request first (newer arrives earlier)
      if (secondSubscriber) {
        secondSubscriber.next({ content: [mockUser2], totalElements: 1 });
        secondSubscriber.complete();
      }
      await p2; // wait for the newer request to be applied

      expect(component.users()).toEqual([mockUser2]);

      // now complete the first request (older arrives later and errors) - should be ignored
      if (firstSubscriber) {
        firstSubscriber.error(new Error('Api error older')); // older request fails
      }
      try {
        await p1;
      } catch (e) {
        // ignore error from p1 (older)
      }

      // No toast should be shown for the stale error
      expect(mockToastService.showErrorKey).not.toHaveBeenCalled();
    });
  });

  describe('Mock users', () => {
    it('should use mock users and avoid API calls when enabled', async () => {
      vi.clearAllMocks();
      const mockUsers: KeycloakUserDTO[] = [
        { id: 'mock-1', firstName: 'Alice', lastName: 'Curie', email: 'alice.curie@tum.de' },
        { id: 'mock-2', firstName: 'Ben', lastName: 'Schmidt', email: 'ben.schmidt@mytum.de' },
      ];

      const componentWithMocks = component as unknown as {
        USE_MOCK_USERS: boolean;
        mockUsers: { set: (value: KeycloakUserDTO[] | null) => void };
      };
      componentWithMocks.USE_MOCK_USERS = true;
      componentWithMocks.mockUsers.set(mockUsers);

      await component.loadAvailableUsers('alice');

      expect(component.users()).toEqual([mockUsers[0]]);
      expect(component.totalRecords()).toBe(1);
      expect(mockUserService.getAvailableUsersForResearchGroup).not.toHaveBeenCalled();
    });

    it('should handle missing user fields when filtering mock users', async () => {
      vi.clearAllMocks();
      const mockUsers: KeycloakUserDTO[] = [
        { id: 'mock-1', firstName: undefined, lastName: undefined, email: undefined } as KeycloakUserDTO,
        { id: 'mock-2', firstName: 'Alice', lastName: 'Curie', email: 'alice.curie@tum.de' },
      ];

      const componentWithMocks = component as unknown as {
        USE_MOCK_USERS: boolean;
        mockUsers: { set: (value: KeycloakUserDTO[] | null) => void };
      };
      componentWithMocks.USE_MOCK_USERS = true;
      componentWithMocks.mockUsers.set(mockUsers);

      await component.loadAvailableUsers('alice');

      expect(component.users()).toEqual([mockUsers[1]]);
      expect(component.totalRecords()).toBe(1);
      expect(mockUserService.getAvailableUsersForResearchGroup).not.toHaveBeenCalled();
    });

    it('should paginate mock users based on page and pageSize', async () => {
      vi.clearAllMocks();
      const mockUsers: KeycloakUserDTO[] = [
        { id: 'mock-1', firstName: 'Alice', lastName: 'Curie', email: 'alice.curie@tum.de' },
        { id: 'mock-2', firstName: 'Ben', lastName: 'Schmidt', email: 'ben.schmidt@mytum.de' },
        { id: 'mock-3', firstName: 'Carla', lastName: 'Nguyen', email: 'carla.nguyen@tum.de' },
        { id: 'mock-4', firstName: 'David', lastName: 'Ibrahim', email: 'david.ibrahim@mytum.de' },
        { id: 'mock-5', firstName: 'Elena', lastName: 'Rossi', email: 'elena.rossi@tum.de' },
        { id: 'mock-6', firstName: 'Farid', lastName: 'Khan', email: 'farid.khan@mytum.de' },
      ];

      const componentWithMocks = component as unknown as {
        USE_MOCK_USERS: boolean;
        mockUsers: { set: (value: KeycloakUserDTO[] | null) => void };
      };
      componentWithMocks.USE_MOCK_USERS = true;
      componentWithMocks.mockUsers.set(mockUsers);

      component.pageSize.set(2);
      component.page.set(1);

      await component.loadAvailableUsers('tum');

      expect(component.totalRecords()).toBe(6);
      expect(component.users()).toEqual([mockUsers[2], mockUsers[3]]);
      expect(mockUserService.getAvailableUsersForResearchGroup).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Config', () => {
    it('should compute researchGroupId from dialog config data', () => {
      expect(component.researchGroupId()).toBe('research-group-1');
    });

    it('should handle undefined researchGroupId in dialog config', () => {
      mockDialogConfig.data = undefined;
      expect(component.researchGroupId()).toBeUndefined();
    });
  });

  describe('Pagination', () => {
    it('should update page and pageSize and load users on page change', async () => {
      vi.clearAllMocks();
      mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));
      // Set a search query to ensure the component makes the API call
      component.searchQuery.set('test-search');

      component.onPageChange({ first: 20, rows: 10 });
      await Promise.resolve(); // Wait for async operation

      expect(component.page()).toBe(2); // 20 / 10 = 2
      expect(component.pageSize()).toBe(10);
      expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 2, 'test-search');
      expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined first and rows in page change event', async () => {
      vi.clearAllMocks();
      mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));
      component.searchQuery.set('abc');

      component.onPageChange({});
      await Promise.resolve();

      expect(component.page()).toBe(0);
      expect(component.pageSize()).toBe(10); // Unchanged
      expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(10, 0, 'abc');
      expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledTimes(1);
    });

    it('should update pageSize when rows is provided in page change event', async () => {
      vi.clearAllMocks();
      mockUserService.getAvailableUsersForResearchGroup.mockReturnValue(of(mockPageResponse));
      component.searchQuery.set('abc');

      component.onPageChange({ first: 0, rows: 25 });
      await Promise.resolve();

      expect(component.pageSize()).toBe(25);
      expect(mockUserService.getAvailableUsersForResearchGroup).toHaveBeenCalledWith(25, 0, 'abc');
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
  });

  describe('User Selection', () => {
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

    it('should show error toast when toggling user with undefined id', () => {
      const userWithoutId: KeycloakUserDTO = { ...mockUser1, id: undefined } as KeycloakUserDTO;

      component.toggleUserSelection(userWithoutId);

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.invalidUser');
      expect(mockToastService.showErrorKey).toHaveBeenCalledTimes(1);
      expect(component.selectedUserCount()).toBe(0);
    });

    it('should return false for isUserSelected when user has no id', () => {
      const userWithoutId: KeycloakUserDTO = { ...mockUser1, id: undefined } as KeycloakUserDTO;

      expect(component.isUserSelected(userWithoutId)).toBe(false);
    });

    it('should return false for isUserSelected when user is not selected', () => {
      expect(component.isUserSelected(mockUser1)).toBe(false);
    });
  });

  describe('Dialog Actions', () => {
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
        keycloakUsers: [mockUser1, mockUser2],
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
        keycloakUsers: [mockUser1],
        researchGroupId: 'research-group-1',
      });
      expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledTimes(1);
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.addMembersFailed');
      expect(mockToastService.showErrorKey).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should handle HttpErrorResponse with no error.message and show generic error toast', async () => {
      component.toggleUserSelection(mockUser1);
      const httpErr = new HttpErrorResponse({ error: {}, status: 400 });
      mockResearchGroupService.addMembersToResearchGroup.mockReturnValue(throwError(() => httpErr));

      await component.onAddMembers();

      expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledWith({
        keycloakUsers: [mockUser1],
        researchGroupId: 'research-group-1',
      });
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.addMembersFailed');
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should show specific already-member error toast when server returns AlreadyMemberOfResearchGroup', async () => {
      component.toggleUserSelection(mockUser1);
      const apiError = {
        errorCode: 'OPERATION_NOT_ALLOWED',
        message: "User with universityId 'ab12abc' is already a member of research group.",
      };
      mockResearchGroupService.addMembersToResearchGroup.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: apiError, status: 400 })),
      );

      await component.onAddMembers();

      expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledWith({
        keycloakUsers: [mockUser1],
        researchGroupId: 'research-group-1',
      });
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.addMembersFailedAlreadyMember');
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should show specific invalid-university-id error toast when server returns invalid universityId error', async () => {
      component.toggleUserSelection(mockUser1);
      const apiError = {
        message: 'User does not have a valid universityId',
      };
      mockResearchGroupService.addMembersToResearchGroup.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: apiError, status: 400 })),
      );

      await component.onAddMembers();

      expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledWith({
        keycloakUsers: [mockUser1],
        researchGroupId: 'research-group-1',
      });
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.addMembersFailedInvalidUniversityId');
      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });

    it('should add members with undefined researchGroupId', async () => {
      mockDialogConfig.data = undefined;
      component.toggleUserSelection(mockUser1);
      mockResearchGroupService.addMembersToResearchGroup.mockReturnValue(of(void 0));

      await component.onAddMembers();

      expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledWith({
        keycloakUsers: [mockUser1],
        researchGroupId: undefined,
      });
      expect(mockResearchGroupService.addMembersToResearchGroup).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Persistence', () => {
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
});
