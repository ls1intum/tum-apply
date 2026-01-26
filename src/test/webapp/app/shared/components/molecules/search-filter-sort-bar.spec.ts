import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { Filter, FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('SearchFilterSortBar', () => {
  const mockFilters: Filter[] = [
    {
      filterId: 'status-filter',
      filterLabel: 'Status',
      filterSearchPlaceholder: 'Search status...',
      filterOptions: ['Active', 'Inactive', 'Pending'],
    },
    {
      filterId: 'category-filter',
      filterLabel: 'Category',
      filterSearchPlaceholder: 'Search category...',
      filterOptions: ['Category A', 'Category B'],
      shouldTranslateOptions: true,
    },
  ];

  const mockSortOptions: SortOption[] = [
    { displayName: 'Name', fieldName: 'name', type: 'TEXT' },
    { displayName: 'Date', fieldName: 'date', type: 'TEXT' },
  ];

  function createSearchFilterSortBarFixture(
    overrideInputs?: Partial<{
      totalRecords: number;
      searchText: string;
      filters: Filter[];
      sortableFields: SortOption[];
      singleEntity: string;
      multipleEntities: string;
    }>,
  ) {
    const fixture = TestBed.createComponent(SearchFilterSortBar);

    fixture.componentRef.setInput('singleEntity', overrideInputs?.singleEntity ?? 'item');
    fixture.componentRef.setInput('multipleEntities', overrideInputs?.multipleEntities ?? 'items');

    fixture.componentRef.setInput('totalRecords', overrideInputs?.totalRecords ?? 0);
    fixture.componentRef.setInput('searchText', overrideInputs?.searchText ?? undefined);
    fixture.componentRef.setInput('filters', overrideInputs?.filters ?? []);
    fixture.componentRef.setInput('sortableFields', overrideInputs?.sortableFields ?? undefined);

    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [SearchFilterSortBar],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const fixture = createSearchFilterSortBarFixture();

    expect(fixture.componentInstance.inputText).toBe('');
    expect(fixture.componentInstance.totalRecords()).toBe(0);
    expect(fixture.componentInstance.filters()).toEqual([]);
  });

  it('should emit search output with debounce', () => {
    const fixture = createSearchFilterSortBarFixture();
    const searchOutputSpy = vi.spyOn(fixture.componentInstance.searchOutput, 'emit');

    fixture.componentInstance.inputText = 'test search';
    fixture.componentInstance.onSearch();

    expect(searchOutputSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(searchOutputSpy).toHaveBeenCalledWith('test search');
  });

  it('should clear previous debounce timeout on new search', () => {
    const fixture = createSearchFilterSortBarFixture();
    const searchOutputSpy = vi.spyOn(fixture.componentInstance.searchOutput, 'emit');

    fixture.componentInstance.inputText = 'first search';
    fixture.componentInstance.onSearch();

    vi.advanceTimersByTime(100);
    fixture.componentInstance.inputText = 'second search';
    fixture.componentInstance.onSearch();

    vi.advanceTimersByTime(300);

    expect(searchOutputSpy).toHaveBeenCalledTimes(1);
    expect(searchOutputSpy).toHaveBeenCalledWith('second search');
  });

  it('should emit multiple searches with proper debouncing', () => {
    const fixture = createSearchFilterSortBarFixture();
    const searchOutputSpy = vi.spyOn(fixture.componentInstance.searchOutput, 'emit');

    fixture.componentInstance.inputText = 'first';
    fixture.componentInstance.onSearch();
    vi.advanceTimersByTime(300);

    fixture.componentInstance.inputText = 'second';
    fixture.componentInstance.onSearch();
    vi.advanceTimersByTime(300);

    expect(searchOutputSpy).toHaveBeenCalledTimes(2);
    expect(searchOutputSpy).toHaveBeenNthCalledWith(1, 'first');
    expect(searchOutputSpy).toHaveBeenNthCalledWith(2, 'second');
  });

  it('should emit filter change', () => {
    const fixture = createSearchFilterSortBarFixture({
      filters: mockFilters,
    });
    const filterOutputSpy = vi.spyOn(fixture.componentInstance.filterOutput, 'emit');

    const filterChange: FilterChange = {
      filterId: 'status-filter',
      selectedValues: ['Active', 'Pending'],
    };

    fixture.componentInstance.onFilterChange(filterChange);

    expect(filterOutputSpy).toHaveBeenCalledWith(filterChange);
  });

  it('should emit sort change', () => {
    const fixture = createSearchFilterSortBarFixture({
      sortableFields: mockSortOptions,
    });
    const sortOutputSpy = vi.spyOn(fixture.componentInstance.sortOutput, 'emit');

    const sortChange: Sort = {
      field: 'name',
      direction: 'ASC',
    };

    fixture.componentInstance.onSortChange(sortChange);

    expect(sortOutputSpy).toHaveBeenCalledWith(sortChange);
  });

  it('should display filters when provided', () => {
    const fixture = createSearchFilterSortBarFixture({
      filters: mockFilters,
    });

    expect(fixture.componentInstance.filters()).toEqual(mockFilters);
    expect(fixture.componentInstance.filters().length).toBe(2);
  });

  it('should display sort options when provided', () => {
    const fixture = createSearchFilterSortBarFixture({
      sortableFields: mockSortOptions,
    });

    expect(fixture.componentInstance.sortableFields()).toEqual(mockSortOptions);
  });

  it('should handle empty filters array', () => {
    const fixture = createSearchFilterSortBarFixture({
      filters: [],
    });

    expect(fixture.componentInstance.filters()).toEqual([]);
  });

  it('should handle undefined sortable fields', () => {
    const fixture = createSearchFilterSortBarFixture({
      sortableFields: undefined,
    });

    expect(fixture.componentInstance.sortableFields()).toBeUndefined();
  });

  it('should display correct total records', () => {
    const fixture = createSearchFilterSortBarFixture({
      totalRecords: 42,
    });

    expect(fixture.componentInstance.totalRecords()).toBe(42);
  });

  it('should use single entity for count of 1', () => {
    const fixture = createSearchFilterSortBarFixture({
      totalRecords: 1,
      singleEntity: 'job',
      multipleEntities: 'jobs',
    });

    expect(fixture.componentInstance.totalRecords()).toBe(1);
    expect(fixture.componentInstance.singleEntity()).toBe('job');
  });

  it('should use multiple entities for count more than 1', () => {
    const fixture = createSearchFilterSortBarFixture({
      totalRecords: 5,
      singleEntity: 'job',
      multipleEntities: 'jobs',
    });

    expect(fixture.componentInstance.totalRecords()).toBe(5);
    expect(fixture.componentInstance.multipleEntities()).toBe('jobs');
  });

  it('should handle search text placeholder', () => {
    const fixture = createSearchFilterSortBarFixture({
      searchText: 'Enter search term...',
    });

    expect(fixture.componentInstance.searchText()).toBe('Enter search term...');
  });

  describe('DOM rendering', () => {
    it('should render search input element', () => {
      const fixture = createSearchFilterSortBarFixture({
        searchText: 'Search items...',
      });

      const searchInput = fixture.nativeElement.querySelector('input[type="text"]');
      expect(searchInput).toBeTruthy();
      expect(searchInput.placeholder).toBe('Search items...');
    });

    it('should render search icon', () => {
      const fixture = createSearchFilterSortBarFixture();

      const icon = fixture.nativeElement.querySelector('fa-icon');
      expect(icon).toBeTruthy();
    });

    it('should render filter components when filters are provided', () => {
      const fixture = createSearchFilterSortBarFixture({
        filters: mockFilters,
      });

      const filterComponents = fixture.nativeElement.querySelectorAll('jhi-filter-multiselect');
      expect(filterComponents.length).toBe(2);
    });

    it('should not render filter components when filters array is empty', () => {
      const fixture = createSearchFilterSortBarFixture({
        filters: [],
      });

      const filterComponents = fixture.nativeElement.querySelectorAll('jhi-filter-multiselect');
      expect(filterComponents.length).toBe(0);
    });

    it('should render sorting component when sortable fields are provided', () => {
      const fixture = createSearchFilterSortBarFixture({
        sortableFields: mockSortOptions,
      });

      const sortingComponent = fixture.nativeElement.querySelector('jhi-sorting');
      expect(sortingComponent).toBeTruthy();
    });

    it('should not render sorting component when sortable fields are undefined', () => {
      const fixture = createSearchFilterSortBarFixture({
        sortableFields: undefined,
      });

      const sortingComponent = fixture.nativeElement.querySelector('jhi-sorting');
      expect(sortingComponent).toBeFalsy();
    });

    it('should render record count element', () => {
      const fixture = createSearchFilterSortBarFixture({
        totalRecords: 10,
      });

      const recordCount = fixture.nativeElement.querySelector('div[jhiTranslate="entity.filters.recordsFound"]');
      expect(recordCount).toBeTruthy();
    });

    it('should render "Filter by" text when filters are present', () => {
      const fixture = createSearchFilterSortBarFixture({
        filters: mockFilters,
      });

      const filterBySpan = fixture.nativeElement.querySelector('.filter-sort span[jhiTranslate="entity.filterBy"]');
      expect(filterBySpan).toBeTruthy();
    });

    it('should render "Sort by" text when sortable fields are present', () => {
      const fixture = createSearchFilterSortBarFixture({
        sortableFields: mockSortOptions,
      });

      const sortBySpan = fixture.nativeElement.querySelector('.filter-sort span[jhiTranslate="entity.sortBy"]');
      expect(sortBySpan).toBeTruthy();
    });
  });

  describe('cleanup', () => {
    it('should call clearTimeout when onSearch is called again before timeout', () => {
      const fixture = createSearchFilterSortBarFixture();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      fixture.componentInstance.inputText = 'first';
      fixture.componentInstance.onSearch();

      fixture.componentInstance.inputText = 'second';
      fixture.componentInstance.onSearch();

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    it('should not call clearTimeout on first search', () => {
      const fixture = createSearchFilterSortBarFixture();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      fixture.componentInstance.inputText = 'first';
      fixture.componentInstance.onSearch();

      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should clear timeout multiple times for rapid searches', () => {
      const fixture = createSearchFilterSortBarFixture();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      fixture.componentInstance.inputText = 'first';
      fixture.componentInstance.onSearch();

      fixture.componentInstance.inputText = 'second';
      fixture.componentInstance.onSearch();

      fixture.componentInstance.inputText = 'third';
      fixture.componentInstance.onSearch();

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty search input', () => {
      const fixture = createSearchFilterSortBarFixture();
      const searchOutputSpy = vi.spyOn(fixture.componentInstance.searchOutput, 'emit');

      fixture.componentInstance.inputText = '';
      fixture.componentInstance.onSearch();

      vi.advanceTimersByTime(300);

      expect(searchOutputSpy).toHaveBeenCalledWith('');
    });

    it('should handle very long search input', () => {
      const fixture = createSearchFilterSortBarFixture();
      const searchOutputSpy = vi.spyOn(fixture.componentInstance.searchOutput, 'emit');

      const longString = 'a'.repeat(1000);
      fixture.componentInstance.inputText = longString;
      fixture.componentInstance.onSearch();

      vi.advanceTimersByTime(300);

      expect(searchOutputSpy).toHaveBeenCalledWith(longString);
      expect(searchOutputSpy.mock.calls[0][0].length).toBe(1000);
    });

    it('should handle search input with special characters', () => {
      const fixture = createSearchFilterSortBarFixture();
      const searchOutputSpy = vi.spyOn(fixture.componentInstance.searchOutput, 'emit');

      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\';
      fixture.componentInstance.inputText = specialChars;
      fixture.componentInstance.onSearch();

      vi.advanceTimersByTime(300);

      expect(searchOutputSpy).toHaveBeenCalledWith(specialChars);
    });

    it('should handle search input with whitespace only', () => {
      const fixture = createSearchFilterSortBarFixture();
      const searchOutputSpy = vi.spyOn(fixture.componentInstance.searchOutput, 'emit');

      fixture.componentInstance.inputText = '   ';
      fixture.componentInstance.onSearch();

      vi.advanceTimersByTime(300);

      expect(searchOutputSpy).toHaveBeenCalledWith('   ');
    });

    it('should handle totalRecords of 0', () => {
      const fixture = createSearchFilterSortBarFixture({
        totalRecords: 0,
      });

      expect(fixture.componentInstance.totalRecords()).toBe(0);
    });

    it('should handle very large totalRecords number', () => {
      const fixture = createSearchFilterSortBarFixture({
        totalRecords: 999999,
      });

      expect(fixture.componentInstance.totalRecords()).toBe(999999);
    });

    it('should handle filter change with empty selected values', () => {
      const fixture = createSearchFilterSortBarFixture({
        filters: mockFilters,
      });
      const filterOutputSpy = vi.spyOn(fixture.componentInstance.filterOutput, 'emit');

      const filterChange: FilterChange = {
        filterId: 'status-filter',
        selectedValues: [],
      };

      fixture.componentInstance.onFilterChange(filterChange);

      expect(filterOutputSpy).toHaveBeenCalledWith(filterChange);
    });

    it('should handle filter change with different filterId values', () => {
      const fixture = createSearchFilterSortBarFixture({
        filters: mockFilters,
      });
      const filterOutputSpy = vi.spyOn(fixture.componentInstance.filterOutput, 'emit');

      const filterChange1: FilterChange = {
        filterId: 'status-filter',
        selectedValues: ['Active'],
      };

      const filterChange2: FilterChange = {
        filterId: 'category-filter',
        selectedValues: ['Category A'],
      };

      fixture.componentInstance.onFilterChange(filterChange1);
      fixture.componentInstance.onFilterChange(filterChange2);

      expect(filterOutputSpy).toHaveBeenNthCalledWith(1, filterChange1);
      expect(filterOutputSpy).toHaveBeenNthCalledWith(2, filterChange2);
      expect(filterOutputSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('should pass filterId to filter components', () => {
    const fixture = createSearchFilterSortBarFixture({
      filters: mockFilters,
    });

    expect(fixture.componentInstance.filters()[0].filterId).toBe('status-filter');
    expect(fixture.componentInstance.filters()[1].filterId).toBe('category-filter');
  });

  it('should handle filters with all properties', () => {
    const completeFilters: Filter[] = [
      {
        filterId: 'complete-filter',
        filterLabel: 'Complete Filter',
        filterSearchPlaceholder: 'Search...',
        filterOptions: ['Option 1', 'Option 2'],
        shouldTranslateOptions: true,
      },
    ];

    const fixture = createSearchFilterSortBarFixture({
      filters: completeFilters,
    });

    const filter = fixture.componentInstance.filters()[0];
    expect(filter.filterId).toBe('complete-filter');
    expect(filter.filterLabel).toBe('Complete Filter');
    expect(filter.filterSearchPlaceholder).toBe('Search...');
    expect(filter.filterOptions).toEqual(['Option 1', 'Option 2']);
    expect(filter.shouldTranslateOptions).toBe(true);
  });

  it('should handle filters without shouldTranslateOptions', () => {
    const filtersWithoutTranslate: Filter[] = [
      {
        filterId: 'simple-filter',
        filterLabel: 'Simple Filter',
        filterSearchPlaceholder: 'Search...',
        filterOptions: ['A', 'B'],
      },
    ];

    const fixture = createSearchFilterSortBarFixture({
      filters: filtersWithoutTranslate,
    });

    const filter = fixture.componentInstance.filters()[0];
    expect(filter.filterId).toBe('simple-filter');
    expect(filter.shouldTranslateOptions).toBeUndefined();
  });
});
