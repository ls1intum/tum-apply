import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterMultiselect } from './filter-multiselect';

describe('FilterMultiselect', () => {
  let component: FilterMultiselect;
  let fixture: ComponentFixture<FilterMultiselect>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterMultiselect],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterMultiselect);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
