import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { JobCardListComponent } from 'app/job/job-overview/job-card-list/job-card-list.component';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { ToastService } from 'app/service/toast-service';
import { provideTranslateMock } from 'src/test/webapp/util/translate.mock';
import { provideFontAwesomeTesting } from 'src/test/webapp/util/fontawesome.testing';

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
          content: [{ jobId: '1', title: 'Test Job', professorName: 'Prof. Y' }],
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
});
