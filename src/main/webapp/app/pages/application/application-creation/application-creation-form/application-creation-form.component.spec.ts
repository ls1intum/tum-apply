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
} from '@fortawesome/free-solid-svg-icons';
import { HttpResponse } from '@angular/common/http';

import ApplicationCreationFormComponent from './application-creation-form.component';

class MockApplicationResourceService {
  getApplicationById = jest.fn().mockReturnValue(of({}));
  createApplication = jest.fn();
}

describe('ApplicationCreationFormComponent create', () => {
  let component: ApplicationCreationFormComponent;
  let fixture: ComponentFixture<ApplicationCreationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreationFormComponent],
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
            getJobDetails: jest.fn().mockReturnValue(of(new HttpResponse({ body: { title: 'Test title' } }))),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationCreationFormComponent);
    component = fixture.componentInstance;

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faEnvelope);
    library.addIcons(faChevronDown);
    library.addIcons(faChevronUp);
    library.addIcons(faCalendar);
    library.addIcons(faCaretLeft);
    library.addIcons(faCaretRight);
    library.addIcons(faArrowRight);
    library.addIcons(faArrowLeft);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set mode to "create" and extract jobId from route', () => {
    expect(component.mode).toBe('create');
    expect(component.jobId).toBe('123');
  });
});
