import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApplicationResourceService } from 'app/generated';
import { ActivatedRoute } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faArrowRightArrowLeft,
  faBrain,
  faBuildingColumns,
  faCircleUser,
  faFlask,
  faLink,
  faRocket,
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';

import ApplicationDetailForApplicantComponent from './application-detail-for-applicant.component';

class MockApplicationResourceService {
  getApplicationForDetailPage = jest.fn().mockReturnValue(of({}));
}

describe('ApplicationDetailForApplicantComponent', () => {
  let component: ApplicationDetailForApplicantComponent;
  let fixture: ComponentFixture<ApplicationDetailForApplicantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationDetailForApplicantComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            url: of([{ path: 'application' }, { path: 'detail' }]),
            snapshot: {
              paramMap: {
                get(_key: string) {
                  return '123';
                },
              },
            },
          },
        },
        {
          provide: ApplicationResourceService,
          useClass: MockApplicationResourceService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDetailForApplicantComponent);
    component = fixture.componentInstance;

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faLink);
    library.addIcons(faCircleUser);
    library.addIcons(faLinkedin);
    library.addIcons(faBuildingColumns);
    library.addIcons(faArrowRightArrowLeft);
    library.addIcons(faBrain);
    library.addIcons(faRocket);
    library.addIcons(faFlask);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
