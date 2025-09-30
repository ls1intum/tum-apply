import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FilterMultiselect } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('FilterMultiselect', () => {
  const mockFilterOptions = ['Option A', 'Option B', 'Option C', 'Option D'];

  function createFilterMultiselectFixture(
    overrideInputs?: Partial<{
      filterLabel: string;
      filterSearchPlaceholder: string;
      filterOptions: string[];
      shouldTranslateOptions: boolean;
    }>,
  ) {
    const fixture = TestBed.createComponent(FilterMultiselect);

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

  it('should initialize with empty selected values and closed dropdown', () => {
    const filterFixture = createFilterMultiselectFixture();

    expect(filterFixture.componentInstance.selectedValues()).toEqual([]);
    expect(filterFixture.componentInstance.isOpen()).toBe(false);
    expect(filterFixture.componentInstance.searchTerm()).toBe('');
  });

  it('should return all options when no search term is provided', () => {
    const filterFixture = createFilterMultiselectFixture();

    const filteredOptions = filterFixture.componentInstance.filteredOptions();
    expect(filteredOptions).toEqual(mockFilterOptions);
  });

  it('clears search term when opening the dropdown', () => {
    const fx = createFilterMultiselectFixture();
    fx.componentInstance.searchTerm.set('abc');
    fx.componentInstance.toggleDropdown();
    expect(fx.componentInstance.isOpen()).toBe(true);
    expect(fx.componentInstance.searchTerm()).toBe('');
  });

  it('should filter options based on search term', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.searchTerm.set('Option A');

    const filteredOptions = filterFixture.componentInstance.filteredOptions();
    expect(filteredOptions).toEqual(['Option A']);
  });

  it('should maintain sort order (selected first) even with active search', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.selectedValues.set(['Option B', 'Option D']);
    filterFixture.componentInstance.searchTerm.set('option');

    const sortedOptions = filterFixture.componentInstance.sortedOptions();

    expect(sortedOptions).toEqual([
      { label: 'Option B', value: 'Option B', selected: true },
      { label: 'Option D', value: 'Option D', selected: true },
      { label: 'Option A', value: 'Option A', selected: false },
      { label: 'Option C', value: 'Option C', selected: false },
    ]);

    expect(sortedOptions[0].selected).toBe(true);
    expect(sortedOptions[1].selected).toBe(true);
    expect(sortedOptions[2].selected).toBe(false);
    expect(sortedOptions[3].selected).toBe(false);
  });

  it('should filter options case-insensitively', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.searchTerm.set('option b');

    const filteredOptions = filterFixture.componentInstance.filteredOptions();
    expect(filteredOptions).toEqual(['Option B']);
  });

  it('should filter translated options when shouldTranslateOptions is true', () => {
    const filterFixture = createFilterMultiselectFixture({
      shouldTranslateOptions: true,
      filterOptions: ['key.option.a', 'key.option.b'],
    });

    filterFixture.componentInstance.searchTerm.set('key.option.a');

    const filteredOptions = filterFixture.componentInstance.filteredOptions();
    expect(filteredOptions).toEqual(['key.option.a']);
  });

  it('should sort options with selected items first', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.selectedValues.set(['Option C', 'Option A']);

    const sortedOptions = filterFixture.componentInstance.sortedOptions();
    expect(sortedOptions).toEqual([
      { label: 'Option A', value: 'Option A', selected: true },
      { label: 'Option C', value: 'Option C', selected: true },
      { label: 'Option B', value: 'Option B', selected: false },
      { label: 'Option D', value: 'Option D', selected: false },
    ]);
  });

  it('should compute selected options correctly', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.selectedValues.set(['Option A', 'Option C']);

    const selectedOptions = filterFixture.componentInstance.selectedOptions();
    expect(selectedOptions).toEqual([
      { label: 'Option A', value: 'Option A', selected: true },
      { label: 'Option C', value: 'Option C', selected: true },
    ]);
  });

  it('should compute unselected options correctly', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.selectedValues.set(['Option A']);

    const unselectedOptions = filterFixture.componentInstance.unselectedOptions();
    expect(unselectedOptions).toEqual([
      { label: 'Option B', value: 'Option B', selected: false },
      { label: 'Option C', value: 'Option C', selected: false },
      { label: 'Option D', value: 'Option D', selected: false },
    ]);
  });

  it('should correctly compute hasSelectedItems', () => {
    const filterFixture = createFilterMultiselectFixture();

    expect(filterFixture.componentInstance.hasSelectedItems()).toBe(false);

    filterFixture.componentInstance.selectedValues.set(['Option A']);
    expect(filterFixture.componentInstance.hasSelectedItems()).toBe(true);
  });

  it('should correctly compute hasUnselectedItems', () => {
    const filterFixture = createFilterMultiselectFixture();

    expect(filterFixture.componentInstance.hasUnselectedItems()).toBe(true);

    filterFixture.componentInstance.selectedValues.set(mockFilterOptions);
    expect(filterFixture.componentInstance.hasUnselectedItems()).toBe(false);
  });

  it('should compute correct counts', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.selectedValues.set(['Option A', 'Option B']);

    expect(filterFixture.componentInstance.selectedCount()).toBe(2);
    expect(filterFixture.componentInstance.totalCount()).toBe(4);
  });

  it('should toggle dropdown state', () => {
    const filterFixture = createFilterMultiselectFixture();

    expect(filterFixture.componentInstance.isOpen()).toBe(false);

    filterFixture.componentInstance.toggleDropdown();
    expect(filterFixture.componentInstance.isOpen()).toBe(true);

    filterFixture.componentInstance.toggleDropdown();
    expect(filterFixture.componentInstance.isOpen()).toBe(false);
  });

  it('should close dropdown', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.isOpen.set(true);
    filterFixture.componentInstance.closeDropdown();

    expect(filterFixture.componentInstance.isOpen()).toBe(false);
  });

  it('should toggle option selection and emit change in correct order', () => {
    const filterFixture = createFilterMultiselectFixture();

    const filterChangeSpy = vi.spyOn(filterFixture.componentInstance.filterChange, 'emit');

    filterFixture.componentInstance.toggleOption('Option A');
    expect(filterFixture.componentInstance.selectedValues()).toEqual(['Option A']);
    expect(filterChangeSpy).toHaveBeenNthCalledWith(1, {
      filterLabel: 'Test Filter',
      selectedValues: ['Option A'],
    });

    filterFixture.componentInstance.toggleOption('Option B');
    expect(filterFixture.componentInstance.selectedValues()).toEqual(['Option A', 'Option B']);
    expect(filterChangeSpy).toHaveBeenNthCalledWith(2, {
      filterLabel: 'Test Filter',
      selectedValues: ['Option A', 'Option B'],
    });

    filterFixture.componentInstance.toggleOption('Option A');
    expect(filterFixture.componentInstance.selectedValues()).toEqual(['Option B']);
    expect(filterChangeSpy).toHaveBeenNthCalledWith(3, {
      filterLabel: 'Test Filter',
      selectedValues: ['Option B'],
    });

    expect(filterChangeSpy).toHaveBeenCalledTimes(3);
  });

  it('should handle search input change', () => {
    const filterFixture = createFilterMultiselectFixture();

    const mockInput = document.createElement('input');
    mockInput.value = 'new search term';

    const mockEvent = {
      target: mockInput,
    } as unknown as Event;

    filterFixture.componentInstance.onSearchChange(mockEvent);

    expect(filterFixture.componentInstance.searchTerm()).toBe('new search term');
  });

  it('should close dropdown on document click outside component', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.isOpen.set(true);

    const outsideElement = document.createElement('div');
    const mockEvent = { target: outsideElement } as unknown as Event;

    filterFixture.componentInstance.onDocumentClick(mockEvent);

    expect(filterFixture.componentInstance.isOpen()).toBe(false);
  });

  it('should not close dropdown on clicks inside component', () => {
    const fx = createFilterMultiselectFixture();
    fx.componentInstance.isOpen.set(true);
    const insideEl = fx.nativeElement.querySelector('.filter-multiselect') ?? fx.nativeElement;
    fx.componentInstance.onDocumentClick({ target: insideEl } as unknown as Event);
    expect(fx.componentInstance.isOpen()).toBe(true);
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

  it('should show no results message when search term yields no matches', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.isOpen.set(true);
    filterFixture.componentInstance.searchTerm.set('nonexistent option');
    filterFixture.detectChanges();

    expect(filterFixture.componentInstance.filteredOptions()).toEqual([]);

    const noResultsElement = filterFixture.nativeElement.querySelector('.no-results');
    expect(noResultsElement).toBeTruthy();
    expect(noResultsElement?.textContent?.trim()).toContain('entity.filters.noResults');
  });

  it('should show no results message when filter options array is empty', () => {
    const filterFixture = createFilterMultiselectFixture({
      filterOptions: [],
    });

    filterFixture.componentInstance.isOpen.set(true);
    filterFixture.detectChanges();

    expect(filterFixture.componentInstance.filteredOptions()).toEqual([]);

    const noResultsElement = filterFixture.nativeElement.querySelector('.no-results');
    expect(noResultsElement).toBeTruthy();
    expect(noResultsElement?.textContent?.trim()).toContain('entity.filters.noResults');
  });
});
