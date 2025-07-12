import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationForApplicantDTO, ApplicationOverviewDTO, ApplicationResourceService } from 'app/generated';
import { Observable, Subject, of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { AccountService } from 'app/core/auth/account.service';
import { MissingTranslationHandler, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

import ApplicationOverviewForApplicantComponent from './application-overview-for-applicant.component';

class MockApplicationResourceService {
  deleteApplication = jest.fn().mockReturnValue(of(undefined));
  withdrawApplication = jest.fn().mockReturnValue(of(undefined));
  getApplicationPages(pageSize = 10, pageNumber = 0): Observable<ApplicationOverviewDTO[]> {
    const start = pageNumber * pageSize;
    const end = start + pageSize;
    const pagedData: ApplicationOverviewDTO[] = mockApplications.slice(start, end);
    return of(pagedData);
  }

  getApplicationPagesLength(): Observable<number> {
    return of(mockApplications.length);
  }
}

class FakeLoader implements TranslateLoader {
  getTranslation(): Observable<{}> {
    return of({}); // return an empty object or mock translations
  }
}

class MockTranslateService {
  onLangChange = new Subject();
  onTranslationChange = new Subject();
  onDefaultLangChange = new Subject();

  get = jest.fn().mockImplementation((key: string) => of(key));
}

const mockApplications: ApplicationOverviewDTO[] = [
  {
    applicationId: 'app-001',
    jobTitle: 'Postdoctoral Researcher - AI Ethics',
    researchGroup: 'Ethics & Society Lab',
    applicationState: 'SENT',
    timeSinceCreation: '2 days ago',
  },
  {
    applicationId: 'app-002',
    jobTitle: 'PhD in Machine Learning',
    researchGroup: 'ML Systems',
    applicationState: 'IN_REVIEW',
    timeSinceCreation: '10 days ago',
  },
  {
    applicationId: 'app-003',
    jobTitle: 'Data Scientist Intern',
    researchGroup: 'Data Insights',
    applicationState: 'SAVED',
    timeSinceCreation: 'Today',
  },
  {
    applicationId: 'app-004',
    jobTitle: 'Senior Research Scientist',
    researchGroup: 'Advanced Robotics',
    applicationState: 'ACCEPTED',
    timeSinceCreation: '1 month ago',
  },
  {
    applicationId: 'app-005',
    jobTitle: 'Research Assistant - Computational Biology',
    researchGroup: 'Bioinformatics Lab',
    applicationState: 'REJECTED',
    timeSinceCreation: '5 days ago',
  },
  {
    applicationId: 'app-006',
    jobTitle: 'Junior Software Engineer',
    researchGroup: 'Platform Engineering',
    applicationState: 'WITHDRAWN',
    timeSinceCreation: '15 days ago',
  },
];

describe('ApplicationOverviewForApplicantComponent', () => {
  let component: ApplicationOverviewForApplicantComponent;
  let fixture: ComponentFixture<ApplicationOverviewForApplicantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ApplicationOverviewForApplicantComponent,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: FakeLoader },
          defaultLanguage: 'en',
          useDefaultLang: true,
        }),
      ],
      providers: [
        {
          provide: ApplicationResourceService,
          useClass: MockApplicationResourceService,
        },
        {
          provide: AccountService,
          useValue: {
            loadedUser: jest.fn().mockReturnValue(of({ id: 'id_for_test' })),
          },
        },
        {
          provide: MissingTranslationHandler,
          useValue: { handle: jest.fn() },
        },
        { provide: TranslateService, useClass: MockTranslateService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationOverviewForApplicantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch total record count on init', () => {
    const applicationService = TestBed.inject(ApplicationResourceService);
    const spy = jest
      .spyOn(applicationService, 'getApplicationPagesLength')
      .mockReturnValue(of(new HttpResponse({ body: 42, status: 200 })));

    fixture = TestBed.createComponent(ApplicationOverviewForApplicantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should have default signals', () => {
    expect(component.pageData()).toEqual([]);
    expect(component.total()).toBe(6);
    expect(component.pageSize()).toBe(10);
    expect(component.loading()).toBe(false);
  });

  it('should load data and set pageData', async () => {
    const applicationService = TestBed.inject(ApplicationResourceService);
    jest.spyOn(applicationService, 'getApplicationPages');
    fixture = TestBed.createComponent(ApplicationOverviewForApplicantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    await component.loadPage({ first: 0, rows: 10 });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(component.loading()).toBe(false);
    expect(component.pageData()).toEqual(mockApplications);
  });

  it('should store the last lazy load event', async () => {
    const event = { first: 0, rows: 10 };
    await component.loadPage(event);
    expect(component.lastLazyLoadEvent()).toEqual(event);
  });

  it('should delete application and reload data', () => {
    const applicationService = TestBed.inject(ApplicationResourceService);

    const reloadSpy = jest.spyOn(component, 'loadPage').mockImplementation();

    jest.spyOn(global, 'confirm').mockReturnValue(true);
    jest.spyOn(applicationService, 'deleteApplication').mockReturnValue(of(new HttpResponse({ body: undefined, status: 200 })));
    component.lastLazyLoadEvent.set({ first: 0, rows: 10 });

    component.onDeleteApplication('app-id');

    expect(applicationService.deleteApplication).toHaveBeenCalledWith('app-id');
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('should withdraw application and reload data', () => {
    const applicationService = TestBed.inject(ApplicationResourceService);
    const reloadSpy = jest.spyOn(component, 'loadPage').mockImplementation();

    jest.spyOn(global, 'confirm').mockReturnValue(true);
    jest.spyOn(applicationService, 'withdrawApplication').mockReturnValue(
      of(
        new HttpResponse({
          body: {
            applicationId: 'app-001',
            applicationState: 'SENT',
          } as ApplicationForApplicantDTO,
          status: 200,
        }),
      ),
    );
    component.lastLazyLoadEvent.set({ first: 0, rows: 10 });

    component.onWithdrawApplication('app-id');

    expect(applicationService.withdrawApplication).toHaveBeenCalledWith('app-id');
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle error in loadPage()', async () => {
    const applicationService = TestBed.inject(ApplicationResourceService);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(applicationService, 'getApplicationPages').mockReturnValueOnce(
      of(() => {
        throw new Error('Oops');
      }) as any,
    );

    await component.loadPage({ first: 0, rows: 10 });
    expect(component.loading()).toBe(false);
  });
});
