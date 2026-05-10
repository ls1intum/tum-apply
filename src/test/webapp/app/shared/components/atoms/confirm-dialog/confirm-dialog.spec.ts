import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { provideTranslateMock } from 'util/translate.mock';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { ConfirmationService } from 'primeng/api';
import { Subject } from 'rxjs';

type ConfirmArgs = { message?: string; header?: string; accept?: () => void; reject?: () => void };

describe('ConfirmDialog', () => {
  let mockConfirmationService: {
    confirm: ReturnType<typeof vi.fn>;
    requireConfirmation$: Subject<any>;
    close$: Subject<any>;
  };

  function createFixture() {
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.componentRef.setInput('label', 'Delete');
    fixture.componentRef.setInput('header', 'Confirm Deletion');
    fixture.componentRef.setInput('message', 'Are you sure you want to delete this item?');
    fixture.componentRef.setInput('confirmIcon', 'trash');
    fixture.componentRef.setInput('severity', 'danger');
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    mockConfirmationService = {
      confirm: vi.fn(),
      requireConfirmation$: new Subject(),
      close$: new Subject(),
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialog, ButtonComponent],
      providers: [provideFontAwesomeTesting(), provideTranslateMock()],
    })
      .overrideComponent(ConfirmDialog, {
        set: {
          providers: [{ provide: ConfirmationService, useValue: mockConfirmationService }],
        },
      })
      .compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Open Button Behaviour', () => {
    it('should hide open button when showOpenButton is false', () => {
      const fixture = createFixture();
      fixture.componentRef.setInput('showOpenButton', false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('jhi-button')).toBeFalsy();
    });

    it('should call confirm() when open button is clicked', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('showOpenButton', true);
      fixture.detectChanges();
      const confirmSpy = vi.spyOn(comp, 'confirm');
      const button = fixture.nativeElement.querySelector('jhi-button');
      button.click();
      expect(confirmSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Confirm Method and Dialog Behaviour', () => {
    it('should call confirmationService.confirm with header and message when confirm() is called', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('header', 'Custom Header');
      fixture.componentRef.setInput('message', 'Custom Message');

      comp.confirm();

      expect(mockConfirmationService.confirm).toHaveBeenCalledOnce();
      expect(mockConfirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom Message',
          header: 'Custom Header',
          accept: expect.any(Function),
        }),
      );
    });
  });

  describe('Accept and Reject Behaviour', () => {
    it('should emit confirmed event with data when accept is called', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('data', 'test-data-123');

      const emitSpy = vi.spyOn(comp.confirmed, 'emit');

      comp.confirm();

      const confirmCall = mockConfirmationService.confirm.mock.calls[0][0] as ConfirmArgs;
      confirmCall.accept?.();

      expect(emitSpy).toHaveBeenCalledWith('test-data-123');
    });

    it('should emit confirmed event with undefined when no data is provided', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const emitSpy = vi.spyOn(comp.confirmed, 'emit');

      comp.confirm();

      const confirmCall = mockConfirmationService.confirm.mock.calls[0][0] as ConfirmArgs;
      confirmCall.accept?.();

      expect(emitSpy).toHaveBeenCalledWith(undefined);
    });

    it('should not emit confirmed when accept is not called', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const emitSpy = vi.spyOn(comp.confirmed, 'emit');

      comp.confirm();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit confirmed when dialog is rejected', () => {
      const fixture = createFixture();
      const comp = fixture.componentInstance;
      const emitSpy = vi.spyOn(comp.confirmed, 'emit');

      comp.confirm();

      const confirmCall = mockConfirmationService.confirm.mock.calls[0][0] as ConfirmArgs;
      confirmCall.reject?.();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
