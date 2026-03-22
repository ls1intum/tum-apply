import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationTriangle, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { TranslateDirective } from 'app/shared/language';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { InfoBoxComponent } from 'app/shared/components/atoms/info-box/info-box.component';
import { TagComponent } from 'app/shared/components/atoms/tag/tag.component';
import { ProgressSpinnerComponent } from 'app/shared/components/atoms/progress-spinner/progress-spinner.component';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { Filter, FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { TabItem, TabPanelTemplateDirective, TabViewComponent } from 'app/shared/components/molecules/tab-view/tab-view.component';
import { AdminDependencyResourceApiService } from 'app/generated/api/adminDependencyResourceApi.service';
import { DependenciesOverviewDTO } from 'app/generated/model/dependenciesOverviewDTO';
import { DependencyDTO } from 'app/generated/model/dependencyDTO';
import { VulnerabilityDTO } from 'app/generated/model/vulnerabilityDTO';

/**
 * Admin page component for displaying the project's software dependencies
 * and their known security vulnerabilities.
 *
 * Shows server-side (Java/Gradle) and client-side (npm) dependencies in a
 * filterable, sortable, paginated table with vulnerability severity indicators.
 * Data is fetched from the backend, which queries OSV.dev for vulnerability information.
 */
@Component({
  selector: 'jhi-admin-dependencies',
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    TranslateDirective,
    TranslateModule,
    ButtonComponent,
    InfoBoxComponent,
    TagComponent,
    ProgressSpinnerComponent,
    DynamicTableComponent,
    SearchFilterSortBar,
    TabViewComponent,
    TabPanelTemplateDirective,
  ],
  templateUrl: './admin-dependencies.component.html',
})
export class AdminDependenciesComponent {
  /** Whether the initial dependency data is being loaded. */
  readonly isLoading = signal(false);

  /** Whether a manual vulnerability refresh is in progress. */
  readonly isRefreshing = signal(false);

  /** The full dependencies overview response from the backend. */
  readonly dependenciesOverview = signal<DependenciesOverviewDTO | undefined>(undefined);

  /** Current zero-based page index for table pagination. */
  readonly currentPage = signal(0);

  /** Number of rows displayed per table page. */
  readonly pageSize = signal(25);

  /** Current search query text entered in the search bar. */
  readonly searchQuery = signal('');

  /** Currently selected values in the security filter dropdown. */
  readonly selectedSecurityFilter = signal<string[]>([]);

  /** Field name used for sorting the dependency table. */
  readonly sortField = signal('security');

  /** Sort direction for the dependency table. */
  readonly sortDirection = signal<'ASC' | 'DESC'>('DESC');

  /** Currently active source tab (all, server, or client). */
  readonly activeSourceTab = signal('all');

  /** Template reference for the custom version column rendering. */
  readonly versionColumnTemplate = viewChild<TemplateRef<unknown>>('versionTemplate');

  /** Template reference for the custom security column rendering. */
  readonly securityColumnTemplate = viewChild<TemplateRef<unknown>>('securityTemplate');

  /** Template reference for the custom source column rendering. */
  readonly sourceColumnTemplate = viewChild<TemplateRef<unknown>>('sourceTemplate');

  /** Tab definitions for filtering dependencies by source (all, server, client). */
  readonly sourceTabs: TabItem[] = [
    { id: 'all', translationKey: 'dependencies.sourceAll' },
    { id: 'server', translationKey: 'dependencies.sourceServer', icon: ['fas', 'server'] },
    { id: 'client', translationKey: 'dependencies.sourceClient', icon: ['fas', 'desktop'] },
  ];

  /** Available sort options shown in the search-filter-sort bar dropdown. */
  readonly sortableFields: SortOption[] = [
    { displayName: 'dependencies.componentSecurity', fieldName: 'security', type: 'NUMBER' },
    { displayName: 'dependencies.componentName', fieldName: 'name', type: 'TEXT' },
    { displayName: 'dependencies.componentGroup', fieldName: 'group', type: 'TEXT' },
    { displayName: 'dependencies.componentVersion', fieldName: 'version', type: 'TEXT' },
  ];

  /**
   * Computed filter definitions for the search-filter-sort bar.
   * Only shows the security filter when vulnerabilities exist.
   */
  readonly securityFilters = computed<Filter[]>(() => {
    const overview = this.dependenciesOverview();
    if (overview?.totalVulnerabilities == null || overview.totalVulnerabilities === 0) return [];
    return [
      {
        filterId: 'security',
        filterLabel: 'dependencies.componentSecurity',
        filterSearchPlaceholder: 'dependencies.filterPlaceholder',
        filterOptions: ['Vulnerable', 'Secure'],
        shouldTranslateOptions: false,
      },
    ];
  });

  /**
   * Computed list of all dependencies after applying source tab, security filter,
   * search query, and sort order. This is the full filtered dataset before pagination.
   */
  readonly filteredDependencies = computed(() => {
    const overview = this.dependenciesOverview();
    if (!overview?.dependencies) return [];

    let dependencies = overview.dependencies;

    const sourceTab = this.activeSourceTab();
    if (sourceTab !== 'all') {
      dependencies = dependencies.filter(dep => dep.source === sourceTab);
    }

    const securityFilterValues = this.selectedSecurityFilter();
    if (securityFilterValues.length) {
      const showVulnerable = securityFilterValues.includes('Vulnerable');
      const showSecure = securityFilterValues.includes('Secure');
      if (showVulnerable && !showSecure) {
        dependencies = dependencies.filter(dep => (dep.vulnerabilities?.length ?? 0) > 0);
      } else if (showSecure && !showVulnerable) {
        dependencies = dependencies.filter(dep => (dep.vulnerabilities?.length ?? 0) === 0);
      }
    }

    const searchTerm = this.searchQuery().toLowerCase();
    if (searchTerm) {
      dependencies = dependencies.filter(
        dep =>
          (dep.name?.toLowerCase().includes(searchTerm) ?? false) ||
          (dep.group?.toLowerCase().includes(searchTerm) ?? false) ||
          (dep.version?.toLowerCase().includes(searchTerm) ?? false),
      );
    }

    const field = this.sortField();
    const sortMultiplier = this.sortDirection() === 'ASC' ? 1 : -1;
    const sorted = dependencies.slice();
    if (field === 'security') {
      sorted.sort((a, b) => ((a.vulnerabilities?.length ?? 0) - (b.vulnerabilities?.length ?? 0)) * sortMultiplier);
    } else {
      sorted.sort((a, b) => {
        const aVal = this.getDependencySortValue(a, field);
        const bVal = this.getDependencySortValue(b, field);
        return aVal.localeCompare(bVal) * sortMultiplier;
      });
    }
    return sorted;
  });

  /** Total number of dependencies after filtering, used for pagination. */
  readonly filteredDependencyCount = computed(() => this.filteredDependencies().length);

  /**
   * Computed page slice of filtered dependencies, enriched with pre-computed
   * severity level and tag color to avoid method calls in the template.
   */
  readonly paginatedDependencies = computed(() => {
    const allDependencies = this.filteredDependencies();
    const startIndex = this.currentPage() * this.pageSize();
    return allDependencies.slice(startIndex, startIndex + this.pageSize()).map(dep => {
      const severity = this.computeHighestSeverity(dep.vulnerabilities ?? []);
      return Object.assign({}, dep, {
        highestSeverity: severity,
        severityTagColor: this.computeSeverityTagColor(severity),
      });
    });
  });

  /** Column definitions for the dynamic table, with custom templates assigned when available. */
  readonly columns = computed<DynamicTableColumn[]>(() => {
    const cols: DynamicTableColumn[] = [
      { field: 'name', header: 'dependencies.componentName', width: '14rem' },
      { field: 'group', header: 'dependencies.componentGroup', width: '14rem' },
      { field: 'version', header: 'dependencies.componentVersion', width: '8rem' },
      { field: 'security', header: 'dependencies.componentSecurity', width: '14rem' },
      { field: 'source', header: 'dependencies.componentSource', width: '8rem' },
    ];
    const versionTemplate = this.versionColumnTemplate();
    const securityTemplate = this.securityColumnTemplate();
    const sourceTemplate = this.sourceColumnTemplate();
    if (versionTemplate) cols[2].template = versionTemplate;
    if (securityTemplate) cols[3].template = securityTemplate;
    if (sourceTemplate) cols[4].template = sourceTemplate;
    return cols;
  });

  /** Icon used for secure status badges in the security column. */
  protected readonly faShieldAlt = faShieldAlt;

  /** Icon used for vulnerability warning badges in the security column. */
  protected readonly faExclamationTriangle = faExclamationTriangle;

  private readonly dependencyService = inject(AdminDependencyResourceApiService);

  /** Loads the dependencies overview on component initialization. */
  constructor() {
    void this.loadDependencies();
  }

  /**
   * Fetches the dependencies overview from the backend using the cached endpoint.
   * Sets the loading state while the request is in progress and updates
   * the dependenciesOverview signal with the response.
   */
  async loadDependencies(): Promise<void> {
    this.isLoading.set(true);
    try {
      const overview = await firstValueFrom(this.dependencyService.getOverview());
      this.dependenciesOverview.set(overview);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Triggers a forced refresh of vulnerability data, bypassing the backend cache.
   * Sets the refreshing state while the request is in progress and updates
   * the dependenciesOverview signal with the fresh response.
   */
  async refreshVulnerabilities(): Promise<void> {
    this.isRefreshing.set(true);
    try {
      const overview = await firstValueFrom(this.dependencyService.refresh());
      this.dependenciesOverview.set(overview);
    } finally {
      this.isRefreshing.set(false);
    }
  }

  /**
   * Handles source tab changes and resets pagination to the first page.
   *
   * @param tabId the selected tab identifier ('all', 'server', or 'client')
   */
  onTabChange(tabId: string): void {
    this.activeSourceTab.set(tabId);
    this.currentPage.set(0);
  }

  /**
   * Handles search input changes and resets pagination to the first page.
   *
   * @param query the search text entered by the user
   */
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(0);
  }

  /**
   * Handles security filter changes and resets pagination to the first page.
   * Only processes changes for the 'security' filter, ignoring other filter IDs.
   *
   * @param change the filter change event containing the filter ID and selected values
   */
  onFilterChange(change: FilterChange): void {
    if (change.filterId === 'security') {
      this.selectedSecurityFilter.set(change.selectedValues);
      this.currentPage.set(0);
    }
  }

  /**
   * Handles sort option changes and resets pagination to the first page.
   *
   * @param sort the sort event containing the field name and direction
   */
  onSortChange(sort: Sort): void {
    this.sortField.set(sort.field);
    this.sortDirection.set(sort.direction);
    this.currentPage.set(0);
  }

  /**
   * Handles table pagination events emitted by the dynamic table.
   * Updates the current page and page size based on the lazy load event.
   *
   * @param event the PrimeNG table lazy load event containing first row index and row count
   */
  onPageChange(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 25;
    this.currentPage.set(first / rows);
    this.pageSize.set(rows);
  }

  /**
   * Downloads all dependencies as a formatted JSON file.
   * Creates a temporary blob URL and triggers a browser download
   * with the filename 'tumapply-dependencies.json'.
   */
  downloadDependencies(): void {
    const overview = this.dependenciesOverview();
    if (!overview) return;
    const blob = new Blob([JSON.stringify(overview.dependencies, undefined, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'tumapply-dependencies.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Determines the highest severity level from a list of vulnerabilities.
   * Checks in priority order: CRITICAL, HIGH, MEDIUM, LOW.
   *
   * @param vulns the list of vulnerabilities to evaluate
   * @returns the highest severity string found, or 'LOW' if none match
   */
  private computeHighestSeverity(vulns: VulnerabilityDTO[]): string {
    for (const sev of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      if (vulns.some(v => v.severity === sev)) return sev;
    }
    return 'LOW';
  }

  /**
   * Maps a severity level string to a jhi-tag color prop value.
   * CRITICAL maps to 'danger' (red), HIGH/MEDIUM to 'warn' (yellow),
   * and LOW or unknown severities to 'secondary' (neutral).
   *
   * @param severity the severity level string (e.g. 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW')
   * @returns the jhi-tag color value to use for rendering
   */
  private computeSeverityTagColor(severity: string): 'danger' | 'warn' | 'secondary' {
    switch (severity) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
      case 'MEDIUM':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  /**
   * Resolves the sortable string value from a dependency for the given field name.
   * Used by the sort comparator to safely access optional DTO fields.
   *
   * @param dep the dependency to read the field from
   * @param field the sort field name (e.g. 'name', 'group', 'version', 'source')
   * @returns the field value as a string, or an empty string if the field is not found
   */
  private getDependencySortValue(dep: DependencyDTO, field: string): string {
    switch (field) {
      case 'name':
        return dep.name ?? '';
      case 'group':
        return dep.group ?? '';
      case 'version':
        return dep.version ?? '';
      case 'source':
        return dep.source ?? '';
      default:
        return '';
    }
  }
}
