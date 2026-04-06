import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { AdminDependenciesComponent } from 'app/admin/dependencies/admin-dependencies.component';
import { AdminDependencyResourceApi } from 'app/generated/api/admin-dependency-resource-api';
import { DependenciesOverviewDTO } from 'app/generated/model/dependencies-overview-dto';
import { DependencyDTO } from 'app/generated/model/dependency-dto';
import { createTranslateServiceMock, provideTranslateMock, TranslateServiceMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { Sort } from 'app/shared/components/atoms/sorting/sorting';

describe('AdminDependenciesComponent', () => {
  let component: AdminDependenciesComponent;
  let fixture: ComponentFixture<AdminDependenciesComponent>;
  let mockDependencyApi: {
    getOverview: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let mockToastService: ToastServiceMock;
  let mockTranslateService: TranslateServiceMock;

  const vulnerableDep: DependencyDTO = {
    name: 'lodash',
    group: 'npm',
    version: '4.17.20',
    source: 'client',
    purl: 'pkg:npm/lodash@4.17.20',
    vulnerabilities: [
      { id: 'GHSA-001', summary: 'Prototype pollution', severity: 'CRITICAL' },
      { id: 'GHSA-002', summary: 'ReDoS vulnerability', severity: 'HIGH' },
    ],
  };

  const secureDep: DependencyDTO = {
    name: 'rxjs',
    group: 'npm',
    version: '7.8.1',
    source: 'client',
    purl: 'pkg:npm/rxjs@7.8.1',
    vulnerabilities: [],
  };

  const serverDep: DependencyDTO = {
    name: 'spring-boot-starter-web',
    group: 'org.springframework.boot',
    version: '3.2.0',
    source: 'server',
    purl: 'pkg:maven/org.springframework.boot/spring-boot-starter-web@3.2.0',
    vulnerabilities: [{ id: 'CVE-2024-001', summary: 'Remote code execution', severity: 'CRITICAL' }],
  };

  const mediumVulnDep: DependencyDTO = {
    name: 'jackson-databind',
    group: 'com.fasterxml.jackson.core',
    version: '2.15.0',
    source: 'server',
    purl: 'pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.15.0',
    vulnerabilities: [{ id: 'CVE-2024-002', summary: 'Deserialization flaw', severity: 'MEDIUM' }],
  };

  const mockOverview: DependenciesOverviewDTO = {
    dependencies: [vulnerableDep, secureDep, serverDep, mediumVulnDep],
    serverCount: 2,
    clientCount: 2,
    totalVulnerabilities: 4,
    criticalCount: 2,
    highCount: 1,
    mediumCount: 1,
    lowCount: 0,
  };

  const emptyOverview: DependenciesOverviewDTO = {
    dependencies: [],
    serverCount: 0,
    clientCount: 0,
    totalVulnerabilities: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
  };

  beforeEach(async () => {
    mockDependencyApi = {
      getOverview: vi.fn(),
      refresh: vi.fn(),
    };

    mockToastService = createToastServiceMock();
    mockTranslateService = createTranslateServiceMock();

    // Prevent constructor from triggering loadDependencies before test setup
    mockDependencyApi.getOverview.mockReturnValue(of(mockOverview));

    await TestBed.configureTestingModule({
      imports: [AdminDependenciesComponent],
      providers: [
        { provide: AdminDependencyResourceApi, useValue: mockDependencyApi },
        provideTranslateMock(mockTranslateService),
        provideToastServiceMock(mockToastService),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDependenciesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct default signal values', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.isRefreshing()).toBe(false);
    expect(component.currentPage()).toBe(0);
    expect(component.pageSize()).toBe(25);
    expect(component.searchQuery()).toBe('');
    expect(component.sortField()).toBe('security');
    expect(component.sortDirection()).toBe('DESC');
    expect(component.selectedSecurityFilter()).toEqual([]);
    expect(component.selectedSourceFilter()).toEqual([]);
  });

  describe('Loading Dependencies', () => {
    it('should call getOverview on construction and populate the overview signal', async () => {
      await Promise.resolve();

      expect(mockDependencyApi.getOverview).toHaveBeenCalled();
      expect(component.dependenciesOverview()).toEqual(mockOverview);
    });

    it('should set isLoading to false after successful load', async () => {
      await Promise.resolve();

      expect(component.isLoading()).toBe(false);
    });

    it('should show error toast when loading dependencies fails', async () => {
      mockDependencyApi.getOverview.mockReturnValue(throwError(() => new Error('Network error')));

      await component.loadDependencies();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('dependencies.toast.loadError');
      expect(component.isLoading()).toBe(false);
    });

    it('should set isLoading to false even when loading fails', async () => {
      mockDependencyApi.getOverview.mockReturnValue(throwError(() => new Error('Failure')));

      await component.loadDependencies();

      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Refreshing Vulnerabilities', () => {
    it('should call refresh API and update the overview', async () => {
      const refreshedOverview: DependenciesOverviewDTO = {
        ...mockOverview,
        totalVulnerabilities: 5,
      };
      mockDependencyApi.refresh.mockReturnValue(of(refreshedOverview));

      await component.refreshVulnerabilities();

      expect(mockDependencyApi.refresh).toHaveBeenCalled();
      expect(component.dependenciesOverview()).toEqual(refreshedOverview);
      expect(component.isRefreshing()).toBe(false);
    });

    it('should show success toast after successful refresh', async () => {
      mockDependencyApi.refresh.mockReturnValue(of(mockOverview));

      await component.refreshVulnerabilities();

      expect(mockToastService.showSuccessKey).toHaveBeenCalledWith('dependencies.toast.vulnerabilityRefreshSuccess');
    });

    it('should show error toast when refresh fails', async () => {
      mockDependencyApi.refresh.mockReturnValue(throwError(() => new Error('API error')));

      await component.refreshVulnerabilities();

      expect(mockToastService.showErrorKey).toHaveBeenCalledWith('dependencies.toast.vulnerabilityLoadError');
      expect(component.isRefreshing()).toBe(false);
    });
  });

  describe('Search Handling', () => {
    it('should update search query and reset to first page', () => {
      component.currentPage.set(3);

      component.onSearchChange('lodash');

      expect(component.searchQuery()).toBe('lodash');
      expect(component.currentPage()).toBe(0);
    });

    it('should filter dependencies by name when searching', async () => {
      await Promise.resolve();

      component.onSearchChange('lodash');
      const filtered = component.filteredDependencies();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('lodash');
    });

    it('should filter dependencies by group when searching', async () => {
      await Promise.resolve();

      component.onSearchChange('springframework');
      const filtered = component.filteredDependencies();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('spring-boot-starter-web');
    });

    it('should filter dependencies by version when searching', async () => {
      await Promise.resolve();

      component.onSearchChange('3.2.0');
      const filtered = component.filteredDependencies();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('spring-boot-starter-web');
    });

    it('should perform case-insensitive search', async () => {
      await Promise.resolve();

      component.onSearchChange('LODASH');
      const filtered = component.filteredDependencies();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('lodash');
    });

    it('should return all dependencies when search query is empty', async () => {
      await Promise.resolve();

      component.onSearchChange('');
      const filtered = component.filteredDependencies();

      expect(filtered).toHaveLength(4);
    });
  });

  describe('Source Filter', () => {
    it('should filter to show only server dependencies', async () => {
      await Promise.resolve();

      const filterChange: FilterChange = {
        filterId: 'source',
        selectedValues: ['dependencies.sourceServer'],
      };
      component.onFilterChange(filterChange);

      const filtered = component.filteredDependencies();
      expect(filtered.every(dep => dep.source === 'server')).toBe(true);
      expect(filtered).toHaveLength(2);
    });

    it('should filter to show only client dependencies', async () => {
      await Promise.resolve();

      const filterChange: FilterChange = {
        filterId: 'source',
        selectedValues: ['dependencies.sourceClient'],
      };
      component.onFilterChange(filterChange);

      const filtered = component.filteredDependencies();
      expect(filtered.every(dep => dep.source === 'client')).toBe(true);
      expect(filtered).toHaveLength(2);
    });

    it('should show all dependencies when both server and client are selected', async () => {
      await Promise.resolve();

      const filterChange: FilterChange = {
        filterId: 'source',
        selectedValues: ['dependencies.sourceServer', 'dependencies.sourceClient'],
      };
      component.onFilterChange(filterChange);

      expect(component.filteredDependencies()).toHaveLength(4);
    });

    it('should reset page to 0 when filter changes', () => {
      component.currentPage.set(5);

      const filterChange: FilterChange = {
        filterId: 'source',
        selectedValues: ['dependencies.sourceServer'],
      };
      component.onFilterChange(filterChange);

      expect(component.currentPage()).toBe(0);
    });
  });

  describe('Security Filter', () => {
    it('should filter to show only vulnerable dependencies', async () => {
      await Promise.resolve();

      const filterChange: FilterChange = {
        filterId: 'security',
        selectedValues: ['dependencies.showVulnerableOnly'],
      };
      component.onFilterChange(filterChange);

      const filtered = component.filteredDependencies();
      expect(filtered.every(dep => (dep.vulnerabilities?.length ?? 0) > 0)).toBe(true);
      expect(filtered).toHaveLength(3);
    });

    it('should filter to show only secure dependencies', async () => {
      await Promise.resolve();

      const filterChange: FilterChange = {
        filterId: 'security',
        selectedValues: ['dependencies.secure'],
      };
      component.onFilterChange(filterChange);

      const filtered = component.filteredDependencies();
      expect(filtered.every(dep => (dep.vulnerabilities?.length ?? 0) === 0)).toBe(true);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('rxjs');
    });

    it('should show all dependencies when both vulnerable and secure are selected', async () => {
      await Promise.resolve();

      const filterChange: FilterChange = {
        filterId: 'security',
        selectedValues: ['dependencies.showVulnerableOnly', 'dependencies.secure'],
      };
      component.onFilterChange(filterChange);

      expect(component.filteredDependencies()).toHaveLength(4);
    });
  });

  describe('Sort Handling', () => {
    it('should update sort field and direction', () => {
      const sort: Sort = { field: 'name', direction: 'ASC' };

      component.onSortChange(sort);

      expect(component.sortField()).toBe('name');
      expect(component.sortDirection()).toBe('ASC');
    });

    it('should reset page to 0 on sort change', () => {
      component.currentPage.set(3);

      component.onSortChange({ field: 'name', direction: 'ASC' });

      expect(component.currentPage()).toBe(0);
    });

    it('should sort dependencies by name ascending', async () => {
      await Promise.resolve();

      component.onSortChange({ field: 'name', direction: 'ASC' });
      const sorted = component.filteredDependencies();

      expect(sorted[0].name).toBe('jackson-databind');
      expect(sorted[1].name).toBe('lodash');
      expect(sorted[2].name).toBe('rxjs');
      expect(sorted[3].name).toBe('spring-boot-starter-web');
    });

    it('should sort dependencies by name descending', async () => {
      await Promise.resolve();

      component.onSortChange({ field: 'name', direction: 'DESC' });
      const sorted = component.filteredDependencies();

      expect(sorted[0].name).toBe('spring-boot-starter-web');
      expect(sorted[3].name).toBe('jackson-databind');
    });

    it('should sort dependencies by security (vulnerability count) ascending', async () => {
      await Promise.resolve();

      component.onSortChange({ field: 'security', direction: 'ASC' });
      const sorted = component.filteredDependencies();

      expect(sorted[0].vulnerabilities?.length ?? 0).toBeLessThanOrEqual(sorted[1].vulnerabilities?.length ?? 0);
    });

    it('should sort by security descending by default', async () => {
      await Promise.resolve();

      const sorted = component.filteredDependencies();

      expect(sorted[0].vulnerabilities?.length ?? 0).toBeGreaterThanOrEqual(sorted[1].vulnerabilities?.length ?? 0);
    });
  });

  describe('Pagination', () => {
    it('should update page and pageSize on page change event', () => {
      const event: TableLazyLoadEvent = { first: 50, rows: 25 };

      component.onPageChange(event);

      expect(component.currentPage()).toBe(2);
      expect(component.pageSize()).toBe(25);
    });

    it('should handle undefined first and rows with defaults', () => {
      const event: TableLazyLoadEvent = {};

      component.onPageChange(event);

      expect(component.currentPage()).toBe(0);
      expect(component.pageSize()).toBe(25);
    });

    it('should paginate the filtered dependencies', async () => {
      await Promise.resolve();

      component.pageSize.set(2);
      component.currentPage.set(0);
      component.onSortChange({ field: 'name', direction: 'ASC' });

      const page = component.paginatedDependencies();
      expect(page).toHaveLength(2);
      expect(page[0].name).toBe('jackson-databind');
      expect(page[1].name).toBe('lodash');
    });

    it('should return correct page count via filteredDependencyCount', async () => {
      await Promise.resolve();

      expect(component.filteredDependencyCount()).toBe(4);
    });
  });

  describe('Paginated Dependencies Enrichment', () => {
    it('should enrich paginated dependencies with highest severity', async () => {
      await Promise.resolve();

      component.onSortChange({ field: 'name', direction: 'ASC' });
      const paginated = component.paginatedDependencies();

      const lodash = paginated.find(d => d.name === 'lodash');
      expect(lodash).toBeDefined();
      expect(lodash!.highestSeverity).toBe('CRITICAL');
    });

    it('should map CRITICAL severity to danger tag color', async () => {
      await Promise.resolve();

      component.onSortChange({ field: 'name', direction: 'ASC' });
      const paginated = component.paginatedDependencies();

      const lodash = paginated.find(d => d.name === 'lodash');
      expect(lodash!.severityTagColor).toBe('danger');
    });

    it('should map MEDIUM severity to warn tag color', async () => {
      await Promise.resolve();

      component.onSortChange({ field: 'name', direction: 'ASC' });
      const paginated = component.paginatedDependencies();

      const jackson = paginated.find(d => d.name === 'jackson-databind');
      expect(jackson!.severityTagColor).toBe('warn');
    });

    it('should map secure dependency to secondary tag color', async () => {
      await Promise.resolve();

      component.onSortChange({ field: 'name', direction: 'ASC' });
      const paginated = component.paginatedDependencies();

      const rxjs = paginated.find(d => d.name === 'rxjs');
      expect(rxjs!.severityTagColor).toBe('secondary');
    });
  });

  describe('Vulnerability Expansion Toggle', () => {
    it('should expand vulnerability list for a dependency', () => {
      component.toggleVulnerabilityExpansion(vulnerableDep);

      expect(component.isVulnerabilityExpanded(vulnerableDep)).toBe(true);
    });

    it('should collapse vulnerability list on second toggle', () => {
      component.toggleVulnerabilityExpansion(vulnerableDep);
      component.toggleVulnerabilityExpansion(vulnerableDep);

      expect(component.isVulnerabilityExpanded(vulnerableDep)).toBe(false);
    });

    it('should track expansion by group:name key', () => {
      component.toggleVulnerabilityExpansion(vulnerableDep);

      // A different dependency with the same group:name should also be considered expanded
      const sameDep: DependencyDTO = { ...vulnerableDep, version: '4.17.21' };
      expect(component.isVulnerabilityExpanded(sameDep)).toBe(true);
    });

    it('should independently track expansion for different dependencies', () => {
      component.toggleVulnerabilityExpansion(vulnerableDep);

      expect(component.isVulnerabilityExpanded(vulnerableDep)).toBe(true);
      expect(component.isVulnerabilityExpanded(secureDep)).toBe(false);
    });
  });

  describe('Columns Configuration', () => {
    it('should define five columns with correct fields', async () => {
      fixture.detectChanges();
      const columns = component.columns();

      expect(columns).toHaveLength(5);
      expect(columns[0].field).toBe('name');
      expect(columns[1].field).toBe('group');
      expect(columns[2].field).toBe('version');
      expect(columns[3].field).toBe('security');
      expect(columns[4].field).toBe('source');
    });

    it('should have correct translation keys for column headers', async () => {
      fixture.detectChanges();
      const columns = component.columns();

      expect(columns[0].header).toBe('dependencies.column.name');
      expect(columns[1].header).toBe('dependencies.column.group');
      expect(columns[2].header).toBe('dependencies.column.version');
      expect(columns[3].header).toBe('dependencies.column.security');
      expect(columns[4].header).toBe('dependencies.column.source');
    });

    it('should have correct column widths', async () => {
      fixture.detectChanges();
      const columns = component.columns();

      expect(columns[0].width).toBe('14rem');
      expect(columns[1].width).toBe('14rem');
      expect(columns[2].width).toBe('8rem');
      expect(columns[3].width).toBe('14rem');
      expect(columns[4].width).toBe('8rem');
    });
  });

  describe('Sortable Fields Configuration', () => {
    it('should have four sortable fields', () => {
      expect(component.sortableFields).toHaveLength(4);
    });

    it('should have correct sortable field names', () => {
      expect(component.sortableFields[0].fieldName).toBe('security');
      expect(component.sortableFields[1].fieldName).toBe('name');
      expect(component.sortableFields[2].fieldName).toBe('group');
      expect(component.sortableFields[3].fieldName).toBe('version');
    });

    it('should have correct translation keys for sortable field display names', () => {
      expect(component.sortableFields[0].displayName).toBe('dependencies.column.security');
      expect(component.sortableFields[1].displayName).toBe('dependencies.column.name');
      expect(component.sortableFields[2].displayName).toBe('dependencies.column.group');
      expect(component.sortableFields[3].displayName).toBe('dependencies.column.version');
    });

    it('should have correct sort types', () => {
      expect(component.sortableFields[0].type).toBe('NUMBER');
      expect(component.sortableFields[1].type).toBe('TEXT');
      expect(component.sortableFields[2].type).toBe('TEXT');
      expect(component.sortableFields[3].type).toBe('TEXT');
    });
  });

  describe('Filters Configuration', () => {
    it('should include security filter when vulnerabilities exist', async () => {
      await Promise.resolve();

      const filters = component.filters();
      const securityFilter = filters.find(f => f.filterId === 'security');

      expect(securityFilter).toBeDefined();
      expect(securityFilter!.filterOptions).toEqual(['dependencies.showVulnerableOnly', 'dependencies.secure']);
    });

    it('should not include security filter when no vulnerabilities exist', async () => {
      mockDependencyApi.getOverview.mockReturnValue(of(emptyOverview));
      await component.loadDependencies();

      const filters = component.filters();
      const securityFilter = filters.find(f => f.filterId === 'security');

      expect(securityFilter).toBeUndefined();
    });

    it('should always include source filter', async () => {
      await Promise.resolve();

      const filters = component.filters();
      const sourceFilter = filters.find(f => f.filterId === 'source');

      expect(sourceFilter).toBeDefined();
      expect(sourceFilter!.filterOptions).toEqual(['dependencies.sourceServer', 'dependencies.sourceClient']);
    });
  });

  describe('Download Dependencies', () => {
    it('should not throw when overview is undefined', () => {
      component.dependenciesOverview.set(undefined);

      expect(() => component.downloadDependencies()).not.toThrow();
    });

    it('should create a download when overview is available', async () => {
      await Promise.resolve();

      const createElementSpy = vi.spyOn(document, 'createElement');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      component.downloadDependencies();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('Combined Filter and Search Interactions', () => {
    it('should apply source filter and search together', async () => {
      await Promise.resolve();

      component.onFilterChange({ filterId: 'source', selectedValues: ['dependencies.sourceServer'] });
      component.onSearchChange('jackson');

      const filtered = component.filteredDependencies();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('jackson-databind');
      expect(filtered[0].source).toBe('server');
    });

    it('should apply security filter and source filter together', async () => {
      await Promise.resolve();

      component.onFilterChange({ filterId: 'source', selectedValues: ['dependencies.sourceClient'] });
      component.onFilterChange({ filterId: 'security', selectedValues: ['dependencies.secure'] });

      const filtered = component.filteredDependencies();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('rxjs');
    });

    it('should return empty list when no dependencies match combined filters', async () => {
      await Promise.resolve();

      component.onFilterChange({ filterId: 'source', selectedValues: ['dependencies.sourceServer'] });
      component.onFilterChange({ filterId: 'security', selectedValues: ['dependencies.secure'] });

      const filtered = component.filteredDependencies();
      expect(filtered).toHaveLength(0);
    });
  });
});
