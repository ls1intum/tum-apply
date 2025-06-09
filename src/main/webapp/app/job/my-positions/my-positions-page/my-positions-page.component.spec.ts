import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPositionsPageComponent } from './my-positions-page.component';

describe('CreatedJobsDashboardPageComponent', () => {
  let component: MyPositionsPageComponent;
  let fixture: ComponentFixture<MyPositionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPositionsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPositionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
