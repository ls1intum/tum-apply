import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import dayjs from 'dayjs/esm';

import { InterviewProcessesOverviewComponent } from 'app/interview/interview-processes-overview/interview-processes-overview.component';
import { InterviewResourceApi } from 'app/generated/api/interview-resource-api';
import { InterviewOverviewDTO } from 'app/generated/model/interview-overview-dto';
import { JobDetailDTOStateEnum } from 'app/generated/model/job-detail-dto';
import { UpcomingInterviewDTO } from 'app/generated/model/upcoming-interview-dto';
import { provideTranslateMock } from 'util/translate.mock';
import { provideRouterMock, createRouterMock, RouterMock } from 'util/router.mock';
import { provideBreakpointObserverMock } from 'util/breakpoint-observer.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const mockProcess: InterviewOverviewDTO = {
  jobId: 'job-1',
  processId: 'process-1',
  jobTitle: 'Software Engineer',
  jobState: JobDetailDTOStateEnum.Published,
  isClosed: false,
  totalSlots: 10,
  totalInterviews: 5,
  scheduledCount: 3,
  completedCount: 1,
  invitedCount: 4,
  uncontactedCount: 2,
};

const mockUpcomingInterview: UpcomingInterviewDTO = {
  id: 'interview-1',
  processId: 'process-1',
  intervieweeId: 'interviewee-1',
  intervieweeName: 'John Doe',
  jobTitle: 'Software Engineer',
  startDateTime: dayjs().format(),
  endDateTime: dayjs().add(1, 'hour').format(),
  location: 'Room 101',
};

describe('InterviewProcessesOverviewComponent', () => {
  let fixture: ComponentFixture<InterviewProcessesOverviewComponent>;
  let component: InterviewProcessesOverviewComponent;
  let mockInterviewService: Partial<InterviewResourceApi>;
  let routerMock: RouterMock;

  beforeEach(async () => {
    mockInterviewService = {
      getInterviewOverview: vi.fn().mockReturnValue(of([])),
      getUpcomingInterviews: vi.fn().mockReturnValue(of([])),
    };

    routerMock = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [InterviewProcessesOverviewComponent],
      providers: [
        provideTranslateMock(),
        provideRouterMock(routerMock),
        provideBreakpointObserverMock(),
        provideFontAwesomeTesting(),
        { provide: InterviewResourceApi, useValue: mockInterviewService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Loading', () => {
    it('should load interview processes and upcoming interviews on init', async () => {
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(of([mockProcess]));
      (mockInterviewService.getUpcomingInterviews as ReturnType<typeof vi.fn>).mockReturnValue(of([mockUpcomingInterview]));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(component.interviewProcesses().length).toBe(1);
      expect(component.upcomingInterviews().length).toBe(1);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe(false);
    });

    it('should set error to true when loading fails', async () => {
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => new Error('fail')));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(component.error()).toBe(true);
      expect(component.loading()).toBe(false);
    });

    it('should assign fallback image URL when process has no imageUrl', async () => {
      const processWithoutImage: InterviewOverviewDTO = {
        jobId: 'job-1',
        processId: 'process-1',
        jobTitle: 'Software Engineer',
        jobState: JobDetailDTOStateEnum.Published,
        isClosed: false,
        totalSlots: 10,
        totalInterviews: 5,
        scheduledCount: 3,
        completedCount: 1,
        invitedCount: 4,
        uncontactedCount: 2,
      };
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(of([processWithoutImage]));
      (mockInterviewService.getUpcomingInterviews as ReturnType<typeof vi.fn>).mockReturnValue(of([]));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(component.interviewProcesses()[0].imageUrl).toContain('/content/images/job-banner/');
    });

    it('should keep existing imageUrl when process has one', async () => {
      const processWithImage: InterviewOverviewDTO = {
        jobId: 'job-1',
        processId: 'process-1',
        jobTitle: 'Software Engineer',
        jobState: JobDetailDTOStateEnum.Published,
        isClosed: false,
        totalSlots: 10,
        totalInterviews: 5,
        scheduledCount: 3,
        completedCount: 1,
        invitedCount: 4,
        uncontactedCount: 2,
        imageUrl: '/custom/image.jpg',
      };
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(of([processWithImage]));
      (mockInterviewService.getUpcomingInterviews as ReturnType<typeof vi.fn>).mockReturnValue(of([]));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(component.interviewProcesses()[0].imageUrl).toBe('/custom/image.jpg');
    });
  });

  describe('Month Navigation', () => {
    it.each([
      { method: 'previousMonth' as const, expectedDelta: -1 },
      { method: 'nextMonth' as const, expectedDelta: 1 },
    ])('should change month offset by $expectedDelta on $method()', ({ method, expectedDelta }) => {
      fixture.detectChanges();
      const initial = component.currentMonthOffset();
      component[method]();
      expect(component.currentMonthOffset()).toBe(initial + expectedDelta);
    });

    it('should reset date page to 0 when changing month', () => {
      fixture.detectChanges();
      component.currentDatePage.set(2);
      component.nextMonth();
      expect(component.currentDatePage()).toBe(0);
    });
  });

  describe('Date Pagination', () => {
    it('should not go to previous date page when already on first page', () => {
      fixture.detectChanges();
      component.currentDatePage.set(0);
      component.previousDatePage();
      expect(component.currentDatePage()).toBe(0);
    });

    it('should go to previous date page when possible', async () => {
      const now = dayjs();
      const interviews: UpcomingInterviewDTO[] = Array.from({ length: 10 }, (_, i) => ({
        id: `int-${i}`,
        processId: 'process-1',
        intervieweeId: `interviewee-${i}`,
        intervieweeName: `Person ${i}`,
        jobTitle: 'Software Engineer',
        startDateTime: now.add(i, 'day').format(),
        endDateTime: now.add(i, 'day').add(1, 'hour').format(),
        location: 'Room 101',
      }));
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(of([]));
      (mockInterviewService.getUpcomingInterviews as ReturnType<typeof vi.fn>).mockReturnValue(of(interviews));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      component.currentDatePage.set(1);
      component.previousDatePage();
      expect(component.currentDatePage()).toBe(0);
    });

    it('should not go to next date page when already on last page', () => {
      fixture.detectChanges();
      component.nextDatePage();
      expect(component.currentDatePage()).toBe(0);
    });
  });

  describe('Grouped Upcoming Interviews', () => {
    it('should return empty array when no upcoming interviews', () => {
      fixture.detectChanges();
      expect(component.groupedUpcomingInterviews()).toEqual([]);
    });

    it('should group interviews by date and filter by current month', async () => {
      const now = dayjs();
      const interviews: UpcomingInterviewDTO[] = [
        {
          id: 'int-1',
          processId: 'process-1',
          intervieweeId: 'iee-1',
          intervieweeName: 'Alice',
          jobTitle: 'Dev',
          startDateTime: now.startOf('month').add(1, 'day').hour(9).format(),
          endDateTime: now.startOf('month').add(1, 'day').hour(10).format(),
          location: 'Room A',
        },
        {
          id: 'int-2',
          processId: 'process-1',
          intervieweeId: 'iee-2',
          intervieweeName: 'Bob',
          jobTitle: 'Dev',
          startDateTime: now.startOf('month').add(1, 'day').hour(11).format(),
          endDateTime: now.startOf('month').add(1, 'day').hour(12).format(),
          location: 'Room B',
        },
        {
          id: 'int-3',
          processId: 'process-1',
          intervieweeId: 'iee-3',
          intervieweeName: 'Charlie',
          jobTitle: 'Dev',
          startDateTime: now.startOf('month').add(2, 'day').hour(9).format(),
          endDateTime: now.startOf('month').add(2, 'day').hour(10).format(),
          location: 'Room C',
        },
      ];
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(of([]));
      (mockInterviewService.getUpcomingInterviews as ReturnType<typeof vi.fn>).mockReturnValue(of(interviews));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      const grouped = component.groupedUpcomingInterviews();
      expect(grouped.length).toBe(2);
      expect(grouped[0].interviews.length).toBe(2);
      expect(grouped[1].interviews.length).toBe(1);
    });

    it('should exclude interviews from other months', async () => {
      const nextMonth = dayjs().add(1, 'month');
      const interviews: UpcomingInterviewDTO[] = [
        {
          id: 'int-1',
          processId: 'process-1',
          intervieweeId: 'iee-1',
          intervieweeName: 'Alice',
          jobTitle: 'Dev',
          startDateTime: nextMonth.format(),
          endDateTime: nextMonth.add(1, 'hour').format(),
          location: 'Room A',
        },
      ];
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(of([]));
      (mockInterviewService.getUpcomingInterviews as ReturnType<typeof vi.fn>).mockReturnValue(of(interviews));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(component.groupedUpcomingInterviews().length).toBe(0);
    });

    it('should skip interviews with null startDateTime', async () => {
      const interviews: UpcomingInterviewDTO[] = [
        {
          id: 'int-1',
          processId: 'process-1',
          intervieweeId: 'iee-1',
          intervieweeName: 'Alice',
          jobTitle: 'Dev',
          startDateTime: undefined,
          endDateTime: undefined,
          location: 'Room A',
        },
      ];
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(of([]));
      (mockInterviewService.getUpcomingInterviews as ReturnType<typeof vi.fn>).mockReturnValue(of(interviews));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      expect(component.groupedUpcomingInterviews().length).toBe(0);
    });
  });

  describe('View Details Navigation', () => {
    it('should navigate to interview process detail page', async () => {
      const process: InterviewOverviewDTO = {
        jobId: 'job-1',
        processId: 'proc-1',
        jobTitle: 'Dev',
        jobState: JobDetailDTOStateEnum.Published,
        isClosed: false,
        totalSlots: 10,
        totalInterviews: 5,
        scheduledCount: 3,
        completedCount: 1,
        invitedCount: 4,
        uncontactedCount: 2,
      };
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(of([process]));
      (mockInterviewService.getUpcomingInterviews as ReturnType<typeof vi.fn>).mockReturnValue(of([]));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      component.viewDetails('job-1');
      expect(routerMock.navigate).toHaveBeenCalledOnce();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/interviews', 'proc-1'], {
        state: { jobTitle: 'Dev' },
      });
    });

    it('should not navigate when jobId is not found', async () => {
      (mockInterviewService.getInterviewOverview as ReturnType<typeof vi.fn>).mockReturnValue(of([]));
      (mockInterviewService.getUpcomingInterviews as ReturnType<typeof vi.fn>).mockReturnValue(of([]));

      fixture = TestBed.createComponent(InterviewProcessesOverviewComponent);
      component = fixture.componentInstance;
      await fixture.whenStable();

      component.viewDetails('non-existent');
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });
});
