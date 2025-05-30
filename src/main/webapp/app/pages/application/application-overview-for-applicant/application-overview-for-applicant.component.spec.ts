import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationForApplicantDTO, ApplicationOverviewDTO, ApplicationResourceService } from 'app/generated';
import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

import ApplicationOverviewForApplicantComponent from './application-overview-for-applicant.component';

class MockApplicationResourceService {
  getApplicationPages(_applicantId: string, pageSize = 10, pageNumber = 0) {
    const start = pageNumber * pageSize;
    const end = start + pageSize;
    const pagedData: ApplicationOverviewDTO[] = mockApplications.slice(start, end);
    return of(pagedData);
  }

  getApplicationPagesLength() {
    return of(mockApplications.length);
  }

  deleteApplication = jest.fn().mockReturnValue(of(undefined));
  withdrawApplication = jest.fn().mockReturnValue(of(undefined));
}

const mockApplications: ApplicationOverviewDTO[] = [
  {
    applicationId: 'app-001',
    jobTitle: 'Postdoctoral Researcher - AI Ethics',
    researchGroup: 'Ethics & Society Lab',
    applicationState: 'SENT',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
  {
    applicationId: 'app-002',
    jobTitle: 'PhD in Machine Learning',
    researchGroup: 'ML Systems',
    applicationState: 'IN_REVIEW',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
  },
  {
    applicationId: 'app-003',
    jobTitle: 'Data Scientist Intern',
    researchGroup: 'Data Insights',
    applicationState: 'SAVED',
    createdAt: new Date().toISOString(), // now
  },
  {
    applicationId: 'app-004',
    jobTitle: 'Senior Research Scientist',
    researchGroup: 'Advanced Robotics',
    applicationState: 'ACCEPTED',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
  },
  {
    applicationId: 'app-005',
    jobTitle: 'Research Assistant - Computational Biology',
    researchGroup: 'Bioinformatics Lab',
    applicationState: 'REJECTED',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    applicationId: 'app-006',
    jobTitle: 'Junior Software Engineer',
    researchGroup: 'Platform Engineering',
    applicationState: 'WITHDRAWN',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  },
];

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

  it('should fetch total record count on init', () => {
    const applicationService = TestBed.inject(ApplicationResourceService);
    const spy = jest
      .spyOn(applicationService, 'getApplicationPagesLength')
      .mockReturnValue(of(new HttpResponse({ body: 42, status: 200 })));

    fixture = TestBed.createComponent(ApplicationOverviewForApplicantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000104');
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
    expect(reloadSpy).toHaveBeenCalled();
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
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('should calculate relative date correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const result = component.calculateDate(oneHourAgo.toISOString());
    expect(result).toBe('1 hour ago');
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
