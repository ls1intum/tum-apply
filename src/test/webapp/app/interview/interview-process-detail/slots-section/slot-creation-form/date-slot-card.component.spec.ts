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

  describe('Collapse', () => {
    it('should toggle collapsed state', () => {
      expect(component['isCollapsed']()).toBe(false);

      component.toggleCollapse();
      expect(component['isCollapsed']()).toBe(true);

      component.toggleCollapse();
      expect(component['isCollapsed']()).toBe(false);
    });
  });

  describe('Add Slots', () => {
    it('should add a single slot with default values', () => {
      const initialCount = component['slotRanges']().length;
      component.addSingleSlot();

      const ranges = component['slotRanges']();
      expect(ranges).toHaveLength(initialCount + 1);

      const added = ranges[ranges.length - 1];
      expect(added.type).toBe('single');
      expect(added.duration).toBe(30);
      expect(added.startTime).toBeNull();
      expect(added.location).toBe('');
    });

    it('should add a range with default values', () => {
      const initialCount = component['slotRanges']().length;
      component.addRange();

      const ranges = component['slotRanges']();
      expect(ranges).toHaveLength(initialCount + 1);

      const added = ranges[ranges.length - 1];
      expect(added.type).toBe('range');
      expect(added.startTime).toBeNull();
      expect(added.endTime).toBeNull();
    });
  });

  describe('Remove Slots', () => {
    it('should remove a range by index', () => {
      component.addSingleSlot();
      component.addSingleSlot();
      const countBefore = component['slotRanges']().length;

      component.removeRange(0);

      expect(component['slotRanges']()).toHaveLength(countBefore - 1);
    });

    it('should remove a specific slot from a range', () => {
      component.addRange();
      const rangeIndex = component['slotRanges']().length - 1;

      component.onStartInput(rangeIndex, '09:00');
      component.onEndInput(rangeIndex, '10:30');

      const slotCountBefore = component['slotRanges']()[rangeIndex].slots.length;
      if (slotCountBefore > 0) {
        component.removeSlot(rangeIndex, 0);
        expect(component['slotRanges']()[rangeIndex].slots).toHaveLength(slotCountBefore - 1);
      }
    });
  });

  describe('Start Time Input', () => {
    it('should create a single slot when start time is set for single type', () => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;

      component.onStartInput(index, '09:00');

      const range = component['slotRanges']()[index];
      expect(range.slots).toHaveLength(1);
      expect(range.endTimeString).toBe('09:30');
    });

    it('should clear slots when start time is cleared for single type', () => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;

      component.onStartInput(index, '09:00');
      component.onStartInput(index, '');

      const range = component['slotRanges']()[index];
      expect(range.slots).toHaveLength(0);
      expect(range.endTime).toBeNull();
    });

    it('should handle undefined start time input', () => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;

      component.onStartInput(index, undefined as unknown as string);

      const range = component['slotRanges']()[index];
      expect(range.slots).toHaveLength(0);
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
    it('should update location for all slots in a range', () => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;
      component.onStartInput(index, '09:00');

      component.onLocationInput(index, 'Room 101');

      const range = component['slotRanges']()[index];
      expect(range.location).toBe('Room 101');
      expect(range.slots[0].location).toBe('Room 101');
    });

    it('should set streamLink for virtual locations', () => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;
      component.onStartInput(index, '09:00');

      component.onLocationInput(index, 'https://zoom.us/meeting123');

      const range = component['slotRanges']()[index];
      expect(range.slots[0].streamLink).toBe('https://zoom.us/meeting123');
    });

    it('should not set streamLink for physical locations', () => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;
      component.onStartInput(index, '09:00');

      component.onLocationInput(index, 'Room 101');

      const range = component['slotRanges']()[index];
      expect(range.slots[0].streamLink).toBeUndefined();
    });

    it('should handle undefined location input', () => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;
      component.onStartInput(index, '09:00');

      component.onLocationInput(index, undefined as unknown as string);

      const range = component['slotRanges']()[index];
      expect(range.location).toBe('');
    });
  });

  describe('Break Selection', () => {
    it('should switch to custom break mode when selecting -1', () => {
      component.addRange();
      const index = component['slotRanges']().length - 1;

      component.selectBreak(index, -1);

      expect(component['slotRanges']()[index].isCustomBreakMode).toBe(true);
    });

    it.each([
      { breakValue: 0, label: '0min' },
      { breakValue: 5, label: '5min' },
      { breakValue: 10, label: '10min' },
      { breakValue: 15, label: '15min' },
    ])('should set break duration to $breakValue for preset $label', ({ breakValue }) => {
      component.addRange();
      const index = component['slotRanges']().length - 1;

      component.selectBreak(index, breakValue);

      expect(component['slotRanges']()[index].breakDuration).toBe(breakValue);
      expect(component['slotRanges']()[index].isCustomBreakMode).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('should compute allSlots from all ranges', () => {
      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;
      component.onStartInput(index, '09:00');

      component.addSingleSlot();
      const index2 = component['slotRanges']().length - 1;
      component.onStartInput(index2, '10:00');

      expect(component['allSlots']().length).toBeGreaterThanOrEqual(2);
    });

    it('should detect hasSingleSlots', () => {
      component.addSingleSlot();

      expect(component['hasSingleSlots']()).toBe(true);
    });

    it('should detect hasRangeSlots', () => {
      component.addRange();

      expect(component['hasRangeSlots']()).toBe(true);
    });
  });

  describe('getRanges / setRanges', () => {
    it('should return current ranges via getRanges', () => {
      component.addSingleSlot();
      const ranges = component.getRanges();

      expect(ranges.length).toBeGreaterThanOrEqual(1);
      expect(ranges[ranges.length - 1].type).toBe('single');
    });

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

  describe('Conflict Detection', () => {
    it('should detect conflicts between slots from different ranges', () => {
      component.addSingleSlot();
      const index1 = component['slotRanges']().length - 1;
      component.onStartInput(index1, '09:00');
      component.onLocationInput(index1, 'Room 1');

      component.addSingleSlot();
      const index2 = component['slotRanges']().length - 1;
      component.onStartInput(index2, '09:15');
      component.onLocationInput(index2, 'Room 2');

      expect(component['conflictingSlotKeys']().size).toBeGreaterThan(0);
    });

    it('should not detect conflicts for non-overlapping slots from different ranges', () => {
      component.addSingleSlot();
      const index1 = component['slotRanges']().length - 1;
      component.onStartInput(index1, '09:00');
      component.onLocationInput(index1, 'Room 1');

      component.addSingleSlot();
      const index2 = component['slotRanges']().length - 1;
      component.onStartInput(index2, '10:00');
      component.onLocationInput(index2, 'Room 2');

      expect(component['conflictingSlotKeys']().size).toBe(0);
    });
  });

  describe('Emit Slots', () => {
    it('should emit slots on changes', () => {
      const emitSpy = vi.spyOn(component.slotsChange, 'emit');

      component.addSingleSlot();
      const index = component['slotRanges']().length - 1;
      component.onStartInput(index, '09:00');
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalled();
    });
  });
});
