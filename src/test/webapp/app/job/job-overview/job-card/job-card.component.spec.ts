import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JobCardComponent } from 'app/job/job-overview/job-card/job-card.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('JobCardComponent', () => {
  let fixture: ComponentFixture<JobCardComponent>;
  let component: JobCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardComponent],
      providers: [provideRouter([]), provideTranslateMock(), provideFontAwesomeTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(JobCardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Formatted Start Date', () => {
    it('should format the start date via computed signal', () => {
      fixture.componentRef.setInput('startDate', '2025-11-01');
      fixture.detectChanges();

      expect(component.formattedStartDate()).toBe('01.11.2025');
    });
  });

  describe('Navigation', () => {
    it('should navigate to the detail page on onViewDetails()', () => {
      const router = TestBed.inject(Router);
      const routerNavigateSpy = vi.spyOn(router, 'navigate');

      fixture.componentRef.setInput('jobId', 'abc-123');
      fixture.detectChanges();

      component.onViewDetails();
      expect(routerNavigateSpy).toHaveBeenCalledWith(['/job/detail/abc-123']);
    });
  });

  describe('Formatted Workload', () => {
    it('should format full-time workload (40 hours)', () => {
      fixture.componentRef.setInput('workload', 40);
      fixture.detectChanges();

      expect(component.formattedWorkload()).toBe('jobDetailPage.workload.fullTime');
    });

    it('should format part-time workload with percentage', () => {
      fixture.componentRef.setInput('workload', 20);
      fixture.detectChanges();

      expect(component.formattedWorkload()).toBe('jobDetailPage.workload.partTime');
    });

    it('should return undefined when workload is not set', () => {
      fixture.detectChanges();

      expect(component.formattedWorkload()).toBeUndefined();
    });
  });

  describe('Formatted Contract Duration', () => {
    it('should return the contract duration when set', () => {
      fixture.componentRef.setInput('contractDuration', 12);
      fixture.detectChanges();

      expect(component.formattedContractDuration()).toBe(12);
    });

    it('should return undefined when contract duration is not set', () => {
      fixture.detectChanges();

      expect(component.formattedContractDuration()).toBeUndefined();
    });
  });
});
