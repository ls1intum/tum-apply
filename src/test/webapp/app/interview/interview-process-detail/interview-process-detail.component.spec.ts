import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { InterviewProcessDetailComponent } from 'app/interview/interview-process-detail/interview-process-detail.component';
import { InterviewResourceApiService, EmailTemplateResourceApiService, ApplicationEvaluationResourceApiService } from 'app/generated';
import { InterviewOverviewDTO } from 'app/generated/model/interviewOverviewDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideRouterMock, createRouterMock } from 'util/router.mock';
import { createActivatedRouteMock, provideActivatedRouteMock, ActivatedRouteMock } from 'util/activated-route.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideBreakpointObserverMock } from 'util/breakpoint-observer.mock';

describe('InterviewProcessDetailComponent', () => {
  let fixture: ComponentFixture<InterviewProcessDetailComponent>;
  let component: InterviewProcessDetailComponent;
  let mockInterviewService: Partial<InterviewResourceApiService>;
  let toastMock: ToastServiceMock;
  let activatedRouteMock: ActivatedRouteMock;

  const processDetailsResponse: InterviewOverviewDTO = {
    jobId: 'job-1',
    processId: 'process-1',
    jobTitle: 'Software Engineer',
    jobState: 'ACTIVE',
    isClosed: false,
    totalSlots: 10,
    totalInterviews: 5,
    scheduledCount: 3,
    completedCount: 1,
    invitedCount: 4,
    uncontactedCount: 2,
  };

  beforeEach(async () => {
    mockInterviewService = {
      getInterviewProcessDetails: vi.fn().mockReturnValue(of(processDetailsResponse)),
      getSlotsByProcessId: vi.fn().mockReturnValue(of({ content: [], totalElements: 0 })),
      getIntervieweesByProcessId: vi.fn().mockReturnValue(of([])),
      deleteSlot: vi.fn().mockReturnValue(of(undefined)),
      updateSlotLocation: vi.fn().mockReturnValue(of(undefined)),
      cancelInterview: vi.fn().mockReturnValue(of(undefined)),
      addApplicantsToInterview: vi.fn().mockReturnValue(of(undefined)),
      sendInvitations: vi.fn().mockReturnValue(of({ sentCount: 0, failedEmails: [] })),
    };
    toastMock = createToastServiceMock();
    activatedRouteMock = createActivatedRouteMock({ processId: 'process-1' });

    await TestBed.configureTestingModule({
      imports: [InterviewProcessDetailComponent],
      providers: [
        provideTranslateMock(),
        provideRouterMock(createRouterMock()),
        provideActivatedRouteMock(activatedRouteMock),
        provideToastServiceMock(toastMock),
        provideFontAwesomeTesting(),
        provideBreakpointObserverMock(),
        { provide: InterviewResourceApiService, useValue: mockInterviewService },
        { provide: EmailTemplateResourceApiService, useValue: { getTemplates: vi.fn().mockReturnValue(of({ content: [] })) } },
        {
          provide: ApplicationEvaluationResourceApiService,
          useValue: { getApplicationsDetails: vi.fn().mockReturnValue(of({ applications: [], totalRecords: 0 })) },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Loading', () => {
    it('should load process details on init when processId is present', async () => {
      fixture = TestBed.createComponent(InterviewProcessDetailComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(mockInterviewService.getInterviewProcessDetails).toHaveBeenCalledOnce();
      expect(mockInterviewService.getInterviewProcessDetails).toHaveBeenCalledWith('process-1');
      expect(component.jobTitle()).toBe('Software Engineer');
      expect(component.jobId()).toBe('job-1');
      expect(component.jobState()).toBe('ACTIVE');
      expect(component.invitedCount()).toBe(4);
    });

    it('should show error toast when loading fails', async () => {
      (mockInterviewService.getInterviewProcessDetails as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => new Error('fail')));

      fixture = TestBed.createComponent(InterviewProcessDetailComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(toastMock.showErrorKey).toHaveBeenCalledOnce();
      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.detail.error.loadFailed');
    });
  });

  describe('Computed Properties', () => {
    it.each([
      { jobState: 'CLOSED', expected: true },
      { jobState: 'APPLICANT_FOUND', expected: true },
      { jobState: 'ACTIVE', expected: false },
      { jobState: 'DRAFT', expected: false },
    ])('should return isJobClosed=$expected when jobState=$jobState', async ({ jobState, expected }) => {
      const response: InterviewOverviewDTO = {
        jobId: 'job-1',
        processId: 'process-1',
        jobTitle: 'Dev',
        jobState,
        isClosed: false,
        totalSlots: 10,
        totalInterviews: 5,
        scheduledCount: 3,
        completedCount: 1,
        invitedCount: 4,
        uncontactedCount: 2,
      };
      (mockInterviewService.getInterviewProcessDetails as ReturnType<typeof vi.fn>).mockReturnValue(of(response));

      fixture = TestBed.createComponent(InterviewProcessDetailComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(component.isJobClosed()).toBe(expected);
    });

    it('should default safeProcessId and safeJobTitle to empty strings before data loads', () => {
      (mockInterviewService.getInterviewProcessDetails as ReturnType<typeof vi.fn>).mockReturnValue(of(processDetailsResponse));

      fixture = TestBed.createComponent(InterviewProcessDetailComponent);
      component = fixture.componentInstance;

      // safeProcessId returns processId or '' — processId is set from route param
      expect(component.safeProcessId()).toBe('process-1');
      // safeJobTitle returns '' before API response arrives
      expect(component.safeJobTitle()).toBe('');
    });
  });

  describe('Refresh Keys', () => {
    it('should increment intervieweeRefreshKey on onSlotAssigned()', async () => {
      fixture = TestBed.createComponent(InterviewProcessDetailComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      const initial = component.intervieweeRefreshKey();
      component.onSlotAssigned();
      expect(component.intervieweeRefreshKey()).toBe(initial + 1);
    });

    it('should increment slotsRefreshKey on onSlotCancelled()', async () => {
      fixture = TestBed.createComponent(InterviewProcessDetailComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      const initial = component.slotsRefreshKey();
      component.onSlotCancelled();
      expect(component.slotsRefreshKey()).toBe(initial + 1);
    });
  });
});
