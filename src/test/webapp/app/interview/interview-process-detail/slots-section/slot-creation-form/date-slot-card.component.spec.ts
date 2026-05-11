import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  DateSlotCardComponent,
  SlotRange,
} from 'app/interview/interview-process-detail/slots-section/slot-creation-form/date-slot-card.component';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const testDate = new Date(2026, 3, 10);

describe('DateSlotCardComponent', () => {
  let fixture: ComponentFixture<DateSlotCardComponent>;
  let component: DateSlotCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateSlotCardComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DateSlotCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('date', testDate);
    fixture.componentRef.setInput('duration', 30);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add, remove, and toggle collapse on slot ranges', () => {
    component.addSingleSlot();
    const after1 = component['slotRanges']().length;
    expect(component['slotRanges']()[after1 - 1].type).toBe('single');

    component.addRange();
    const after2 = component['slotRanges']().length;
    expect(component['slotRanges']()[after2 - 1].type).toBe('range');

    component.removeRange(0);
    expect(component['slotRanges']()).toHaveLength(after2 - 1);

    component.toggleCollapse();
    expect(component['isCollapsed']()).toBe(true);
  });

  describe('Start Time Input', () => {
    it('should create a single slot when start time is set', () => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;

      component.onStartInput(index, '09:00');

      const range = component['slotRanges']()[index];
      expect(range.slots).toHaveLength(1);
      expect(range.endTimeString).toBe('09:30');
    });

    it.each([
      { value: '', label: 'empty string' },
      { value: undefined as unknown as string, label: 'undefined' },
    ])('should clear slots when start time is $label', ({ value }) => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;

      component.onStartInput(index, '09:00');
      component.onStartInput(index, value);

      expect(component['slotRanges']()[index].slots).toHaveLength(0);
    });
  });

  describe('Range Slot Generation', () => {
    it('should generate multiple slots for a range', () => {
      component.addRange();
      const index = component['slotRanges']().length - 1;

      component.onStartInput(index, '09:00');
      component.onEndInput(index, '10:30');

      const range = component['slotRanges']()[index];
      expect(range.slots).toHaveLength(3);
    });

    it('should generate no slots when start time is after end time', () => {
      component.addRange();
      const index = component['slotRanges']().length - 1;

      component.onStartInput(index, '11:00');
      component.onEndInput(index, '10:00');

      const range = component['slotRanges']()[index];
      expect(range.slots).toHaveLength(0);
    });

    it('should account for break duration between slots', () => {
      component.addRange();
      const index = component['slotRanges']().length - 1;

      component.onStartInput(index, '09:00');
      component.onEndInput(index, '10:30');
      component.onBreakInput(index, 15);

      const range = component['slotRanges']()[index];
      // 30min slot + 15min break = 45min per cycle, 90min total → 2 slots
      expect(range.slots).toHaveLength(2);
    });
  });

  describe('Location Input', () => {
    it.each([
      { location: 'https://zoom.us/meeting123', expectedStreamLink: 'https://zoom.us/meeting123', label: 'virtual' },
      { location: 'Room 101', expectedStreamLink: undefined, label: 'physical' },
    ])('should set streamLink to $expectedStreamLink for $label location', ({ location, expectedStreamLink }) => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;
      component.onStartInput(index, '09:00');

      component.onLocationInput(index, location);

      const range = component['slotRanges']()[index];
      expect(range.location).toBe(location);
      expect(range.slots[0].location).toBe(location);
      expect(range.slots[0].streamLink).toBe(expectedStreamLink);
    });
  });

  describe('Break Selection', () => {
    it('should switch to custom break mode when selecting -1', () => {
      component.addRange();
      const index = component['slotRanges']().length - 1;

      component.selectBreak(index, -1);

      expect(component['slotRanges']()[index].isCustomBreakMode).toBe(true);
    });

    it('should set break duration for preset value', () => {
      component.addRange();
      const index = component['slotRanges']().length - 1;

      component.selectBreak(index, 10);

      expect(component['slotRanges']()[index].breakDuration).toBe(10);
      expect(component['slotRanges']()[index].isCustomBreakMode).toBe(false);
    });
  });

  describe('getRanges / setRanges', () => {
    it('should set ranges from source and adjust date', () => {
      const sourceRanges: SlotRange[] = [
        {
          id: 'source-1',
          startTimeString: '09:00',
          endTimeString: '09:30',
          startTime: new Date(2026, 3, 5, 9, 0),
          endTime: new Date(2026, 3, 5, 9, 30),
          type: 'single',
          duration: 30,
          breakDuration: 0,
          isCustomBreakMode: false,
          location: 'Room A',
          slots: [
            {
              startDateTime: new Date(2026, 3, 5, 9, 0).toISOString(),
              endDateTime: new Date(2026, 3, 5, 9, 30).toISOString(),
              location: 'Room A',
            },
          ],
        },
      ];

      component.setRanges(sourceRanges);

      const ranges = component.getRanges();
      expect(ranges).toHaveLength(1);
      expect(ranges[0].location).toBe('Room A');
      expect(ranges[0].slots).toHaveLength(1);
    });
  });

  it.each([
    { description: 'overlapping slots', secondTime: '09:15', expected: 'gt0' as const },
    { description: 'non-overlapping slots', secondTime: '10:00', expected: 0 },
  ])('should detect conflicts for $description', ({ secondTime, expected }) => {
    component.addSingleSlot();
    const index1 = component['slotRanges']().length - 1;
    component.onStartInput(index1, '09:00');
    component.onLocationInput(index1, 'Room 1');

    component.addSingleSlot();
    const index2 = component['slotRanges']().length - 1;
    component.onStartInput(index2, secondTime);
    component.onLocationInput(index2, 'Room 2');

    if (expected === 'gt0') {
      expect(component['conflictingSlotKeys']().size).toBeGreaterThan(0);
    } else {
      expect(component['conflictingSlotKeys']().size).toBe(0);
    }
  });

  it('should emit slots on changes', () => {
    const emitSpy = vi.spyOn(component.slotsChange, 'emit');

    component.addSingleSlot();
    const index = component['slotRanges']().length - 1;
    component.onStartInput(index, '09:00');
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
