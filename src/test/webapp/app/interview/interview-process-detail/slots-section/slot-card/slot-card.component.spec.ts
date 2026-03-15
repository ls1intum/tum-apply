import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { SlotCardComponent } from 'app/interview/interview-process-detail/slots-section/slot-card/slot-card.component';
import { InterviewSlotDTO } from 'app/generated/model/interviewSlotDTO';
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
    state: 'SCHEDULED',
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

  describe('Computed Properties', () => {
    it('should compute isBooked as false for unbooked slot', () => {
      fixture.componentRef.setInput('slot', unbookedSlot);
      fixture.detectChanges();

      expect(component.isBooked()).toBe(false);
    });

    it('should compute isBooked as true for booked slot', () => {
      fixture.componentRef.setInput('slot', bookedSlot);
      fixture.detectChanges();

      expect(component.isBooked()).toBe(true);
    });

    it('should compute isPast as true for past slot', () => {
      fixture.componentRef.setInput('slot', pastSlot);
      fixture.detectChanges();

      expect(component.isPast()).toBe(true);
    });

    it('should compute isPast as false for future slot', () => {
      fixture.componentRef.setInput('slot', unbookedSlot);
      fixture.detectChanges();

      expect(component.isPast()).toBe(false);
    });

    it('should compute applicantName from interviewee', () => {
      fixture.componentRef.setInput('slot', bookedSlot);
      fixture.detectChanges();

      expect(component.applicantName()).toContain('Jane');
      expect(component.applicantName()).toContain('Doe');
    });

    it('should return empty applicantName when no interviewee', () => {
      fixture.componentRef.setInput('slot', unbookedSlot);
      fixture.detectChanges();

      expect(component.applicantName()).toBe('');
    });
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
