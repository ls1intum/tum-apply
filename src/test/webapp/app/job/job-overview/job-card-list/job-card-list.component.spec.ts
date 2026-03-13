import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { JobCardListComponent } from 'app/job/job-overview/job-card-list/job-card-list.component';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';
import { ApplicationStatusExtended, JobCardComponent } from 'app/job/job-overview/job-card/job-card.component';
import * as DropdownOptions from 'app/job/dropdown-options';
import { Job } from 'app/generated/model/job';
import LocationEnum = Job.LocationEnum;
import { By } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { createToastServiceMock, provideToastServiceMock } from '../../../../util/toast-service.mock';

describe('JobCardListComponent', () => {
  let fixture: ComponentFixture<JobCardListComponent>;
  let component: JobCardListComponent;

  let jobService: {
    getAllFilters: ReturnType<typeof vi.fn>;
    getAvailableJobs: ReturnType<typeof vi.fn>;
  };

  let mockToastService = createToastServiceMock();

  beforeEach(async () => {
    jobService = {
      getAllFilters: vi.fn().mockReturnValue(
        of({
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

    await TestBed.configureTestingModule({
      imports: [JobCardListComponent],
      providers: [
        { provide: JobResourceApiService, useValue: jobService },
        provideTranslateMock(),
        provideFontAwesomeTesting(),
        provideToastServiceMock(mockToastService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should load filters successfully', async () => {
    await component.loadAllFilter();

    expect(jobService.getAllFilters).toHaveBeenCalled();
    // allFieldOfStudies is a static list of i18n keys from DropdownOptions
    expect(component.allFieldOfStudies).toEqual(DropdownOptions.fieldsOfStudies.map(option => option.name));
    expect(component.allSupervisorNames()).toEqual(['Prof. X']);
    expect(mockToastService.showErrorKey).not.toHaveBeenCalled();
  });

  it('should handle error when loading filters', async () => {
    jobService.getAllFilters.mockReturnValueOnce(throwError(() => new Error('fail')));

    await component.loadAllFilter();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobOverviewPage.errors.loadFilter');
  });

  it('should load jobs successfully', async () => {
    await component.loadJobs();

    expect(jobService.getAvailableJobs).toHaveBeenCalled();
    expect(component.jobs().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('should handle error when loading jobs', async () => {
    jobService.getAvailableJobs.mockReturnValueOnce(throwError(() => new Error('fail')));

    await component.loadJobs();

    expect(mockToastService.showErrorKey).toHaveBeenCalledWith('jobOverviewPage.errors.loadJobs');
  });

  it('should reset page and update search query on new search', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.searchQuery.set('Old query');
    component.page.set(5);

    component.onSearchEmit('New query');
    fixture.detectChanges();

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

  it('should handle filter changes for fieldOfStudies', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onFilterEmit({ filterId: 'fieldOfStudies', selectedValues: ['AI'] });
    fixture.detectChanges();
    expect(component.selectedFieldOfStudiesFilters()).toEqual(['AI']);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle filter changes for location', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onFilterEmit({
      filterId: 'location',
      selectedValues: ['jobCreationForm.basicInformationSection.locations.Munich'],
    });
    fixture.detectChanges();
    expect(component.selectedLocationFilters()).toEqual(['MUNICH']);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle filter changes for supervisor', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onFilterEmit({ filterId: 'supervisor', selectedValues: ['Prof. X'] });
    fixture.detectChanges();
    expect(component.selectedSupervisorFilters()).toEqual(['Prof. X']);
    expect(spy).toHaveBeenCalled();
  });

  it('should handle sort emit correctly', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onSortEmit({ field: 'title', direction: 'ASC' });
    fixture.detectChanges();
    expect(component.page()).toBe(0);
    expect(component.sortBy()).toBe('title');
    expect(component.sortDirection()).toBe('ASC');
    expect(spy).toHaveBeenCalled();
  });

  it('should handle table lazy load correctly', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.loadOnTableEmit({ first: 16, rows: 8 });
    fixture.detectChanges();
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

    // allFieldOfStudies remains the static list of i18n keys
    expect(component.allFieldOfStudies).toEqual(DropdownOptions.fieldsOfStudies.map(option => option.name));
    expect(component.allSupervisorNames()).toEqual([]);
  });

  it('should ignore unknown filterId in onFilterEmit', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onFilterEmit({ filterId: 'unknown', selectedValues: ['x'] });

    expect(spy).not.toHaveBeenCalled();
  });

  it('should clear search when only whitespace is entered', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.searchQuery.set('Existing');
    component.onSearchEmit('   ');
    fixture.detectChanges();

    expect(component.searchQuery()).toBe('');
    expect(spy).toHaveBeenCalled();
  });

  it('should update sort when called twice with different values', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.onSortEmit({ field: 'title', direction: 'ASC' });
    fixture.detectChanges();
    component.onSortEmit({ field: 'startDate', direction: 'DESC' });
    fixture.detectChanges();

    expect(component.sortBy()).toBe('startDate');
    expect(component.sortDirection()).toBe('DESC');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should calculate page correctly when rows are missing in lazy load', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();

    component.loadOnTableEmit({ first: 16, rows: undefined });
    fixture.detectChanges();
    expect(component.page()).toBe(Math.floor(16 / component.pageSize()));
    expect(spy).toHaveBeenCalled();
  });

  it('should call loadAllFilter in constructor', () => {
    expect(jobService.getAllFilters).toHaveBeenCalled();
  });

  it('should render one job-card per job when jobs exist', () => {
    component.jobs.set([
      {
        jobId: '1',
        title: 'A',
        professorName: 'P1',
        location: LocationEnum.Heilbronn,
        departmentName: 'D1',
      },
      {
        jobId: '2',
        title: 'B',
        professorName: 'P2',
        location: LocationEnum.Heilbronn,
        departmentName: 'D2',
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
        departmentName: 'D1',
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
        departmentName: 'D1',
      },
    ]);
    fixture.detectChanges();

    // initial EN
    let cardDE = fixture.debugElement.query(By.directive(JobCardComponent));
    let child = cardDE.componentInstance as JobCardComponent;
    expect(child.relativeTime()).toBe('2 days ago');

    // switch to German
    const translate = TestBed.inject(TranslateService) as Partial<TranslateService & { currentLang?: string }>;
    (translate as TranslateService).use('de');
    fixture.detectChanges();

    cardDE = fixture.debugElement.query(By.directive(JobCardComponent));
    child = cardDE.componentInstance as JobCardComponent;
    expect(child.relativeTime()).toBe('vor 2 Tagen');
  });

  it('should compute page 0 when first is undefined but rows is defined (lazy load)', async () => {
    const spy = vi.spyOn(component, 'loadJobs').mockResolvedValue();
    component.page.set(5);
    component.loadOnTableEmit({ rows: 20 });
    fixture.detectChanges();
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
