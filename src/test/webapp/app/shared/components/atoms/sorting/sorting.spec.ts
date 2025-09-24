import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sorting, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('Sorting', () => {
  const mockSortOptions: SortOption[] = [
    { displayName: 'Name', fieldName: 'name', type: 'TEXT' },
    { displayName: 'Age', fieldName: 'age', type: 'NUMBER' },
    { displayName: 'Date', fieldName: 'date', type: 'TEXT' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sorting],
      providers: [provideFontAwesomeTesting()],
    }).compileComponents();
  });

  it('should use first sortable field as default current option', () => {
    const sortingFixture = TestBed.createComponent(Sorting);
    sortingFixture.componentRef.setInput('sortableFields', mockSortOptions);
    sortingFixture.detectChanges();

    expect(sortingFixture.componentInstance.currentOption()).toEqual(mockSortOptions[0]);
  });

  it('should generate correct select options from sortable fields', () => {
    const sortingFixture = TestBed.createComponent(Sorting);
    sortingFixture.componentRef.setInput('sortableFields', mockSortOptions);
    sortingFixture.detectChanges();

    const selectOptions = sortingFixture.componentInstance.selectOptions();
    expect(selectOptions).toEqual([
      { name: 'Name', value: 'name' },
      { name: 'Age', value: 'age' },
      { name: 'Date', value: 'date' },
    ]);
  });

  it('should return correct sort icon for TEXT type', () => {
    const sortingFixture = TestBed.createComponent(Sorting);
    sortingFixture.componentRef.setInput('sortableFields', mockSortOptions);
    sortingFixture.detectChanges();

    expect(sortingFixture.componentInstance.getSortIcon()).toBe('arrow-up-a-z');

    sortingFixture.componentInstance.isAsc.set(true);
    expect(sortingFixture.componentInstance.getSortIcon()).toBe('arrow-down-a-z');
  });

  it('should return correct sort icon for NUMBER type', () => {
    const sortingFixture = TestBed.createComponent(Sorting);
    sortingFixture.componentRef.setInput('sortableFields', mockSortOptions);
    sortingFixture.detectChanges();

    // Select the Age field (NUMBER type)
    sortingFixture.componentInstance.selectedOption.set(mockSortOptions[1]);

    expect(sortingFixture.componentInstance.getSortIcon()).toBe('arrow-up-1-9');

    sortingFixture.componentInstance.isAsc.set(true);
    expect(sortingFixture.componentInstance.getSortIcon()).toBe('arrow-down-1-9');
  });

  it('should change selected option and emit sort change', () => {
    const sortingFixture = TestBed.createComponent(Sorting);
    sortingFixture.componentRef.setInput('sortableFields', mockSortOptions);
    sortingFixture.detectChanges();

    const sortChangeSpy = vi.spyOn(sortingFixture.componentInstance.sortChange, 'emit');

    sortingFixture.componentInstance.onSortFieldChange({ name: 'Age', value: 'age' });

    expect(sortingFixture.componentInstance.selectedOption()).toEqual(mockSortOptions[1]);
    expect(sortChangeSpy).toHaveBeenCalledWith({
      field: 'age',
      direction: 'DESC',
    });
  });

  it('should set undefined option when empty value is selected', () => {
    const sortingFixture = TestBed.createComponent(Sorting);
    sortingFixture.componentRef.setInput('sortableFields', mockSortOptions);
    sortingFixture.detectChanges();

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
    const sortingFixture = TestBed.createComponent(Sorting);
    sortingFixture.componentRef.setInput('sortableFields', mockSortOptions);
    sortingFixture.detectChanges();

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
    const sortingFixture = TestBed.createComponent(Sorting);
    sortingFixture.componentRef.setInput('sortableFields', mockSortOptions);
    sortingFixture.detectChanges();

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
