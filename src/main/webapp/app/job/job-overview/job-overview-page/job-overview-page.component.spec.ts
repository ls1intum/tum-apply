import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobOverviewPageComponent } from './job-overview-page.component';

describe('JobOverviewPageComponent', () => {
  let component: JobOverviewPageComponent;
  let fixture: ComponentFixture<JobOverviewPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobOverviewPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JobOverviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
