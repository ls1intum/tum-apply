import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { SlotsSectionComponent } from 'app/interview/interview-process-detail/slots-section/slots-section.component';
import { InterviewResourceApi } from 'app/generated/api/interview-resource-api';
import { EmailTemplateResourceApi } from 'app/generated/api/email-template-resource-api';
import { InterviewSlotDTO } from 'app/generated/models/interview-slot-dto';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideBreakpointObserverMock } from 'util/breakpoint-observer.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const futureSlot: InterviewSlotDTO = {
  id: 'slot-1',
  interviewProcessId: 'process-1',
  startDateTime: '2027-06-15T09:00:00',
  endDateTime: '2027-06-15T10:00:00',
  location: 'Room 101',
  isBooked: false,
};

const bookedFutureSlot: InterviewSlotDTO = {
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

describe('SlotsSectionComponent', () => {
  let fixture: ComponentFixture<SlotsSectionComponent>;
  let component: SlotsSectionComponent;
  let mockInterviewService: Partial<InterviewResourceApi>;
  let mockEmailTemplateService: Partial<EmailTemplateResourceApi>;
  let toastMock: ToastServiceMock;

  beforeEach(async () => {
    mockInterviewService = {
      getSlotsByProcessId: vi.fn().mockReturnValue(of({ content: [], totalElements: 0 })),
      deleteSlot: vi.fn().mockReturnValue(of(undefined)),
      updateSlotLocation: vi.fn().mockReturnValue(of(undefined)),
      cancelInterview: vi.fn().mockReturnValue(of(undefined)),
    };
    mockEmailTemplateService = {
      getTemplates: vi.fn().mockReturnValue(of({ content: [] })),
    };
    toastMock = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [SlotsSectionComponent],
      providers: [
        provideTranslateMock(),
        provideToastServiceMock(toastMock),
        provideBreakpointObserverMock(),
        provideFontAwesomeTesting(),
        { provide: InterviewResourceApi, useValue: mockInterviewService },
        { provide: EmailTemplateResourceApi, useValue: mockEmailTemplateService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SlotsSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('processId', 'proc-1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Modal Control', () => {
    it('should open slot creation form', () => {
      fixture.detectChanges();

      component.openCreateSlotsModal();

      expect(component.showSlotCreationForm()).toBe(true);
    });

    it('should open assign modal with selected slot', () => {
      fixture.detectChanges();

      component.onAssignApplicant(futureSlot);

      expect(component.showAssignModal()).toBe(true);
      expect(component.selectedSlotForAssignment()).toBe(futureSlot);
    });

    it('should open edit dialog with slot data', () => {
      fixture.detectChanges();

      component.onEditSlot(futureSlot);

      expect(component.showEditDialog()).toBe(true);
      expect(component.selectedSlotForEdit()).toBe(futureSlot);
      expect(component.editLocation()).toBe('Room 101');
    });

    it('should close edit dialog and reset state', () => {
      fixture.detectChanges();
      component.selectedSlotForEdit.set(futureSlot);
      component.editLocation.set('Room 101');
      component.showEditDialog.set(true);

      component.closeEditDialog();

      expect(component.showEditDialog()).toBe(false);
      expect(component.selectedSlotForEdit()).toBeUndefined();
      expect(component.editLocation()).toBe('');
    });

    it('should open cancel interview modal', () => {
      fixture.detectChanges();

      component.onCancelInterview(bookedFutureSlot);

      expect(component.showCancelModal()).toBe(true);
      expect(component.selectedSlotForCancel()).toBe(bookedFutureSlot);
    });
  });

  describe('Date Pagination', () => {
    it('should not go to previous date page when on first page', () => {
      fixture.detectChanges();
      component.currentDatePage.set(0);

      component.previousDatePage();

      expect(component.currentDatePage()).toBe(0);
    });

    it('should not go to next date page when on last page', () => {
      fixture.detectChanges();

      component.nextDatePage();

      expect(component.currentDatePage()).toBe(0);
    });
  });

  describe('Toggle Expanded', () => {
    it('should toggle date expansion on and off', () => {
      fixture.detectChanges();

      component.toggleExpanded('2026-03-15');
      expect(component.expandedDates().has('2026-03-15')).toBe(true);

      component.toggleExpanded('2026-03-15');
      expect(component.expandedDates().has('2026-03-15')).toBe(false);
    });
  });

  describe('getShowMoreText', () => {
    it.each([
      { count: 1, expectedKey: 'interview.slots.showMoreSingular' },
      { count: 3, expectedKey: 'interview.slots.showMorePlural' },
    ])('should use $expectedKey for count=$count', ({ count, expectedKey }) => {
      fixture.detectChanges();

      const text = component.getShowMoreText(count);

      expect(text).toContain(`${count}`);
      expect(text).toContain(expectedKey);
    });
  });

  describe('onSlotsCreated', () => {
    it('should set hasAnySlots to true', () => {
      fixture.detectChanges();

      component.onSlotsCreated();

      expect(component.hasAnySlots()).toBe(true);
    });
  });

  describe('Save Slot Location', () => {
    it('should save location and show success toast', async () => {
      fixture.detectChanges();
      component.selectedSlotForEdit.set(futureSlot);
      component.editLocation.set('New Room');

      await component.saveSlotLocation();

      expect(mockInterviewService.updateSlotLocation).toHaveBeenCalledOnce();
      expect(mockInterviewService.updateSlotLocation).toHaveBeenCalledWith('slot-1', { location: 'New Room' });
      expect(toastMock.showSuccessKey).toHaveBeenCalledWith('interview.slots.edit.success');
    });

    it('should not save when location is empty', async () => {
      fixture.detectChanges();
      component.selectedSlotForEdit.set(futureSlot);
      component.editLocation.set('   ');

      await component.saveSlotLocation();

      expect(mockInterviewService.updateSlotLocation).not.toHaveBeenCalled();
    });

    it('should show forbidden error on 403', async () => {
      (mockInterviewService.updateSlotLocation as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => ({ status: 403 })));

      fixture.detectChanges();
      component.selectedSlotForEdit.set(futureSlot);
      component.editLocation.set('New Room');

      await component.saveSlotLocation();

      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.slots.edit.errorForbidden');
    });
  });

  describe('Delete Slot', () => {
    it('should delete slot and show success toast', async () => {
      fixture.detectChanges();

      await component.onDeleteSlot(futureSlot);

      expect(mockInterviewService.deleteSlot).toHaveBeenCalledOnce();
      expect(mockInterviewService.deleteSlot).toHaveBeenCalledWith('slot-1');
      expect(toastMock.showSuccessKey).toHaveBeenCalledWith('interview.slots.delete.success');
    });

    it('should not delete when slot has no id', async () => {
      fixture.detectChanges();

      await component.onDeleteSlot({ location: 'Room' });

      expect(mockInterviewService.deleteSlot).not.toHaveBeenCalled();
    });

    it.each([
      { status: 400, expectedKey: 'interview.slots.delete.errorBooked' },
      { status: 403, expectedKey: 'interview.slots.delete.errorForbidden' },
      { status: 500, expectedKey: 'interview.slots.delete.error' },
    ])('should show $expectedKey on $status error', async ({ status, expectedKey }) => {
      (mockInterviewService.deleteSlot as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => ({ status })));

      fixture.detectChanges();

      await component.onDeleteSlot(futureSlot);

      expect(toastMock.showErrorKey).toHaveBeenCalledWith(expectedKey);
    });
  });

  describe('Cancel Interview', () => {
    it('should cancel interview and emit slotAssigned', async () => {
      fixture.detectChanges();
      component.selectedSlotForCancel.set(bookedFutureSlot);
      const slotAssignedSpy = vi.spyOn(component.slotAssigned, 'emit');

      await component.onCancelInterviewConfirm({ deleteSlot: false, sendReinvite: true });

      expect(mockInterviewService.cancelInterview).toHaveBeenCalledOnce();
      expect(mockInterviewService.cancelInterview).toHaveBeenCalledWith('proc-1', 'slot-2', {
        deleteSlot: false,
        sendReinvite: true,
      });
      expect(toastMock.showSuccessKey).toHaveBeenCalledWith('interview.slots.cancelInterview.success');
      expect(slotAssignedSpy).toHaveBeenCalledOnce();
      expect(component.showCancelModal()).toBe(false);
    });

    it('should show error toast when cancel fails', async () => {
      (mockInterviewService.cancelInterview as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();
      component.selectedSlotForCancel.set(bookedFutureSlot);

      await component.onCancelInterviewConfirm({ deleteSlot: false, sendReinvite: false });

      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.slots.cancelInterview.error');
    });
  });

  describe('Applicant Assigned', () => {
    it('should update slot in futureSlots and emit slotAssigned', () => {
      fixture.detectChanges();
      component.futureSlots.set([futureSlot]);

      const updatedSlot: InterviewSlotDTO = {
        id: 'slot-1',
        interviewProcessId: 'process-1',
        startDateTime: '2027-06-15T09:00:00',
        endDateTime: '2027-06-15T10:00:00',
        location: 'Room 101',
        isBooked: true,
        interviewee: { id: 'iee-new', firstName: 'New', lastName: 'Person', email: 'new@example.com', state: 'SCHEDULED' },
      };

      const slotAssignedSpy = vi.spyOn(component.slotAssigned, 'emit');
      component.onApplicantAssigned(updatedSlot);

      expect(component.futureSlots()[0].isBooked).toBe(true);
      expect(slotAssignedSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Empty State Message', () => {
    it.each([
      {
        description: 'not initialized',
        initialized: false,
        hasAnySlots: false,
        futureSlots: [] as InterviewSlotDTO[],
        pastSlots: [] as InterviewSlotDTO[],
        expected: undefined,
      },
      {
        description: 'no slots created',
        initialized: true,
        hasAnySlots: false,
        futureSlots: [] as InterviewSlotDTO[],
        pastSlots: [] as InterviewSlotDTO[],
        expected: 'interview.slots.emptyState.noSlotsCreated',
      },
      {
        description: 'no slots in current month',
        initialized: true,
        hasAnySlots: true,
        futureSlots: [] as InterviewSlotDTO[],
        pastSlots: [] as InterviewSlotDTO[],
        expected: 'interview.slots.emptyState.noSlotsInMonth',
      },
      {
        description: 'slots exist in current month',
        initialized: true,
        hasAnySlots: true,
        futureSlots: [futureSlot],
        pastSlots: [] as InterviewSlotDTO[],
        expected: undefined,
      },
    ])('should return $expected when $description', ({ initialized, hasAnySlots, futureSlots: fs, pastSlots: ps, expected }) => {
      fixture.detectChanges();
      component.initialized.set(initialized);
      component.hasAnySlots.set(hasAnySlots);
      component.futureSlots.set(fs);
      component.pastSlots.set(ps);

      expect(component.emptyStateMessage()).toBe(expected);
    });
  });

  describe('notEnoughSlots', () => {
    it.each([
      { description: 'invited exceeds unbooked', initialized: true, invitedCount: 5, unbookedCount: 2, expected: true },
      { description: 'enough slots available', initialized: true, invitedCount: 2, unbookedCount: 5, expected: false },
      { description: 'not initialized', initialized: false, invitedCount: 5, unbookedCount: 2, expected: false },
    ])('should return $expected when $description', ({ initialized, invitedCount, unbookedCount, expected }) => {
      fixture.detectChanges();
      component.initialized.set(initialized);
      fixture.componentRef.setInput('invitedCount', invitedCount);
      component.globalFutureUnbookedCount.set(unbookedCount);

      expect(component.notEnoughSlots()).toBe(expected);
    });
  });
});
