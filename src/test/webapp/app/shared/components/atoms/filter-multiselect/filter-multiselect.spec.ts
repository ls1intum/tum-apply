import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  it('should filter options based on search term', () => {
    const filterFixture = createFilterMultiselectFixture();

    filterFixture.componentInstance.searchTerm.set('Option A');

    const filteredOptions = filterFixture.componentInstance.filteredOptions();
    expect(filteredOptions).toEqual(['Option A']);
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

  it('should toggle option selection and emit change', () => {
    const filterFixture = createFilterMultiselectFixture();

    const filterChangeSpy = vi.spyOn(filterFixture.componentInstance.filterChange, 'emit');

    filterFixture.componentInstance.toggleOption('Option A');

    expect(filterFixture.componentInstance.selectedValues()).toEqual(['Option A']);
    expect(filterChangeSpy).toHaveBeenCalledWith({
      filterLabel: 'Test Filter',
      selectedValues: ['Option A'],
    });

    filterFixture.componentInstance.toggleOption('Option B');

    expect(filterFixture.componentInstance.selectedValues()).toEqual(['Option A', 'Option B']);
    expect(filterChangeSpy).toHaveBeenCalledWith({
      filterLabel: 'Test Filter',
      selectedValues: ['Option A', 'Option B'],
    });

    filterFixture.componentInstance.toggleOption('Option A');

    expect(filterFixture.componentInstance.selectedValues()).toEqual(['Option B']);
    expect(filterChangeSpy).toHaveBeenCalledWith({
      filterLabel: 'Test Filter',
      selectedValues: ['Option B'],
    });
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
