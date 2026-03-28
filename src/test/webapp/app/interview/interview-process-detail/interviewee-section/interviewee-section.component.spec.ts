import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { IntervieweeSectionComponent } from 'app/interview/interview-process-detail/interviewee-section/interviewee-section.component';
import { InterviewResourceApi } from 'app/generated/api/interview-resource-api';
import { ApplicationEvaluationResourceApi } from 'app/generated/api/application-evaluation-resource-api';
import { IntervieweeDTO, IntervieweeDTOStateEnum } from 'app/generated/model/interviewee-dto';
import { provideTranslateMock } from 'util/translate.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const uncontactedInterviewee: IntervieweeDTO = {
  id: 'iee-1',
  applicationId: 'app-1',
  state: IntervieweeDTOStateEnum.Uncontacted,
  user: { userId: 'u1', firstName: 'Alice', lastName: 'Mueller', email: 'alice@example.com' },
};

const invitedInterviewee: IntervieweeDTO = {
  id: 'iee-2',
  applicationId: 'app-2',
  state: IntervieweeDTOStateEnum.Invited,
  user: { userId: 'u2', firstName: 'Bob', lastName: 'Schmidt', email: 'bob@example.com' },
};

const scheduledInterviewee: IntervieweeDTO = {
  id: 'iee-3',
  applicationId: 'app-3',
  state: IntervieweeDTOStateEnum.Scheduled,
  user: { userId: 'u3', firstName: 'Charlie', lastName: 'Brown', email: 'charlie@example.com' },
  scheduledSlot: {
    id: 'slot-1',
    startDateTime: '2026-03-20T14:00:00',
    endDateTime: '2026-03-20T15:00:00',
    location: 'Room 303',
  },
};

const allInterviewees = [uncontactedInterviewee, invitedInterviewee, scheduledInterviewee];

describe('IntervieweeSectionComponent', () => {
  let fixture: ComponentFixture<IntervieweeSectionComponent>;
  let component: IntervieweeSectionComponent;
  let mockInterviewService: Partial<InterviewResourceApi>;
  let mockApplicationService: Partial<ApplicationEvaluationResourceApi>;
  let toastMock: ToastServiceMock;

  beforeEach(async () => {
    mockInterviewService = {
      getIntervieweesByProcessId: vi.fn().mockReturnValue(of(allInterviewees)),
      addApplicantsToInterview: vi.fn().mockReturnValue(of(undefined)),
      sendInvitations: vi.fn().mockReturnValue(of({ sentCount: 1, failedEmails: [] })),
      cancelInterview: vi.fn().mockReturnValue(of(undefined)),
    };
    mockApplicationService = {
      getApplicationsDetails: vi.fn().mockReturnValue(of({ applications: [], totalRecords: 0 })),
    };
    toastMock = createToastServiceMock();

    await TestBed.configureTestingModule({
      imports: [IntervieweeSectionComponent],
      providers: [
        provideTranslateMock(),
        provideToastServiceMock(toastMock),
        provideFontAwesomeTesting(),
        { provide: InterviewResourceApi, useValue: mockInterviewService },
        { provide: ApplicationEvaluationResourceApi, useValue: mockApplicationService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(IntervieweeSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('processId', 'proc-1');
    fixture.componentRef.setInput('jobTitle', 'Dev');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Loading', () => {
    it('should load interviewees on init', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mockInterviewService.getIntervieweesByProcessId).toHaveBeenCalledWith('proc-1');
      expect(component.interviewees().length).toBe(3);
      expect(component.loadingInterviewees()).toBe(false);
    });

    it('should show error toast when loading fails', async () => {
      (mockInterviewService.getIntervieweesByProcessId as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.interviewees.error.loadFailed');
    });
  });

  describe('Filter Tabs', () => {
    it('should compute filter tabs with correct counts', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const tabs = component.filterTabs();
      expect(tabs.length).toBe(5);
      expect(tabs[0].count).toBe(3); // ALL
      expect(tabs[1].count).toBe(1); // UNCONTACTED
      expect(tabs[2].count).toBe(1); // INVITED
      expect(tabs[3].count).toBe(1); // SCHEDULED
      expect(tabs[4].count).toBe(0); // COMPLETED
    });

    it('should filter interviewees by active filter', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.setFilter(IntervieweeDTOStateEnum.Uncontacted);
      expect(component.filteredInterviewees().length).toBe(1);
      expect(component.filteredInterviewees()[0].state).toBe(IntervieweeDTOStateEnum.Uncontacted);
    });

    it('should return all interviewees when filter is ALL', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.setFilter('ALL');
      expect(component.filteredInterviewees().length).toBe(3);
    });
  });

  describe('Selection', () => {
    it('should toggle selection on and off', () => {
      fixture.detectChanges();

      component.toggleSelection('app-1');
      expect(component.isSelected('app-1')).toBe(true);
      expect(component.selectedCount()).toBe(1);

      component.toggleSelection('app-1');
      expect(component.isSelected('app-1')).toBe(false);
      expect(component.selectedCount()).toBe(0);
    });
  });

  describe('Modal Control', () => {
    it('should open add modal and load applicants', () => {
      fixture.detectChanges();

      component.openAddModal();

      expect(component.showAddModal()).toBe(true);
      expect(mockApplicationService.getApplicationsDetails).toHaveBeenCalledOnce();
    });

    it('should close add modal and clear selections', () => {
      fixture.detectChanges();
      component.selectedIds.set(new Set(['app-1', 'app-2']));

      component.closeAddModal();

      expect(component.showAddModal()).toBe(false);
      expect(component.selectedCount()).toBe(0);
    });
  });

  describe('Add Interviewees', () => {
    it('should add selected applicants and show success toast', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.selectedIds.set(new Set(['app-10']));
      await component.addInterviewees();

      expect(mockInterviewService.addApplicantsToInterview).toHaveBeenCalledOnce();
      expect(mockInterviewService.addApplicantsToInterview).toHaveBeenCalledWith('proc-1', { applicationIds: ['app-10'] });
      expect(toastMock.showSuccessKey).toHaveBeenCalledOnce();
    });

    it('should show error toast when adding fails', async () => {
      (mockInterviewService.addApplicantsToInterview as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();
      await fixture.whenStable();

      component.selectedIds.set(new Set(['app-10']));
      await component.addInterviewees();

      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.interviewees.error.addFailed');
    });

    it('should not add when processId is empty', async () => {
      fixture.componentRef.setInput('processId', '');
      fixture.detectChanges();
      await fixture.whenStable();

      await component.addInterviewees();

      expect(mockInterviewService.addApplicantsToInterview).not.toHaveBeenCalled();
    });
  });

  describe('Send Invitation', () => {
    it('should warn when no slots available', async () => {
      fixture.componentRef.setInput('hasSlots', false);
      fixture.detectChanges();
      await fixture.whenStable();

      component.sendInvitation(uncontactedInterviewee);

      expect(toastMock.showWarnKey).toHaveBeenCalledOnce();
      expect(toastMock.showWarnKey).toHaveBeenCalledWith('interview.interviewees.invitation.noSlots');
      expect(mockInterviewService.sendInvitations).not.toHaveBeenCalled();
    });

    it('should send invitation for uncontacted interviewee', async () => {
      fixture.componentRef.setInput('hasSlots', true);
      fixture.detectChanges();
      await fixture.whenStable();

      component.sendInvitation(uncontactedInterviewee);
      await fixture.whenStable();

      expect(mockInterviewService.sendInvitations).toHaveBeenCalledOnce();
    });

    it('should show resend dialog for already invited interviewee', async () => {
      fixture.componentRef.setInput('hasSlots', true);
      fixture.detectChanges();
      await fixture.whenStable();

      component.sendInvitation(invitedInterviewee);

      expect(component.showResendDialog()).toBe(true);
      expect(component.pendingResendId()).toBe('iee-2');
      expect(mockInterviewService.sendInvitations).not.toHaveBeenCalled();
    });
  });

  describe('Send All Invitations', () => {
    it('should warn when no slots available', async () => {
      fixture.componentRef.setInput('hasSlots', false);
      fixture.detectChanges();
      await fixture.whenStable();

      await component.sendAllInvitations();

      expect(toastMock.showWarnKey).toHaveBeenCalledWith('interview.interviewees.invitation.noSlots');
    });

    it('should send bulk invitations when slots available', async () => {
      fixture.componentRef.setInput('hasSlots', true);
      fixture.detectChanges();
      await fixture.whenStable();

      await component.sendAllInvitations();

      expect(mockInterviewService.sendInvitations).toHaveBeenCalledOnce();
      expect(mockInterviewService.sendInvitations).toHaveBeenCalledWith('proc-1', { onlyUninvited: true });
    });
  });

  describe('Cancel Interview', () => {
    it('should open cancel modal with selected interviewee', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.onCancelInterview(scheduledInterviewee);

      expect(component.showCancelModal()).toBe(true);
      expect(component.selectedIntervieweeForCancel()).toBe(scheduledInterviewee);
    });

    it('should cancel interview and emit slotsRefresh', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.selectedIntervieweeForCancel.set(scheduledInterviewee);
      const slotsRefreshSpy = vi.spyOn(component.slotsRefresh, 'emit');

      await component.onCancelInterviewConfirm({ deleteSlot: false, sendReinvite: false });

      expect(mockInterviewService.cancelInterview).toHaveBeenCalledOnce();
      expect(mockInterviewService.cancelInterview).toHaveBeenCalledWith('proc-1', 'slot-1', {
        deleteSlot: false,
        sendReinvite: false,
      });
      expect(toastMock.showSuccessKey).toHaveBeenCalledWith('interview.slots.cancelInterview.success');
      expect(slotsRefreshSpy).toHaveBeenCalledOnce();
      expect(component.showCancelModal()).toBe(false);
    });

    it('should show error toast when cancel fails', async () => {
      (mockInterviewService.cancelInterview as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();
      await fixture.whenStable();

      component.selectedIntervieweeForCancel.set(scheduledInterviewee);
      await component.onCancelInterviewConfirm({ deleteSlot: false, sendReinvite: false });

      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.slots.cancelInterview.error');
    });
  });

  describe('Computed: uncontactedCount', () => {
    it('should count uncontacted interviewees', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.uncontactedCount()).toBe(1);
    });
  });

  describe('Table Pagination', () => {
    it('should update page number and size on table emit', () => {
      fixture.detectChanges();

      component.loadOnTableEmit({ first: 20, rows: 10 });

      expect(component.pageNumber()).toBe(2);
      expect(component.pageSize()).toBe(10);
    });
  });
});
