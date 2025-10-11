import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { JobCardListComponent } from 'app/job/job-overview/job-card-list/job-card-list.component';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { ApplicationStatusExtended, JobCardComponent } from 'app/job/job-overview/job-card/job-card.component';
import { Job } from 'app/generated/model/job';
import LocationEnum = Job.LocationEnum;
import { By } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';

describe('JobCardListComponent', () => {
  let fixture: ComponentFixture<JobCardListComponent>;
  let component: JobCardListComponent;

  let jobService: {
    getAllFilters: ReturnType<typeof vi.fn>;
    getAvailableJobs: ReturnType<typeof vi.fn>;
  };

  let toast: {
    showErrorKey: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    jobService = {
      getAllFilters: vi.fn().mockReturnValue(
        of({
          jobNames: ['Job A', 'Job B'],
          fieldsOfStudy: ['AI', 'ML'],
          supervisorNames: ['Prof. X'],
        }),
      ),
      getAvailableJobs: vi.fn().mockReturnValue(
        of({
          content: [
            {
              jobId: '1',
              title: 'Test Job',
              professorName: 'Prof. Y',
              location: LocationEnum.Munich,
            },
          ],
          totalElements: 1,
        }),
      ),
    };

    toast = {
      showErrorKey: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [JobCardListComponent],
      providers: [
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        { provide: JobResourceApiService, useValue: jobService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load filters successfully', async () => {
    await component.loadAllFilter();

    expect(jobService.getAllFilters).toHaveBeenCalled();
    expect(component.allJobNames()).toEqual(['Job A', 'Job B']);
    expect(component.allFieldOfStudies()).toEqual(['AI', 'ML']);
    expect(component.allSupervisorNames()).toEqual(['Prof. X']);
    expect(toast.showErrorKey).not.toHaveBeenCalled();
  });

  it('should handle error when loading filters', async () => {
    jobService.getAllFilters.mockReturnValueOnce(throwError(() => new Error('fail')));

    await component.loadAllFilter();

    expect(toast.showErrorKey).toHaveBeenCalledWith('jobOverviewPage.errors.loadFilter');
    expect(component.allJobNames()).toEqual([]);
  });

  it('should load jobs successfully', async () => {
    await component.loadJobs();

    expect(jobService.getAvailableJobs).toHaveBeenCalled();
    expect(component.jobs().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
    expect(toast.showErrorKey).not.toHaveBeenCalled();
  });

  it('should handle error when loading jobs', async () => {
    jobService.getAvailableJobs.mockReturnValueOnce(throwError(() => new Error('fail')));

    await component.loadJobs();

    expect(toast.showErrorKey).toHaveBeenCalledWith('jobOverviewPage.errors.loadJobs');
  });

  it('should reset page and update search query on new search', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.searchQuery.set('Old query');
    component.page.set(5);

    component.onSearchEmit('New query');

    expect(component.page()).toBe(0);
    expect(component.searchQuery()).toBe('New query');
    expect(spy).toHaveBeenCalled();
  });

  it('should not reload jobs if search query is the same after trimming', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.searchQuery.set('Same query');
    component.onSearchEmit('   Same   query   ');

    expect(spy).not.toHaveBeenCalled();
  });

  it('should handle filter changes for jobTitle', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onFilterEmit({ filterId: 'jobTitle', selectedValues: ['Test Job'] });
    expect(component.selectedJobFilters()).toEqual(['Test Job']);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle filter changes for fieldOfStudies', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onFilterEmit({ filterId: 'fieldOfStudies', selectedValues: ['AI'] });
    expect(component.selectedFieldOfStudiesFilters()).toEqual(['AI']);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle filter changes for location', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onFilterEmit({ filterId: 'location', selectedValues: ['Munich'] });
    expect(component.selectedLocationFilters()).toEqual(['MUNICH']);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle filter changes for supervisor', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onFilterEmit({ filterId: 'supervisor', selectedValues: ['Prof. X'] });
    expect(component.selectedSupervisorFilters()).toEqual(['Prof. X']);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle sort emit correctly', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onSortEmit({ field: 'title', direction: 'ASC' });
    expect(component.page()).toBe(0);
    expect(component.sortBy()).toBe('title');
    expect(component.sortDirection()).toBe('ASC');
    expect(spy).toHaveBeenCalled();
  });

  it('should handle table lazy load correctly', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.loadOnTableEmit({ first: 16, rows: 8 });
    expect(component.page()).toBe(2);
    expect(component.pageSize()).toBe(8);
    expect(spy).toHaveBeenCalled();
  });

  it('should set empty jobs and totalRecords when API returns no content', async () => {
    jobService.getAvailableJobs.mockReturnValueOnce(of({ content: undefined, totalElements: undefined }));

    await component.loadJobs();

    expect(component.jobs()).toEqual([]);
    expect(component.totalRecords()).toBe(0);
  });

  it('should handle loadAllFilter when API returns null fields', async () => {
    jobService.getAllFilters.mockReturnValueOnce(of({ jobNames: null, fieldsOfStudy: null, supervisorNames: null }));

    await component.loadAllFilter();

    expect(component.allJobNames()).toEqual([]);
    expect(component.allFieldOfStudies()).toEqual([]);
    expect(component.allSupervisorNames()).toEqual([]);
  });

  it('should ignore unknown filterId in onFilterEmit', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onFilterEmit({ filterId: 'unknown', selectedValues: ['x'] });

    expect(component.selectedJobFilters()).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should clear search when only whitespace is entered', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.searchQuery.set('Existing');
    component.onSearchEmit('   ');

    expect(component.searchQuery()).toBe('');
    expect(spy).toHaveBeenCalled();
  });

  it('should update sort when called twice with different values', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onSortEmit({ field: 'title', direction: 'ASC' });
    component.onSortEmit({ field: 'startDate', direction: 'DESC' });

    expect(component.sortBy()).toBe('startDate');
    expect(component.sortDirection()).toBe('DESC');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should calculate page correctly when rows are missing in lazy load', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.loadOnTableEmit({ first: 16, rows: undefined });
    expect(component.page()).toBe(Math.floor(16 / component.pageSize()));
    expect(spy).toHaveBeenCalled();
  });

  it('should call loadAllFilter in constructor', () => {
    expect(jobService.getAllFilters).toHaveBeenCalled();
  });

  it('should render "no jobs" message when jobs are empty', () => {
    component.jobs.set([]);
    fixture.detectChanges();

    const noJobs = fixture.nativeElement.querySelector('.no-jobs-text');
    const cards = fixture.nativeElement.querySelectorAll('jhi-job-card');
    expect(noJobs).not.toBeNull();
    expect(noJobs.getAttribute('jhiTranslate')).toBe('jobOverviewPage.noJobsFound');
    expect(cards.length).toBe(0);
  });

  it('should render one job-card per job when jobs exist', () => {
    component.jobs.set([
      {
        jobId: '1',
        title: 'A',
        professorName: 'P1',
        location: LocationEnum.Heilbronn,
        fieldOfStudies: '',
      },
      {
        jobId: '2',
        title: 'B',
        professorName: 'P2',
        location: LocationEnum.Heilbronn,
        fieldOfStudies: '',
      },
    ]);
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.directive(JobCardComponent));
    expect(cards.length).toBe(2);
  });

  it('should pass NotYetApplied when applicationState is undefined', () => {
    component.jobs.set([
      {
        jobId: '1',
        title: 'A',
        professorName: 'P1',
        location: LocationEnum.Heilbronn,
        applicationState: undefined,
        fieldOfStudies: '',
      },
    ]);
    fixture.detectChanges();

    const cardDE = fixture.debugElement.query(By.directive(JobCardComponent));
    const child = cardDE.componentInstance as JobCardComponent;

    expect(child.applicationState()).toBe(ApplicationStatusExtended.NotYetApplied);
  });

  it('should use relativeTimeEnglish for EN and relativeTimeGerman after switching to DE', () => {
    component.jobs.set([
      {
        jobId: '1',
        title: 'A',
        professorName: 'P1',
        location: LocationEnum.Garching,
        relativeTimeEnglish: '2 days ago',
        relativeTimeGerman: 'vor 2 Tagen',
        fieldOfStudies: '',
      },
    ]);
    fixture.detectChanges();

    // initial EN
    let cardDE = fixture.debugElement.query(By.directive(JobCardComponent));
    let child = cardDE.componentInstance as JobCardComponent;
    expect(child.relativeTime()).toBe('2 days ago');

    // switch to German
    const translate = TestBed.inject(TranslateService) as Partial<TranslateService & { currentLang?: string }>;
    translate.onLangChange?.next({ lang: 'de', translations: {} });
    fixture.detectChanges();

    cardDE = fixture.debugElement.query(By.directive(JobCardComponent));
    child = cardDE.componentInstance as JobCardComponent;
    expect(child.relativeTime()).toBe('vor 2 Tagen');
  });

  it('should compute page 0 when first is undefined but rows is defined (lazy load)', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();
    component.page.set(5);
    component.loadOnTableEmit({ rows: 20 });
    expect(component.page()).toBe(0);
    expect(component.pageSize()).toBe(20);
    expect(spy).toHaveBeenCalled();
  });

  it('should default initial language to EN when translateService.currentLang is undefined', () => {
    // Grab the mock that provideTranslateMock already gave us
    const translate = TestBed.inject(TranslateService) as Partial<TranslateService & { currentLang?: string }>;

    // Override currentLang for this test
    translate.currentLang = undefined;

    // Recreate the component so constructor logic runs again
    const fixture2 = TestBed.createComponent(JobCardListComponent);
    const component2 = fixture2.componentInstance;
    fixture2.detectChanges();

    expect(component2.currentLanguage()).toBe('EN');
  });
});
