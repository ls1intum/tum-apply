import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchFilterSortBar } from './search-filter-sort-bar';

describe('SearchFilterSortBar', () => {
  let component: SearchFilterSortBar;
  let fixture: ComponentFixture<SearchFilterSortBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchFilterSortBar],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchFilterSortBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
