import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { DateHeaderComponent } from 'app/interview/interview-process-detail/slots-section/date-header/date-header.component';
import { provideTranslateMock, createTranslateServiceMock } from 'util/translate.mock';

describe('DateHeaderComponent', () => {
  let fixture: ComponentFixture<DateHeaderComponent>;
  let component: DateHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateHeaderComponent],
      providers: [provideTranslateMock()],
    }).compileComponents();

    fixture = TestBed.createComponent(DateHeaderComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('slotsText', () => {
    it.each([
      { count: 1, expectedKey: 'interview.slots.slotsCountSingular' },
      { count: 5, expectedKey: 'interview.slots.slotsCountPlural' },
    ])('should use $expectedKey for count=$count', ({ count, expectedKey }) => {
      fixture.componentRef.setInput('date', new Date('2026-03-15'));
      fixture.componentRef.setInput('slotCount', count);
      fixture.detectChanges();

      const text = component.slotsText();
      expect(text).toContain(`${count}`);
      expect(text).toContain(expectedKey);
    });
  });
});
