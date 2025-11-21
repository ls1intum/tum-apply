import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertErrorComponent } from '../../../../../../src/main/webapp/app/shared/alert/alert-error.component';
import { AlertService } from '../../../../../../src/main/webapp/app/core/util/alert.service';
import { EventManager } from '../../../../../../src/main/webapp/app/core/util/event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { of, Subscription } from 'rxjs';

class MockAlertService {
  addAlert = vi.fn();
}
class MockEventManager {
  subscribe = vi.fn().mockImplementation((_event: string, cb: any) => {
    // Return a dummy subscription
    return { unsubscribe: vi.fn() } as unknown as Subscription;
  });
  destroy = vi.fn();
}
class MockTranslateService {
  instant = vi.fn((key: string) => key);
}

describe('AlertErrorComponent', () => {
  let component: AlertErrorComponent;
  let fixture: ComponentFixture<AlertErrorComponent>;
  let alertService: MockAlertService;
  let eventManager: MockEventManager;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AlertErrorComponent],
      providers: [
        { provide: AlertService, useClass: MockAlertService },
        { provide: EventManager, useClass: MockEventManager },
        { provide: TranslateService, useClass: MockTranslateService },
      ],
    });
    fixture = TestBed.createComponent(AlertErrorComponent);
    component = fixture.componentInstance;
    alertService = TestBed.inject(AlertService) as any;
    eventManager = TestBed.inject(EventManager) as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to error and httpError events on construction', () => {
    expect(eventManager.subscribe).toHaveBeenCalledWith('tumApplyApp.error', expect.any(Function));
    expect(eventManager.subscribe).toHaveBeenCalledWith('tumApplyApp.httpError', expect.any(Function));
  });

  it('should call eventManager.destroy on destroy', () => {
    component.ngOnDestroy();
    expect(eventManager.destroy).toHaveBeenCalledTimes(2);
  });

  it('should handle default error with error.message', () => {
    const httpErrorResponse = { error: { message: 'err', params: { foo: 'bar' } } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleDefaultError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('err', 'err', { foo: 'bar' });
  });

  it('should handle fields error in handleFieldsError', () => {
    const httpErrorResponse = {
      error: {
        fieldErrors: [{ message: 'Min', field: 'foo[1].bar', objectName: 'obj' }],
      },
    };
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn(() => 'translatedField');
    // @ts-ignore
    component['handleFieldsError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "translatedField"', 'error.Size', {
      fieldName: 'translatedField',
    });
  });

  it('should handle bad request with fieldErrors', () => {
    const httpErrorResponse = {
      headers: { keys: () => [], get: () => null },
      error: { fieldErrors: [{ message: 'Min', field: 'foo[1].bar', objectName: 'obj' }] },
    };
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn(() => 'translatedField');
    // @ts-ignore
    component['handleBadRequest'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "translatedField"', 'error.Size', {
      fieldName: 'translatedField',
    });
  });

  it('should handle http error 0 (server not reachable)', () => {
    const response = { content: { status: 0 } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleHttpError'](response);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Server not reachable', 'error.server.not.reachable');
  });

  it('should handle http error 404 (not found)', () => {
    const response = { content: { status: 404 } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleHttpError'](response);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Not found', 'error.url.not.found');
  });

  it('should handle http error 400 with app-error header', () => {
    const headers = new HttpHeaders({ 'X-App-Error': 'err', 'X-App-Params': 'entity' });
    const response = { content: { status: 400, headers, error: '' } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleHttpError'](response);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('err', 'err', expect.anything());
  });

  it('should set correct classes for toast and position', () => {
    const alert: any = { toast: true, position: 'bottom-left' };
    const classes = component.setClasses(alert);
    expect(classes['jhi-toast']).toBe(true);
    expect(classes['bottom-left']).toBe(true);
  });

  it('should call alert.close when close is called', () => {
    const closeFn = vi.fn();
    const alert: any = { close: closeFn };
    component.close(alert);
    expect(closeFn).toHaveBeenCalledWith(component.alerts());
  });

  it('should add error alert via alertService when addErrorAlert is called', () => {
    const mockAlerts = component.alerts();
    component['addErrorAlert']('Test Message', 'test.key', { param: 'value' });
    expect(alertService.addAlert).toHaveBeenCalledWith(
      { type: 'danger', message: 'Test Message', translationKey: 'test.key', translationParams: { param: 'value' } },
      mockAlerts,
    );
  });
});
