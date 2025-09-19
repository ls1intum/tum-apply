// src/test/webapp/job/job-overview/job-card/job-card.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobCardComponent } from 'app/job/job-overview/job-card/job-card.component';

describe('JobCardComponent (with plugin)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        // Minimal stub for TranslateService (component injects it)
        { provide: (await import('@ngx-translate/core')).TranslateService, useValue: {} },
      ],
    }).compileComponents();
  });

  it('formats start date via computed signal', () => {
    const f = TestBed.createComponent(JobCardComponent);
    f.componentRef.setInput('startDate', '2025-11-01');
    f.detectChanges();
    expect(f.componentInstance.formattedStartDate()).toBe('01.11.2025');
  });

  it('navigates to details on onViewDetails()', () => {
    const f = TestBed.createComponent(JobCardComponent);
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate');

    f.componentRef.setInput('jobId', 'abc-123');
    f.detectChanges();

    f.componentInstance.onViewDetails();
    expect(spy).toHaveBeenCalledWith(['/job/detail/abc-123']);
  });

  it('navigates to apply/edit/view correctly', () => {
    const f = TestBed.createComponent(JobCardComponent);
    const c = f.componentInstance;
    const r = TestBed.inject(Router);
    const nav = vi.spyOn(r, 'navigate');

    f.componentRef.setInput('jobId', 'abc-123');
    f.componentRef.setInput('applicationId', 'app-42');
    f.detectChanges();

    c.onApply();
    expect(nav).toHaveBeenCalledWith(['/application/form'], { queryParams: { job: 'abc-123' } });

    c.onEdit();
    expect(nav).toHaveBeenCalledWith(['/application/form'], { queryParams: { job: 'abc-123', application: 'app-42' } });

    c.onView();
    expect(nav).toHaveBeenCalledWith(['/application/detail/app-42']);
  });
});
