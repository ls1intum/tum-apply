import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SlotCardComponent } from 'app/interview/interview-process-detail/slots-section/slot-card/slot-card.component';
import { InterviewSlotDTO } from 'app/generated/model/interview-slot-dto';
import { IntervieweeDTOStateEnum } from 'app/generated/model/interviewee-dto';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const unbookedSlot: InterviewSlotDTO = {
  id: 'slot-1',
  interviewProcessId: 'process-1',
  startDateTime: '2027-06-15T09:00:00',
  endDateTime: '2027-06-15T10:00:00',
  location: 'Room 101',
  isBooked: false,
};

const bookedSlot: InterviewSlotDTO = {
  id: 'slot-2',
  interviewProcessId: 'process-1',
  startDateTime: '2027-06-15T11:00:00',
  endDateTime: '2027-06-15T12:00:00',
  location: 'Room 202',
  isBooked: true,
  interviewee: {
    id: 'iee-1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    state: IntervieweeDTOStateEnum.Scheduled,
  },
};

const pastSlot: InterviewSlotDTO = {
  id: 'slot-3',
  interviewProcessId: 'process-1',
  startDateTime: '2020-01-01T09:00:00',
  endDateTime: '2020-01-01T10:00:00',
  location: 'Room 101',
  isBooked: false,
};

describe('SlotCardComponent', () => {
  let fixture: ComponentFixture<SlotCardComponent>;
  let component: SlotCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlotCardComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SlotCardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { description: 'unbooked future slot', slot: unbookedSlot, isBooked: false, isPast: false, applicantName: '' },
    { description: 'booked future slot', slot: bookedSlot, isBooked: true, isPast: false, applicantName: 'Jane Doe' },
    { description: 'past slot', slot: pastSlot, isBooked: false, isPast: true, applicantName: '' },
  ])('should compute properties for $description', ({ slot, isBooked, isPast, applicantName }) => {
    fixture.componentRef.setInput('slot', slot);
    fixture.detectChanges();

    expect(component.isBooked()).toBe(isBooked);
    expect(component.isPast()).toBe(isPast);
    if (applicantName) {
      expect(component.applicantName()).toContain(applicantName);
    } else {
      expect(component.applicantName()).toBe('');
    }
  });

  describe('Menu Items', () => {
    it('should include edit and delete for unbooked slot', () => {
      fixture.componentRef.setInput('slot', unbookedSlot);
      fixture.detectChanges();

      const items = component.menuItems();
      expect(items.length).toBe(2);
      expect(items[0].label).toBe('button.edit');
      expect(items[1].label).toBe('button.delete');
    });

    it('should include edit and cancel for booked slot', () => {
      fixture.componentRef.setInput('slot', bookedSlot);
      fixture.detectChanges();

      const items = component.menuItems();
      expect(items.length).toBe(2);
      expect(items[0].label).toBe('button.edit');
      expect(items[1].label).toBe('interview.slots.cancelInterview.triggerButton');
    });
  });

  describe('Output Emissions', () => {
    it.each([
      { method: 'onEdit' as const, outputName: 'editSlot' as const },
      { method: 'onDelete' as const, outputName: 'deleteSlot' as const },
      { method: 'onAssign' as const, outputName: 'assignApplicant' as const },
      { method: 'onCancelInterview' as const, outputName: 'cancelInterview' as const },
    ])('should emit $outputName on $method()', ({ method, outputName }) => {
      fixture.componentRef.setInput('slot', unbookedSlot);
      fixture.detectChanges();

      const spy = vi.spyOn(component[outputName], 'emit');
      component[method]();

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(unbookedSlot);
    });
  });
});
