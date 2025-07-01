// review-dialog.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ReviewDialogComponent } from './review-dialog.component';

class TranslateStub {
  instant(key: string): string {
    return key;
  }
}

describe('ReviewDialogComponent (logic only)', () => {
  let component: ReviewDialogComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useClass: TranslateStub }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    component = TestBed.createComponent(ReviewDialogComponent).componentInstance;
  });

  describe('canAccept', () => {
    it('is TRUE when notifyApplicant is true and message length > 7', () => {
      component.notifyApplicant.set(true);
      component.editorModel.set('More than seven'); // length = 15
      expect(component.canAccept()).toBe(true);
    });

    it('is FALSE when notifyApplicant is true but message too short', () => {
      component.notifyApplicant.set(true);
      component.editorModel.set('short'); // length = 5
      expect(component.canAccept()).toBe(false);
    });

    it('is TRUE when notifyApplicant is false regardless of message length', () => {
      component.notifyApplicant.set(false);
      component.editorModel.set('');
      expect(component.canAccept()).toBe(true);
    });
  });

  describe('canReject', () => {
    const dummyOption = { name: 'Failed requirements', value: 'FAILED_REQUIREMENTS' } as any;

    it('is FALSE when no reason selected', () => {
      component.selectedRejectReason.set(undefined);
      expect(component.canReject()).toBe(false);
    });

    it('is TRUE when a reason is selected', () => {
      component.selectedRejectReason.set(dummyOption);
      expect(component.canReject()).toBe(true);
    });
  });

  describe('onReject', () => {
    const dummyOption = { name: 'Failed requirements', value: 'FAILED_REQUIREMENTS' } as any;

    it('emits a RejectDTO with selected reason and notify flag', () => {
      const emitSpy = jest.spyOn(component.reject, 'emit');
      component.selectedRejectReason.set(dummyOption);
      component.notifyApplicant.set(false);

      component.onReject();

      expect(emitSpy).toHaveBeenCalledWith({
        reason: 'FAILED_REQUIREMENTS',
        notifyApplicant: false,
      });
    });

    it('does nothing if no reason has been chosen', () => {
      const emitSpy = jest.spyOn(component.reject, 'emit');
      component.selectedRejectReason.set(undefined);

      component.onReject();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
