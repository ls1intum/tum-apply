import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateService } from '@ngx-translate/core';

import { ResearchGroupAdminView } from 'app/usermanagement/research-group/research-group-admin-view/research-group-admin-view.component';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupAdminDTO } from 'app/generated/model/researchGroupAdminDTO';
import { PageResponseDTOResearchGroupAdminDTO } from 'app/generated/model/pageResponseDTOResearchGroupAdminDTO';
import { createTranslateServiceMock, provideTranslateMock, TranslateServiceMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { Sort } from 'app/shared/components/atoms/sorting/sorting';
import { createDialogServiceMock, DialogServiceMock, provideDialogServiceMock } from 'util/dialog.service.mock';

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
  let mockDialogService: DialogServiceMock;
  let mockTranslateService: TranslateServiceMock;

  const mockResearchGroup1: ResearchGroupAdminDTO = {
    id: 'rg-1',
    professorName: 'Prof. Dr. Smith',
    status: ResearchGroupAdminDTO.StatusEnum.Draft,
    researchGroup: 'AI Research Lab',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const mockResearchGroup2: ResearchGroupAdminDTO = {
    id: 'rg-2',
    professorName: 'Prof. Dr. Jones',
    status: ResearchGroupAdminDTO.StatusEnum.Active,
    researchGroup: 'ML Research Lab',
    createdAt: '2024-01-02T00:00:00.000Z',
  };

  const mockResearchGroup3: ResearchGroupAdminDTO = {
    id: 'rg-3',
    professorName: 'Prof. Dr. Brown',
    status: ResearchGroupAdminDTO.StatusEnum.Denied,
    researchGroup: 'Data Science Lab',
    createdAt: '2024-01-03T00:00:00.000Z',
  };

  const mockPageResponse: PageResponseDTOResearchGroupAdminDTO = {
    content: [mockResearchGroup1, mockResearchGroup2, mockResearchGroup3],
    totalElements: 3,
  };

  beforeEach(async () => {
    mockResearchGroupService = {
      getResearchGroupsForAdmin: vi.fn(),
      activateResearchGroup: vi.fn(),
      denyResearchGroup: vi.fn(),
      withdrawResearchGroup: vi.fn(),
    };

    mockToastService = createToastServiceMock();

    mockDialogService = createDialogServiceMock();

    mockTranslateService = createTranslateServiceMock();

    await TestBed.configureTestingModule({
      imports: [ResearchGroupAdminView],
      providers: [
        { provide: ResearchGroupResourceApiService, useValue: mockResearchGroupService },
        provideDialogServiceMock(mockDialogService),
        provideTranslateMock(mockTranslateService),
        provideToastServiceMock(mockToastService),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResearchGroupAdminView);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.researchGroups()).toEqual([]);
    expect(component.totalRecords()).toBe(0);
    expect(component.page()).toBe(0);
    expect(component.pageSize()).toBe(10);
    expect(component.searchQuery()).toBe('');
    expect(component.sortBy()).toBe('state');
    expect(component.sortDirection()).toBe('DESC');
    expect(component.selectedStatusFilters()).toEqual([]);
  });

  it('should have correct columns configuration', () => {
    fixture.detectChanges();
    const columns = component.columns();

    expect(columns).toHaveLength(5);
    expect(columns[0].field).toBe('professorName');
    expect(columns[1].field).toBe('status');
    expect(columns[2].field).toBe('researchGroup');
    expect(columns[3].field).toBe('createdAt');
    expect(columns[4].field).toBe('actions');
  });

  it('should have correct status options', () => {
    expect(component.availableStatusOptions).toHaveLength(3);
    expect(component.availableStatusOptions).toEqual([
      { key: 'DRAFT', label: 'researchGroup.adminView.groupState.draft' },
      { key: 'ACTIVE', label: 'researchGroup.adminView.groupState.active' },
      { key: 'DENIED', label: 'researchGroup.adminView.groupState.denied' },
    ]);
  });

  it('should have correct state text map', () => {
    const stateTextMap = component.stateTextMap();
    expect(stateTextMap['DRAFT']).toBe('researchGroup.adminView.groupState.draft');
    expect(stateTextMap['ACTIVE']).toBe('researchGroup.adminView.groupState.active');
    expect(stateTextMap['DENIED']).toBe('researchGroup.adminView.groupState.denied');
  });

  it('should have correct state severity map', () => {
    const stateSeverityMap = component.stateSeverityMap();
    expect(stateSeverityMap['DRAFT']).toBe('contrast');
    expect(stateSeverityMap['ACTIVE']).toBe('success');
    expect(stateSeverityMap['DENIED']).toBe('danger');
  });

  it('should have correct sortable fields', () => {
    expect(component.sortableFields).toHaveLength(2);
    expect(component.sortableFields[0].fieldName).toBe('state');
    expect(component.sortableFields[1].fieldName).toBe('createdAt');
  });

  it('should load research groups on table emit', async () => {
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    const event: TableLazyLoadEvent = {
      first: 20,
      rows: 10,
    };

    component.loadOnTableEmit(event);
    await Promise.resolve();

    expect(component.page()).toBe(2);
    expect(component.pageSize()).toBe(10);
    expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 2, [], '', 'state', 'DESC');
  });

  it('should handle undefined first and rows in table emit', async () => {
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    const event: TableLazyLoadEvent = {};

    component.loadOnTableEmit(event);
    await Promise.resolve();

    expect(component.page()).toBe(0);
    expect(component.pageSize()).toBe(10);
  });

  it('should load research groups successfully', async () => {
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    component.loadOnTableEmit({ first: 0, rows: 10 });
    await Promise.resolve();

    expect(component.researchGroups()).toEqual(mockPageResponse.content);
    expect(component.totalRecords()).toBe(3);
  });

  it('should handle empty response when loading research groups', async () => {
    const emptyResponse: PageResponseDTOResearchGroupAdminDTO = {};
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(emptyResponse));

    component.loadOnTableEmit({ first: 0, rows: 10 });
    await Promise.resolve();

    expect(component.researchGroups()).toEqual([]);
    expect(component.totalRecords()).toBe(0);
  });

  it('should handle error when loading research groups fails', async () => {
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(throwError(() => new Error('API Error')));

    component.loadOnTableEmit({ first: 0, rows: 10 });
    await Promise.resolve();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.adminView.errors.loadResearchGroups');
  });

  it('should reset page and reload on search', async () => {
    component.page.set(2);
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    component.onSearchEmit('test query');
    await Promise.resolve();

    expect(component.page()).toBe(0);
    expect(component.searchQuery()).toBe('test query');
    expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, [], 'test query', 'state', 'DESC');
  });

  it('should not reload when search query is the same', async () => {
    component.searchQuery.set('same query');
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    component.onSearchEmit('same query');
    await Promise.resolve();

    expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
  });

  it('should handle status filter change', async () => {
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    const filterChange: FilterChange = {
      filterId: 'status',
      selectedValues: ['researchGroup.adminView.groupState.draft', 'researchGroup.adminView.groupState.active'],
    };

    component.onFilterEmit(filterChange);
    await Promise.resolve();

    expect(component.page()).toBe(0);
    expect(component.selectedStatusFilters()).toEqual(['DRAFT', 'ACTIVE']);
    expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, ['DRAFT', 'ACTIVE'], '', 'state', 'DESC');
  });

  it('should ignore unknown filter IDs', async () => {
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    const filterChange: FilterChange = {
      filterId: 'unknown',
      selectedValues: ['value1'],
    };

    component.onFilterEmit(filterChange);
    await Promise.resolve();

    expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
  });

  it('should handle sort change', async () => {
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    const sortEvent: Sort = {
      field: 'createdAt',
      direction: 'ASC',
    };

    component.loadOnSortEmit(sortEvent);
    await Promise.resolve();

    expect(component.page()).toBe(0);
    expect(component.sortBy()).toBe('createdAt');
    expect(component.sortDirection()).toBe('ASC');
    expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(10, 0, [], '', 'createdAt', 'ASC');
  });

  it('should open detail view dialog', () => {
    component.onViewResearchGroup('rg-123');

    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        header: 'researchGroup.detailView.title',
        data: { researchGroupId: 'rg-123' },
      }),
    );
    expect(mockTranslateService.instant).toHaveBeenCalledWith('researchGroup.detailView.title');
  });

  it('should open create dialog and reload on success', async () => {
    const mockDialogRef = {
      onClose: {
        subscribe: vi.fn((callback: (result: boolean) => void) => {
          callback(true);
        }),
      },
    } as unknown as DynamicDialogRef;

    mockDialogService.open.mockReturnValue(mockDialogRef);
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    component.onCreateResearchGroup();
    await Promise.resolve();

    expect(mockDialogService.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        header: 'researchGroup.adminView.createDialog.title',
        data: { mode: 'admin' },
      }),
    );
    expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalled();
  });

  it('should not reload when create dialog is cancelled', async () => {
    const mockDialogRef = {
      onClose: {
        subscribe: vi.fn((callback: (result: boolean) => void) => {
          callback(false);
        }),
      },
    } as unknown as DynamicDialogRef;

    mockDialogService.open.mockReturnValue(mockDialogRef);

    component.onCreateResearchGroup();
    await Promise.resolve();

    expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
  });

  it('should approve research group successfully', async () => {
    mockResearchGroupService.activateResearchGroup.mockReturnValue(of(void 0));
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    await component.onApproveResearchGroup('rg-1');

    expect(mockResearchGroupService.activateResearchGroup).toHaveBeenCalledWith('rg-1');
    expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.adminView.success.approve');
    expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalled();
  });

  it('should handle error when approving research group fails', async () => {
    mockResearchGroupService.activateResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

    await component.onApproveResearchGroup('rg-1');

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.adminView.errors.approve');
    expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
  });

  it('should deny research group successfully', async () => {
    mockResearchGroupService.denyResearchGroup.mockReturnValue(of(void 0));
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    await component.onDenyResearchGroup('rg-1');

    expect(mockResearchGroupService.denyResearchGroup).toHaveBeenCalledWith('rg-1');
    expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.adminView.success.deny');
    expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalled();
  });

  it('should handle error when denying research group fails', async () => {
    mockResearchGroupService.denyResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

    await component.onDenyResearchGroup('rg-1');

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.adminView.errors.deny');
    expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
  });

  it('should withdraw research group successfully', async () => {
    mockResearchGroupService.withdrawResearchGroup.mockReturnValue(of(void 0));
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    await component.onWithdrawResearchGroup('rg-2');

    expect(mockResearchGroupService.withdrawResearchGroup).toHaveBeenCalledWith('rg-2');
    expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('researchGroup.adminView.success.withdraw');
    expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalled();
  });

  it('should handle error when withdrawing research group fails', async () => {
    mockResearchGroupService.withdrawResearchGroup.mockReturnValue(throwError(() => new Error('API Error')));

    await component.onWithdrawResearchGroup('rg-2');

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('researchGroup.adminView.errors.withdraw');
    expect(mockResearchGroupService.getResearchGroupsForAdmin).not.toHaveBeenCalled();
  });

  it('should map translation keys to enum values correctly', async () => {
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    const filterChange: FilterChange = {
      filterId: 'status',
      selectedValues: ['researchGroup.adminView.groupState.draft', 'researchGroup.adminView.groupState.denied'],
    };

    component.onFilterEmit(filterChange);
    await Promise.resolve();

    expect(component.selectedStatusFilters()).toEqual(['DRAFT', 'DENIED']);
  });

  it('should handle unknown translation keys in filter mapping', async () => {
    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    const filterChange: FilterChange = {
      filterId: 'status',
      selectedValues: ['unknown.key'],
    };

    component.onFilterEmit(filterChange);
    await Promise.resolve();

    expect(component.selectedStatusFilters()).toEqual(['unknown.key'] as unknown as ('DRAFT' | 'ACTIVE' | 'DENIED')[]);
  });

  it('should have correct filter configuration', () => {
    expect(component.filters).toHaveLength(1);
    expect(component.filters[0].filterId).toBe('status');
    expect(component.filters[0].shouldTranslateOptions).toBe(true);
  });

  it('should pass all parameters to API when loading research groups', async () => {
    component.page.set(2);
    component.pageSize.set(25);
    component.searchQuery.set('test search');
    component.sortBy.set('createdAt');
    component.sortDirection.set('ASC');
    component.selectedStatusFilters.set(['DRAFT', 'ACTIVE']);

    mockResearchGroupService.getResearchGroupsForAdmin.mockReturnValue(of(mockPageResponse));

    component.loadOnTableEmit({ first: 50, rows: 25 });
    await Promise.resolve();

    expect(mockResearchGroupService.getResearchGroupsForAdmin).toHaveBeenCalledWith(
      25,
      2,
      ['DRAFT', 'ACTIVE'],
      'test search',
      'createdAt',
      'ASC',
    );
  });
});
