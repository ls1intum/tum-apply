import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertComponent } from 'app/shared/alert/alert.component';
import { AlertService, Alert } from 'app/core/util/alert.service';
import { vi } from 'vitest';

class MockAlertService {
  get = vi.fn().mockReturnValue([{ id: 1, type: 'success', message: 'Test', toast: false, position: 'top-right' }]);
  clear = vi.fn();
}

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;
  let alertService: MockAlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AlertComponent],
      providers: [{ provide: AlertService, useClass: MockAlertService }],
    });
    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
    alertService = TestBed.inject(AlertService) as unknown as MockAlertService;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load alerts on init', () => {
    component.ngOnInit();
    expect(component.alerts().length).toBe(1);
    expect(component.alerts()[0].message).toBe('Test');
  });

  it('should call alertService.clear on destroy', () => {
    component.ngOnDestroy();
    expect(alertService.clear).toHaveBeenCalled();
    vi.clearAllMocks();
  });

  it('should set correct classes for toast and position', () => {
    const alert = { id: 2, type: 'danger', message: 'x', toast: true, position: 'bottom-left' } as Alert;
    const classes = component.setClasses(alert);
    expect(classes['jhi-toast']).toBe(true);
    expect(classes['bottom-left']).toBe(true);
  });

  it('should set correct classes for no position', () => {
    const alert = { id: 3, type: 'info', message: 'y', toast: true } as Alert;
    const classes = component.setClasses(alert);
    expect(classes['jhi-toast']).toBe(true);
    expect(Object.keys(classes).length).toBe(1);
  });

  it('should call alert.close when close is called', () => {
    const closeFn = vi.fn();
    const alert = { id: 4, type: 'warning', message: 'z', close: closeFn } as Alert;
    component.close(alert);
    expect(closeFn).toHaveBeenCalledWith(component.alerts());
    vi.clearAllMocks();
  });
});
