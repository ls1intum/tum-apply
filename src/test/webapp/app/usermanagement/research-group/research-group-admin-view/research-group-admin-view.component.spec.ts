import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ResearchGroupAdminView } from 'app/usermanagement/research-group/research-group-admin-view/research-group-admin-view.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupAdminDTO } from 'app/generated/model/researchGroupAdminDTO';
import { PageResponseDTOResearchGroupAdminDTO } from 'app/generated/model/pageResponseDTOResearchGroupAdminDTO';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { Sort } from 'app/shared/components/atoms/sorting/sorting';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { TableLazyLoadEvent } from 'primeng/table';

const I18N_BASE = 'researchGroup.adminView';

function makeResearchGroup(id: string, partial?: Partial<ResearchGroupAdminDTO>): ResearchGroupAdminDTO {
  return {
    id: id,
    professorName: `Prof. ${id}`,
    researchGroup: `Research Group ${id}`,
    status: 'DRAFT',
    createdAt: '2025-01-01T00:00:00Z',
    ...partial,
  } as ResearchGroupAdminDTO;
}

describe('ResearchGroupAdminView', () => {
  let component: ResearchGroupAdminView;
  let fixture: ComponentFixture<ResearchGroupAdminView>;
  let mockResearchGroupService: {
    getResearchGroupsForAdmin: ReturnType<typeof vi.fn>;
    activateResearchGroup: ReturnType<typeof vi.fn>;
    denyResearchGroup: ReturnType<typeof vi.fn>;
    withdrawResearchGroup: ReturnType<typeof vi.fn>;
  };
  let mockToastService: ToastServiceMock;

  beforeEach(async () => {
    vi.useFakeTimers();

    mockResearchGroupService = {
      getResearchGroupsForAdmin: vi.fn().mockReturnValue(of({ content: [makeResearchGroup('1')], totalElements: 1 })),
      activateResearchGroup: vi.fn().mockReturnValue(of(makeResearchGroup('1', { status: 'ACTIVE' }))),
      denyResearchGroup: vi.fn().mockReturnValue(of(makeResearchGroup('1', { status: 'DENIED' }))),
      withdrawResearchGroup: vi.fn().mockReturnValue(of(makeResearchGroup('1', { status: 'DRAFT' }))),
    };

    mockToastService = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupAdminView],
      providers: [
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        provideTranslateMock(),
        provideToastServiceMock(mockToastService),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupAdminView);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    vi.runOnlyPendingTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    fixture?.destroy();
  });

  // ---------------- INITIALIZATION ----------------
  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      // Note: researchGroups and totalRecords are populated from the mock service during initialization
      expect(component.researchGroups()).toEqual([makeResearchGroup('1')]);
      expect(component.totalRecords()).toBe(1);
      expect(component.page()).toBe(0);
      expect(component.pageSize()).toBe(10);
      expect(component.searchQuery()).toBe('');
      expect(component.sortBy()).toBe('state');
      expect(component.sortDirection()).toBe('DESC');
      expect(component.selectedStatusFilters()).toEqual([]);
    });

    it('should have correct available status options', () => {
      expect(component.availableStatusOptions).toEqual([
        { key: 'DRAFT', label: `${I18N_BASE}.groupState.draft` },
        { key: 'ACTIVE', label: `${I18N_BASE}.groupState.active` },
        { key: 'DENIED', label: `${I18N_BASE}.groupState.denied` },
      ]);
    });

    it('should compute state text map correctly', () => {
      const stateTextMap = component.stateTextMap();
      expect(stateTextMap.DRAFT).toBe(`${I18N_BASE}.groupState.draft`);
      expect(stateTextMap.ACTIVE).toBe(`${I18N_BASE}.groupState.active`);
      expect(stateTextMap.DENIED).toBe(`${I18N_BASE}.groupState.denied`);
    });

    it('should have correct state severity map', () => {
      const severityMap = component.stateSeverityMap();
      expect(severityMap.DRAFT).toBe('contrast');
      expect(severityMap.ACTIVE).toBe('success');
      expect(severityMap.DENIED).toBe('danger');
    });

    it('should have correct columns configuration', () => {
      fixture.detectChanges();
      const columns = component.columns();

      expect(columns).toHaveLength(5);
      expect(columns[0].field).toBe('professorName');
      expect(columns[0].header).toBe(`${I18N_BASE}.tableColumn.professor`);
      expect(columns[1].field).toBe('status');
      expect(columns[1].header).toBe(`${I18N_BASE}.tableColumn.status`);
      expect(columns[1].alignCenter).toBe(true);
      expect(columns[2].field).toBe('researchGroup');
      expect(columns[2].header).toBe(`${I18N_BASE}.tableColumn.researchGroup`);
      expect(columns[3].field).toBe('createdAt');
      expect(columns[3].header).toBe(`${I18N_BASE}.tableColumn.requestedAt`);
      expect(columns[3].type).toBe('date');
      expect(columns[4].field).toBe('actions');
      expect(columns[4].header).toBe('');
    });

    it('should assign templates to correct columns', () => {
      fixture.detectChanges();
      const columns = component.columns();

      const statusColumn = columns.find(c => c.field === 'status');
      const actionsColumn = columns.find(c => c.field === 'actions');

      expect(statusColumn?.template).toBeDefined();
      expect(actionsColumn?.template).toBeDefined();
    });

    it('should have correct filters configuration', () => {
      expect(component.filters).toHaveLength(1);
      expect(component.filters[0].filterId).toBe('status');
      expect(component.filters[0].filterLabel).toBe(`${I18N_BASE}.filter.status`);
      expect(component.filters[0].shouldTranslateOptions).toBe(true);
    });

    it('should have correct sortable fields', () => {
      expect(component.sortableFields).toHaveLength(2);
      expect(component.sortableFields[0].fieldName).toBe('state');
      expect(component.sortableFields[0].type).toBe('TEXT');
      expect(component.sortableFields[1].fieldName).toBe('createdAt');
      expect(component.sortableFields[1].type).toBe('NUMBER');
    });
  });

  // ---------------- TABLE LAZY LOAD ----------------
  describe('Table Lazy Load', () => {
    it('should update page and load research groups on table emit', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      const event: TableLazyLoadEvent = {
        first: 20,
        rows: 10,
      };

      component.loadOnTableEmit(event);

      expect(component.page()).toBe(2); // 20 / 10 = 2
      expect(component.pageSize()).toBe(10);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 2, [], '', 'state', 'DESC');
    });

    it('should handle undefined first and rows values with fallback to defaults', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      const event: TableLazyLoadEvent = {};

      component.loadOnTableEmit(event);

      expect(component.page()).toBe(0);
      expect(component.pageSize()).toBe(10);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, [], '', 'state', 'DESC');
    });

    it('should calculate page correctly with different page sizes', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      const event: TableLazyLoadEvent = {
        first: 50,
        rows: 25,
      };

      component.loadOnTableEmit(event);

      expect(component.page()).toBe(2); // 50 / 25 = 2
      expect(component.pageSize()).toBe(25);
    });
  });

  // ---------------- SEARCH ----------------
  describe('Search', () => {
    it('should update search query and reset page to 0', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.page.set(2);

      component.onSearchEmit('test query');

      expect(component.searchQuery()).toBe('test query');
      expect(component.page()).toBe(0);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, [], 'test query', 'state', 'DESC');
    });

    it('should not reload if search query is the same', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.searchQuery.set('existing');

      component.onSearchEmit('existing');

      expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
    });

    it('should reload if search query changes', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.searchQuery.set('old');

      component.onSearchEmit('new');

      expect(component.searchQuery()).toBe('new');
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalled();
    });
  });

  // ---------------- FILTERS ----------------
  describe('Filters', () => {
    it('should apply status filters and reset page to 0', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.page.set(2);

      const filterChange: FilterChange = {
        filterId: 'status',
        selectedValues: [`${I18N_BASE}.groupState.draft`, `${I18N_BASE}.groupState.active`],
      };

      component.onFilterEmit(filterChange);

      expect(component.page()).toBe(0);
      expect(component.selectedStatusFilters()).toEqual(['DRAFT', 'ACTIVE']);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, ['DRAFT', 'ACTIVE'], '', 'state', 'DESC');
    });

    it('should map translation keys to enum values correctly', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      const filterChange: FilterChange = {
        filterId: 'status',
        selectedValues: [`${I18N_BASE}.groupState.denied`],
      };

      component.onFilterEmit(filterChange);

      expect(component.selectedStatusFilters()).toEqual(['DENIED']);
    });

    it('should handle unknown filter values by keeping them as-is', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      const filterChange: FilterChange = {
        filterId: 'status',
        selectedValues: ['unknown.key'],
      };

      component.onFilterEmit(filterChange);

      expect(component.selectedStatusFilters()).toEqual(['unknown.key']);
    });

    it('should clear filters when empty array is provided', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.selectedStatusFilters.set(['DRAFT']);

      const filterChange: FilterChange = {
        filterId: 'status',
        selectedValues: [],
      };

      component.onFilterEmit(filterChange);

      expect(component.selectedStatusFilters()).toEqual([]);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, [], '', 'state', 'DESC');
    });

    it('should ignore filter changes for unknown filter IDs', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      const filterChange: FilterChange = {
        filterId: 'unknownFilter',
        selectedValues: ['value'],
      };

      component.onFilterEmit(filterChange);

      expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
    });
  });

  // ---------------- SORTING ----------------
  describe('Sorting', () => {
    it('should update sort field and direction and reset page to 0', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.page.set(2);

      const sort: Sort = {
        field: 'createdAt',
        direction: 'ASC',
      };

      component.loadOnSortEmit(sort);

      expect(component.page()).toBe(0);
      expect(component.sortBy()).toBe('createdAt');
      expect(component.sortDirection()).toBe('ASC');
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, [], '', 'createdAt', 'ASC');
    });

    it('should handle DESC sort direction', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      const sort: Sort = {
        field: 'state',
        direction: 'DESC',
      };

      component.loadOnSortEmit(sort);

      expect(component.sortDirection()).toBe('DESC');
    });
  });

  // ---------------- LOAD RESEARCH GROUPS ----------------
  describe('Load Research Groups', () => {
    it('should load research groups successfully', async () => {
      const mockData: PageResponseDTOResearchGroupAdminDTO = {
        content: [makeResearchGroup('1'), makeResearchGroup('2')],
        totalElements: 2,
      };
      mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockData));

      await component['loadResearchGroups']();

      expect(component.researchGroups()).toEqual(mockData.content);
      expect(component.totalRecords()).toBe(2);
    });

    it('should handle empty response', async () => {
      const emptyResponse: PageResponseDTOResearchGroupAdminDTO = {
        content: [],
        totalElements: 0,
      };
      mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(emptyResponse));

      await component['loadResearchGroups']();

      expect(component.researchGroups()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
    });

    it('should handle undefined content gracefully', async () => {
      const undefinedResponse: PageResponseDTOResearchGroupAdminDTO = {
        content: undefined,
        totalElements: undefined,
      };
      mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(undefinedResponse));

      await component['loadResearchGroups']();

      expect(component.researchGroups()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
    });

    it('should show error toast when loading fails', async () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(throwError(() => new Error('API Error')));

      await component['loadResearchGroups']();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith(`${I18N_BASE}.errors.loadResearchGroups`);
    });

    it('should pass all parameters correctly to service', async () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.pageSize.set(25);
      component.page.set(1);
      component.selectedStatusFilters.set(['DRAFT', 'ACTIVE']);
      component.searchQuery.set('search term');
      component.sortBy.set('createdAt');
      component.sortDirection.set('ASC');

      await component['loadResearchGroups']();

      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(
        25,
        1,
        ['DRAFT', 'ACTIVE'],
        'search term',
        'createdAt',
        'ASC',
      );
    });
  });

  // ---------------- APPROVE RESEARCH GROUP ----------------
  describe('Approve Research Group', () => {
    it('should approve research group and show success toast', async () => {
      mockResearchGroupService.activateResearchGroup.mockClear();
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      await component.onApproveResearchGroup('group-123');

      expect(mockResearchGroupService.activateResearchGroup).toHaveBeenCalledWith('group-123');
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith(`${I18N_BASE}.success.approve`);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalled();
    });

    it('should show error toast when approval fails', async () => {
      mockResearchGroupService.activateResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      await component.onApproveResearchGroup('group-123');

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith(`${I18N_BASE}.errors.approve`);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
    });

    it('should reload research groups after successful approval', async () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      await component.onApproveResearchGroup('group-123');

      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------- DENY RESEARCH GROUP ----------------
  describe('Deny Research Group', () => {
    it('should deny research group and show success toast', async () => {
      mockResearchGroupService.denyResearchGroup.mockClear();
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      await component.onDenyResearchGroup('group-456');

      expect(mockResearchGroupService.denyResearchGroup).toHaveBeenCalledWith('group-456');
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith(`${I18N_BASE}.success.deny`);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalled();
    });

    it('should show error toast when denial fails', async () => {
      mockResearchGroupService.denyResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      await component.onDenyResearchGroup('group-456');

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith(`${I18N_BASE}.errors.deny`);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
    });

    it('should reload research groups after successful denial', async () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      await component.onDenyResearchGroup('group-456');

      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------- WITHDRAW RESEARCH GROUP ----------------
  describe('Withdraw Research Group', () => {
    it('should withdraw research group and show success toast', async () => {
      mockResearchGroupService.withdrawResearchGroup.mockClear();
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      await component.onWithdrawResearchGroup('group-789');

      expect(mockResearchGroupService.withdrawResearchGroup).toHaveBeenCalledWith('group-789');
      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith(`${I18N_BASE}.success.withdraw`);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalled();
    });

    it('should show error toast when withdrawal fails', async () => {
      mockResearchGroupService.withdrawResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      await component.onWithdrawResearchGroup('group-789');

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith(`${I18N_BASE}.errors.withdraw`);
      expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
    });

    it('should reload research groups after successful withdrawal', async () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      await component.onWithdrawResearchGroup('group-789');

      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------- INTEGRATION TESTS ----------------
  describe('Integration Tests', () => {
    it('should handle complete workflow: search, filter, sort, and action', async () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      // Search
      component.onSearchEmit('AI');
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, [], 'AI', 'state', 'DESC');

      // Filter
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.onFilterEmit({
        filterId: 'status',
        selectedValues: [`${I18N_BASE}.groupState.draft`],
      });
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, ['DRAFT'], 'AI', 'state', 'DESC');

      // Sort
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.loadOnSortEmit({ field: 'createdAt', direction: 'ASC' });
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, ['DRAFT'], 'AI', 'createdAt', 'ASC');

      // Approve
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      await component.onApproveResearchGroup('group-1');
      expect(mockResearchGroupService.activateResearchGroup).toHaveBeenCalledWith('group-1');
      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, ['DRAFT'], 'AI', 'createdAt', 'ASC');
    });

    it('should maintain state across multiple filter changes', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();
      component.searchQuery.set('test');
      component.sortBy.set('createdAt');

      component.onFilterEmit({
        filterId: 'status',
        selectedValues: [`${I18N_BASE}.groupState.active`],
      });

      expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, ['ACTIVE'], 'test', 'createdAt', 'DESC');
    });

    it('should reset page when filters or search change but maintain other state', () => {
      component.page.set(5);
      component.sortBy.set('createdAt');
      component.sortDirection.set('ASC');

      component.onSearchEmit('new search');

      expect(component.page()).toBe(0);
      expect(component.sortBy()).toBe('createdAt');
      expect(component.sortDirection()).toBe('ASC');
    });
  });

  // ---------------- EDGE CASES ----------------
  describe('Edge Cases', () => {
    it('should handle empty research group ID gracefully', async () => {
      await component.onApproveResearchGroup('');
      expect(mockResearchGroupService.activateResearchGroup).toHaveBeenCalledWith('');
    });

    it('should handle multiple rapid filter changes', () => {
      mockResearchGroupService.getResearchGroupsForAdmin.mockClear();

      component.onFilterEmit({ filterId: 'status', selectedValues: [`${I18N_BASE}.groupState.draft`] });
      component.onFilterEmit({ filterId: 'status', selectedValues: [`${I18N_BASE}.groupState.active`] });
      component.onFilterEmit({ filterId: 'status', selectedValues: [`${I18N_BASE}.groupState.denied`] });

      expect(component.selectedStatusFilters()).toEqual(['DENIED']);
    });

    it('should handle page calculation with zero rows', () => {
      const event: TableLazyLoadEvent = {
        first: 10,
        rows: 0,
      };

      // This should not cause a division by zero error
      expect(() => component.loadOnTableEmit(event)).not.toThrow();
    });

    it('should handle negative page numbers gracefully', () => {
      const event: TableLazyLoadEvent = {
        first: -10,
        rows: 10,
      };

      component.loadOnTableEmit(event);

      expect(component.page()).toBe(-1); // Math.floor(-10 / 10)
    });
  });
});
