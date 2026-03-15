import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { CancelInterviewModalComponent } from 'app/interview/interview-process-detail/cancel-interview-modal/cancel-interview-modal.component';
import { provideTranslateMock } from 'util/translate.mock';

describe('CancelInterviewModalComponent', () => {
  let fixture: ComponentFixture<CancelInterviewModalComponent>;
  let component: CancelInterviewModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancelInterviewModalComponent],
      providers: [provideTranslateMock()],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CancelInterviewModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('onConfirm', () => {
    it('should emit confirmed with current deleteSlot and sendReinvite values', () => {
      const confirmedSpy = vi.spyOn(component.confirmed, 'emit');
      component.deleteSlot.set(true);
      component.sendReinvite.set(true);

      component.onConfirm();

      expect(confirmedSpy).toHaveBeenCalledOnce();
      expect(confirmedSpy).toHaveBeenCalledWith({ deleteSlot: true, sendReinvite: true });
    });

    it('should emit confirmed with default false values', () => {
      const confirmedSpy = vi.spyOn(component.confirmed, 'emit');

      component.onConfirm();

      expect(confirmedSpy).toHaveBeenCalledOnce();
      expect(confirmedSpy).toHaveBeenCalledWith({ deleteSlot: false, sendReinvite: false });
    });
  });

  describe('onVisibleChange', () => {
    it('should emit visibleChange with the value', () => {
      const visibleChangeSpy = vi.spyOn(component.visibleChange, 'emit');

      component.onVisibleChange(false);

      expect(visibleChangeSpy).toHaveBeenCalledOnce();
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    });

    it('should reset state when closing (value=false)', () => {
      component.deleteSlot.set(true);
      component.sendReinvite.set(true);

      component.onVisibleChange(false);

      expect(component.deleteSlot()).toBe(false);
      expect(component.sendReinvite()).toBe(false);
    });

    it('should not reset state when opening (value=true)', () => {
      component.deleteSlot.set(true);
      component.sendReinvite.set(true);

      component.onVisibleChange(true);

      expect(component.deleteSlot()).toBe(true);
      expect(component.sendReinvite()).toBe(true);
    });
  });

  describe('close', () => {
    it('should call onVisibleChange with false', () => {
      const visibleChangeSpy = vi.spyOn(component.visibleChange, 'emit');

      component.close();

      expect(visibleChangeSpy).toHaveBeenCalledOnce();
      expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    });
  });
});
