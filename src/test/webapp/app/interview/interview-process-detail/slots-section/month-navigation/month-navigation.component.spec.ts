import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { MonthNavigationComponent } from 'app/interview/interview-process-detail/slots-section/month-navigation/month-navigation.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';

describe('MonthNavigationComponent', () => {
  let fixture: ComponentFixture<MonthNavigationComponent>;
  let component: MonthNavigationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthNavigationComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthNavigationComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should accept currentMonth input', () => {
    fixture.componentRef.setInput('currentMonth', 'March 2026');
    fixture.detectChanges();

    expect(component.currentMonth()).toBe('March 2026');
  });

  it('should default isClosed to false', () => {
    fixture.componentRef.setInput('currentMonth', 'March 2026');
    fixture.detectChanges();

    expect(component.isClosed()).toBe(false);
  });

  it.each([{ outputName: 'previousMonth' as const }, { outputName: 'nextMonth' as const }, { outputName: 'addSlots' as const }])(
    'should have $outputName output',
    ({ outputName }) => {
      fixture.componentRef.setInput('currentMonth', 'March 2026');
      fixture.detectChanges();

      const spy = vi.spyOn(component[outputName], 'emit');
      component[outputName].emit();

      expect(spy).toHaveBeenCalledOnce();
    },
  );
});
