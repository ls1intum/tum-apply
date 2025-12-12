import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableLazyLoadEvent } from 'primeng/table';
import { of, throwError } from 'rxjs';
import { createAccountServiceMock, provideAccountServiceMock } from 'src/test/webapp/util/account.service.mock';
import {
  createResearchGroupResourceApiServiceMock,
  provideResearchGroupResourceApiServiceMock,
} from 'src/test/webapp/util/research-group-resource-api.service.mock';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { provideToastServiceMock, createToastServiceMock } from 'src/test/webapp/util/toast-service.mock';
import {
  provideDynamicDialogConfigMock,
  createDynamicDialogConfigMock,
  provideDynamicDialogRefMock,
  createDynamicDialogRefMock,
} from 'src/test/webapp/util/dynamicdialogref.mock';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ResearchGroupRemoveMembersComponent } from 'app/usermanagement/research-group/research-group-admin-view/research-group-remove-members/research-group-remove-members.component';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PageResponseDTOUserShortDTO } from 'app/generated/model/pageResponseDTOUserShortDTO';
import { vi } from 'vitest';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';

describe('ResearchGroupRemoveMembersComponent (full coverage)', () => {
  let component: ResearchGroupRemoveMembersComponent;
  let fixture: ComponentFixture<ResearchGroupRemoveMembersComponent>;
  let mockResearchGroupService: ReturnType<typeof createResearchGroupResourceApiServiceMock>;
  let mockAccountService: ReturnType<typeof createAccountServiceMock>;
  let mockToastService: ReturnType<typeof createToastServiceMock>;

  const member: UserShortDTO = {
    userId: 'u-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@test.com',
    roles: ['APPLICANT'],
  };

  beforeEach(async () => {
    mockResearchGroupService = createResearchGroupResourceApiServiceMock();
    mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of({ content: [member], totalElements: 1 }));
    mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(of(void 0));

    mockAccountService = createAccountServiceMock();
    mockAccountService.user.set({ id: 'id-1', name: 'test', email: 'test@test.com', authorities: [] });

    mockToastService = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupRemoveMembersComponent],
      providers: [
        provideResearchGroupResourceApiServiceMock(mockResearchGroupService),
        provideAccountServiceMock(mockAccountService),
        provideTranslateMock(),
        provideToastServiceMock(mockToastService),
        provideDynamicDialogConfigMock(createDynamicDialogConfigMock({ researchGroupId: 'rg-123' })),
        provideDynamicDialogRefMock(createDynamicDialogRefMock()),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupRemoveMembersComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Columns', () => {
    it('should compute columns and include templates', () => {
      fixture.detectChanges();
      const cols = component.columns();
      expect(cols).toHaveLength(4);
      expect(cols[0].field).toBe('name');
      expect(cols[0].template).toBeDefined();
      expect(cols[3].field).toBe('actions');
      expect(cols[3].template).toBeDefined();
    });
  });

  describe('Table Loading and Pagination', () => {
    it('should handle undefined first/rows in table emit', () => {
      const event: TableLazyLoadEvent = {};
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(
        of({ content: [member], totalElements: 1 } as PageResponseDTOUserShortDTO),
      );
      component.loadOnTableEmit(event);
      expect(component.pageNumber()).toBe(0);
      expect(component.pageSize()).toBe(10);
      expect(mockResearchGroupService.getResearchGroupMembersById).toHaveBeenCalledWith('rg-123', 10, 0);
    });

    it('should compute pageNumber when first provided', () => {
      const event: TableLazyLoadEvent = { first: 20 };
      component.loadOnTableEmit(event);
      expect(component.pageNumber()).toBe(2);
      expect(component.pageSize()).toBe(10);
      expect(mockResearchGroupService.getResearchGroupMembersById).toHaveBeenCalledWith('rg-123', 10, 2);
    });

    it('should set empty members when API returns empty response', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of({} as PageResponseDTOUserShortDTO));
      await component.loadMembers();
      expect(component.members()).toEqual([]);
      expect(component.total()).toBe(0);
    });

    it('should load members and tableData transforms correctly', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of({ content: [member], totalElements: 1 }));
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadOnTableEmit(event);
      await Promise.resolve();
      expect(component.members()).toHaveLength(1);
      expect(component.tableData()[0].name).toBe('John Doe');
    });

    it('should show error when API throws during loadMembers', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(throwError(() => new Error('API Error')));
      component.loadOnTableEmit({ first: 0, rows: 10 });
      await Promise.resolve();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.loadFailed');
    });

    it('should show error when loadMembers called without researchGroupId', async () => {
      const dynConfig = TestBed.inject(DynamicDialogConfig) as DynamicDialogConfig;
      dynConfig.data = undefined;
      fixture = TestBed.createComponent(ResearchGroupRemoveMembersComponent);
      component = fixture.componentInstance;
      await component.loadMembers();
      expect(mockToastService.showErrorKey).toHaveBeenCalled();
      dynConfig.data = { researchGroupId: 'rg-123' } as DynamicDialogConfig['data'];
    });
  });

  describe('Member Removal', () => {
    it('should remove member and refresh members on success', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(
        of({ content: [member], totalElements: 1 } as PageResponseDTOUserShortDTO),
      );
      component.loadOnTableEmit({ first: 0, rows: 10 });
      await Promise.resolve();
      const initialCalls = mockResearchGroupService.getResearchGroupMembersById.mock.calls.length;
      await component.removeMember(member);
      expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith(member.userId);
      expect(mockToastService.showSuccessKey).toHaveBeenCalled();
      expect(mockResearchGroupService.getResearchGroupMembersById.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('should show error when removeMember fails', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(
        of({ content: [member], totalElements: 1 } as PageResponseDTOUserShortDTO),
      );
      mockResearchGroupService.removeMemberFromResearchGroup = vi.fn().mockReturnValue(throwError(() => new Error('API Error')));
      component.loadOnTableEmit({ first: 0, rows: 10 });
      await Promise.resolve();
      await component.removeMember(member);
      expect(mockToastService.showErrorKey).toHaveBeenCalled();
    });

    it('should call removeMemberFromResearchGroup with empty string when userId undefined', async () => {
      const memberWithoutId: UserShortDTO = { ...member, userId: undefined } as unknown as UserShortDTO;
      mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(of(void 0));
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(
        of({ content: [member], totalElements: 1 } as PageResponseDTOUserShortDTO),
      );
      await component.removeMember(memberWithoutId);
      expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith('');
      expect(mockToastService.showSuccessKey).toHaveBeenCalled();
    });
  });

  describe('Selection', () => {
    it('toggleMemberSelection adds and removes selection', () => {
      expect(component.selectedCount()).toBe(0);
      component.toggleMemberSelection(member);
      expect(component.selectedCount()).toBe(1);
      component.toggleMemberSelection(member);
      expect(component.selectedCount()).toBe(0);
    });

    it('removeSelectedMembers does nothing when no selection', async () => {
      component.selectedMembers.set(new Map());
      await component.removeSelectedMembers();
      expect(mockResearchGroupService.removeMemberFromResearchGroup).not.toHaveBeenCalled();
    });

    it('removeSelectedMembers removes selected and clears selection on success', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(
        of({ content: [member], totalElements: 1 } as PageResponseDTOUserShortDTO),
      );
      component.toggleMemberSelection(member);
      expect(component.selectedCount()).toBe(1);
      mockResearchGroupService.removeMemberFromResearchGroup.mockReturnValue(of(void 0));
      await component.removeSelectedMembers();
      expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith(member.userId);
      expect(component.selectedCount()).toBe(0);
    });

    it('removeSelectedMembers shows error and retains selection on failure', async () => {
      component.toggleMemberSelection(member);
      expect(component.selectedCount()).toBe(1);
      mockResearchGroupService.removeMemberFromResearchGroup = vi.fn().mockReturnValue(throwError(() => new Error('API Error')));
      await component.removeSelectedMembers();
      expect(mockToastService.showErrorKey).toHaveBeenCalled();
      expect(component.selectedCount()).toBe(1);
    });
  });

  describe('Helper Functions', () => {
    it('formatRoles returns translated noRole when roles undefined', () => {
      expect(component['formatRoles']()).toBe('researchGroup.members.noRole');
    });

    it('formatRoles returns pretty printed role when provided', () => {
      expect(component['formatRoles'](['APPLICANT'])).toBe('Applicant');
    });

    it('isCurrentUser returns true/false correctly', () => {
      mockAccountService.user.set({ id: 'u-1', name: 'John', email: 'john.doe@test.com', authorities: [] });
      expect(component['isCurrentUser'](member)).toBe(true);
      expect(component['isCurrentUser']({ ...member, userId: 'u-2' })).toBe(false);
    });
  });
});
