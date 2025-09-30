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
      filterLabel: 'Status',
      filterSearchPlaceholder: 'Search status...',
      filterOptions: ['Active', 'Inactive', 'Pending'],
    },
    {
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
      filterLabel: 'status',
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
});
