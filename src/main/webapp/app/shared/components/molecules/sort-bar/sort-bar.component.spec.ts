import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faArrowDown19, faArrowDownAZ, faArrowUp19, faArrowUpAZ, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { TranslateModule } from '@ngx-translate/core';

import { Sort, SortBarComponent, SortDirection, SortOption } from './sort-bar.component';

@Component({
  selector: 'jhi-dropdown',
  template: '',
  standalone: true,
})
class MockDropdownComponent {
  width = signal<string>('');
  items = signal<unknown>([]);
  selected = signal<unknown>(null);
}

@Component({
  selector: 'jhi-button',
  template: '<button (click)="click()"></button>',
  standalone: true,
})
class MockButtonComponent {
  icon = signal<string>('');
  variant = signal<string>('');
  click = signal(undefined);
}

describe('SortBarComponent', () => {
  let fixture: ComponentFixture<SortBarComponent>;
  let component: SortBarComponent;
  let library: FaIconLibrary;

  const sortableFields: SortOption[] = [
    { displayName: 'Name', field: 'name', type: 'TEXT' },
    { displayName: 'Age', field: 'age', type: 'NUMBER' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortBarComponent, MockDropdownComponent, MockButtonComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(SortBarComponent);
    component = fixture.componentInstance;

    library = TestBed.inject(FaIconLibrary);
    library.addIcons(faChevronDown, faArrowDown19, faArrowUp19, faArrowDownAZ, faArrowUpAZ);

    fixture.componentRef.setInput('totalRecords', 0);
    fixture.componentRef.setInput('sortableFields', sortableFields);
    fixture.componentRef.setInput('singleEntity', 'Application');
    fixture.componentRef.setInput('multipleEntities', 'Applications');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('record-count rendering', () => {
    it.each`
      count | expectedEntity
      ${0}  | ${'Applications'}
      ${1}  | ${'Application'}
      ${2}  | ${'Applications'}
    `('selects correct entity string for $count', ({ count, expectedEntity }) => {
      fixture.componentRef.setInput('totalRecords', count);
      fixture.detectChanges();
      expect(component.totalRecords()).toBe(count);
      expect(count === 1 ? component.singleEntity() : component.multipleEntities()).toBe(expectedEntity);
    });
  });

  it('defaults to the first sortable field', () => {
    expect(component.currentOption()).toEqual(sortableFields[0]);
  });

  it('emits sortChange when the sort field changes', () => {
    const spy = jest.fn();
    component.sortChange.subscribe(spy);
    component.onSortFieldChange({ name: 'Age', value: 'age' });
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      field: 'age',
      direction: SortDirection.DESC,
    } as Sort);
  });

  it('emits sortChange when the sort direction toggles', () => {
    const spy = jest.fn();
    component.sortChange.subscribe(spy);
    component.toggleDirection();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith({
      field: 'name',
      direction: SortDirection.ASC,
    });
    component.toggleDirection();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith({
      field: 'name',
      direction: SortDirection.DESC,
    });
  });

  it('emits in the right order when changing field and then toggling', () => {
    const spy = jest.fn();
    component.sortChange.subscribe(spy);
    component.onSortFieldChange({ name: 'Age', value: 'age' });
    component.toggleDirection();
    fixture.detectChanges();
    expect(spy.mock.calls).toEqual([[{ field: 'age', direction: SortDirection.DESC }], [{ field: 'age', direction: SortDirection.ASC }]]);
  });
});
