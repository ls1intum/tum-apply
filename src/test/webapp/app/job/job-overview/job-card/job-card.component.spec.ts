import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobCardComponent } from 'app/job/job-overview/job-card/job-card.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('JobCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardComponent],
      providers: [provideRouter([]), provideTranslateMock(), provideFontAwesomeTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should format the start date via computed signal', () => {
    const jobCardFixture = TestBed.createComponent(JobCardComponent);
    jobCardFixture.componentRef.setInput('startDate', '2025-11-01');
    jobCardFixture.detectChanges();

    expect(jobCardFixture.componentInstance.formattedStartDate()).toBe('01.11.2025');
  });

  it('should navigate to the detail page on onViewDetails()', () => {
    const jobCardFixture = TestBed.createComponent(JobCardComponent);
    const router = TestBed.inject(Router);
    const routerNavigateSpy = vi.spyOn(router, 'navigate');

    jobCardFixture.componentRef.setInput('jobId', 'abc-123');
    jobCardFixture.detectChanges();

    jobCardFixture.componentInstance.onViewDetails();
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/job/detail/abc-123']);
  });

  it('should navigate to the job detail page on onViewJob()', () => {
    const jobCardFixture = TestBed.createComponent(JobCardComponent);
    const router = TestBed.inject(Router);
    const routerNavigateSpy = vi.spyOn(router, 'navigate');

    jobCardFixture.componentRef.setInput('jobId', 'abc-123');
    jobCardFixture.detectChanges();

    jobCardFixture.componentInstance.onViewDetails();
    expect(routerNavigateSpy).toHaveBeenCalledWith(['/job/detail/abc-123']);
  });
});
