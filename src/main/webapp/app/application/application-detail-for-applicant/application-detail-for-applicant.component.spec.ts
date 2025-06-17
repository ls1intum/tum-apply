import { ComponentFixture, TestBed } from '@angular/core/testing';

import ApplicationDetailForApplicantComponent from './application-detail-for-applicant.component';

describe('ApplicationDetailForApplicantComponent', () => {
  let component: ApplicationDetailForApplicantComponent;
  let fixture: ComponentFixture<ApplicationDetailForApplicantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailForApplicantComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDetailForApplicantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
