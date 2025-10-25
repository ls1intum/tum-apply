import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { provideFontAwesomeTesting } from 'util/fontawesome.testing';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { By } from '@angular/platform-browser';

type ConfirmArgs = { message?: string; header?: string; accept?: () => void; reject?: () => void };

describe('ConfirmDialog', () => {
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
    await TestBed.configureTestingModule({
      imports: [ConfirmDialog, ButtonComponent],
      providers: [provideFontAwesomeTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  //--------------Basic setup--------------
  it('should create the component', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;

    expect(comp).toBeTruthy();
  });

  //--------------Input properties and defaults--------------
  it('should default showOpenButton to true', () => {
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.showOpenButton()).toBe(true);
  });

  it('should use default primary severity when not specified', () => {
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.severity()).toBe('primary');
  });

  it('should apply severity prop correctly', () => {
    const fixture = createFixture();

    fixture.componentRef.setInput('severity', 'warning');
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.severity()).toBe('warning');
  });

  it('should apply variant prop correctly', () => {
    const fixture = createFixture();

    fixture.componentRef.setInput('variant', 'outlined');
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.variant()).toBe('outlined');
  });

  it('should apply confirmIcon prop correctly', () => {
    const fixture = createFixture();

    fixture.componentRef.setInput('confirmIcon', 'check');
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.confirmIcon()).toBe('check');
  });

  //--------------Open button tests--------------
  it('should display open button when showOpenButton is true', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('showOpenButton', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('jhi-button');
    expect(button).toBeTruthy();
  });

  it('should hide open button when showOpenButton is false', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('showOpenButton', false);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('jhi-button');
    expect(button).toBeFalsy();
  });

  it('should display correct label on open button', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('showOpenButton', true);
    fixture.detectChanges();

    const buttonDebugElement = fixture.debugElement.query(By.directive(ButtonComponent));
    const buttonComponent = buttonDebugElement.componentInstance as ButtonComponent;

    expect(buttonComponent.label()).toBe('Delete');
  });

  it('should pass correct icon to open button component', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('confirmIcon', 'trash');
    fixture.componentRef.setInput('showOpenButton', true);
    fixture.detectChanges();

    const buttonDebugElement = fixture.debugElement.query(By.directive(ButtonComponent));
    const buttonComponent = buttonDebugElement.componentInstance as ButtonComponent;

    expect(buttonComponent.icon()).toBe('trash');
  });

  it('should pass correct severity to button component', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('severity', 'success');
    fixture.componentRef.setInput('showOpenButton', true);
    fixture.detectChanges();

    const buttonDebugElement = fixture.debugElement.query(By.directive(ButtonComponent));
    const buttonComponent = buttonDebugElement.componentInstance as ButtonComponent;

    expect(buttonComponent.severity()).toBe('success');
  });

  it('should pass correct variant to button component', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('variant', 'text');
    fixture.componentRef.setInput('showOpenButton', true);
    fixture.detectChanges();

    const buttonDebugElement = fixture.debugElement.query(By.directive(ButtonComponent));
    const buttonComponent = buttonDebugElement.componentInstance as ButtonComponent;

    expect(buttonComponent.variant()).toBe('text');
  });

  it('should call confirm() when open button is clicked', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    fixture.componentRef.setInput('showOpenButton', true);
    fixture.detectChanges();

    const confirmSpy = vi.spyOn(comp, 'confirm');
    const button = fixture.nativeElement.querySelector('jhi-button');
    button.click();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  //--------------Confirm method and dialog behaviour--------------
  it('should call confirmationService.confirm when confirm() is called', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const confirmationService = (comp as any).confirmationService;
    const confirmSpy = vi.spyOn(confirmationService, 'confirm');

    comp.confirm();

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Are you sure you want to delete this item?',
        header: 'Confirm Deletion',
        accept: expect.any(Function),
      }),
    );
  });

  it('should use correct header and message in confirmation dialog', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const confirmationService = (comp as any).confirmationService;
    const confirmSpy = vi.spyOn(confirmationService, 'confirm');

    fixture.componentRef.setInput('header', 'Custom Header');
    fixture.componentRef.setInput('message', 'Custom Message');

    comp.confirm();

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Custom Message',
        header: 'Custom Header',
        accept: expect.any(Function),
      }),
    );
  });

  it('should handle undefined header gracefully', () => {
    const fixture = TestBed.createComponent(ConfirmDialog);
    const comp = fixture.componentInstance;
    const confirmationService = (comp as any).confirmationService;
    const confirmSpy = vi.spyOn(confirmationService, 'confirm');

    fixture.componentRef.setInput('header', undefined);
    fixture.componentRef.setInput('message', 'Test message');

    comp.confirm();

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test message',
        header: undefined,
        accept: expect.any(Function),
      }),
    );
  });

  it('should handle undefined message gracefully', () => {
    const fixture = TestBed.createComponent(ConfirmDialog);
    const comp = fixture.componentInstance;
    const confirmationService = (comp as any).confirmationService;
    const confirmSpy = vi.spyOn(confirmationService, 'confirm');

    fixture.componentRef.setInput('header', 'Test header');
    fixture.componentRef.setInput('message', undefined);

    comp.confirm();

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: undefined,
        header: 'Test header',
        accept: expect.any(Function),
      }),
    );
  });

  it('should pass icon to confirm button in dialog', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('confirmIcon', 'check');
    fixture.detectChanges();

    const comp = fixture.componentInstance;
    expect(comp.confirmIcon()).toBe('check');
  });

  //--------------Accept/Reject behaviour--------------
  it('should emit confirmed event with data when accept is called', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const confirmationService = (comp as any).confirmationService;
    const confirmSpy = vi.spyOn(confirmationService, 'confirm');
    fixture.componentRef.setInput('data', 'test-data-123');

    const emitSpy = vi.spyOn(comp.confirmed, 'emit');

    comp.confirm();

    const confirmCall = confirmSpy.mock.calls[0][0] as ConfirmArgs;
    confirmCall.accept?.();

    expect(emitSpy).toHaveBeenCalledWith('test-data-123');
  });

  it('should emit confirmed event with undefined when no data is provided', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const confirmationService = (comp as any).confirmationService;
    const confirmSpy = vi.spyOn(confirmationService, 'confirm');

    const emitSpy = vi.spyOn(comp.confirmed, 'emit');

    comp.confirm();

    const confirmCall = confirmSpy.mock.calls[0][0] as ConfirmArgs;
    confirmCall.accept?.();

    expect(emitSpy).toHaveBeenCalledWith(undefined);
  });

  it('should not emit confirmed when accept is not called', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const confirmationService = (comp as any).confirmationService;
    vi.spyOn(confirmationService, 'confirm');

    const emitSpy = vi.spyOn(comp.confirmed, 'emit');

    comp.confirm();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit confirmed when dialog is rejected', () => {
    const fixture = createFixture();
    const comp = fixture.componentInstance;
    const confirmationService = (comp as any).confirmationService;
    const confirmSpy = vi.spyOn(confirmationService, 'confirm');
    const emitSpy = vi.spyOn(comp.confirmed, 'emit');

    comp.confirm();

    const confirmCall = confirmSpy.mock.calls[0][0] as ConfirmArgs;
    confirmCall.reject?.();

    expect(emitSpy).not.toHaveBeenCalled();
  });
});
