import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { UpcomingInterviewCardComponent } from 'app/interview/interview-processes-overview/upcoming-interviews-widget/upcoming-interview-card/upcoming-interview-card.component';
import { UpcomingInterviewDTO } from 'app/generated/model/upcoming-interview-dto';
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

const virtualInterview: UpcomingInterviewDTO = {
  id: 'interview-virtual',
  processId: 'process-1',
  intervieweeId: 'interviewee-virtual',
  intervieweeName: 'Max',
  jobTitle: 'Dev',
  startDateTime: '2026-03-15T09:00:00',
  endDateTime: '2026-03-15T10:00:00',
  location: 'https://zoom.us/j/123',
};

const interviewWithAvatar: UpcomingInterviewDTO = {
  id: 'interview-avatar',
  processId: 'process-1',
  intervieweeId: 'interviewee-avatar',
  intervieweeName: 'Max',
  jobTitle: 'Dev',
  startDateTime: '2026-03-15T09:00:00',
  endDateTime: '2026-03-15T10:30:00',
  location: 'Room 101',
  avatar: '/img/avatar.jpg',
};

const interviewNoName: UpcomingInterviewDTO = {
  id: 'interview-noname',
  processId: 'process-1',
  intervieweeId: 'interviewee-noname',
  intervieweeName: undefined,
  jobTitle: 'Dev',
  startDateTime: '2026-03-15T09:00:00',
  endDateTime: '2026-03-15T10:00:00',
  location: 'Room 101',
};

const interviewNoLocation: UpcomingInterviewDTO = {
  id: 'interview-noloc',
  processId: 'process-1',
  intervieweeId: 'interviewee-noloc',
  intervieweeName: 'Max',
  jobTitle: 'Dev',
  startDateTime: '2026-03-15T09:00:00',
  endDateTime: '2026-03-15T10:00:00',
  location: undefined,
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
    it.each([
      { interview: physicalInterview, expectedName: 'Jane Smith', expectedLocation: 'Room 101' },
      { interview: interviewNoName, expectedName: '', expectedLocation: 'Room 101' },
      { interview: interviewNoLocation, expectedName: 'Max', expectedLocation: '' },
    ])('should return name="$expectedName" and location="$expectedLocation"', ({ interview, expectedName, expectedLocation }) => {
      fixture.componentRef.setInput('interview', interview);
      fixture.detectChanges();

      expect(component.intervieweeName()).toBe(expectedName);
      expect(component.location()).toBe(expectedLocation);
    });

    it('should return avatar URL', () => {
      fixture.componentRef.setInput('interview', interviewWithAvatar);
      fixture.detectChanges();

      expect(component.avatarUrl()).toBe('/img/avatar.jpg');
    });

    it('should format time range correctly', () => {
      fixture.componentRef.setInput('interview', interviewWithAvatar);
      fixture.detectChanges();

      expect(component.formattedTimeRange()).toBe('09:00 - 10:30');
    });
  });

  describe('Virtual Meeting Detection', () => {
    it.each([
      { interview: virtualInterview, expectedVirtual: true, expectedUrl: 'https://zoom.us/j/123' },
      { interview: physicalInterview, expectedVirtual: false, expectedUrl: null },
    ])('should detect virtual=$expectedVirtual for "$interview.location"', ({ interview, expectedVirtual, expectedUrl }) => {
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
