import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';

import { IntervieweeAssessmentComponent } from 'app/interview/interviewee-assessment/interviewee-assessment.component';
import { InterviewResourceApiService } from 'app/generated';
import { IntervieweeDetailDTO } from 'app/generated/model/intervieweeDetailDTO';
import { provideTranslateMock } from 'util/translate.mock';
import { provideRouterMock, createRouterMock, RouterMock } from 'util/router.mock';
import { createActivatedRouteMock, provideActivatedRouteMock, ActivatedRouteMock } from 'util/activated-route.mock';
import { provideToastServiceMock, createToastServiceMock, ToastServiceMock } from 'util/toast-service.mock';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';

const intervieweeDetail: IntervieweeDetailDTO = {
  id: 'iee-1',
  applicationId: 'app-1',
  state: 'SCHEDULED',
  rating: 4,
  assessmentNotes: 'Good candidate',
  user: {
    userId: 'user-1',
    firstName: 'Alice',
    lastName: 'Mueller',
    email: 'alice@example.com',
    avatar: '/img/alice.jpg',
  },
  application: {
    applicationId: 'app-1',
    applicationState: 'SENT',
    jobId: 'job-1',
    researchGroup: 'Applied Software Engineering',
    supervisingProfessorName: 'Prof. Test',
    motivation: 'I love this role',
    specialSkills: 'Angular, TypeScript',
    projects: 'Built a CMS',
    applicant: {
      masterDegreeName: 'Computer Science',
      masterUniversity: 'TU Munich',
      user: {
        userId: 'user-1',
        name: 'Alice Mueller',
        email: 'alice@example.com',
      },
    },
  },
  scheduledSlot: {
    id: 'slot-1',
    startDateTime: '2026-03-20T14:00:00',
    endDateTime: '2026-03-20T15:00:00',
    location: 'Room 303',
  },
};

const intervieweeWithoutOptionals: IntervieweeDetailDTO = {
  id: 'iee-2',
  applicationId: 'app-2',
  state: 'UNCONTACTED',
};

describe('IntervieweeAssessmentComponent', () => {
  let fixture: ComponentFixture<IntervieweeAssessmentComponent>;
  let component: IntervieweeAssessmentComponent;
  let mockInterviewService: Partial<InterviewResourceApiService>;
  let toastMock: ToastServiceMock;
  let routerMock: RouterMock;
  let activatedRouteMock: ActivatedRouteMock;

  function createComponent(): void {
    fixture = TestBed.createComponent(IntervieweeAssessmentComponent);
    component = fixture.componentInstance;
  }

  function configureTestBed(): Promise<void> {
    return TestBed.configureTestingModule({
      imports: [IntervieweeAssessmentComponent],
      providers: [
        provideTranslateMock(),
        provideRouterMock(routerMock),
        provideActivatedRouteMock(activatedRouteMock),
        provideToastServiceMock(toastMock),
        provideFontAwesomeTesting(),
        { provide: InterviewResourceApiService, useValue: mockInterviewService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }

  beforeEach(async () => {
    mockInterviewService = {
      getIntervieweeDetails: vi.fn().mockReturnValue(of(intervieweeDetail)),
      updateAssessment: vi.fn().mockReturnValue(of(intervieweeDetail)),
    };
    toastMock = createToastServiceMock();
    routerMock = createRouterMock();
    activatedRouteMock = createActivatedRouteMock({ processId: 'proc-1', intervieweeId: 'iee-1' });

    await configureTestBed();
    createComponent();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Loading', () => {
    it('should load interviewee details on init', () => {
      expect(mockInterviewService.getIntervieweeDetails).toHaveBeenCalledOnce();
      expect(mockInterviewService.getIntervieweeDetails).toHaveBeenCalledWith('proc-1', 'iee-1');
      expect(component['loading']()).toBe(false);
      expect(component['interviewee']()).toBe(intervieweeDetail);
    });

    it('should set error signal on 404', async () => {
      (mockInterviewService.getIntervieweeDetails as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => ({ status: 404 })));

      createComponent();
      await fixture.whenStable();

      expect(component['error']()).toBe('interview.assessment.error.notFound');
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should show error toast and navigate to overview on 403', async () => {
      (mockInterviewService.getIntervieweeDetails as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => ({ status: 403 })));

      createComponent();
      await fixture.whenStable();

      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.assessment.error.loadFailed');
      expect(routerMock.navigate).toHaveBeenCalledWith(['/interviews/overview']);
    });

    it('should set error signal and show toast on generic error', async () => {
      (mockInterviewService.getIntervieweeDetails as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => ({ status: 500 })));

      createComponent();
      await fixture.whenStable();

      expect(component['error']()).toBe('interview.assessment.error.loadFailed');
      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.assessment.error.loadFailed');
    });
  });

  describe('Computed Properties', () => {
    it.each([
      { property: 'applicantAvatar', expected: '/img/alice.jpg' },
      { property: 'degreeName', expected: 'Computer Science' },
      { property: 'universityName', expected: 'TU Munich' },
      { property: 'motivation', expected: 'I love this role' },
      { property: 'skills', expected: 'Angular, TypeScript' },
      { property: 'interests', expected: 'Built a CMS' },
      { property: 'applicationId', expected: 'app-1' },
    ])('should compute $property correctly', ({ property, expected }) => {
      expect(component[property as keyof typeof component]()).toBe(expected);
    });

    it('should compute applicantName from user', () => {
      expect(component['applicantName']()).toContain('Alice');
      expect(component['applicantName']()).toContain('Mueller');
    });

    it('should compute slotInfo from interviewee', () => {
      expect(component['slotInfo']()?.location).toBe('Room 303');
    });
  });

  describe('Computed Properties with missing data', () => {
    beforeEach(async () => {
      (mockInterviewService.getIntervieweeDetails as ReturnType<typeof vi.fn>).mockReturnValue(of(intervieweeWithoutOptionals));
      TestBed.resetTestingModule();
      await configureTestBed();
      createComponent();
      await fixture.whenStable();
    });

    it.each([
      { property: 'applicantName', expected: '' },
      { property: 'applicantAvatar', expected: undefined },
      { property: 'degreeName', expected: '' },
      { property: 'universityName', expected: '' },
      { property: 'motivation', expected: '' },
      { property: 'skills', expected: '' },
      { property: 'interests', expected: '' },
      { property: 'savedNotes', expected: '' },
    ])('should return "$expected" for $property when data is missing', ({ property, expected }) => {
      expect(component[property as keyof typeof component]()).toBe(expected);
    });
  });

  describe('Save Notes', () => {
    it('should save notes and show success toast', async () => {
      component['notesControl'].setValue('Updated notes');
      await component.saveNotes();

      expect(mockInterviewService.updateAssessment).toHaveBeenCalledOnce();
      expect(mockInterviewService.updateAssessment).toHaveBeenCalledWith('proc-1', 'iee-1', { notes: 'Updated notes' });
      expect(toastMock.showSuccessKey).toHaveBeenCalledWith('interview.assessment.notes.saved');
      expect(component['saving']()).toBe(false);
    });

    it('should show error toast when saving notes fails', async () => {
      (mockInterviewService.updateAssessment as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => new Error('fail')));

      component['notesControl'].setValue('New notes');
      await component.saveNotes();

      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.assessment.error.saveFailed');
      expect(component['saving']()).toBe(false);
    });

    it('should not save when processId is empty', async () => {
      activatedRouteMock = createActivatedRouteMock({ processId: '', intervieweeId: '' });
      TestBed.resetTestingModule();
      await configureTestBed();
      createComponent();
      await fixture.whenStable();

      await component.saveNotes();

      expect(mockInterviewService.updateAssessment).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to process detail page on goBack', () => {
      component.goBack();

      expect(routerMock.navigate).toHaveBeenCalledOnce();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/interviews', 'proc-1']);
    });

    it('should navigate to overview when from=overview query param is set', async () => {
      activatedRouteMock = createActivatedRouteMock({ processId: 'proc-1', intervieweeId: 'iee-1' }, { from: 'overview' });
      TestBed.resetTestingModule();
      await configureTestBed();
      createComponent();
      await fixture.whenStable();

      component.goBack();

      expect(routerMock.navigate).toHaveBeenCalledOnce();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/interviews/overview']);
    });

    it('should navigate to overview when processId is empty', async () => {
      activatedRouteMock = createActivatedRouteMock({ processId: '', intervieweeId: 'iee-1' });
      TestBed.resetTestingModule();
      await configureTestBed();
      createComponent();
      await fixture.whenStable();

      component.goBack();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/interviews/overview']);
    });
  });

  describe('Rating', () => {
    it('should initialize rating from loaded data', () => {
      expect(component['rating']()).toBe(4);
    });

    it('should show error toast and revert rating when save fails', async () => {
      (mockInterviewService.updateAssessment as ReturnType<typeof vi.fn>).mockReturnValue(throwError(() => new Error('fail')));

      component['rating'].set(2);
      await fixture.whenStable();

      expect(toastMock.showErrorKey).toHaveBeenCalledWith('interview.assessment.error.saveFailed');
      expect(component['rating']()).toBe(4);
    });
  });
});
