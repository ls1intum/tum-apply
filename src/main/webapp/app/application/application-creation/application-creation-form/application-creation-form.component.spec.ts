import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faCalendar,
  faCaretLeft,
  faCaretRight,
  faChevronDown,
  faChevronUp,
  faEnvelope,
  faInfoCircle,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';
import { MessageService } from 'primeng/api';

import { JobResourceApiService } from '../../../generated/api/jobResourceApi.service';
import { ApplicationResourceApiService } from '../../../generated/api/applicationResourceApi.service';

import ApplicationCreationFormComponent from './application-creation-form.component';

class MockApplicationResourceService {
  getApplicationById = jest.fn().mockReturnValue(
    of({
      applicationId: 'test-app-id',
      job: { jobId: '123', title: 'Test Job' },
    }),
  );
  createApplication = jest.fn().mockReturnValue(
    of({
      applicationId: 'test-app-id',
      job: { jobId: '123', title: 'Test Job' },
    }),
  );
  getDocumentDictionaryIds = jest.fn().mockReturnValue(of({}));
  updateApplication = jest.fn();
  deleteApplication = jest.fn();
}

describe('ApplicationCreationFormComponent create', () => {
  let component: ApplicationCreationFormComponent;
  let fixture: ComponentFixture<ApplicationCreationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationFormComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: jest.fn().mockImplementation((key: string) => {
                  if (key === 'job') return '123';
                  if (key === 'application') return null;
                  return null;
                }),
              },
            },
          },
        },
        {
          provide: ApplicationResourceApiService,
          useClass: MockApplicationResourceService,
        },
        {
          provide: JobResourceApiService,
          useValue: {
            getJobById: jest.fn().mockReturnValue(of(new HttpResponse({ body: { title: 'Test title' } }))),
          },
        },
        {
          provide: AccountService,
          useValue: {
            loadedUser: jest.fn().mockReturnValue(of({ id: 'id_for_test' })),
            signedIn: jest.fn().mockReturnValue(of(true)),
          },
        },
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationFormComponent);
    component = fixture.componentInstance;

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(
      faEnvelope,
      faChevronDown,
      faChevronUp,
      faCalendar,
      faCaretLeft,
      faCaretRight,
      faInfoCircle,
      faArrowRight,
      faArrowLeft,
      faSave,
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
