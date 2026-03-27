import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { SlotCreationFormComponent } from 'app/interview/interview-process-detail/slots-section/slot-creation-form/slot-creation-form.component';
import { InterviewResourceApi } from 'app/generated/api/interview-resource-api';
import { InterviewSlotDTO } from 'app/generated/models/interview-slot-dto';
import { ConflictDataDTO } from 'app/generated/models/conflict-data-dto';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

describe('SlotCreationFormComponent', () => {
  let fixture: ComponentFixture<SlotCreationFormComponent>;
  let component: SlotCreationFormComponent;
  let mockInterviewService: Partial<InterviewResourceApi>;
  let toastMock: ToastServiceMock;

  const conflictData: ConflictDataDTO = {
    currentProcessId: 'proc-1',
    slots: [],
  };

  beforeEach(async () => {
    mockInterviewService = {
      createSlots: vi.fn().mockReturnValue(of([])),
      getConflictDataForDate: vi.fn().mockReturnValue(of(conflictData)),
    };
    toastMock = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [SlotCreationFormComponent],
      providers: [
        provideTranslateMock(),
        provideToastServiceMock(toastMock),
        provideFontAwesomeTesting(),
        { provide: InterviewResourceApi, useValue: mockInterviewService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SlotCreationFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('processId', 'proc-1');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Duration Selection', () => {
    it.each([
      { value: 30, expectedDuration: 30 },
      { value: 45, expectedDuration: 45 },
      { value: 60, expectedDuration: 60 },
      { value: 90, expectedDuration: 90 },
    ])('should set duration to $expectedDuration when selecting preset $value', ({ value, expectedDuration }) => {
      component.selectDuration(value);

      expect(component['duration']()).toBe(expectedDuration);
      expect(component['isCustomDurationMode']()).toBe(false);
    });

    it('should switch to custom duration mode when selecting -1', () => {
      component.selectDuration(-1);

      expect(component['isCustomDurationMode']()).toBe(true);
    });

    it('should preserve current duration as custom when switching to custom mode', () => {
      component.selectDuration(45);
      component.selectDuration(-1);

      expect(component['customDuration']()).toBe(45);
    });

    it('should set duration error when custom value is 0', () => {
      component.onCustomDurationInput(0);

      expect(component['durationError']()).toBe('interview.slots.create.validation.durationPositive');
    });

    it('should clear duration error and update duration for valid custom value', () => {
      component.onCustomDurationInput(0);
      component.onCustomDurationInput(25);

      expect(component['durationError']()).toBeNull();
      expect(component['duration']()).toBe(25);
    });

    it('should handle undefined custom duration input', () => {
      component.onCustomDurationInput(undefined);

      expect(component['durationError']()).toBe('interview.slots.create.validation.durationPositive');
    });
  });

  describe('Date Selection', () => {
    it('should add a date to selection', () => {
      const date = new Date(2026, 3, 10);
      component.onDateSelect(date);

      expect(component['selectedDatesSignal']()).toHaveLength(1);
      expect(component['selectedDatesSignal']()[0].getTime()).toBe(date.getTime());
    });

    it('should deselect a date when clicked again', () => {
      const date = new Date(2026, 3, 10);
      component.onDateSelect(date);
      component.onDateSelect(date);

      expect(component['selectedDatesSignal']()).toHaveLength(0);
    });

    it('should sort dates chronologically', () => {
      const date1 = new Date(2026, 3, 15);
      const date2 = new Date(2026, 3, 10);
      component.onDateSelect(date1);
      component.onDateSelect(date2);

      expect(component['sortedDates']()[0].getTime()).toBe(date2.getTime());
      expect(component['sortedDates']()[1].getTime()).toBe(date1.getTime());
    });

    it('should clear all dates when null is passed', () => {
      const date = new Date(2026, 3, 10);
      component.onDateSelect(date);
      component.onDateSelect(null);

      expect(component['selectedDatesSignal']()).toHaveLength(0);
    });

    it('should load conflict data for each selected date', () => {
      const date = new Date(2026, 3, 10);
      component.onDateSelect(date);

      expect(mockInterviewService.getConflictDataForDate).toHaveBeenCalledOnce();
    });

    it('should remove a date from selection', () => {
      const date1 = new Date(2026, 3, 10);
      const date2 = new Date(2026, 3, 11);
      component.onDateSelect(date1);
      component.onDateSelect(date2);

      component.removeDate(date1);

      expect(component['selectedDatesSignal']()).toHaveLength(1);
      expect(component['selectedDatesSignal']()[0].getTime()).toBe(date2.getTime());
    });
  });

  describe('Slots Management', () => {
    it('should update slots for a specific date', () => {
      const date = new Date(2026, 3, 10);
      const slots: InterviewSlotDTO[] = [
        {
          startDateTime: '2026-04-10T09:00:00',
          endDateTime: '2026-04-10T09:30:00',
          location: 'Room 1',
        },
      ];

      component.updateSlotsForDate(date, slots);

      expect(component['slotsByDate']().size).toBe(1);
    });
  });

  describe('Close', () => {
    it('should emit visibleChange and reset state on close', () => {
      const emitSpy = vi.spyOn(component.visibleChange, 'emit');
      const date = new Date(2026, 3, 10);
      component.onDateSelect(date);

      component.close();

      expect(emitSpy).toHaveBeenCalledWith(false);
      expect(component['selectedDatesSignal']()).toHaveLength(0);
      expect(component['slotsByDate']().size).toBe(0);
      expect(component['isSubmitting']()).toBe(false);
    });
  });

  describe('Submit', () => {
    it('should show error toast when no slots exist', async () => {
      await component.submit();

      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.slots.create.error.noSlots');
      expect(mockInterviewService.createSlots).not.toHaveBeenCalled();
    });

    it('should show validation error when location is missing', async () => {
      const date = new Date(2026, 3, 10);
      const slots: InterviewSlotDTO[] = [
        {
          startDateTime: '2026-04-10T09:00:00',
          endDateTime: '2026-04-10T09:30:00',
          location: '',
        },
      ];
      component.updateSlotsForDate(date, slots);

      await component.submit();

      expect(component['showValidationErrors']()).toBe(true);
      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.slots.create.validation.locationRequired');
      expect(mockInterviewService.createSlots).not.toHaveBeenCalled();
    });

    it('should create slots and emit success', async () => {
      const createdSlots: InterviewSlotDTO[] = [
        {
          id: 'slot-1',
          startDateTime: '2026-04-10T09:00:00',
          endDateTime: '2026-04-10T09:30:00',
          location: 'Room 1',
        },
      ];
      (mockInterviewService.createSlots as ReturnType<typeof vi.fn>).mockReturnValue(of(createdSlots));

      const date = new Date(2026, 3, 10);
      const slots: InterviewSlotDTO[] = [
        {
          startDateTime: '2026-04-10T09:00:00',
          endDateTime: '2026-04-10T09:30:00',
          location: 'Room 1',
        },
      ];
      component.updateSlotsForDate(date, slots);

      const successSpy = vi.spyOn(component.success, 'emit');
      await component.submit();

      expect(mockInterviewService.createSlots).toHaveBeenCalledOnce();
      expect(toastMock.showSuccessKey).toHaveBeenCalledWith('interview.slots.create.success');
      expect(successSpy).toHaveBeenCalledWith(createdSlots);
      expect(component['isSubmitting']()).toBe(false);
    });

    it.each([
      {
        label: 'conflict error on 409',
        error: () => new HttpErrorResponse({ status: 409 }),
        expectedKey: 'interview.slots.create.error.conflict',
      },
      { label: 'generic error on other failures', error: () => new Error('fail'), expectedKey: 'interview.slots.create.error.generic' },
    ])('should show $label', async ({ error, expectedKey }) => {
      (mockInterviewService.createSlots as ReturnType<typeof vi.fn>).mockReturnValue(throwError(error));

      const date = new Date(2026, 3, 10);
      const slots: InterviewSlotDTO[] = [
        {
          startDateTime: '2026-04-10T09:00:00',
          endDateTime: '2026-04-10T09:30:00',
          location: 'Room 1',
        },
      ];
      component.updateSlotsForDate(date, slots);

      await component.submit();

      expect(toastMock.showErrorKey).toHaveBeenCalledWith(expectedKey);
      expect(component['isSubmitting']()).toBe(false);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect no conflicts when slotsByDate is empty', () => {
      expect(component['serverConflicts']().size).toBe(0);
      expect(component['hasConflicts']()).toBe(false);
    });

    it('should detect server conflicts when existing slots overlap', () => {
      const conflictDataWithSlots: ConflictDataDTO = {
        currentProcessId: 'proc-1',
        slots: [
          {
            id: 'existing-1',
            startDateTime: '2026-04-10T09:00:00',
            endDateTime: '2026-04-10T09:30:00',
            interviewProcessId: 'proc-1',
            isBooked: false,
          },
        ],
      };

      component['conflictDataByDate'].set(new Map([['2026-04-10', conflictDataWithSlots]]));

      const slots: InterviewSlotDTO[] = [
        {
          startDateTime: '2026-04-10T09:00:00',
          endDateTime: '2026-04-10T09:30:00',
          location: 'Room 1',
        },
      ];
      component['slotsByDate'].set(new Map([['2026-04-10', slots]]));

      expect(component['serverConflicts']().size).toBe(1);
      expect(component['hasConflicts']()).toBe(true);
    });

    it.each([
      {
        label: 'overlapping slots',
        secondStart: '2026-04-10T09:15:00',
        secondEnd: '2026-04-10T09:45:00',
        expectedInternal: true,
        expectedConflicts: true,
      },
      {
        label: 'non-overlapping slots',
        secondStart: '2026-04-10T09:30:00',
        secondEnd: '2026-04-10T10:00:00',
        expectedInternal: false,
        expectedConflicts: false,
      },
    ])(
      'should detect internal conflicts=$expectedInternal for $label',
      ({ secondStart, secondEnd, expectedInternal, expectedConflicts }) => {
        const slots: InterviewSlotDTO[] = [
          {
            startDateTime: '2026-04-10T09:00:00',
            endDateTime: '2026-04-10T09:30:00',
            location: 'Room 1',
          },
          {
            startDateTime: secondStart,
            endDateTime: secondEnd,
            location: 'Room 1',
          },
        ];

        component['slotsByDate'].set(new Map([['2026-04-10', slots]]));

        expect(component['hasInternalConflicts']()).toBe(expectedInternal);
        if (expectedConflicts !== undefined) {
          expect(component['hasConflicts']()).toBe(expectedConflicts);
        }
      },
    );

    it('should prioritize BOOKED_OTHER_PROCESS over SAME_PROCESS conflicts', () => {
      const conflictDataWithBookedSlot: ConflictDataDTO = {
        currentProcessId: 'proc-1',
        slots: [
          {
            id: 'existing-1',
            startDateTime: '2026-04-10T09:00:00',
            endDateTime: '2026-04-10T09:30:00',
            interviewProcessId: 'proc-2',
            isBooked: true,
          },
        ],
      };

      component['conflictDataByDate'].set(new Map([['2026-04-10', conflictDataWithBookedSlot]]));

      const slots: InterviewSlotDTO[] = [
        {
          startDateTime: '2026-04-10T09:00:00',
          endDateTime: '2026-04-10T09:30:00',
          location: 'Room 1',
        },
      ];
      component['slotsByDate'].set(new Map([['2026-04-10', slots]]));

      const conflicts = component['serverConflicts']();
      const firstConflict = conflicts.values().next().value;
      expect(firstConflict?.type).toBe('BOOKED_OTHER_PROCESS');
    });
  });
});
