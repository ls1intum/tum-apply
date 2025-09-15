import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobCardComponent } from '../../../../../../../main/webapp/app/job/job-overview/job-card/job-card.component';
import { Component } from '@angular/core';

// Mock-Komponente für den Fall, dass Template-Auflösung weiterhin problematisch ist
@Component({
  selector: 'jhi-job-card',
  template: '<div>Mock Job Card</div>',
})
class MockJobCardComponent extends JobCardComponent {}

describe('JobCardComponent (vitest)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockJobCardComponent], // Nutze die Mock-Komponente statt der echten
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('formats start date via computed signal', () => {
    const fixture = TestBed.createComponent(MockJobCardComponent);
    const comp = fixture.componentInstance;

    fixture.componentRef.setInput('startDate', '2025-11-01');
    fixture.detectChanges();

    expect(comp.formattedStartDate()).toBe('01.11.2025');
  });

  it('navigates to details when onViewDetails() is called', () => {
    const fixture = TestBed.createComponent(MockJobCardComponent);
    const comp = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate');

    fixture.componentRef.setInput('jobId', 'abc-123');
    fixture.detectChanges();

    comp.onViewDetails();
    expect(spy).toHaveBeenCalledWith(['/job/detail/abc-123']);
  });
});
