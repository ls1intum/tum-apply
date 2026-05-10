import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FilterMultiselect } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('FilterMultiselect', () => {
  const mockFilterOptions = ['Option A', 'Option B', 'Option C', 'Option D'];

  function createFilterMultiselectFixture(
    overrideInputs?: Partial<{
      filterId: string;
      filterLabel: string;
      filterSearchPlaceholder: string;
      filterOptions: string[];
      shouldTranslateOptions: boolean;
    }>,
  ) {
    const fixture = TestBed.createComponent(FilterMultiselect);

    fixture.componentRef.setInput('filterId', overrideInputs?.filterId ?? 'test-filter-id');
    fixture.componentRef.setInput('filterLabel', overrideInputs?.filterLabel ?? 'Test Filter');
    fixture.componentRef.setInput('filterSearchPlaceholder', overrideInputs?.filterSearchPlaceholder ?? 'Search...');
    fixture.componentRef.setInput('filterOptions', overrideInputs?.filterOptions ?? mockFilterOptions);
    fixture.componentRef.setInput('shouldTranslateOptions', overrideInputs?.shouldTranslateOptions ?? false);

    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterMultiselect],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each<[string, string[]]>([
    ['', mockFilterOptions],
    ['Option A', ['Option A']],
    ['option b', ['Option B']],
  ])('should filter options for search term "%s"', (searchTerm, expected) => {
    const filterFixture = createFilterMultiselectFixture();
    filterFixture.componentInstance.searchTerm.set(searchTerm);

    expect(filterFixture.componentInstance.filteredOptions()).toEqual(expected);
  });

  it('should clear search term when opening the dropdown', () => {
    const fx = createFilterMultiselectFixture();
    fx.componentInstance.searchTerm.set('abc');
    fx.componentInstance.toggleDropdown();
    expect(fx.componentInstance.isOpen()).toBe(true);
    expect(fx.componentInstance.searchTerm()).toBe('');
  });

  it('should maintain sort order (selected first) even with active search', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.selectedValues.set(['Option B', 'Option D']);
    filterFixture.componentInstance.searchTerm.set('option');

    expect(filterFixture.componentInstance.sortedOptions()).toEqual([
      { label: 'Option B', value: 'Option B', selected: true },
      { label: 'Option D', value: 'Option D', selected: true },
      { label: 'Option A', value: 'Option A', selected: false },
      { label: 'Option C', value: 'Option C', selected: false },
    ]);
  });

  it('should filter translated options when shouldTranslateOptions is true', () => {
    const filterFixture = createFilterMultiselectFixture({
      shouldTranslateOptions: true,
      filterOptions: ['key.option.a', 'key.option.b'],
    });
    filterFixture.componentInstance.searchTerm.set('key.option.a');

    expect(filterFixture.componentInstance.filteredOptions()).toEqual(['key.option.a']);
  });

  it('should compute selectedOptions, unselectedOptions, hasSelectedItems, hasUnselectedItems and counts based on selectedValues', () => {
    const filterFixture = createFilterMultiselectFixture();
    const comp = filterFixture.componentInstance;

    expect(comp.hasSelectedItems()).toBe(false);
    expect(comp.hasUnselectedItems()).toBe(true);

    comp.selectedValues.set(['Option A', 'Option C']);
    expect(comp.hasSelectedItems()).toBe(true);
    expect(comp.selectedOptions()).toEqual([
      { label: 'Option A', value: 'Option A', selected: true },
      { label: 'Option C', value: 'Option C', selected: true },
    ]);
    expect(comp.unselectedOptions()).toEqual([
      { label: 'Option B', value: 'Option B', selected: false },
      { label: 'Option D', value: 'Option D', selected: false },
    ]);
    expect(comp.selectedCount()).toBe(2);
    expect(comp.totalCount()).toBe(4);

    comp.selectedValues.set(mockFilterOptions);
    expect(comp.hasUnselectedItems()).toBe(false);
  });

  it('should toggle and close dropdown state', () => {
    const filterFixture = createFilterMultiselectFixture();
    const comp = filterFixture.componentInstance;

    comp.toggleDropdown();
    expect(comp.isOpen()).toBe(true);

    comp.toggleDropdown();
    expect(comp.isOpen()).toBe(false);

    comp.isOpen.set(true);
    comp.closeDropdown();
    expect(comp.isOpen()).toBe(false);
  });

  it('should toggle option selection and emit change with filterId in correct order', () => {
    const filterFixture = createFilterMultiselectFixture({ filterId: 'custom-filter-id' });

    const filterChangeSpy = vi.spyOn(filterFixture.componentInstance.filterChange, 'emit');

    filterFixture.componentInstance.toggleOption('Option A');
    expect(filterFixture.componentInstance.selectedValues()).toEqual(['Option A']);
    expect(filterChangeSpy).toHaveBeenNthCalledWith(1, {
      filterId: 'custom-filter-id',
      selectedValues: ['Option A'],
    });

    filterFixture.componentInstance.toggleOption('Option B');
    expect(filterFixture.componentInstance.selectedValues()).toEqual(['Option A', 'Option B']);
    expect(filterChangeSpy).toHaveBeenNthCalledWith(2, {
      filterId: 'custom-filter-id',
      selectedValues: ['Option A', 'Option B'],
    });

    filterFixture.componentInstance.toggleOption('Option A');
    expect(filterFixture.componentInstance.selectedValues()).toEqual(['Option B']);
    expect(filterChangeSpy).toHaveBeenNthCalledWith(3, {
      filterId: 'custom-filter-id',
      selectedValues: ['Option B'],
    });

    expect(filterChangeSpy).toHaveBeenCalledTimes(3);
  });

  it('should handle search input change', () => {
    const filterFixture = createFilterMultiselectFixture();

    const mockInput = document.createElement('input');
    mockInput.value = 'new search term';

    const mockEvent: Partial<Event> = {
      target: mockInput,
    };

    filterFixture.componentInstance.onSearchChange(mockEvent as Event);

    expect(filterFixture.componentInstance.searchTerm()).toBe('new search term');
  });

  it('should close dropdown on outside click but keep open on inside click', () => {
    const fx = createFilterMultiselectFixture();
    fx.componentInstance.isOpen.set(true);

    const insideEl = fx.nativeElement.querySelector('.filter-multiselect') ?? fx.nativeElement;
    fx.componentInstance.onDocumentClick({ target: insideEl } as unknown as Event);
    expect(fx.componentInstance.isOpen()).toBe(true);

    fx.componentInstance.onDocumentClick({ target: document.createElement('div') } as unknown as Event);
    expect(fx.componentInstance.isOpen()).toBe(false);
  });

  it('should handle empty filter options', () => {
    const filterFixture = createFilterMultiselectFixture({
      filterOptions: [],
    });

    expect(filterFixture.componentInstance.filteredOptions()).toEqual([]);
    expect(filterFixture.componentInstance.sortedOptions()).toEqual([]);
    expect(filterFixture.componentInstance.hasUnselectedItems()).toBe(false);
    expect(filterFixture.componentInstance.totalCount()).toBe(0);
  });
});
