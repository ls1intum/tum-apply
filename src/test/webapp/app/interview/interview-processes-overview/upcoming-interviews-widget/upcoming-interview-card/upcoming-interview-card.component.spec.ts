import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { UpcomingInterviewCardComponent } from 'app/interview/interview-processes-overview/upcoming-interviews-widget/upcoming-interview-card/upcoming-interview-card.component';
import { UpcomingInterviewDTO } from 'app/generated/model/upcomingInterviewDTO';
import { provideRouterMock, createRouterMock, RouterMock } from 'util/router.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const physicalInterview: UpcomingInterviewDTO = {
  id: 'interview-1',
  processId: 'process-1',
  intervieweeId: 'interviewee-1',
  intervieweeName: 'Jane Smith',
  jobTitle: 'Backend Developer',
  startDateTime: '2026-03-15T09:00:00',
  endDateTime: '2026-03-15T10:00:00',
  location: 'Room 101',
};

describe('UpcomingInterviewCardComponent', () => {
  let fixture: ComponentFixture<UpcomingInterviewCardComponent>;
  let component: UpcomingInterviewCardComponent;
  let routerMock: RouterMock;

  beforeEach(async () => {
    routerMock = createRouterMock();

    await TestBed.configureTestingModule({
      imports: [UpcomingInterviewCardComponent],
      providers: [provideRouterMock(routerMock), provideFontAwesomeTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingInterviewCardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Computed Properties', () => {
    it('should return interviewee name', () => {
      fixture.componentRef.setInput('interview', physicalInterview);
      fixture.detectChanges();

      expect(component.intervieweeName()).toBe('Jane Smith');
    });

    it('should return empty string when interviewee name is undefined', () => {
      const interview: UpcomingInterviewDTO = {
        id: 'interview-2',
        processId: 'process-1',
        intervieweeId: 'interviewee-2',
        intervieweeName: undefined,
        jobTitle: 'Dev',
        startDateTime: '2026-03-15T09:00:00',
        endDateTime: '2026-03-15T10:00:00',
        location: 'Room 101',
      };
      fixture.componentRef.setInput('interview', interview);
      fixture.detectChanges();

      expect(component.intervieweeName()).toBe('');
    });

    it('should return avatar URL', () => {
      const interview: UpcomingInterviewDTO = {
        id: 'interview-3',
        processId: 'process-1',
        intervieweeId: 'interviewee-3',
        intervieweeName: 'Max',
        jobTitle: 'Dev',
        startDateTime: '2026-03-15T09:00:00',
        endDateTime: '2026-03-15T10:00:00',
        location: 'Room 101',
        avatar: '/img/avatar.jpg',
      };
      fixture.componentRef.setInput('interview', interview);
      fixture.detectChanges();

      expect(component.avatarUrl()).toBe('/img/avatar.jpg');
    });

    it('should format time range correctly', () => {
      const interview: UpcomingInterviewDTO = {
        id: 'interview-4',
        processId: 'process-1',
        intervieweeId: 'interviewee-4',
        intervieweeName: 'Max',
        jobTitle: 'Dev',
        startDateTime: '2026-03-15T09:00:00',
        endDateTime: '2026-03-15T10:30:00',
        location: 'Room 101',
      };
      fixture.componentRef.setInput('interview', interview);
      fixture.detectChanges();

      expect(component.formattedTimeRange()).toBe('09:00 - 10:30');
    });

    it('should return location', () => {
      fixture.componentRef.setInput('interview', physicalInterview);
      fixture.detectChanges();

      expect(component.location()).toBe('Room 101');
    });

    it('should return empty string when location is undefined', () => {
      const interview: UpcomingInterviewDTO = {
        id: 'interview-5',
        processId: 'process-1',
        intervieweeId: 'interviewee-5',
        intervieweeName: 'Max',
        jobTitle: 'Dev',
        startDateTime: '2026-03-15T09:00:00',
        endDateTime: '2026-03-15T10:00:00',
        location: undefined,
      };
      fixture.componentRef.setInput('interview', interview);
      fixture.detectChanges();

      expect(component.location()).toBe('');
    });
  });

  describe('Virtual Meeting Detection', () => {
    it.each([
      { location: 'https://zoom.us/j/123', expectedVirtual: true, expectedUrl: 'https://zoom.us/j/123' },
      { location: 'Zoom Meeting Room', expectedVirtual: true, expectedUrl: null },
      { location: 'Microsoft Teams Call', expectedVirtual: true, expectedUrl: null },
      { location: 'Virtual Room', expectedVirtual: true, expectedUrl: null },
      { location: 'Room 101', expectedVirtual: false, expectedUrl: null },
    ])('should detect "$location" as virtual=$expectedVirtual', ({ location, expectedVirtual, expectedUrl }) => {
      const interview: UpcomingInterviewDTO = {
        id: 'interview-virtual',
        processId: 'process-1',
        intervieweeId: 'interviewee-virtual',
        intervieweeName: 'Max',
        jobTitle: 'Dev',
        startDateTime: '2026-03-15T09:00:00',
        endDateTime: '2026-03-15T10:00:00',
        location,
      };
      fixture.componentRef.setInput('interview', interview);
      fixture.detectChanges();

      expect(component.isVirtual()).toBe(expectedVirtual);
      expect(component.meetingUrl()).toBe(expectedUrl);
    });
  });

  describe('Navigation', () => {
    it('should navigate to assessment page on card click', () => {
      fixture.componentRef.setInput('interview', physicalInterview);
      fixture.detectChanges();

      const mockEvent = { target: document.createElement('div') } as unknown as Event;
      (mockEvent.target as HTMLElement).closest = vi.fn().mockReturnValue(null);

      component.navigateToAssessment(mockEvent);

      expect(routerMock.navigate).toHaveBeenCalledOnce();
      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['/interviews', 'process', 'process-1', 'interviewee', 'interviewee-1', 'assessment'],
        { queryParams: { from: 'overview' } },
      );
    });

    it('should not navigate when click is on a link element', () => {
      fixture.componentRef.setInput('interview', physicalInterview);
      fixture.detectChanges();

      const anchor = document.createElement('a');
      const mockEvent = { target: anchor } as unknown as Event;
      (mockEvent.target as HTMLElement).closest = vi.fn().mockReturnValue(anchor);

      component.navigateToAssessment(mockEvent);

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });
});
