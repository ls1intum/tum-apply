import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationOverviewForApplicantComponent } from './application-overview-for-applicant.component';

describe('ApplicationOverviewForApplicantComponent', () => {
  let component: ApplicationOverviewForApplicantComponent;
  let fixture: ComponentFixture<ApplicationOverviewForApplicantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationOverviewForApplicantComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationOverviewForApplicantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
