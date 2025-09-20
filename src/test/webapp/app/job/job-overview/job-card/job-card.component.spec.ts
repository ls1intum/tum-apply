// src/test/webapp/job/job-overview/job-card/job-card.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobCardComponent } from 'app/job/job-overview/job-card/job-card.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('JobCardComponent', () => {
  const translateServiceMock = {
    instant: vi.fn(key => key),
    get: vi.fn(key => ({ subscribe: vi.fn() })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: TranslateService, useValue: translateServiceMock }],
      // Verhindert Probleme mit untergeordneten Komponenten, die nicht importiert werden können
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('formatiert das Startdatum korrekt über computed signal', () => {
    const fixture = TestBed.createComponent(JobCardComponent);
    fixture.componentRef.setInput('startDate', '2025-11-01');
    fixture.detectChanges();
    expect(fixture.componentInstance.formattedStartDate()).toBe('01.11.2025');
  });

  it('navigiert zur Detailseite bei onViewDetails()', () => {
    const fixture = TestBed.createComponent(JobCardComponent);
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate');

    fixture.componentRef.setInput('jobId', 'abc-123');
    fixture.detectChanges();

    fixture.componentInstance.onViewDetails();
    expect(spy).toHaveBeenCalledWith(['/job/detail/abc-123']);
  });

  it('navigiert korrekt zu apply/edit/view', () => {
    const fixture = TestBed.createComponent(JobCardComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigationSpy = vi.spyOn(router, 'navigate');

    fixture.componentRef.setInput('jobId', 'abc-123');
    fixture.componentRef.setInput('applicationId', 'app-42');
    fixture.detectChanges();

    component.onApply();
    expect(navigationSpy).toHaveBeenCalledWith(['/application/form'], { queryParams: { job: 'abc-123' } });

    component.onEdit();
    expect(navigationSpy).toHaveBeenCalledWith(['/application/form'], { queryParams: { job: 'abc-123', application: 'app-42' } });

    component.onView();
    expect(navigationSpy).toHaveBeenCalledWith(['/application/detail/app-42']);
  });
});
