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
import { provideDynamicDialogConfigMock, createDynamicDialogConfigMock } from 'src/test/webapp/util/dynamicdialogref.mock';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ResearchGroupRemoveMembersComponent } from 'app/usermanagement/research-group/research-group-admin-view/research-group-remove-members/research-group-remove-members.component';
import { UserShortDTO } from 'app/generated/model/userShortDTO';
import { PageResponseDTOUserShortDTO } from 'app/generated/model/pageResponseDTOUserShortDTO';
import { vi } from 'vitest';

describe('ResearchGroupRemoveMembersComponent', () => {
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupRemoveMembersComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Columns', () => {
    it('should compute columns and include the name and delete templates', () => {
      fixture.detectChanges();

      const cols = component.columns();

      expect(cols).toHaveLength(4);
      expect(cols[0].field).toBe('name');
      expect(cols[0].template).toBeDefined();
      expect(cols[3].field).toBe('actions');
      expect(cols[3].template).toBeDefined();
      expect(cols[1].field).toBe('email');
      expect(cols[2].field).toBe('role');
    });
  });

  describe('Table Loading and Pagination', () => {
    it('should handle undefined first and rows values in table emit with fallback to defaults', () => {
      const event: TableLazyLoadEvent = {};
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(
        of({ content: [member], totalElements: 1 } as PageResponseDTOUserShortDTO),
      );

      component.loadOnTableEmit(event);
      expect(component.pageNumber()).toBe(0);
      expect(component.pageSize()).toBe(10);
      expect(mockResearchGroupService.getResearchGroupMembersById).toHaveBeenCalledWith('rg-123', 10, 0);
    });

    it('should compute pageNumber when first provided but rows undefined', () => {
      const event: TableLazyLoadEvent = { first: 20 };
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(
        of({ content: [member], totalElements: 1 } as PageResponseDTOUserShortDTO),
      );

      component.loadOnTableEmit(event);
      expect(component.pageNumber()).toBe(2); // 20 / 10
      expect(component.pageSize()).toBe(10);
      expect(mockResearchGroupService.getResearchGroupMembersById).toHaveBeenCalledWith('rg-123', 10, 2);
    });

    it('should set empty members and total when API returns empty response', async () => {
      const emptyResponse: PageResponseDTOUserShortDTO = {};
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(of(emptyResponse));

      await component.loadMembers();

      expect(component.members()).toEqual([]);
      expect(component.total()).toBe(0);
    });

    it('should load members on table emit and set members and total', async () => {
      const event: TableLazyLoadEvent = { first: 0, rows: 10 };
      component.loadOnTableEmit(event);
      // Wait for async change detection and promises
      await Promise.resolve();

      expect(mockResearchGroupService.getResearchGroupMembersById).toHaveBeenCalledWith('rg-123', 10, 0);
      expect(component.members()).toHaveLength(1);
      expect(component.total()).toBe(1);
      expect(component.tableData()[0].name).toBe('John Doe');
    });

    it('should show error when API throws during loadMembers', async () => {
      mockResearchGroupService.getResearchGroupMembersById.mockReturnValue(throwError(() => new Error('API Error')));

      component.loadOnTableEmit({ first: 0, rows: 10 });

      await Promise.resolve();
      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.members.toastMessages.loadFailed');
    });

    it('should show error when loadMembers called without researchGroupId', async () => {
      // configure the injected dialog config to not contain researchGroupId
      const dynConfig = TestBed.inject(DynamicDialogConfig) as DynamicDialogConfig;
      dynConfig.data = undefined;
      await component.loadMembers();
      expect(mockToastService.showErrorKey).toHaveBeenCalled();

      // restore config for other tests
      dynConfig.data = { researchGroupId: 'rg-123' } as unknown as DynamicDialogConfig['data'];
    });
  });

  describe('Member Removal', () => {
    it('should remove member and refresh members on success', async () => {
      component.loadOnTableEmit({ first: 0, rows: 10 });
      await Promise.resolve();

      // ensure initial load
      expect(mockResearchGroupService.getResearchGroupMembersById).toHaveBeenCalledTimes(1);

      // call removeMember
      await component.removeMember(member);

      expect(mockResearchGroupService.removeMemberFromResearchGroup).toHaveBeenCalledWith(member.userId);
      expect(mockToastService.showSuccessKey).toHaveBeenCalled();
      // should have reloaded members once more
      expect(mockResearchGroupService.getResearchGroupMembersById).toHaveBeenCalledTimes(2);
    });

    it('should show error when removeMember fails', async () => {
      mockResearchGroupService.removeMemberFromResearchGroup = vi.fn().mockReturnValue(throwError(() => new Error('API Error')));

      component.loadOnTableEmit({ first: 0, rows: 10 });
      await Promise.resolve();

      await component.removeMember(member);
      expect(mockToastService.showErrorKey).toHaveBeenCalled();
    });

    it('should call removeMemberFromResearchGroup with empty string when member.userId is undefined', async () => {
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

  describe('Helper Functions', () => {
    it('formatRoles returns translated noRole when roles undefined', () => {
      expect(component['formatRoles']()).toBe('researchGroup.members.noRole');
    });

    it('formatRoles returns pretty printed role when roles is present', () => {
      expect(component['formatRoles'](['APPLICANT'])).toBe('Applicant');
    });

    it('isCurrentUser returns true for matching ids', () => {
      const acct = mockAccountService;
      acct.user.set({ id: 'u-1', name: 'John', email: 'john.doe@test.com', authorities: [] });
      expect(component['isCurrentUser'](member)).toBe(true);
    });

    it('isCurrentUser returns false for non matching ids', () => {
      const other: UserShortDTO = { ...member, userId: 'u-other' };
      expect(component['isCurrentUser'](other)).toBe(false);
    });
  });
});
