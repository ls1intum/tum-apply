import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '@angular/router';
import { JobsPreviewSectionComponent } from 'app/shared/pages/landing-page/jobs-preview-section/jobs-preview-section.component';
import { JobResourceApiService } from 'app/generated/api/jobResourceApi.service';
import { createRouterMock, provideRouterMock } from 'util/router.mock';
import { createToastServiceMock, provideToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

class JobResourceApiServiceMock {
  getAvailableJobs = vi.fn();
}

describe('JobsPreviewSectionComponent', () => {
  let fixture: ComponentFixture<JobsPreviewSectionComponent>;
  let component: JobsPreviewSectionComponent;
  let api: JobResourceApiServiceMock;
  let mockToast: ReturnType<typeof createToastServiceMock>;

  const mockJob = {
    jobId: 'job1',
    title: 'Job 1',
    fieldOfStudies: 'CS',
    location: 'Garching',
    professorName: 'Prof. John',
    workload: 20,
    startDate: '2025-09-01',
    applicationId: undefined,
    contractDuration: 6,
    imageUrl: undefined,
  };

  const mockResponse = { content: [mockJob, { ...mockJob, jobId: 'job2' }], totalElements: 2 };

  beforeEach(async () => {
    api = new JobResourceApiServiceMock();
    api.getAvailableJobs.mockReturnValue(of(mockResponse));
    mockToast = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [JobsPreviewSectionComponent],
      providers: [
        { provide: JobResourceApiService, useValue: api },
        provideToastServiceMock(mockToast),
        provideTranslateMock(),
        provideRouterMock(createRouterMock()),
        provideFontAwesomeTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobsPreviewSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load jobs on init', () => {
    expect(api.getAvailableJobs).toHaveBeenCalledWith(4, 0, undefined, undefined, undefined, 'startDate', 'DESC');
    expect(component.jobs().length).toBe(2);
  });

  it('should navigate to job overview on See more click', () => {
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate');
    component.goToJobOverview();
    expect(spy).toHaveBeenCalledWith(['/job-overview']);
  });

  it('should not set header image when job.imageUrl is missing', () => {
    fixture.detectChanges();
    const jobCardEl = fixture.nativeElement.querySelector('jhi-job-card');
    expect(jobCardEl).toBeTruthy();
    const header = jobCardEl.querySelector('div.relative');
    // When there's no job image, background-image should be set to the example image
    expect(header.style.backgroundImage).toContain('https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80');
  });

  it('should handle error on load and show toast', async () => {
    api.getAvailableJobs.mockReturnValueOnce(throwError(() => new Error('fail')));
    await component.loadJobs();
    expect(component.jobs()).toEqual([]);
    expect(mockToast.showErrorKey).toHaveBeenCalledWith('landingPage.jobsPreview.loadFailed');
  });

  it('should show no jobs message when API returns empty content', async () => {
    api.getAvailableJobs.mockReturnValueOnce(of({ content: [], totalElements: 0 }));
    await component.loadJobs();
    fixture.detectChanges();

    expect(component.jobs()).toEqual([]);
    const noJobsEl = fixture.nativeElement.querySelector('.text-center p');
    expect(noJobsEl).toBeTruthy();
    expect(noJobsEl.getAttribute('jhiTranslate')).toBe('landingPage.jobsPreview.noJobs');
  });

  it('should handle missing content and set empty jobs', async () => {
    api.getAvailableJobs.mockReturnValueOnce(of({ totalElements: 0 }));
    await component.loadJobs();
    expect(component.jobs()).toEqual([]);
  });
});
