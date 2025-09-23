import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sorting } from 'app/shared/components/atoms/sorting/sorting';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('Sorting', () => {
  let component: Sorting;
  let fixture: ComponentFixture<Sorting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sorting],
      providers: [provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Sorting);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('sortableFields', [{ displayName: 'Name', fieldName: 'name', type: 'TEXT' }]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
