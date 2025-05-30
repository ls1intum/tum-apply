import { ComponentFixture, TestBed } from '@angular/core/testing';

import ApplicationOverviewForApplicantComponent from './application-overview-for-applicant.component';
import { ApplicationResourceService } from 'app/generated';
import { of } from 'rxjs';

class MockApplicationResourceService {
  getApplicationPages = jest.fn().mockReturnValue(of([]));
}

describe('ApplicationOverviewForApplicantComponent', () => {
  let component: ApplicationOverviewForApplicantComponent;
  let fixture: ComponentFixture<ApplicationOverviewForApplicantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationOverviewForApplicantComponent],
      providers: [
        {
          provide: ApplicationResourceService,
          useClass: MockApplicationResourceService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationOverviewForApplicantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
