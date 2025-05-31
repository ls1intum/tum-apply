import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { of } from 'rxjs';
import { JobResourceService, PageJobCardDTO } from 'app/generated';

import { JobCardListComponent } from './job-card-list.component';

describe('JobCardListComponent', () => {
  let component: JobCardListComponent;
  let fixture: ComponentFixture<JobCardListComponent>;

  const mockJobService = {
    getAvailableJobs: jest.fn().mockReturnValue(
      of({
        content: [],
        totalElements: 0,
      } as PageJobCardDTO),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardListComponent],
      providers: [{ provide: JobResourceService, useValue: mockJobService }, provideHttpClientTesting()],
    }).compileComponents();

    const library = TestBed.inject(FaIconLibrary);
    library.addIcons(faGraduationCap);

    fixture = TestBed.createComponent(JobCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call loadJobs on init and populate jobs and totalRecords', () => {
    expect(mockJobService.getAvailableJobs).toHaveBeenCalledWith(0, component.pageSize);
    expect(component.jobs().length).toBe(0);
    expect(component.totalRecords()).toBe(0);
  });

  it('should call loadJobs with correct page and size on lazy load', () => {
    const spy = jest.spyOn(mockJobService, 'getAvailableJobs');
    component.onLazyLoad({ first: 16, rows: 8 });
    expect(spy).toHaveBeenCalledWith(2, 8);
  });

  it('should display no jobs message when jobs array is empty', () => {
    component.jobs.set([]);
    fixture.detectChanges();
    const noJobsText = fixture.nativeElement.querySelector('.no-jobs-text');
    expect(noJobsText).toBeTruthy();
    expect(noJobsText.textContent).toContain('No jobs found');
  });
});
