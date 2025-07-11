import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ApplicationResourceService, JobResourceService } from 'app/generated';
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
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { HttpResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from 'app/core/auth/account.service';

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

jest.useFakeTimers();

describe('ApplicationCreationFormComponent create', () => {
  let component: ApplicationCreationFormComponent;
  let fixture: ComponentFixture<ApplicationCreationFormComponent>;

  beforeEach(async () => {
    jest.clearAllTimers();
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationFormComponent, TranslateModule.forRoot()],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            url: of([{ path: 'application' }, { path: 'create' }]),
            snapshot: {
              paramMap: {
                get(key: string) {
                  if (key === 'job_id') return '123';
                  return null;
                },
              },
            },
          },
        },
        {
          provide: ApplicationResourceService,
          useClass: MockApplicationResourceService,
        },
        {
          provide: JobResourceService,
          useValue: {
            getJobById: jest.fn().mockReturnValue(of(new HttpResponse({ body: { title: 'Test title' } }))),
          },
        },
        {
          provide: AccountService,
          useValue: {
            loadedUser: jest.fn().mockReturnValue(of({ id: 'id_for_test' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationFormComponent);
    component = fixture.componentInstance;

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faEnvelope, faChevronDown, faChevronUp, faCalendar, faCaretLeft, faCaretRight, faArrowRight, faArrowLeft, faSave);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set mode to "create" and extract jobId from route', () => {
    expect(component.mode).toBe('create');
    expect(component.jobId()).toBe('123');
  });
});
