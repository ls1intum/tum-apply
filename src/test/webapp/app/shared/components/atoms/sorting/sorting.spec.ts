import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Sorting, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { createTranslateServiceMock, provideTranslateMock } from 'util/translate.mock';

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
    const translateServiceMock = createTranslateServiceMock();
    translateServiceMock.instant = vi.fn((key: string | string[]) => {
      const translations: Record<string, string> = {
        'entity.sorting.ascending.text': 'Ascending (A-Z)',
        'entity.sorting.descending.text': 'Descending (Z-A)',
        'entity.sorting.ascending.number': 'Ascending (1-9)',
        'entity.sorting.descending.number': 'Descending (9-1)',
      };
      const single = Array.isArray(key) ? key[0] : key;
      return translations[single] ?? single;
    }) as never;

    await TestBed.configureTestingModule({
      imports: [Sorting],
      providers: [provideFontAwesomeTesting(), provideTranslateMock(translateServiceMock)],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it.each<[number, boolean, string, string]>([
    [0, false, 'arrow-down-z-a', 'entity.sorting.descending.text'],
    [0, true, 'arrow-up-z-a', 'entity.sorting.ascending.text'],
    [1, false, 'arrow-down-9-1', 'entity.sorting.descending.number'],
    [1, true, 'arrow-up-9-1', 'entity.sorting.ascending.number'],
  ])('should return icon=%s and tooltip=%s for option index %i with isAsc=%s', (optionIdx, isAsc, expectedIcon, expectedTooltip) => {
    const sortingFixture = createSortingFixture();
    sortingFixture.componentInstance.selectedOption.set(mockSortOptions[optionIdx]);
    sortingFixture.componentInstance.isAsc.set(isAsc);

    expect(sortingFixture.componentInstance.getSortIcon()).toBe(expectedIcon);
    expect(sortingFixture.componentInstance.getSortTooltip()).toBe(expectedTooltip);
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
