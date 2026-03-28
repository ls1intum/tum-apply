import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { InterviewProcessCardComponent } from 'app/interview/interview-processes-overview/interview-process-card/interview-process-card.component';
import { InterviewOverviewDTO } from 'app/generated/model/interview-overview-dto';
import { JobDetailDTOStateEnum } from 'app/generated/model/job-detail-dto';
import { provideTranslateMock } from 'util/translate.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const activeProcess: InterviewOverviewDTO = {
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

const closedProcess: InterviewOverviewDTO = {
  jobId: 'job-2',
  processId: 'process-2',
  jobTitle: 'Data Scientist',
  jobState: JobDetailDTOStateEnum.Closed,
  isClosed: true,
  totalSlots: 5,
  totalInterviews: 3,
  scheduledCount: 2,
  completedCount: 1,
  invitedCount: 10,
  uncontactedCount: 0,
};

describe('InterviewProcessCardComponent', () => {
  let fixture: ComponentFixture<InterviewProcessCardComponent>;
  let component: InterviewProcessCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewProcessCardComponent],
      providers: [provideTranslateMock(), provideFontAwesomeTesting()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(InterviewProcessCardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Process Status', () => {
    it.each([
      { process: activeProcess, expectedStatus: JobDetailDTOStateEnum.Published, expectedIsClosed: false },
      { process: closedProcess, expectedStatus: JobDetailDTOStateEnum.Closed, expectedIsClosed: true },
    ])('should return $expectedStatus when isClosed is $expectedIsClosed', ({ process, expectedStatus, expectedIsClosed }) => {
      fixture.componentRef.setInput('process', process);
      fixture.detectChanges();

      expect(component.processStatus()).toBe(expectedStatus);
      expect(component.isClosed()).toBe(expectedIsClosed);
    });
  });

  describe('Warning Message', () => {
    it('should return undefined when process is closed', () => {
      fixture.componentRef.setInput('process', closedProcess);
      fixture.detectChanges();

      expect(component.warningMessage()).toBeUndefined();
    });

    it('should return undefined when invited count is less than or equal to total slots', () => {
      fixture.componentRef.setInput('process', activeProcess);
      fixture.detectChanges();

      expect(component.warningMessage()).toBeUndefined();
    });

    it.each([
      { invitedCount: 1, totalSlots: 0, expectedKey: 'interview.warning.zeroSlotsSingular' },
      { invitedCount: 3, totalSlots: 0, expectedKey: 'interview.warning.zeroSlots' },
      { invitedCount: 5, totalSlots: 2, expectedKey: 'interview.warning.notEnoughSlots' },
    ])(
      'should return $expectedKey when invitedCount=$invitedCount and totalSlots=$totalSlots',
      ({ invitedCount, totalSlots, expectedKey }) => {
        const process: InterviewOverviewDTO = {
          jobId: 'job-warn',
          processId: 'process-warn',
          jobTitle: 'Designer',
          jobState: JobDetailDTOStateEnum.Published,
          isClosed: false,
          totalSlots,
          totalInterviews: 0,
          scheduledCount: 0,
          completedCount: 0,
          invitedCount,
          uncontactedCount: 0,
        };
        fixture.componentRef.setInput('process', process);
        fixture.detectChanges();

        expect(component.warningMessage()).toBe(expectedKey);
      },
    );
  });

  describe('Card Click', () => {
    it('should emit jobId when card is clicked', () => {
      fixture.componentRef.setInput('process', activeProcess);
      fixture.detectChanges();

      const emitSpy = vi.spyOn(component.cardClick, 'emit');
      component.onCardClick();

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('job-1');
    });
  });

  describe('Total Slots', () => {
    it('should return the total slots from the process', () => {
      const process: InterviewOverviewDTO = {
        jobId: 'job-6',
        processId: 'process-6',
        jobTitle: 'PM',
        jobState: JobDetailDTOStateEnum.Published,
        isClosed: false,
        totalSlots: 15,
        totalInterviews: 5,
        scheduledCount: 3,
        completedCount: 1,
        invitedCount: 4,
        uncontactedCount: 2,
      };
      fixture.componentRef.setInput('process', process);
      fixture.detectChanges();

      expect(component.totalSlots()).toBe(15);
    });
  });
});
