import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewDialogComponent } from 'app/shared/components/molecules/review-dialog/review-dialog.component';
import { provideTranslateMock } from '../../../../../util/translate.mock';
import { SelectOption } from 'app/shared/components/atoms/select/select.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations'; // DialogModule of PrimeNG still uses legacy animations (@animation.start)
import { provideFontAwesomeTesting } from '../../../../../util/fontawesome.testing';
import { ApplicationEvaluationDetailDTO } from 'app/generated/model/applicationEvaluationDetailDTO';

describe('ReviewDialogComponent', () => {
  let fixture: ComponentFixture<ReviewDialogComponent>;
  let component: ReviewDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewDialogComponent],
      providers: [provideTranslateMock(), provideNoopAnimations(), provideFontAwesomeTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewDialogComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('mode', 'ACCEPT');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('computed canAccept', () => {
    it('should be false if notifyApplicant is true and editorModel length <= 7', () => {
      component.notifyApplicant.set(true);
      component.editorModel.set('<p></p>');
      expect(component.canAccept()).toBe(false);
    });

    it('should be true if notifyApplicant is true and editorModel length > 7', () => {
      component.notifyApplicant.set(true);
      component.editorModel.set('<p>Hello</p>');
      expect(component.canAccept()).toBe(true);
    });

    it('should be true if notifyApplicant is false regardless of editorModel length', () => {
      component.notifyApplicant.set(false);
      component.editorModel.set('');
      expect(component.canAccept()).toBe(true);
    });
  });

  describe('computed canReject', () => {
    it('should be false if no reason is selected', () => {
      component.selectedRejectReason.set(undefined);
      expect(component.canReject()).toBe(false);
    });

    it('should be true if a reason is selected', () => {
      component.selectedRejectReason.set({ name: 'test', value: 'JOB_FILLED' });
      expect(component.canReject()).toBe(true);
    });
  });

  describe('translationMetaData', () => {
    it('should return undefined if no application input', () => {
      fixture.componentRef.setInput('application', undefined);
      expect(component.translationMetaData()).toBeUndefined();
    });

    it('should return expected metadata when application is provided', () => {
      const application: ApplicationEvaluationDetailDTO = {
        applicationDetailDTO: {
          applicant: { user: { name: 'Alice' } },
          jobTitle: 'Research Job',
        },
        professor: {
          email: 'prof@uni.de',
          firstName: 'John',
          lastName: 'Doe',
          researchGroupName: 'GroupX',
          researchGroupWebsite: 'www.groupx.com',
        },
      } as ApplicationEvaluationDetailDTO;
      fixture.componentRef.setInput('application', application);

      const meta = component.translationMetaData();
      expect(meta?.APPLICANT_FIRST_NAME).toBe('Alice');
      expect(meta?.PROFESSOR_EMAIL).toBe('prof@uni.de');
    });

    it('should use empty string for APPLICANT_FIRST_NAME if applicant or user is missing', () => {
      const application: ApplicationEvaluationDetailDTO = {
        applicationDetailDTO: {
          applicant: undefined,
          jobTitle: 'Research Job',
        },
        professor: {
          email: 'prof@uni.de',
          firstName: 'John',
          lastName: 'Doe',
          researchGroupName: 'GroupX',
          researchGroupWebsite: 'www.groupx.com',
        },
      } as ApplicationEvaluationDetailDTO;
      fixture.componentRef.setInput('application', application);

      const meta = component.translationMetaData();
      expect(meta?.APPLICANT_FIRST_NAME).toBe('');
      expect(meta?.JOB_NAME).toBe('Research Job');
    });
  });

  describe('resetDialogState', () => {
    it('should reset notifyApplicant, closeJob, and selectedRejectReason', () => {
      component.notifyApplicant.set(false);
      component.closeJob.set(true);
      component.selectedRejectReason.set({ name: 'test', value: 'JOB_FILLED' });

      component.resetDialogState();

      expect(component.notifyApplicant()).toBe(true);
      expect(component.closeJob()).toBe(false);
      expect(component.selectedRejectReason()).toBeUndefined();
    });
  });

  describe('onSelectChange', () => {
    it('should update selectedRejectReason', () => {
      const option: SelectOption = { name: 'reason', value: 'JOB_FILLED' };
      component.onSelectChange(option);
      expect(component.selectedRejectReason()).toEqual(option);
    });
  });

  describe('onAccept', () => {
    it('should emit accept event with current values', () => {
      const spy = vi.fn();
      component.accept.subscribe(spy);

      component.editorModel.set('Hello world');
      component.notifyApplicant.set(true);
      component.closeJob.set(true);

      component.onAccept();

      expect(spy).toHaveBeenCalledWith({
        message: 'Hello world',
        notifyApplicant: true,
        closeJob: true,
      });
    });
  });

  describe('onReject', () => {
    it('should not emit if no reason selected', () => {
      const spy = vi.fn();
      component.reject.subscribe(spy);

      component.selectedRejectReason.set(undefined);
      component.onReject();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit reject event with correct reason and notifyApplicant', () => {
      const spy = vi.fn();
      component.reject.subscribe(spy);

      const option: SelectOption = { name: 'reason', value: 'FAILED_REQUIREMENTS' };
      component.selectedRejectReason.set(option);
      component.notifyApplicant.set(false);

      component.onReject();

      expect(spy).toHaveBeenCalledWith({
        reason: 'FAILED_REQUIREMENTS',
        notifyApplicant: false,
      });
    });
  });

  describe('_defaultTextEffect', () => {
    it('should set editorModel when visible is true', () => {
      fixture.componentInstance.visible.set(true);
      fixture.detectChanges();

      expect(component.editorModel()).toBe('evaluation.defaultAcceptMessage');
    });
  });
});
