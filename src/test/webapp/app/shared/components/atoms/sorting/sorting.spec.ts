import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Sorting, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { TranslateService } from '@ngx-translate/core';

describe('Sorting', () => {
  const mockSortOptions: SortOption[] = [
    { displayName: 'Name', fieldName: 'name', type: 'TEXT' },
    { displayName: 'Age', fieldName: 'age', type: 'NUMBER' },
    { displayName: 'Date', fieldName: 'date', type: 'TEXT' },
  ];

  function createSortingFixture() {
    const fixture = TestBed.createComponent(Sorting);
    fixture.componentRef.setInput('sortableFields', mockSortOptions);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    const translateServiceMock = {
      instant: vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'entity.sorting.ascending.text': 'Ascending (A-Z)',
          'entity.sorting.descending.text': 'Descending (Z-A)',
          'entity.sorting.ascending.number': 'Ascending (1-9)',
          'entity.sorting.descending.number': 'Descending (9-1)',
        };
        return translations[key] || key;
      }),
    };

    await TestBed.configureTestingModule({
      imports: [Sorting],
      providers: [provideFontAwesomeTesting(), { provide: TranslateService, useValue: translateServiceMock }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should use first sortable field as default current option', () => {
    const sortingFixture = createSortingFixture();

    expect(sortingFixture.componentInstance.currentOption()).toEqual(mockSortOptions[0]);
  });

  it('should generate correct select options from sortable fields', () => {
    const sortingFixture = createSortingFixture();

    const selectOptions = sortingFixture.componentInstance.selectOptions();
    expect(selectOptions).toEqual([
      { name: 'Name', value: 'name' },
      { name: 'Age', value: 'age' },
      { name: 'Date', value: 'date' },
    ]);
  });

  it('should return correct sort icon for TEXT type', () => {
    const sortingFixture = createSortingFixture();

    expect(sortingFixture.componentInstance.getSortIcon()).toBe('arrow-down-z-a');

    sortingFixture.componentInstance.isAsc.set(true);
    expect(sortingFixture.componentInstance.getSortIcon()).toBe('arrow-up-z-a');
  });

  it('should return correct sort icon for NUMBER type', () => {
    const sortingFixture = createSortingFixture();

    sortingFixture.componentInstance.selectedOption.set(mockSortOptions[1]);

    expect(sortingFixture.componentInstance.getSortIcon()).toBe('arrow-down-9-1');

    sortingFixture.componentInstance.isAsc.set(true);
    expect(sortingFixture.componentInstance.getSortIcon()).toBe('arrow-up-9-1');
  });

  it('should return correct sort tooltip for TEXT type', () => {
    const sortingFixture = createSortingFixture();

    expect(sortingFixture.componentInstance.getSortTooltip()).toBe('Descending (Z-A)');

    sortingFixture.componentInstance.isAsc.set(true);
    expect(sortingFixture.componentInstance.getSortTooltip()).toBe('Ascending (A-Z)');
  });

  it('should return correct sort tooltip for NUMBER type', () => {
    const sortingFixture = createSortingFixture();

    sortingFixture.componentInstance.selectedOption.set(mockSortOptions[1]);

    expect(sortingFixture.componentInstance.getSortTooltip()).toBe('Descending (9-1)');

    sortingFixture.componentInstance.isAsc.set(true);
    expect(sortingFixture.componentInstance.getSortTooltip()).toBe('Ascending (1-9)');
  });

  it('should change selected option and emit sort change', () => {
    const sortingFixture = createSortingFixture();

    const sortChangeSpy = vi.spyOn(sortingFixture.componentInstance.sortChange, 'emit');

    sortingFixture.componentInstance.onSortFieldChange({ name: 'Age', value: 'age' });

    expect(sortingFixture.componentInstance.selectedOption()).toEqual(mockSortOptions[1]);
    expect(sortChangeSpy).toHaveBeenCalledWith({
      field: 'age',
      direction: 'DESC',
    });
  });

  it('should set undefined option when empty value is selected', () => {
    const sortingFixture = createSortingFixture();

    const sortChangeSpy = vi.spyOn(sortingFixture.componentInstance.sortChange, 'emit');

    sortingFixture.componentInstance.onSortFieldChange({ name: '', value: '' });

    expect(sortingFixture.componentInstance.selectedOption()).toBeUndefined();
    // Should still emit with first option as fallback due to currentOption computed
    expect(sortChangeSpy).toHaveBeenCalledWith({
      field: 'name',
      direction: 'DESC',
    });
  });

  it('should toggle direction and emit sort change', () => {
    const sortingFixture = createSortingFixture();

    const sortChangeSpy = vi.spyOn(sortingFixture.componentInstance.sortChange, 'emit');

    expect(sortingFixture.componentInstance.isAsc()).toBe(false);

    sortingFixture.componentInstance.toggleDirection();

    expect(sortingFixture.componentInstance.isAsc()).toBe(true);
    expect(sortChangeSpy).toHaveBeenCalledWith({
      field: 'name',
      direction: 'ASC',
    });

    sortingFixture.componentInstance.toggleDirection();

    expect(sortingFixture.componentInstance.isAsc()).toBe(false);
    expect(sortChangeSpy).toHaveBeenCalledWith({
      field: 'name',
      direction: 'DESC',
    });
  });

  it('should return correct selected select option', () => {
    const sortingFixture = createSortingFixture();

    // Default should return first option
    expect(sortingFixture.componentInstance.selectedSelectOption()).toEqual({
      name: 'Name',
      value: 'name',
    });

    // Change to different option
    sortingFixture.componentInstance.selectedOption.set(mockSortOptions[2]);
    expect(sortingFixture.componentInstance.selectedSelectOption()).toEqual({
      name: 'Date',
      value: 'date',
    });
  });
});
