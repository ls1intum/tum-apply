import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterSortBarComponent } from './filter-sort-bar.component';

describe('FilterSortBarComponent', () => {
  let component: FilterSortBarComponent;
  let fixture: ComponentFixture<FilterSortBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSortBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterSortBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
