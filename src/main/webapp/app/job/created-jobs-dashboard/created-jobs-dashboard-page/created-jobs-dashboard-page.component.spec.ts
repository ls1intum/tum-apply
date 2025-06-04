import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatedJobsDashboardPageComponent } from './created-jobs-dashboard-page.component';

describe('CreatedJobsDashboardPageComponent', () => {
  let component: CreatedJobsDashboardPageComponent;
  let fixture: ComponentFixture<CreatedJobsDashboardPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatedJobsDashboardPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatedJobsDashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
