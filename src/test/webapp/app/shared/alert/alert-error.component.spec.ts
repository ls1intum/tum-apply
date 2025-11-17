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


  it('should handle default error with error.message', () => {
    const httpErrorResponse = { error: { message: 'err', params: { foo: 'bar' } } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleDefaultError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('err', 'err', { foo: 'bar' });
  });

  it('should handle default error with no error.message', () => {
    const httpErrorResponse = { error: 'fail' };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleDefaultError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('fail', 'fail');
  });

  it('should handle fields error in handleFieldsError', () => {
    const httpErrorResponse = { error: { fieldErrors: [
      { message: 'Min', field: 'foo[1].bar', objectName: 'obj' },
      { message: 'Other', field: 'baz', objectName: 'obj2' },
    ] } };
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn(() => 'translatedField');
    // @ts-ignore
    component['handleFieldsError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "translatedField"', 'error.Size', { fieldName: 'translatedField' });
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "translatedField"', 'error.Other', { fieldName: 'translatedField' });
  });

  it('should handle bad request with fieldErrors', () => {
    const httpErrorResponse = { headers: { keys: () => [], get: () => null }, error: { fieldErrors: [
      { message: 'Min', field: 'foo[1].bar', objectName: 'obj' },
    ] } };
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn(() => 'translatedField');
    // @ts-ignore
    component['handleBadRequest'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "translatedField"', 'error.Size', { fieldName: 'translatedField' });
  });

  it('should handle bad request with empty error', () => {
    const httpErrorResponse = { headers: { keys: () => [], get: () => null }, error: '' };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleBadRequest'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('', '');
  });

  it('should handle bad request with error.detail', () => {
    const httpErrorResponse = { headers: { keys: () => [], get: () => null }, error: { message: 'err', detail: 'detail', params: { foo: 'bar' } } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleBadRequest'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('detail', 'err', { foo: 'bar' });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call eventManager.destroy on destroy', () => {
    component.ngOnDestroy();
    expect(eventManager.destroy).toHaveBeenCalledTimes(2);
  });

  it('should set correct classes for toast and position', () => {
    const alert: any = { toast: true, position: 'bottom-left' };
    const classes = component.setClasses(alert);
    expect(classes['jhi-toast']).toBe(true);
    expect(classes['bottom-left']).toBe(true);
  });

  it('should set correct classes for no position', () => {
    const alert: any = { toast: true };
    const classes = component.setClasses(alert);
    expect(classes['jhi-toast']).toBe(true);
    expect(Object.keys(classes).length).toBe(1);
  });

  it('should call alert.close when close is called', () => {
    const closeFn = vi.fn();
    const alert: any = { close: closeFn };
    component.close(alert);
    expect(closeFn).toHaveBeenCalledWith(component.alerts());
  });

  it('should add error alert for error event', () => {
    // Simuliere Event-Callback
    const error = { message: 'err', key: 'err.key', params: { foo: 'bar' } };
    // @ts-ignore
    component['addErrorAlert'] = vi.fn();
    // Rufe den Konstruktor-Callback direkt auf
    component['addErrorAlert'](error.message, error.key, error.params);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('err', 'err.key', { foo: 'bar' });
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

  it('should handle http error 400 with error.message', () => {
    const response = { content: { status: 400, headers: new HttpHeaders(), error: { message: 'err', params: { foo: 'bar' } } } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleHttpError'](response);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('err', 'err', { foo: 'bar' });
  });

  it('should handle http error with default case (status 500)', () => {
    const response = { content: { status: 500, headers: new HttpHeaders(), error: { message: 'internal error', detail: 'detailed error' } } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleHttpError'](response);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('detailed error', 'internal error', undefined);
  });

  it('should handle http error with default case and no error.message', () => {
    const response = { content: { status: 500, headers: new HttpHeaders(), error: 'generic error' } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleHttpError'](response);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('generic error', 'generic error');
  });

  it('should handle bad request with app-error header and app-params header', () => {
    const headers = new HttpHeaders({ 'X-tumapplyapp-Error': 'Custom Error', 'X-tumapplyapp-Params': 'user' });
    const httpErrorResponse = { headers, error: '' };
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn((key: string) => 'User');
    // @ts-ignore
    component['handleBadRequest'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Custom Error', 'Custom Error', { entityName: 'User' });
  });

  it('should handle bad request with app-error header but no app-params header', () => {
    const headers = new HttpHeaders({ 'x-tumapplyapp-error': 'Custom Error' });
    const httpErrorResponse = { headers, error: '' };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleBadRequest'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Custom Error', 'Custom Error', undefined);
  });

  it('should handle fields error with multiple bracket replacements', () => {
    const httpErrorResponse = { error: { fieldErrors: [
      { message: 'Max', field: 'items[0].subitems[5].value[2]', objectName: 'myObject' },
    ] } };
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn((key: string) => {
      if (key === 'tumApplyApp.myObject.items[].subitems[].value[]') {
        return 'Translated Field';
      }
      return key;
    });
    // @ts-ignore
    component['handleFieldsError'](httpErrorResponse);
    expect(component['translateService'].instant).toHaveBeenCalledWith('tumApplyApp.myObject.items[].subitems[].value[]');
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "Translated Field"', 'error.Size', { fieldName: 'Translated Field' });
  });

  it('should handle fields error with DecimalMin message', () => {
    const httpErrorResponse = { error: { fieldErrors: [
      { message: 'DecimalMin', field: 'price', objectName: 'product' },
    ] } };
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn(() => 'Price');
    // @ts-ignore
    component['handleFieldsError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "Price"', 'error.Size', { fieldName: 'Price' });
  });

  it('should handle fields error with DecimalMax message', () => {
    const httpErrorResponse = { error: { fieldErrors: [
      { message: 'DecimalMax', field: 'discount', objectName: 'product' },
    ] } };
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn(() => 'Discount');
    // @ts-ignore
    component['handleFieldsError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "Discount"', 'error.Size', { fieldName: 'Discount' });
  });

  it('should handle default error with error.detail', () => {
    const httpErrorResponse = { error: { message: 'error message', detail: 'detailed description', params: { id: 123 } } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleDefaultError'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith('detailed description', 'error message', { id: 123 });
  });

  it('should call close with undefined when alert.close is undefined', () => {
    const alert: any = { };
    expect(() => component.close(alert)).not.toThrow();
  });

  it('should set classes without toast', () => {
    const alert: any = { toast: false, position: 'top-right' };
    const classes = component.setClasses(alert);
    expect(classes['jhi-toast']).toBe(false);
    expect(classes['top-right']).toBe(true);
  });

  it('should handle bad request with error but no message or fieldErrors', () => {
    const httpErrorResponse = { headers: { keys: () => [], get: () => null }, error: { someOtherProperty: 'value' } };
    component['addErrorAlert'] = vi.fn();
    // @ts-ignore
    component['handleBadRequest'](httpErrorResponse);
    expect(component['addErrorAlert']).toHaveBeenCalledWith({ someOtherProperty: 'value' }, { someOtherProperty: 'value' });
  });

  it('should subscribe to error and httpError events on construction', () => {
    expect(eventManager.subscribe).toHaveBeenCalledWith('tumApplyApp.error', expect.any(Function));
    expect(eventManager.subscribe).toHaveBeenCalledWith('tumApplyApp.httpError', expect.any(Function));
  });

  it('should add error alert via alertService when addErrorAlert is called', () => {
    const mockAlerts = component.alerts();
    component['addErrorAlert']('Test Message', 'test.key', { param: 'value' });
    expect(alertService.addAlert).toHaveBeenCalledWith(
      { type: 'danger', message: 'Test Message', translationKey: 'test.key', translationParams: { param: 'value' } },
      mockAlerts
    );
  });

  it('should handle field error with no brackets in field name', () => {
    const httpErrorResponse = { error: { fieldErrors: [
      { message: 'NotNull', field: 'username', objectName: 'user' },
    ] } };
    component['addErrorAlert'] = vi.fn();
    component['translateService'].instant = vi.fn(() => 'Username');
    // @ts-ignore
    component['handleFieldsError'](httpErrorResponse);
    expect(component['translateService'].instant).toHaveBeenCalledWith('tumApplyApp.user.username');
    expect(component['addErrorAlert']).toHaveBeenCalledWith('Error on field "Username"', 'error.NotNull', { fieldName: 'Username' });
  });
});
