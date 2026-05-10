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

    expect(searchOutputSpy).toHaveBeenCalledOnce();
    expect(searchOutputSpy).toHaveBeenCalledWith('second search');
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

  describe('DOM rendering', () => {
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
  });

  describe('cleanup', () => {
    it('should clear timeout on subsequent search calls within debounce', () => {
      const fixture = createSearchFilterSortBarFixture();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      fixture.componentInstance.inputText = 'first';
      fixture.componentInstance.onSearch();
      expect(clearTimeoutSpy).not.toHaveBeenCalled();

      fixture.componentInstance.inputText = 'second';
      fixture.componentInstance.onSearch();
      expect(clearTimeoutSpy).toHaveBeenCalledOnce();
    });
  });

  it('should emit filter change with empty selected values', () => {
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
});
